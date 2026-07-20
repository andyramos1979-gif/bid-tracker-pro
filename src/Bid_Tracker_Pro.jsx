import React, { useState, useEffect, useMemo, useCallback } from "react";
import "./FuturisticCard.css";
import CompactSystemHealth from "./CompactSystemHealth";
import TodoPanel from "./TodoPanel";
import Papa from "papaparse";
import USAMap from "react-usa-map";
import {
  Zap, LayoutGrid, List as ListIcon, Star, Plus, Download, X, Search,
  ChevronUp, ChevronDown, ChevronsUpDown, ChevronRight, CheckCircle2,
  FileText, DollarSign, BarChart2, HardHat, Building, Mail,
  ShieldCheck, Trash2, ClipboardCheck, ArrowRight, Save,
  Briefcase, FolderKanban, AlertTriangle, TrendingUp, CheckSquare, Wallet,
  AlertCircle, Play, Pause, Activity, Globe, Sun, Moon,
  Layers, Trophy, ExternalLink, Send
} from "lucide-react";


// Constants & pure helpers extracted to ./bid/constants.js (Phase 0.5 modularization).
import {
  CHECK_FIELDS, OPS_SCHEMA, CATEGORIES, DECISION_BADGE, STAGE_FILTERS, STAGE_CHIP_ON,
  RESULT_BADGE, daysSince, agingBadge, PROBABILITY_OPTS, FOLLOWUP_OPTS, FOLLOWUP_CLS,
  money, PROJECT_PHASES, PRIORITIES, STATUS_COLORS, PROJECT_STATUS, GEO_WIN_RATES,
} from "./bid/constants";
// Shared presentational atoms extracted to ./bid/atoms.jsx (Phase 0.5).
import { LiveClock, Toast, Sparkline, Countdown, ProgressRing, InputField } from "./bid/atoms";

// ─── BIDS COMPONENTS ─────────────────────────────────────────────────────────

// Kanban board extracted to ./bid/BidBoard.jsx (Phase 0.5).
import { KanbanView } from "./bid/BidBoard";

// Bid detail modal extracted to ./bid/BidModal.jsx (Phase 0.5A).
import { BidModal } from "./bid/BidModal";

// Create-bid modal extracted to ./bid/AddBidModal.jsx (Phase 0.5A).
import { AddBidModal } from "./bid/AddBidModal";

// ─── PROJECTS COMPONENTS ─────────────────────────────────────────────────────

function ProjectCard({ project, onClick, isMobileView }) {
  const completedMilestones = (project.milestones || []).filter(m => m.completed).length;
  const totalMilestones    = (project.milestones || []).length;
  const latestMilestone    = [...(project.milestones || [])].reverse().find(m => !m.completed)?.title
                           || (project.milestones || []).slice(-1)[0]?.title
                           || null;
  const progress           = Math.max(0, Math.min(100, Number(project.progress) || 0));
  const collectedK         = ((project.collectedValue || 0) / 1000).toFixed(0);
  const contractK          = `$${((project.contractValue || 0) / 1000).toFixed(0)}k`;

  /* map project status to a badge label */
  const statusLabel = project.status === "In Progress" ? "ACTIVE RUN"
                    : project.status === "On Hold"     ? "ON HOLD"
                    : project.status === "Completed"   ? "COMPLETED"
                    :                                    project.status?.toUpperCase() || "ACTIVE";

  return (
    <section
      className="fxCard"
      onClick={() => !isMobileView && onClick(project)}
      aria-label={`${project.title} project card`}
    >
      <div className="fxCard__fx" aria-hidden="true" />
      <div className="fxCard__content">

        {/* Header */}
        <header className="fxCard__header">
          <div className="fxBadge" role="status" aria-label={`Status: ${statusLabel}`}>
            <span className="fxBadge__icon" aria-hidden="true">
              {/* shield icon */}
              <svg viewBox="0 0 24 24" width="15" height="15">
                <path d="M12 2l8 4v6c0 6-4 10-8 10S4 18 4 12V6l8-4z"
                  fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M9 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span className="fxBadge__text">{statusLabel}</span>
          </div>
          <div className="fxCard__category">{project.phase || "Procurement"}</div>
        </header>

        {/* Title */}
        <div className="fxCard__titleBlock">
          <h2 className="fxCard__title">{project.title}</h2>
          <div className="fxCard__location">
            <span className="fxCard__locationIcon" aria-hidden="true">
              {/* building icon */}
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M3 21V7l9-4 9 4v14" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <path d="M9 21v-6h6v6" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <line x1="12" y1="8" x2="12" y2="11" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <span>{project.facility}</span>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="fxRingWrap">
          <div className="fxRing" style={{ "--p": progress }}>
            <div className="fxRing__dot" aria-hidden="true" />
            <div className="fxRing__core">
              <div className="fxRing__value">{progress}%</div>
            </div>
          </div>
          <div className="fxRing__label">Progress</div>
        </div>

        {/* Metric Tiles */}
        <div className="fxMetrics">
          <div className="fxTile fxTile--green">
            <div className="fxTile__top">
              <div className="fxTile__label">Collected</div>
              <div className="fxTile__value">
                <span className="fxTile__valueStrong">${collectedK}k</span>
                <span className="fxTile__valueDim"> / {contractK}</span>
              </div>
            </div>
            <div className="fxTile__icon" aria-hidden="true">
              {/* coin stack icon */}
              <svg viewBox="0 0 24 24" width="30" height="30">
                <ellipse cx="12" cy="6" rx="7" ry="3" fill="currentColor" opacity=".85" />
                <path d="M5 6v4c0 1.65 3.13 3 7 3s7-1.35 7-3V6" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".8" />
                <path d="M5 10v4c0 1.65 3.13 3 7 3s7-1.35 7-3v-4" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".65" />
              </svg>
            </div>
          </div>

          <div className="fxTile">
            <div className="fxTile__top">
              <div className="fxTile__label">Milestones</div>
              <div className="fxTile__value">
                <span className="fxTile__valueStrong">{completedMilestones}</span>
                <span className="fxTile__valueDim"> / {totalMilestones} Done</span>
              </div>
              {latestMilestone && (
                <div style={{ fontSize: "9px", color: "var(--color-text-faint)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }} title={latestMilestone}>
                  {latestMilestone}
                </div>
              )}
            </div>
            <div className="fxTile__icon fxTile__icon--neutral" aria-hidden="true">
              {/* clipboard icon */}
              <svg viewBox="0 0 24 24" width="27" height="27">
                <path d="M9 4h6l1 2H8L9 4z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <rect x="5" y="5" width="14" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 11h8M8 15h8" stroke="currentColor" strokeWidth="1.5" opacity=".85" />
                <path d="M8 11l1.4 1.4L12 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="fxFooter">
          <div className="fxAvatars" aria-label="Assigned team">
            <div className="fxAvatar fxAvatar--blue">AR</div>
            <div className="fxAvatar fxAvatar--gray">JS</div>
          </div>
          <div className="fxTarget">
            <div className="fxTarget__label">Target Date:</div>
            <div className="fxTarget__row">
              {project.endDate
                ? <span className="fxTarget__countdown"><Countdown dueDate={project.endDate} compact /></span>
                : null}
              <span className="fxTarget__status">
                {project.status === "Completed" ? "DONE" : "PENDING"}
              </span>
            </div>
          </div>
        </footer>

      </div>
    </section>
  );
}

// ── Cyber Stats Panel sub-icons ─────────────────────────────────────────────

// Capture-Intelligence icons extracted to ./bid/icons.jsx (Phase 0.5).
import {
  CsIconPlayBox, CsIconRings, CsIconLockBox, CsIconHexGrid, CsIconIsoCube, CsIconHoneycomb, CsIconSiren, CsIconWaveform, CsIconUpArrow, CsIconWaveCurve, CsIconGem, CsIconCircuit, CsIconCanister, CsIconMedallion,
} from "./bid/icons";

// Metric panels extracted to ./bid/BidMetrics.jsx (Phase 0.5).
import { CyberStatsPanel, CyberBidsPanel } from "./bid/BidMetrics";

// Project detail modal extracted to ./bid/ProjectModal.jsx (Phase 0.5A).
import { ProjectModal } from "./bid/ProjectModal";

// Create/convert-project modal extracted to ./bid/AddProjectModal.jsx (Phase 0.5A).
import { AddProjectModal } from "./bid/AddProjectModal";

// ─── GEO / MAP COMPONENT ─────────────────────────────────────────────────────

function GeoPerformanceView({ bids }) {
  const [selectedState, setSelectedState] = useState(null);

  const stateWins = useMemo(() => {
    const map = {};
    (bids || []).forEach(b => {
      const st = b.state ? b.state.trim().toUpperCase() : "UNKNOWN";
      if (!st || st === "UNKNOWN" || st.length !== 2) return; 
      
      if (!map[st]) map[st] = { total: 0, awarded: 0 };
      map[st].total++;
      if (b.status === "Awarded") map[st].awarded++;
    });

    return Object.entries(map)
      .map(([state, v]) => ({ 
        state, 
        ...v, 
        rate: v.total ? Math.round((v.awarded / v.total) * 100) : 0 
      }))
      .sort((a, b) => b.total - a.total);
  }, [bids]);

  const mapConfig = useMemo(() => {
    const config = {};
    stateWins.forEach(s => {
      let fill = "#0284c7"; // sky-600 for open bids
      if (s.rate > 0) fill = "var(--color-success)"; // emerald-500 for wins

      config[s.state] = {
        fill: fill,
        clickHandler: () => setSelectedState(s)
      };
    });
    return config;
  }, [stateWins]);

  const handleMapClick = (event) => {
    const stateName = event.target.dataset.name;
    if (!stateName) return;
    const existing = stateWins.find(s => s.state === stateName);
    if (existing) {
      setSelectedState(existing);
    } else {
      setSelectedState({ state: stateName, total: 0, awarded: 0, rate: 0 });
    }
  };

  const totalWinRate = stateWins.length > 0 
    ? Math.round((stateWins.reduce((sum, s) => sum + s.awarded, 0) / stateWins.reduce((sum, s) => sum + s.total, 0)) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* INTERACTIVE USA MAP */}
        <div className="xl:col-span-2 bg-surface border border-border rounded-3xl p-8 flex flex-col relative overflow-hidden min-h-[500px]">
          <div className="flex justify-between items-start mb-4 relative z-10">
             <div>
               <h2 className="text-xl font-bold text-white flex items-center gap-2">
                 <Globe className="w-5 h-5 text-info" /> Geographic Footprint
               </h2>
               <p className="text-sm text-text-faint mt-1">Interactive bid volume and win-rate tracking.</p>
             </div>
             
             <div className="flex gap-4 bg-bg-app/50 px-4 py-2 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-success"></div>
                   <span className="text-xs font-bold text-text-muted">Wins Logged</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-info"></div>
                   <span className="text-xs font-bold text-text-muted">Active Bids</span>
                </div>
             </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center w-full mt-4 [&>svg]:w-full [&>svg]:max-w-3xl [&>svg]:h-auto [&_path]:stroke-slate-950 [&_path]:stroke-[1.5px] cursor-pointer relative z-10">
            <USAMap 
              customize={mapConfig} 
              onClick={handleMapClick} 
              defaultFill="var(--color-surface-raised)" 
            />
          </div>

          {selectedState && (
            <div className="absolute bottom-8 right-8 bg-bg-app/90 backdrop-blur-md border border-border p-5 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 z-20 min-w-[200px]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-2xl font-black text-white">{selectedState.state}</span>
                <button onClick={() => setSelectedState(null)} className="text-text-faint hover:text-white"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-text-faint uppercase tracking-wider">Total Bids</span>
                  <span className="text-sm font-mono font-bold text-info">{selectedState.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-text-faint uppercase tracking-wider">Won</span>
                  <span className="text-sm font-mono font-bold text-success">{selectedState.awarded}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-success rounded-full transition-all" style={{ width: `${selectedState.rate}%` }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="bg-surface border border-border rounded-3xl p-8 flex flex-col">
          <div className="bg-bg-app/50 rounded-2xl border border-border p-6 flex flex-col items-center mb-8">
             <h3 className="text-xs font-bold text-text-faint uppercase tracking-widest mb-4">Overall Win Rate Gauge</h3>
             <ProgressRing pct={totalWinRate} size={120} stroke={10} customColor={totalWinRate > 50 ? "var(--color-success)" : "var(--color-info)"} />
             <div className="text-[10px] font-bold text-text-faint mt-3 uppercase tracking-widest">Target: 75%</div>
          </div>

          <h3 className="text-xs font-bold text-text-faint uppercase tracking-widest mb-6">Win Rate by Service</h3>
          <div className="space-y-5">
            {GEO_WIN_RATES.map(c => (
              <div key={c.name}>
                <div className="flex justify-between text-xs font-bold mb-1.5">
                  <span className="text-text-secondary">{c.name}</span>
                  <span style={{ color: c.color }}>{c.pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-bg-app rounded-full overflow-hidden border border-border/50">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.pct}%`, backgroundColor: c.color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-8">
            <h4 className="text-xs font-bold text-text-faint uppercase tracking-widest mb-4 border-b border-border pb-2">Top Volume States</h4>
            <div className="space-y-3">
              {stateWins.slice(0, 4).map((s, i) => (
                <div key={s.state} className="flex items-center justify-between group cursor-pointer hover:bg-surface-raised/50 p-1.5 -mx-1.5 rounded-lg transition-colors" onClick={() => setSelectedState(s)}>
                  <div className="flex items-center gap-2">
                    <span className="text-text-faint text-[10px] font-mono w-4">{i + 1}.</span>
                    <span className="text-text-secondary text-sm font-bold group-hover:text-white transition-colors">{s.state}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-faint text-xs font-mono">{s.total} bids</span>
                    <span className="text-success text-xs font-bold w-12 text-right">{s.rate}%</span>
                  </div>
                </div>
              ))}
              {stateWins.length === 0 && <p className="text-text-faint text-xs italic">No bid data with state info yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OPS COMPONENTS ──────────────────────────────────────────────────────────

// Weekly ops checklist modal extracted to ./bid/OpsChecklistModal.jsx (Phase 0.5A).
import { OpsChecklistModal } from "./bid/OpsChecklistModal";

// ─── MAIN APP COMPONENT ──────────────────────────────────────────────────────

export default function BidTrackerPro() {
  const [activeTab, setActiveTab] = useState("bids");
  const [isMobileView, setIsMobileView] = useState(false);

  // ── Theme ──
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") !== "light");
  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // Sync dark mode when embedded as an iframe inside the Financial Hub
  useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.type === "fh:darkMode") setDarkMode(e.data.dark);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Bids state ──
  const [bids, setBids]             = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showAddBid, setShowAddBid] = useState(false);
  const [view, setView]             = useState("table");
  const [filter, setFilter]         = useState("Open");
  const [catFilter, setCatFilter]   = useState("All");
  const [decisionFilter, setDecisionFilter] = useState("All");   // capture-engine decision chips
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState("dueDate");
  const [sortDir, setSortDir]       = useState("asc");
  const [showStarred, setShowStarred] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showAuditLog, setShowAuditLog] = useState(false);   // automation audit viewer
  const [auditEvents, setAuditEvents]   = useState(null);    // null=loading, []=loaded
  const [costData, setCostData]         = useState({});      // bid.id → Hub project cost/procurement summary
  const [startupData, setStartupData]   = useState({});      // bid.id → project startup pack (Phase 4A)

  // ── Projects state ──
  const [projects, setProjects]             = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [bidToConvert, setBidToConvert]     = useState(null);

  // ── Ops state ──
  const [showOpsModal, setShowOpsModal]   = useState(false);
  const [opsSummary,   setOpsSummary]     = useState({ failed_today: 0, queued: 0, running: 0, success_24h: 0, by_flow: {} });
  const [opsJobs,      setOpsJobs]        = useState([]);
  const [opsStatusFilter, setOpsStatusFilter] = useState(null);
  const [opsFlowFilter,   setOpsFlowFilter]   = useState(null);
  const [opsSelected,  setOpsSelected]    = useState(null);

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "info") => setToast({ msg, type }), []);

  // ── Recompete state ──
  const [recompetes, setRecompetes] = useState([]);

  // ── Load Bids & Recompete Watch from local Excel API ──
  useEffect(() => {
    const load = () => {
      fetch("/api/bids")
        .then(r => r.json())
        .then(data => setBids(data))
        .catch(() => {});

      fetch("/api/recompete")
        .then(r => r.json())
        .then(data => setRecompetes(data))
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, 30000); // auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // ── Job Ledger polling ──
  useEffect(() => {
    const loadOps = () => {
      const qs = new URLSearchParams({ limit: 50 });
      if (opsStatusFilter) qs.set("status", opsStatusFilter);
      if (opsFlowFilter)   qs.set("flow",   opsFlowFilter);
      Promise.all([
        fetch("/ops/jobs/summary").then(r => r.json()).catch(() => null),
        fetch(`/ops/jobs?${qs}`).then(r => r.json()).catch(() => []),
      ]).then(([s, j]) => {
        if (s) setOpsSummary(s);
        setOpsJobs(Array.isArray(j) ? j : []);
      });
    };
    loadOps();
    const t = setInterval(loadOps, 5000);
    return () => clearInterval(t);
  }, [opsStatusFilter, opsFlowFilter]);

  // ── Bid actions ──
  const toggleCheck = useCallback((id, field) => setBids(bs => bs.map(b => b.id === id ? { ...b, [field]: !b[field] } : b)), []);
  const toggleStar  = useCallback((id)         => setBids(bs => bs.map(b => b.id === id ? { ...b, starred: !b.starred } : b)), []);

  const saveBid = useCallback(updated => {
    const original = bids.find(b => b.id === updated.id);
    setBids(bs => bs.map(b => b.id === updated.id ? updated : b));
    fetch("/api/bids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) })
      .then(() => showToast("Saved to Excel ✓", "success"))
      .catch(() => showToast("Save failed — check API server", "warn"));
    if (original && original.status !== "Awarded" && updated.status === "Awarded") {
      setTimeout(() => setBidToConvert(updated), 400);
    }
  }, [bids, showToast]);

  // Workflow-stage transition (Follow → Prospect, Bid On This → Active Bid,
  // Archive). Writes ONLY the Status column via /api/bids/status; folder creation
  // stays gated to the watcher on the Active Bid (PURSUE) status.
  const setStage = useCallback((bid, stage) => {
    setBids(bs => bs.map(b => b.id === bid.id ? { ...b, workflowStatus: stage } : b));
    fetch("/api/bids/status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bid.id, title: bid.title, status: stage }),
    })
      .then(r => r.json())
      .then(res => {
        if (res && res.ok) {
          const msg = res.folderCreated ? "Bidding — estimate folder created ✓"
                    : stage === "Active Bid" ? "Marked Active Bid ✓"
                    : `Moved to ${stage} ✓`;
          showToast(msg, "success");
        } else { showToast("Status update failed", "warn"); }
      })
      .catch(() => showToast("Status update failed — check API server", "warn"));
  }, [showToast]);

  // Phase 3B — promote an Awarded bid to a Financial Hub project (service layer;
  // Bid Tracker never writes the Hub DB directly). Confirm → API → store IDs.
  const promoteBid = useCallback((bid) => {
    if (!window.confirm(`Promote "${bid.title}" to a Financial Hub project?\n\nThis creates a permanent project and job number in Financial Hub (the system of record).`)) return;
    fetch("/api/bids/promote", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bid.id, title: bid.title }),
    })
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if ((ok || j.already) && j.job_number) {
          setBids(bs => bs.map(b => b.id === bid.id
            ? { ...b, financialHubProjectId: String(j.project_id), jobNumber: j.job_number, promotionStatus: "Promoted" }
            : b));
          showToast(`Project created — ${j.job_number} ✓`, "success");
        } else {
          showToast(j.error || "Promotion failed", "warn");
        }
      })
      .catch(() => showToast("Promotion failed — check API + Financial Hub", "warn"));
  }, [showToast]);

  // Phase 3E — pull the Financial Hub project cost/procurement summary (committed
  // cost, PO count, actual/projected/margin) for a promoted bid. Read-only proxy.
  const viewCosts = useCallback((bid) => {
    if (!bid.jobNumber) return;
    if (costData[bid.id]) { setCostData(cd => { const n = { ...cd }; delete n[bid.id]; return n; }); return; }
    setCostData(cd => ({ ...cd, [bid.id]: { loading: true } }));
    fetch(`/api/projects/${encodeURIComponent(bid.jobNumber)}/summary`)
      .then(r => r.json())
      .then(d => setCostData(cd => ({ ...cd, [bid.id]: d })))
      .catch(() => { setCostData(cd => { const n = { ...cd }; delete n[bid.id]; return n; }); showToast("Could not load project costs", "warn"); });
  }, [costData, showToast]);

  // Phase 4A — generate the Project Startup Pack for a promoted bid (idempotent).
  // Phase 4C — read-only live startup execution status on the promoted card.
  const loadStartup = useCallback((bid) => {
    if (!bid.jobNumber) return;
    fetch(`/api/projects/${encodeURIComponent(bid.jobNumber)}/startup`)
      .then(r => r.json())
      .then(j => setStartupData(sd => ({ ...sd, [bid.id]: { exists: !!j.exists, pack: j.startup || null } })))
      .catch(() => {});
  }, []);

  const initProject = useCallback((bid) => {
    if (!bid.jobNumber) return;
    setStartupData(sd => ({ ...sd, [bid.id]: { ...(sd[bid.id] || {}), loading: true } }));
    fetch("/api/bids/initialize-project", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobNumber: bid.jobNumber }),
    })
      .then(r => r.json())
      .then(j => {
        if (j.startup) {
          setStartupData(sd => ({ ...sd, [bid.id]: { exists: true, pack: j.startup, loading: false } }));
          showToast(j.created ? "Project startup pack created ✓" : "Startup pack ready ✓", "success");
          loadStartup(bid);   // refresh with enriched crew/milestone detail
        } else {
          setStartupData(sd => ({ ...sd, [bid.id]: { error: j.error || "Startup failed" } }));
          showToast(j.error || "Startup failed", "warn");
        }
      })
      .catch(() => { setStartupData(sd => ({ ...sd, [bid.id]: { error: "Startup failed" } })); showToast("Startup failed — check API + Financial Hub", "warn"); });
  }, [showToast, loadStartup]);

  // Auto-load startup status when an Awarded, promoted bid row is expanded.
  useEffect(() => {
    if (!expandedRow) return;
    const b = (bids || []).find(x => x.id === expandedRow);
    if (b && b.workflowStatus === "Awarded" && b.jobNumber && b.financialHubProjectId && !startupData[b.id]) {
      loadStartup(b);
    }
  }, [expandedRow, bids, startupData, loadStartup]);

  // Phase 3H — write additive per-bid meta (follow-up / probability / gov response).
  // Optimistic; never touches Status.
  const updateMeta = useCallback((bid, fields) => {
    setBids(bs => bs.map(b => b.id === bid.id ? { ...b, ...fields } : b));
    fetch("/api/bids/meta", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: bid.id, title: bid.title, fields }),
    })
      .then(r => r.json())
      .then(j => { if (!j.ok) showToast("Update failed", "warn"); })
      .catch(() => showToast("Update failed — check API server", "warn"));
  }, [showToast]);

  const openAuditLog = useCallback(() => {
    setShowAuditLog(true);
    setAuditEvents(null);
    fetch("/api/automation-audit?limit=100")
      .then(r => r.json())
      .then(d => setAuditEvents(Array.isArray(d) ? d : []))
      .catch(() => setAuditEvents([]));
  }, []);

  const deleteBid = useCallback(id  => { setBids(bs => bs.filter(b => b.id !== id)); showToast("Bid deleted", "warn"); }, [showToast]);
  const addBid    = useCallback(bid => {
    setBids(bs => [...bs, bid]);
    fetch("/api/bids", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bid) })
      .catch(() => {});
    showToast("New bid created! 🎉", "success");
  }, [showToast]);

  // ── Load projects from Excel API ──
  useEffect(() => {
    const loadProjects = () =>
      fetch("/api/projects").then(r => r.json()).then(data => setProjects(Array.isArray(data) ? data : [])).catch(() => {});
    loadProjects();
    const t = setInterval(loadProjects, 30000);
    return () => clearInterval(t);
  }, []);

  // ── Project actions ──
  const saveProject = useCallback(updated => {
    setProjects(ps => ps.map(p => p.id === updated.id ? updated : p));
    fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) })
      .catch(() => {});
  }, []);
  const addProject = useCallback(project => {
    setProjects(ps => [...ps, project]);
    fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(project) })
      .catch(() => {});
    showToast("Project started! 🚀", "success");
  }, [showToast]);

  // ── Derived stats ──
  const effectiveStatus = useCallback((bid) => {
    if (bid.status !== "Open") return bid.status;
    if (bid.dueDate && new Date(bid.dueDate) < new Date()) return "Closed";
    return "Open";
  }, []);

  const filteredBids = useMemo(() => {
    return (bids || [])
      .filter(b => {
        const st = effectiveStatus(b);
        return (
          (filter === "All" || (filter === "Won" ? b.wonLoss === "Yes" : filter === "HasAmount" ? Number(b.bidAmount) > 0 : st === filter)) &&
          (catFilter === "All" || b.category === catFilter) &&
          (decisionFilter === "All" ||
            (decisionFilter === "Closed" ? String(b.workflowStatus || "").startsWith("Closed") : b.workflowStatus === decisionFilter)) &&
          (!showStarred || b.starred) &&
          (!search || [b.title, b.city, b.state, b.facility, b.contractor].some(f => f && String(f).toLowerCase().includes(search.toLowerCase())))
        );
      })
      .sort((a, b) => {
        const statusOrder = { Open: 0, Awarded: 1, Closed: 2 };
        const sa = statusOrder[effectiveStatus(a)] ?? 1, sb = statusOrder[effectiveStatus(b)] ?? 1;
        if (sa !== sb) return sa - sb;
        let av = a[sortKey] || "", bv = b[sortKey] || "";
        if (sortKey === "dueDate") { av = new Date(av); bv = new Date(bv); }
        return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
  }, [bids, filter, catFilter, decisionFilter, showStarred, search, sortKey, sortDir, effectiveStatus]);

  const bidStats = useMemo(() => {
    const B = bids || [];
    const ws  = (b) => b.workflowStatus || "";
    const val = (b) => Number(b.bidAmount) || 0;
    const sum = (arr) => arr.reduce((s, b) => s + val(b), 0);
    const active    = B.filter(b => ws(b) === "Active Bid");
    const submitted = B.filter(b => ws(b) === "Submitted");
    const awarded   = B.filter(b => ws(b) === "Awarded");
    const won       = B.filter(b => ws(b) === "Closed Won");
    const lost      = B.filter(b => ws(b) === "Closed Lost");
    const closed    = B.filter(b => ws(b).startsWith("Closed"));
    const winRate   = (won.length + lost.length) ? Math.round(won.length / (won.length + lost.length) * 100) : 0;
    // Award conversion = ever-awarded (Awarded + Closed Won) ÷ Submitted-or-beyond
    const everAwarded = awarded.length + won.length;
    const submittedOrBeyond = submitted.length + everAwarded + lost.length;
    return {
      total:      B.length,
      open:       B.filter(b => effectiveStatus(b) === "Open").length,
      active:     active.length,
      submitted:  submitted.length, submittedValue: sum(submitted),
      awarded:    everAwarded, awardedValue: sum([...awarded, ...won]),
      won:        won.length, wonValue: sum(won),
      lost:       lost.length, closed: closed.length,
      winRate,
      awardConversion: submittedOrBeyond ? Math.round(everAwarded / submittedOrBeyond * 100) : 0,
      urgent:     B.filter(b => effectiveStatus(b) === "Open" && b.dueDate && (new Date(b.dueDate) - new Date() > 0) && (new Date(b.dueDate) - new Date() < 3 * 86400000)).length,
      pipelineValue: sum([...active, ...submitted]),
      totalValue: sum(B),
    };
  }, [bids, effectiveStatus]);

  // Phase 3H — Submitted command-center metrics.
  const submittedStats = useMemo(() => {
    const S = (bids || []).filter(b => b.workflowStatus === "Submitted");
    const val = (b) => Number(b.bidAmount) || 0;
    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    let oldest = null, oldestDays = -1;
    for (const b of S) {
      const dd = daysSince(b.submittedDate);
      if (dd != null && dd > oldestDays) { oldestDays = dd; oldest = b; }
    }
    const totalDays = S.reduce((s, b) => s + (daysSince(b.submittedDate) || 0), 0);
    return {
      count:       S.length,
      totalValue:  S.reduce((s, b) => s + val(b), 0),
      avgDays:     S.length ? Math.round(totalDays / S.length) : 0,
      oldest, oldestDays: oldestDays < 0 ? 0 : oldestDays,
      weighted:    S.reduce((s, b) => s + val(b) * ((Number(b.awardProbability) || 0) / 100), 0),
      thisMonth:   S.filter(b => b.submittedDate && new Date(b.submittedDate) >= mStart).length,
      thisQuarter: S.filter(b => b.submittedDate && new Date(b.submittedDate) >= qStart).length,
      needFollowUp: S.filter(b => !b.followUpStatus || b.followUpStatus === "Not Started" ||
                                  (b.nextFollowUp && new Date(b.nextFollowUp) <= now)).length,
    };
  }, [bids]);

  const projectStats = useMemo(() => ({
    active:         (projects || []).filter(p => p.status === "In Progress").length,
    onHold:         (projects || []).filter(p => p.status === "On Hold").length,
    completed:      (projects || []).filter(p => p.status === "Completed").length,
    openIssues:     (projects || []).reduce((acc, p) => acc + (p.issues || []).filter(i => i.status === "Open").length, 0),
    portfolioValue: (projects || []).reduce((acc, p) => acc + Number(p.contractValue || 0), 0),
    openAR:         (projects || []).reduce((acc, p) => acc + (p.invoices || []).filter(i => i.status === "Pending").reduce((s, i) => s + i.amount, 0), 0),
  }), [projects]);

  const exportToCSV = useCallback(() => {
    if (filteredBids.length === 0) return showToast("No bids to export!", "warn");
    const headers  = ["Status", "Due Date", "Title", "Facility", "City", "State", "Bid Amount", "Awarded Amount", "Priority", "Category", "Contractor"];
    const csvRows  = filteredBids.map(b => [
      b.status, b.dueDate,
      `"${(b.title      || "").replace(/"/g, '""')}"`,
      `"${(b.facility   || "").replace(/"/g, '""')}"`,
      `"${(b.city       || "")}"`,
      b.state, b.bidAmount, b.awardedAmount, b.priority, b.category,
      `"${(b.contractor || "").replace(/"/g, '""')}"`,
    ].join(","));
    const blob = new Blob([[headers.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href  = URL.createObjectURL(blob);
    link.setAttribute("download", `Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast("Exported to CSV! 📊", "success");
  }, [filteredBids, showToast]);

  // ── Sort button ──
  const SortBtn = ({ k, label }) => (
    <div
      onClick={() => { if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(k); setSortDir("asc"); } }}
      className={`flex items-center gap-1 cursor-pointer select-none transition-colors ${sortKey === k ? "text-info" : "text-text-muted hover:text-text"}`}>
      {label}
      {sortKey === k ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
    </div>
  );

  // ── Tab config for the nav ──
  const tabs = [
    { id: "bids",      label: "Bids",        Icon: FolderKanban,  activeColor: "text-info"    },
    { id: "recompete", label: "Recompete",   Icon: AlertTriangle, activeColor: "text-warning"  },
    { id: "projects",  label: "Projects",    Icon: Briefcase,     activeColor: "text-info"   },
    { id: "map",       label: "GeoInsights", Icon: Globe,         activeColor: "text-success"},
    { id: "ops",       label: "Ops",         Icon: Activity,      activeColor: "text-special" },
  ];

  const headerGradient =
    activeTab === "bids"      ? "from-sky-500 to-blue-700 shadow-info/20"        :
    activeTab === "recompete" ? "from-amber-500 to-orange-700 shadow-warning/20"  :
    activeTab === "projects"  ? "from-blue-500 to-indigo-700 shadow-info/20"    :
    activeTab === "map"       ? "from-emerald-500 to-teal-700 shadow-success/20":
                                "from-indigo-500 to-purple-700 shadow-special/20";

  const HeaderIcon =
    activeTab === "bids"      ? Zap           :
    activeTab === "recompete" ? AlertTriangle  :
    activeTab === "projects"  ? Briefcase      :
    activeTab === "map"       ? Globe          :
                                Activity;

  return (
    <div className="min-h-screen bg-bg-app text-text font-sans selection:bg-accent-soft">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-bg-app/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg text-white transition-all duration-300 ${headerGradient}`}>
              <HeaderIcon className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {activeTab === "bids"      ? "BidTracker"  :
                 activeTab === "recompete" ? "Recompete"   :
                 activeTab === "projects"  ? "Project"     :
                 activeTab === "map"       ? "GeoInsights" :
                                            "Operating"}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Pro</span>
              </h1>
              <p className="text-xs font-medium text-text-faint tracking-wide uppercase mt-0.5">VA Contracting Intelligence</p>
            </div>
          </div>

          {/* Nav */}
          <div className="flex bg-surface border border-border rounded-xl p-1.5 shadow-inner">
            {tabs.map(({ id, label, Icon, activeColor }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === id ? `bg-surface-raised ${activeColor} shadow-md` : "text-text-faint hover:text-text-secondary hover:bg-surface-raised/50"}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Clock + Theme toggle */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex bg-surface border border-border rounded-lg px-4 py-2 items-center gap-3 shadow-inner">
              <div className={`w-2 h-2 rounded-full animate-pulse ${activeTab === "bids" ? "bg-success" : activeTab === "projects" ? "bg-info" : activeTab === "map" ? "bg-success" : "bg-special"}`} />
              <LiveClock />
            </div>
            <button
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              className="p-2 bg-surface border border-border rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-all"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-[1800px] mx-auto p-6 flex flex-col gap-6">

        {/* ════════════ BIDS TAB ════════════ */}
        {activeTab === "bids" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-6">

            {/* Stats row */}
            <CyberBidsPanel stats={bidStats} onFilter={(v) => { setDecisionFilter(v); setFilter("All"); }} />

            {/* Toolbar */}
            <div className="bg-surface/60 border border-border rounded-2xl p-2 md:p-3 flex flex-wrap items-center gap-3">
              {/* View toggle */}
              <div className="flex bg-bg-app border border-border rounded-lg p-1">
                <button onClick={() => setView("table")}  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${view === "table"  ? "bg-surface-raised text-info shadow-sm" : "text-text-muted hover:text-text-secondary"}`}><ListIcon className="w-4 h-4" /> Table</button>
                <button onClick={() => setView("kanban")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${view === "kanban" ? "bg-surface-raised text-info shadow-sm" : "text-text-muted hover:text-text-secondary"}`}><LayoutGrid className="w-4 h-4" /> Board</button>
              </div>

              {/* Starred filter */}
              <button onClick={() => setShowStarred(s => !s)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${showStarred ? "bg-warning-soft border-warning/30 text-warning" : "bg-bg-app border-border text-text-muted"}`}>
                <Star className="w-4 h-4" fill={showStarred ? "currentColor" : "none"} /> Starred
              </button>

              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
                <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full bg-bg-app border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text outline-none focus:border-info" />
              </div>

              {/* Status filter */}
              <div className="flex bg-bg-app border border-border rounded-xl p-1">
                {[
                  { val: "All",       label: "All"       },
                  { val: "Open",      label: "Open"      },
                  { val: "Awarded",   label: "Awarded"   },
                  { val: "Closed",    label: "Closed"    },
                  { val: "HasAmount", label: "Submitted" },
                ].map(({ val, label }) => (
                  <button key={val} onClick={() => setFilter(val)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === val ? "bg-surface-raised text-info shadow-sm" : "text-text-faint"}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Category filter */}
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="bg-bg-app border border-border rounded-xl px-4 py-2 text-sm text-text-secondary outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
              </select>

              {/* Workflow-stage filter chips */}
              <div className="flex items-center gap-1 bg-bg-app border border-border rounded-xl p-1 overflow-x-auto">
                {STAGE_FILTERS.map(({ val, label }) => {
                  const active = decisionFilter === val;
                  const count = (bids || []).filter(b => val === "Closed"
                    ? String(b.workflowStatus || "").startsWith("Closed")
                    : b.workflowStatus === val).length;
                  return (
                    <button key={val} onClick={() => setDecisionFilter(val)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${active ? STAGE_CHIP_ON[val] : "text-text-faint hover:text-text-secondary"}`}>
                      {label}{val !== "All" ? ` (${count})` : ""}
                    </button>
                  );
                })}
              </div>

              {!isMobileView && (
                <button onClick={() => setShowAddBid(true)}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-success hover:bg-success text-text text-sm font-bold">
                  <Plus className="w-4 h-4" /> New Bid
                </button>
              )}

              <button onClick={openAuditLog} title="Automation audit log"
                className="flex items-center gap-2 px-4 py-2 bg-surface-raised rounded-xl text-sm font-semibold border border-border hover:bg-bg-subtle transition-colors">
                <Activity className="w-4 h-4" /><span className="hidden lg:inline">Automation Log</span>
              </button>

              <button onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-surface-raised rounded-xl text-sm font-semibold border border-border hover:bg-bg-subtle transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Phase 3H — Submitted Command Center */}
            {decisionFilter === "Submitted" && submittedStats.count > 0 && (
              <div className="mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Send className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-blue-400">Submitted Command Center</h3>
                  {submittedStats.needFollowUp > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-bold">{submittedStats.needFollowUp} need follow-up</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {[
                    ["Submitted", submittedStats.count],
                    ["Submitted Value", money(submittedStats.totalValue)],
                    ["Weighted Pipeline", money(submittedStats.weighted)],
                    ["Avg Days Waiting", `${submittedStats.avgDays}d`],
                    ["Oldest", submittedStats.oldest ? `${submittedStats.oldestDays}d` : "—"],
                    ["This Month", submittedStats.thisMonth],
                    ["This Quarter", submittedStats.thisQuarter],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-[#151926] border border-border/40 px-3 py-2.5">
                      <div className="text-[9.5px] uppercase tracking-wider text-text-faint font-bold">{label}</div>
                      <div className="text-lg font-black text-white tabular-nums mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
                {submittedStats.oldest && (
                  <div className="mt-2.5 text-[11.5px] text-text-muted">
                    Oldest awaiting award: <span className="text-text-secondary font-semibold">{submittedStats.oldest.title}</span>
                    {" "}· {submittedStats.oldestDays} days · {money(submittedStats.oldest.bidAmount)}
                  </div>
                )}
              </div>
            )}

            {/* Phase 3H — Bid Outcome Analytics (Awarded/Closed view) */}
            {(decisionFilter === "Awarded" || decisionFilter === "Closed") && (
              <div className="mb-4 rounded-2xl border border-border bg-[#151926] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-text">Bid Outcome Analytics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {[
                    ["Submitted", bidStats.submitted, "text-blue-400"],
                    ["Awarded", bidStats.awarded, "text-yellow-400"],
                    ["Won", bidStats.won, "text-emerald-400"],
                    ["Lost", bidStats.lost, "text-red-400"],
                    ["Win Rate", `${bidStats.winRate}%`, "text-emerald-400"],
                    ["Award Conv.", `${bidStats.awardConversion}%`, "text-yellow-400"],
                  ].map(([label, value, cls]) => (
                    <div key={label} className="rounded-xl bg-surface-raised/40 border border-border/40 px-3 py-2.5">
                      <div className="text-[9.5px] uppercase tracking-wider text-text-faint font-bold">{label}</div>
                      <div className={`text-lg font-black tabular-nums mt-0.5 ${cls}`}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-4 text-[11.5px] text-text-muted">
                  <span>Awarded value: <span className="text-text-secondary font-semibold">{money(bidStats.awardedValue)}</span></span>
                  <span>Won value: <span className="text-emerald-400 font-semibold">{money(bidStats.wonValue)}</span></span>
                  <span>Pipeline: <span className="text-text-secondary font-semibold">{money(bidStats.pipelineValue)}</span></span>
                </div>
              </div>
            )}

            {/* Kanban or Table */}
            {view === "kanban" ? (
              <KanbanView bids={filteredBids} onSelect={isMobileView ? () => {} : setSelectedBid} onToggleStar={toggleStar} isMobileView={isMobileView} />
            ) : (
              <div className="bg-surface/40 border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="bg-surface border-b border-border text-xs uppercase tracking-wider text-text-muted font-semibold">
                        <th className="px-4 py-4 w-[40px]"></th>
                        <th className="px-4 py-4"><SortBtn k="status"   label="Status" /></th>
                        <th className="px-4 py-4"><SortBtn k="finalScore" label="Capture" /></th>
                        <th className="px-4 py-4"><SortBtn k="dueDate"  label="Deadline" /></th>
                        <th className="px-4 py-4"><SortBtn k="title"    label="Title & Location" /></th>
                        <th className="px-4 py-4"><SortBtn k="bidAmount"label="Value" /></th>
                        <th className="px-4 py-4"><SortBtn k="priority" label="Priority" /></th>
                        <th className="px-4 py-4 text-center">Completion</th>
                        <th className="px-4 py-4 w-[240px]">Requirements</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredBids.length === 0 && (
                        <tr><td colSpan="9" className="px-6 py-12 text-center text-text-faint">No matching bids found.</td></tr>
                      )}
                      {filteredBids.map(bid => {
                        const pct   = Math.round(CHECK_FIELDS.filter(f => bid[f.key]).length / CHECK_FIELDS.length * 100);
                        const st    = effectiveStatus(bid);
                        const sc    = STATUS_COLORS[st]          || STATUS_COLORS["Open"];
                        const pc    = PRIORITIES[bid.priority]   || PRIORITIES["Medium"];
                        const isExp = expandedRow === bid.id;

                        return (
                          <React.Fragment key={bid.id}>
                            <tr
                              className={`group transition-colors ${isMobileView ? "" : "cursor-pointer"} ${isExp ? "bg-surface-raised/40" : "hover:bg-surface-raised/20"}`}
                              onClick={() => isMobileView ? setExpandedRow(isExp ? null : bid.id) : setSelectedBid(bid)}>

                              <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                                <button onClick={e => { e.stopPropagation(); if (!isMobileView) toggleStar(bid.id); }}
                                  className={`transition-colors ${bid.starred ? "text-warning" : "text-text-faint"}`}>
                                  <Star className="w-4 h-4" fill={bid.starred ? "currentColor" : "none"} />
                                </button>
                              </td>

                              <td className="px-4 py-4 align-top pt-5">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${sc.bg} ${sc.border} ${sc.text}`}>{st}</span>
                              </td>

                              <td className="px-4 py-4 align-top pt-5">
                                {bid.decision ? (
                                  <div className="space-y-1">
                                    <span title={bid.decisionReason || ""}
                                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${DECISION_BADGE[bid.decision] || DECISION_BADGE["Archived"]}`}>
                                      {bid.decision}
                                    </span>
                                    {bid.finalScore > 0 && (
                                      <div className="text-[11px] font-mono text-text-muted">
                                        {bid.finalScore}<span className="text-text-faint">/100</span>
                                        {bid.capabilityCount > 0 ? <span className="text-text-faint"> · {bid.capabilityCount} cap</span> : ""}
                                      </div>
                                    )}
                                  </div>
                                ) : <span className="text-text-faint text-xs">—</span>}
                              </td>

                              <td className="px-4 py-4 align-top pt-4">
                                <div className="text-text-muted text-xs mb-1.5 font-medium">{bid.dueDate ? new Date(bid.dueDate).toLocaleDateString() : "No Date"}</div>
                                {!bid.chk_compliance && <Countdown dueDate={bid.dueDate} />}
                              </td>

                              <td className="px-4 py-4">
                                {bid.chk_compliance && (
                                  <div className={`flex items-center gap-1.5 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg mb-2 w-fit ${bid.wonLoss === "No" ? "bg-danger text-white" : "bg-warning text-text"}`}>
                                    <CheckCircle2 className={`w-3 h-3 flex-shrink-0 ${bid.wonLoss === "No" ? "text-danger-fg" : "text-success-fg"}`} />
                                    BID PACKAGE SUBMITTED
                                  </div>
                                )}
                                <div className="text-sm font-semibold text-text mb-1.5 group-hover:text-info transition-colors line-clamp-2 pr-4">{bid.title}</div>
                                <div className="flex items-center gap-2 text-xs flex-wrap">
                                  <span className="text-text-muted flex items-center gap-1"><Building className="w-3 h-3" /> {bid.facility}</span>
                                  {bid.city && <><span className="w-1 h-1 rounded-full bg-bg-subtle" /><span className="text-text-faint">{bid.city}</span></>}
                                  {bid.category && <><span className="w-1 h-1 rounded-full bg-bg-subtle" /><span className="text-info/70 font-medium">{bid.category}</span></>}
                                  {bid.workflowStatus === "Submitted" && (() => {
                                    const ag = agingBadge(daysSince(bid.submittedDate));
                                    return (<>
                                      {ag && <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${ag.cls}`}>{ag.label}</span>}
                                      {bid.awardProbability > 0 && <span className="px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold">{bid.awardProbability}% win</span>}
                                      {bid.followUpStatus && bid.followUpStatus !== "Not Started" && <span className={`text-[10px] font-semibold ${FOLLOWUP_CLS[bid.followUpStatus] || "text-text-faint"}`}>· {bid.followUpStatus}</span>}
                                    </>);
                                  })()}
                                  {String(bid.workflowStatus || "").startsWith("Closed") && (
                                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${RESULT_BADGE[bid.workflowStatus] || ""}`}>{bid.resultStatus || bid.workflowStatus.replace("Closed ", "")}</span>
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-4 align-top pt-5">
                                <div className={`text-sm font-mono font-medium ${bid.bidAmount ? "text-success" : "text-text-faint"}`}>
                                  {bid.bidAmount ? `$${Number(bid.bidAmount).toLocaleString()}` : "—"}
                                </div>
                                {bid.awardedAmount && <div className="text-[10px] text-warning font-mono mt-1">Aw: ${Number(bid.awardedAmount).toLocaleString()}</div>}
                              </td>

                              <td className="px-4 py-4 align-top pt-5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${pc.bg} ${pc.border} ${pc.text}`}>{bid.priority || "Medium"}</span>
                              </td>

                              <td className="px-4 py-4 text-center align-top pt-3 relative"
                                onClick={e => { e.stopPropagation(); setExpandedRow(isExp ? null : bid.id); }}>
                                <ProgressRing pct={pct} size={42} stroke={3} />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-surface/80 backdrop-blur-sm rounded-lg m-2 cursor-pointer">
                                  <ChevronsUpDown className="w-4 h-4 text-info" />
                                </div>
                              </td>

                              <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                <div className="grid grid-cols-5 gap-1.5 w-max">
                                  {CHECK_FIELDS.map(f => (
                                    <div key={f.key} title={f.label} className="relative">
                                      <button
                                        onClick={e => { e.stopPropagation(); if (!isMobileView) toggleCheck(bid.id, f.key); }}
                                        className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all duration-200 ${bid[f.key] ? "bg-success-soft border-success/50 text-success" : "bg-surface border-border text-text-faint"} ${isMobileView ? "cursor-default" : "hover:border-border-strong hover:text-text-muted"}`}>
                                        <f.Icon className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>

                            {/* Expanded row */}
                            {isExp && (
                              <tr className="bg-surface-raised/20 border-b border-border">
                                <td colSpan="9" className="px-8 py-5">
                                  {/* Workflow actions — Follow → Bid On This → Archive */}
                                  <div className="flex flex-wrap items-center gap-2 mb-4" onClick={e => e.stopPropagation()}>
                                    <span className="text-[10px] font-bold text-text-faint uppercase tracking-wider mr-1">Workflow</span>
                                    {(bid.workflowStatus === "Recommended" || bid.workflowStatus === "Manual Review") && (
                                      <button onClick={() => setStage(bid, "Prospect")}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/25 transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Follow
                                      </button>
                                    )}
                                    {bid.workflowStatus === "Prospect" && (
                                      <button onClick={() => setStage(bid, "Active Bid")}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 text-xs font-bold hover:bg-violet-500/25 transition-colors">
                                        <Target className="w-3.5 h-3.5" /> Bid On This
                                      </button>
                                    )}
                                    {bid.workflowStatus === "Active Bid" && (
                                      <>
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 text-xs font-bold">
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Active Bid — folder authorized
                                        </span>
                                        <button onClick={() => setStage(bid, "Submitted")}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/25 transition-colors">
                                          <Send className="w-3.5 h-3.5" /> Submit Bid
                                        </button>
                                      </>
                                    )}
                                    {bid.workflowStatus === "Submitted" && (
                                      <>
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold">
                                          <Send className="w-3.5 h-3.5" /> Submitted{bid.submittedDate ? ` ${bid.submittedDate}` : ""} — awaiting decision
                                        </span>
                                        <button onClick={() => setStage(bid, "Awarded")}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-xs font-bold hover:bg-yellow-500/25 transition-colors">
                                          <Trophy className="w-3.5 h-3.5" /> Mark Awarded
                                        </button>
                                        <button onClick={() => setStage(bid, "Closed Lost")}
                                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 text-xs font-bold hover:bg-red-500/20 transition-colors">Close Lost</button>
                                        <button onClick={() => setStage(bid, "Closed Cancelled")}
                                          className="px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-500/25 text-xs font-bold hover:bg-slate-500/20 transition-colors">Close Cancelled</button>
                                        <button onClick={() => setStage(bid, "Closed Withdrawn")}
                                          className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/25 text-xs font-bold hover:bg-orange-500/20 transition-colors">Withdraw</button>
                                      </>
                                    )}
                                    {String(bid.workflowStatus || "").startsWith("Closed") && (
                                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${RESULT_BADGE[bid.workflowStatus] || RESULT_BADGE["Closed Cancelled"]}`}>
                                        <CheckCircle2 className="w-3.5 h-3.5" /> {bid.resultStatus || bid.workflowStatus.replace("Closed ", "")}
                                        {bid.closedDate ? ` · ${bid.closedDate}` : ""}
                                        <span className="text-text-faint font-normal">(read-only)</span>
                                      </span>
                                    )}
                                    {bid.workflowStatus === "Awarded" && (<>
                                      <div className="w-full flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-text-muted mb-1">
                                        {(bid.awardedAmount || bid.bidAmount) ? <span>Award: <span className="text-yellow-400 font-semibold">{money(bid.awardedAmount || bid.bidAmount)}</span></span> : null}
                                        {bid.promotionDate && <span>Award date: <span className="text-text-secondary">{bid.promotionDate}</span></span>}
                                        {bid.jobNumber && <span>Job #: <span className="text-text-secondary font-mono">{bid.jobNumber}</span></span>}
                                        <span>Promotion: <span className={bid.financialHubProjectId ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>{bid.financialHubProjectId ? "Promoted" : "Awaiting promotion"}</span></span>
                                      </div>
                                      {bid.financialHubProjectId ? (
                                        <div className="flex flex-col gap-2 w-full">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                                              <CheckCircle2 className="w-3.5 h-3.5" /> PROJECT CREATED · {bid.jobNumber || `#${bid.financialHubProjectId}`}
                                            </span>
                                            <a href={`http://${window.location.hostname}:5175/projects`} target="_blank" rel="noreferrer"
                                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-bg-subtle transition-colors">
                                              <ExternalLink className="w-3.5 h-3.5" /> Open in Financial Hub
                                            </a>
                                            {bid.jobNumber && (
                                              <button onClick={() => viewCosts(bid)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-bg-subtle transition-colors">
                                                <DollarSign className="w-3.5 h-3.5" /> {costData[bid.id] && !costData[bid.id].loading ? "Hide Costs" : "View Costs"}
                                              </button>
                                            )}
                                            {bid.jobNumber && (() => {
                                              const sd = startupData[bid.id];
                                              if (sd?.loading) return <span className="text-[11px] text-text-faint">Initializing startup pack…</span>;
                                              if (sd?.pack) return null;   // execution status shown below
                                              return (
                                                <button onClick={() => initProject(bid)}
                                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs font-bold hover:bg-orange-500/25 transition-colors">
                                                  <HardHat className="w-3.5 h-3.5" /> Initialize Project
                                                </button>
                                              );
                                            })()}
                                            {bid.promotionDate && <span className="text-[11px] text-text-faint">Promoted {bid.promotionDate}</span>}
                                          </div>
                                          {startupData[bid.id]?.pack && (() => {
                                            const pack = startupData[bid.id].pack;
                                            const tasks = pack.tasks || [], checklist = pack.checklist || [], ms = pack.milestones || [];
                                            const pm = (pack.crew || []).find(c => c.role === "Project Manager")?.name;
                                            const isActive = pack.status === "Active" || pack.project_status === "ACTIVE";
                                            const foldersOk = pack.folder_path && !String(pack.folder_path).startsWith("(");
                                            return (
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${isActive ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>
                                                  {isActive ? "Active" : `Startup ${pack.status}`} · {pack.completion_pct}%
                                                </span>
                                                {[
                                                  ["PM", pm || "unassigned"],
                                                  ["Tasks", `${tasks.filter(t => t.done).length}/${tasks.length}`],
                                                  ["Checklist", `${checklist.filter(c => c.done).length}/${checklist.length}`],
                                                  ["Milestones", `${ms.filter(m => m.completed).length}/${ms.length || (pack.milestone_ids || []).length}`],
                                                  ["Folders", foldersOk ? "12" : "0"],
                                                ].map(([k, v]) => (
                                                  <span key={k} className="px-2 py-1 rounded-md border border-border bg-surface-raised/40 text-[11px] text-text-muted" title={pack.folder_path || ""}>
                                                    <span className="text-text-faint">{k}:</span> <span className="font-mono font-semibold text-text-secondary">{v}</span>
                                                  </span>
                                                ))}
                                                <a href={`http://${window.location.hostname}:5175`} target="_blank" rel="noreferrer"
                                                  className="text-[11px] font-semibold text-orange-400 hover:underline">Manage startup in Financial Hub →</a>
                                              </div>
                                            );
                                          })()}
                                          {costData[bid.id] && (
                                            costData[bid.id].loading ? (
                                              <span className="text-[11px] text-text-faint">Loading project costs…</span>
                                            ) : costData[bid.id].error ? (
                                              <span className="text-[11px] text-danger">{costData[bid.id].error}</span>
                                            ) : (
                                              <div className="flex flex-col gap-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                  {[
                                                    ["Committed", `$${Number(costData[bid.id].committed_cost || 0).toLocaleString()} · ${costData[bid.id].committed_po_count || 0} PO`],
                                                    ["Actual", `$${Number(costData[bid.id].actual_cost || 0).toLocaleString()}`],
                                                    ["Projected", `$${Number(costData[bid.id].projected_cost || 0).toLocaleString()}`],
                                                    ["Contract", `$${Number(costData[bid.id].contract_value || 0).toLocaleString()}`],
                                                    ["Margin", `${costData[bid.id].margin_pct ?? 0}%`],
                                                  ].map(([k, v]) => (
                                                    <span key={k} className="px-2 py-1 rounded-md border border-border bg-surface-raised/40 text-[11px] text-text-muted">
                                                      <span className="text-text-faint">{k}:</span> <span className="font-mono font-semibold text-text-secondary">{v}</span>
                                                    </span>
                                                  ))}
                                                </div>
                                                {Array.isArray(costData[bid.id].categories) && costData[bid.id].categories.length > 0 && (
                                                  <div className="overflow-x-auto">
                                                    <table className="text-[11px] border border-border rounded-lg overflow-hidden w-auto">
                                                      <thead>
                                                        <tr className="text-text-faint bg-surface-raised/40 uppercase tracking-wide text-[10px]">
                                                          <th className="text-left px-2.5 py-1 font-semibold">Cost Category</th>
                                                          <th className="text-right px-2.5 py-1 font-semibold">Budget</th>
                                                          <th className="text-right px-2.5 py-1 font-semibold">Actual</th>
                                                          <th className="text-right px-2.5 py-1 font-semibold">Remaining</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {costData[bid.id].categories.map(cc => (
                                                          <tr key={cc.category} className="border-t border-border">
                                                            <td className="px-2.5 py-1 text-text-secondary">{cc.category}</td>
                                                            <td className="px-2.5 py-1 text-right font-mono text-text-muted">${Number(cc.budget || 0).toLocaleString()}</td>
                                                            <td className="px-2.5 py-1 text-right font-mono text-text-muted">${Number(cc.actual || 0).toLocaleString()}</td>
                                                            <td className={`px-2.5 py-1 text-right font-mono ${Number(cc.remaining) < 0 ? "text-danger" : "text-text-muted"}`}>${Number(cc.remaining || 0).toLocaleString()}</td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      ) : (
                                        <button onClick={() => promoteBid(bid)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-xs font-bold hover:bg-yellow-500/25 transition-colors">
                                          <Trophy className="w-3.5 h-3.5" /> Promote to Financial Hub Project
                                        </button>
                                      )}
                                      <button onClick={() => setStage(bid, "Closed Won")}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition-colors">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Close Won
                                      </button>
                                    </>)}
                                    {bid.workflowStatus && !["Archived", "Awarded"].includes(bid.workflowStatus) && !String(bid.workflowStatus).startsWith("Closed") && (
                                      <button onClick={() => setStage(bid, "Archived")}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-bold hover:bg-slate-500/20 transition-colors">
                                        Archive
                                      </button>
                                    )}
                                    {(bid.workflowStatus === "Prospect" || bid.workflowStatus === "Archived" || bid.workflowStatus === "Active Bid") && (
                                      <button onClick={() => setStage(bid, "Recommended")}
                                        className="px-3 py-1.5 rounded-lg text-text-faint hover:text-text-secondary text-xs font-semibold transition-colors">
                                        ↩ Back to Recommended
                                      </button>
                                    )}
                                  </div>
                                  {bid.workflowStatus === "Submitted" && (() => {
                                    const ag = agingBadge(daysSince(bid.submittedDate));
                                    const inp = "flex-1 h-7 rounded border border-border bg-surface px-2 text-[11px] text-text focus:outline-none focus:border-blue-500/50";
                                    return (
                                      <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                          <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Submission Tracking</h4>
                                          {ag && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ag.cls}`}>{ag.label}</span>}
                                          {bid.submittedDate && <span className="text-[11px] text-text-faint">Submitted {bid.submittedDate}</span>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                          <span className="text-[11px] text-text-faint w-24">Win Probability</span>
                                          {PROBABILITY_OPTS.map(pp => (
                                            <button key={pp} onClick={() => updateMeta(bid, { awardProbability: pp })}
                                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${Number(bid.awardProbability) === pp ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "border-border text-text-muted hover:text-text"}`}>{pp}%</button>
                                          ))}
                                          {bid.awardProbability > 0 && <span className="text-[11px] text-text-faint">Weighted: {money((Number(bid.bidAmount) || 0) * (Number(bid.awardProbability) / 100))}</span>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                          <span className="text-[11px] text-text-faint w-24">Follow-Up</span>
                                          {FOLLOWUP_OPTS.map(f => (
                                            <button key={f} onClick={() => updateMeta(bid, { followUpStatus: f, lastFollowUp: f !== "Not Started" ? new Date().toISOString().slice(0, 10) : "" })}
                                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${bid.followUpStatus === f ? `bg-surface-raised border-border-strong ${FOLLOWUP_CLS[f] || ""}` : "border-border text-text-muted hover:text-text"}`}>{f}</button>
                                          ))}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          <label className="flex items-center gap-2 text-[11px] text-text-faint">Next follow-up
                                            <input type="date" defaultValue={bid.nextFollowUp || ""} onBlur={e => e.target.value !== (bid.nextFollowUp || "") && updateMeta(bid, { nextFollowUp: e.target.value })} className={inp} /></label>
                                          <label className="flex items-center gap-2 text-[11px] text-text-faint">CO Name
                                            <input defaultValue={bid.coName || ""} onBlur={e => e.target.value !== (bid.coName || "") && updateMeta(bid, { coName: e.target.value })} className={inp} /></label>
                                          <label className="flex items-center gap-2 text-[11px] text-text-faint">CO Email
                                            <input defaultValue={bid.coEmail || ""} onBlur={e => e.target.value !== (bid.coEmail || "") && updateMeta(bid, { coEmail: e.target.value })} className={inp} /></label>
                                          <label className="flex items-center gap-2 text-[11px] text-text-faint">Notes
                                            <input defaultValue={bid.followUpNotes || ""} onBlur={e => e.target.value !== (bid.followUpNotes || "") && updateMeta(bid, { followUpNotes: e.target.value })} className={inp} /></label>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  {bid.decision && (
                                    <div className="mb-5">
                                      <h4 className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-2">Capture Decision</h4>
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${DECISION_BADGE[bid.decision] || DECISION_BADGE["Archived"]}`}>{bid.decision}</span>
                                        {[
                                          ["Final Score", `${bid.finalScore}/100`],
                                          ["Confidence", bid.confidence || "—"],
                                          ["Capability", bid.capabilityCount],
                                          ["Blacklist Hits", bid.blacklistHits],
                                          ["Historical Sim.", bid.historicalSimilarity != null ? bid.historicalSimilarity.toFixed(2) : "—"],
                                          ["Last Review", bid.lastReviewDate || "—"],
                                        ].map(([k, v]) => (
                                          <span key={k} className="px-2 py-1 rounded-md border border-border bg-surface-raised/50 text-[11px] text-text-muted">
                                            <span className="text-text-faint">{k}:</span> <span className="font-mono font-semibold text-text-secondary">{v}</span>
                                          </span>
                                        ))}
                                      </div>
                                      {bid.decisionReason && <p className="text-[11.5px] text-text-muted italic">{bid.decisionReason}</p>}
                                    </div>
                                  )}
                                  <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                      <h4 className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-3">Requirements</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {CHECK_FIELDS.map(f => (
                                          <div key={f.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${bid[f.key] ? "bg-success-soft border-success/20 text-success" : "bg-surface-raised/50 border-border text-text-muted"}`}>
                                            <f.Icon className="w-3 h-3" /> {f.label}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                    {!isMobileView && (
                                      <div className="flex items-end shrink-0">
                                        <button onClick={() => setSelectedBid(bid)}
                                          className="flex items-center gap-2 px-4 py-2 bg-info-soft text-info border border-info/20 rounded-lg text-sm font-semibold transition-colors hover:bg-info/20">
                                          Edit Full Details <ArrowRight className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {/* Mobile fallback (Phase 4): read-only cards, no horizontal scroll; tap opens
                    the full bid modal (richer than the desktop inline expand). Table above untouched. */}
                <div className="md:hidden divide-y divide-border">
                  {filteredBids.length === 0 ? (
                    <div className="px-4 py-10 text-center text-text-faint text-sm">No matching bids found.</div>
                  ) : filteredBids.map(bid => {
                    const pct = Math.round(CHECK_FIELDS.filter(f => bid[f.key]).length / CHECK_FIELDS.length * 100);
                    const st  = effectiveStatus(bid);
                    const sc  = STATUS_COLORS[st] || STATUS_COLORS["Open"];
                    const pc  = PRIORITIES[bid.priority] || PRIORITIES["Medium"];
                    return (
                      <button key={bid.id} onClick={() => setSelectedBid(bid)} className="w-full text-left px-4 py-3 hover:bg-surface-raised/20 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          {bid.starred && <Star className="w-3.5 h-3.5 text-warning flex-shrink-0" fill="currentColor" />}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${sc.bg} ${sc.border} ${sc.text}`}>{st}</span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${pc.bg} ${pc.border} ${pc.text}`}>{bid.priority || "Medium"}</span>
                        </div>
                        <div className="text-sm font-semibold text-text line-clamp-2 mb-1">{bid.title}</div>
                        <div className="flex items-center gap-x-2 gap-y-0.5 text-[11px] text-text-muted flex-wrap">
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {bid.facility}</span>
                          {bid.city && <span>· {bid.city}</span>}
                          <span className="ml-auto font-mono font-semibold text-success">{bid.bidAmount ? `$${Number(bid.bidAmount).toLocaleString()}` : "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-faint">
                          <span>Due {bid.dueDate ? new Date(bid.dueDate).toLocaleDateString() : "—"}</span>
                          <span className="ml-auto">{pct}% complete</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Active Projects Strip ── */}
            {projects.filter(p => p.status !== "Completed").length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-info" />
                    Active Projects
                  </h3>
                  <button onClick={() => setActiveTab("projects")}
                    className="text-[11px] text-info hover:text-info-fg font-semibold transition-colors">
                    View All →
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                  {projects.filter(p => p.status !== "Completed").map(p => {
                    const pct     = Math.max(0, Math.min(100, Number(p.progress) || 0));
                    const cK      = ((p.collectedValue || 0) / 1000).toFixed(0);
                    const ctK     = ((p.contractValue  || 0) / 1000).toFixed(0);
                    const mDone   = (p.milestones || []).filter(m => m.completed).length;
                    const mTotal  = (p.milestones || []).length;
                    return (
                      <div key={p.id}
                        onClick={() => { setActiveTab("projects"); setSelectedProject(p); }}
                        className="flex-shrink-0 w-60 bg-surface/80 border border-border/50 rounded-xl p-4 cursor-pointer hover:border-info/50 hover:bg-surface-raised/60 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] font-extrabold text-info uppercase tracking-wider bg-info-soft px-2 py-0.5 rounded-full border border-info/20">
                            {p.status === "In Progress" ? "Active" : p.status || "Active"}
                          </span>
                          <span className="text-[9px] text-text-faint uppercase tracking-wide">{p.phase || "Execution"}</span>
                        </div>
                        <div className="text-sm font-bold text-text group-hover:text-info transition-colors line-clamp-1 mb-0.5">
                          {p.title}
                        </div>
                        <div className="text-[10px] text-text-faint mb-3 line-clamp-1">{p.facility}</div>
                        <div className="flex items-center gap-3">
                          <ProgressRing pct={pct} size={38} stroke={3} />
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <div className="text-[10px] text-text-faint">Collected</div>
                            <div className="text-xs font-bold text-success">
                              ${cK}k <span className="text-text-faint font-normal">/ ${ctK}k</span>
                            </div>
                            <div className="text-[10px] text-text-muted mt-0.5">{mDone}/{mTotal} milestones</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════ PROJECTS TAB ════════════ */}
        {activeTab === "projects" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-6">

            {/* Stats row */}
            <CyberStatsPanel stats={projectStats} />

            <div className="bg-surface/60 border border-border rounded-2xl p-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-text px-2 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-info" /> Contract Execution
              </h2>
              {!isMobileView && (
                <button onClick={() => setShowAddProject(true)}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-info hover:bg-info text-text text-sm font-bold shadow-lg shadow-info/20 transition-all">
                  <Plus className="w-4 h-4" /> Start Project
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 gap-6">
              {projects.length === 0 && (
                <div className="col-span-full text-center py-12 text-text-faint">No active projects yet. Convert a won bid to get started.</div>
              )}
              {projects.map(p => <ProjectCard key={p.id} project={p} onClick={isMobileView ? () => {} : setSelectedProject} isMobileView={isMobileView} />)}
            </div>
          </div>
        )}

        {/* ════════════ RECOMPETE TAB ════════════ */}
        {activeTab === "recompete" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-6">

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Watching",  value: recompetes.length,                                                              color: "var(--color-warning)" },
                { label: "Overdue",         value: recompetes.filter(r => r.status === "OVERDUE").length,                          color: "var(--color-danger)" },
                { label: "Imminent (≤30d)", value: recompetes.filter(r => r.status === "IMMINENT").length,                         color: "var(--color-warning)" },
                { label: "ARE Prior Wins",  value: recompetes.filter(r => r.areWin?.includes("YES")).length,                       color: "var(--color-success)" },
              ].map(s => (
                <div key={s.label} className="bg-surface/60 border border-border rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl" style={{ backgroundColor: s.color }} />
                  <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">{s.label}</div>
                  <div className="text-3xl font-extrabold tracking-tight" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-surface/40 border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-warning-soft">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-sm font-bold text-warning uppercase tracking-wider">Recompete Watch</span>
                <span className="ml-auto text-xs text-text-faint">{recompetes.length} contracts expiring within 90 days</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                  <thead>
                    <tr className="bg-surface border-b border-border text-xs uppercase tracking-wider text-text-muted font-semibold">
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Days Until</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Recompete Date</th>
                      <th className="px-4 py-3">Award Date</th>
                      <th className="px-4 py-3">Cycle</th>
                      <th className="px-4 py-3">Contractor</th>
                      <th className="px-4 py-3">ARE Win?</th>
                      <th className="px-4 py-3">Est. Amount</th>
                      <th className="px-4 py-3">Title</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {recompetes.length === 0 && (
                      <tr><td colSpan="10" className="px-6 py-12 text-center text-text-faint">No recompetes found. Run the bid tracker agent to populate data.</td></tr>
                    )}
                    {recompetes.map((rc, i) => {
                      const statusColor =
                        rc.status === "OVERDUE"  ? "text-danger bg-danger-soft border-danger/20" :
                        rc.status === "IMMINENT" ? "text-warning bg-warning/10 border-warning/20" :
                                                   "text-success bg-success-soft border-success/20";
                      const isMyWin = rc.areWin?.includes("YES");
                      return (
                        <tr key={i} className={`transition-colors hover:bg-surface-raised/20 ${isMyWin ? "bg-warning-soft" : ""}`}>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>{rc.status}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-sm font-bold text-text-secondary">{rc.daysUntil}d</td>
                          <td className="px-4 py-3 text-sm font-medium text-text">{rc.city}{rc.state ? `, ${rc.state}` : ""}</td>
                          <td className="px-4 py-3 text-xs text-text-muted font-mono">{rc.recompeteDate}</td>
                          <td className="px-4 py-3 text-xs text-text-faint font-mono">{rc.awardDate}</td>
                          <td className="px-4 py-3 text-xs text-text-muted">{rc.cycle}</td>
                          <td className="px-4 py-3 text-xs text-text-muted max-w-[180px] truncate" title={rc.contractor}>{rc.contractor}</td>
                          <td className="px-4 py-3 text-xs font-bold text-center">
                            {isMyWin ? <span className="text-warning text-sm">★</span> : <span className="text-text-secondary">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-success">{rc.amount}</td>
                          <td className="px-4 py-3 text-xs text-text-secondary max-w-[260px] truncate" title={rc.title}>{rc.title}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ GEOINSIGHTS TAB ════════════ */}
        {activeTab === "map" && <GeoPerformanceView bids={bids} />}

        {/* ════════════ OPS TAB ════════════ */}
        {activeTab === "ops" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-6">

            {/* System health pill */}
            <div className="flex justify-end">
              <CompactSystemHealth />
            </div>

            {/* Task Planner (replaces Weekly Ops Checklist + Financial Health) */}
            <TodoPanel />

            {/* Risk Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface/60 border border-border rounded-3xl p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="text-xs font-bold text-text-faint uppercase tracking-widest">Risk Management</div>
                  <AlertCircle className="w-5 h-5 text-danger" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-text-muted text-sm">At-Risk Contracts</span>
                    <span className="text-xl font-bold text-danger">{projectStats.openIssues}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-text-muted text-sm">Critical Deadlines (&lt;3d)</span>
                    <span className="text-lg font-bold text-warning">{bidStats.urgent}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-text-muted text-sm">Total Tracked Bids</span>
                    <span className="text-lg font-bold text-info">{bidStats.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Job Ledger ────────────────────────────────── */}
            <div className="bg-surface/60 border border-border rounded-3xl p-6">
              <div className="flex justify-between items-center mb-5">
                <div className="text-xs font-bold text-text-faint uppercase tracking-widest">Automation Job Ledger</div>
                <button
                  onClick={() => { setOpsStatusFilter(null); setOpsFlowFilter(null); }}
                  className="text-[10px] text-text-faint hover:text-text-secondary uppercase tracking-widest"
                >
                  Clear filters
                </button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Failed Today",  value: opsSummary.failed_today, color: "rose",    status: "failed"  },
                  { label: "Queued",        value: opsSummary.queued,        color: "amber",   status: "queued"  },
                  { label: "Running",       value: opsSummary.running,       color: "sky",     status: "running" },
                  { label: "Success (24h)", value: opsSummary.success_24h,   color: "emerald", status: "success" },
                ].map(c => (
                  <button
                    key={c.status}
                    onClick={() => setOpsStatusFilter(opsStatusFilter === c.status ? null : c.status)}
                    className={`p-3 rounded-2xl border text-left transition-all hover:brightness-110 ${
                      opsStatusFilter === c.status
                        ? `bg-${c.color}-500/20 border-${c.color}-500/50`
                        : "bg-bg-app/50 border-border hover:border-border"
                    }`}
                  >
                    <div className={`text-2xl font-black text-${c.color}-400`}>{c.value}</div>
                    <div className="text-[10px] text-text-faint uppercase tracking-widest mt-0.5">{c.label}</div>
                  </button>
                ))}
              </div>

              {/* Flow filter pills */}
              {Object.keys(opsSummary.by_flow).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.keys(opsSummary.by_flow).map(f => (
                    <button
                      key={f}
                      onClick={() => setOpsFlowFilter(opsFlowFilter === f ? null : f)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                        opsFlowFilter === f
                          ? "bg-special-soft text-special-fg border border-special/50"
                          : "bg-surface-raised text-text-muted border border-border hover:border-border-strong"
                      }`}
                    >
                      {f.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              )}

              {/* Jobs table */}
              {opsJobs.length === 0 ? (
                <div className="text-center text-text-faint text-sm py-8">
                  No jobs yet — watchers will log here when they run.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-text-faint uppercase tracking-widest border-b border-border">
                        <th className="text-left pb-2 pr-4">Flow</th>
                        <th className="text-left pb-2 pr-4">Status</th>
                        <th className="text-left pb-2 pr-4">Stage</th>
                        <th className="text-left pb-2 pr-4">Attempts</th>
                        <th className="text-left pb-2 pr-4">Input</th>
                        <th className="text-left pb-2 pr-4">Updated</th>
                        <th className="text-left pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {opsJobs.map(job => {
                        const statusColor = {
                          success: "text-success", failed: "text-danger",
                          running: "text-info",     queued: "text-warning",
                        }[job.status] || "text-text-muted";
                        const inputName = job.input_path
                          ? job.input_path.split("/").pop()
                          : "—";
                        const updatedShort = job.updated_at
                          ? job.updated_at.replace("T", " ").slice(0, 16)
                          : "—";
                        return (
                          <tr
                            key={job.job_id}
                            className="border-b border-border/50 hover:bg-surface-raised/30 cursor-pointer"
                            onClick={() => setOpsSelected(job.job_id === opsSelected ? null : job.job_id)}
                          >
                            <td className="py-2 pr-4 text-text-secondary font-mono text-xs">{job.flow.replace(/_/g, " ")}</td>
                            <td className={`py-2 pr-4 font-bold text-xs ${statusColor}`}>{job.status}</td>
                            <td className="py-2 pr-4 text-text-muted text-xs">{job.stage || "—"}</td>
                            <td className="py-2 pr-4 text-text-muted text-xs">{job.attempts}/{job.max_attempts}</td>
                            <td className="py-2 pr-4 text-text-muted text-xs max-w-[160px] truncate" title={job.input_path}>{inputName}</td>
                            <td className="py-2 pr-4 text-text-faint text-xs">{updatedShort}</td>
                            <td className="py-2">
                              {job.status === "failed" && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    fetch(`/ops/jobs/${job.job_id}/retry`, { method: "POST" })
                                      .then(() => showToast("Job reset to queued ✓", "success"));
                                  }}
                                  className="text-[10px] px-2 py-1 rounded-lg bg-warning-soft text-warning hover:bg-warning-soft font-bold uppercase tracking-widest"
                                >
                                  Retry
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Inline detail row */}
              {opsSelected && (() => {
                const job = opsJobs.find(j => j.job_id === opsSelected);
                if (!job) return null;
                return (
                  <div className="mt-4 p-4 bg-bg-app/70 rounded-2xl border border-border text-xs font-mono text-text-secondary space-y-1">
                    <div><span className="text-text-faint">job_id: </span>{job.job_id}</div>
                    <div><span className="text-text-faint">input:  </span>{job.input_path || "—"}</div>
                    {job.last_error && (
                      <div><span className="text-danger">error:  </span>{job.last_error}</div>
                    )}
                    <div><span className="text-text-faint">created: </span>{job.created_at}</div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

      </main>

      {/* ════════════ MODALS ════════════ */}
      {selectedBid && (
        <BidModal
          bid={bids.find(b => b.id === selectedBid.id) || selectedBid}
          onClose={() => setSelectedBid(null)}
          onSave={saveBid}
          onDelete={deleteBid}
          toast={showToast}
        />
      )}

      {showAddBid && <AddBidModal onClose={() => setShowAddBid(false)} onAdd={addBid} />}

      {bidToConvert && (
        <AddProjectModal
          isConversion
          initialData={{
            title:         bidToConvert.title,
            facility:      bidToConvert.facility,
            contractValue: bidToConvert.awardedAmount || bidToConvert.bidAmount || "",
            status:        "In Progress",
            phase:         "Planning",
            progress:      0,
            startDate:     new Date().toISOString().split("T")[0],
            endDate:       "",
            collectedValue: 0,
            milestones:    [],
            invoices:      [],
            issues:        [],
            notes:         [],
          }}
          onClose={() => setBidToConvert(null)}
          onAdd={newProj => { addProject(newProj); setBidToConvert(null); setActiveTab("projects"); }}
        />
      )}

      {selectedProject && (
        <ProjectModal
          project={projects.find(p => p.id === selectedProject.id) || selectedProject}
          onClose={() => setSelectedProject(null)}
          onSave={saveProject}
          toast={showToast}
        />
      )}

      {showAddProject && (
        <AddProjectModal
          onClose={() => setShowAddProject(false)}
          onAdd={addProject}
        />
      )}

      {showOpsModal && (
        <OpsChecklistModal
          stats={projectStats}
          onClose={() => setShowOpsModal(false)}
        />
      )}

      {showAuditLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowAuditLog(false)}>
          <div className="w-full max-w-3xl max-h-[85vh] flex flex-col bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-info" />
                <h3 className="text-base font-bold text-text">Automation Audit Log</h3>
                <span className="text-xs text-text-faint">{Array.isArray(auditEvents) ? `${auditEvents.length} events` : ""}</span>
              </div>
              <button onClick={() => setShowAuditLog(false)} className="text-text-faint hover:text-text-secondary"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-auto">
              {auditEvents === null ? (
                <div className="px-5 py-12 text-center text-text-muted text-sm">Loading…</div>
              ) : auditEvents.length === 0 ? (
                <div className="px-5 py-12 text-center text-text-faint text-sm">No automation events recorded yet.</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-bg-app text-[10px] uppercase tracking-wider text-text-faint border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-2.5">When</th>
                      <th className="text-left px-3 py-2.5">Opportunity</th>
                      <th className="text-left px-3 py-2.5">Trigger</th>
                      <th className="text-left px-3 py-2.5">Action</th>
                      <th className="text-left px-3 py-2.5">Result</th>
                      <th className="text-left px-4 py-2.5">Folder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditEvents.map((e, i) => (
                      <tr key={i} className="hover:bg-surface-raised/30">
                        <td className="px-4 py-2.5 text-text-muted whitespace-nowrap font-mono">{e.timestamp ? new Date(e.timestamp).toLocaleString() : "—"}</td>
                        <td className="px-3 py-2.5 text-text-secondary max-w-[180px] truncate" title={`${e.title || ""} (${e.opportunity_id || ""})`}>{e.title || e.opportunity_id || "—"}</td>
                        <td className="px-3 py-2.5 text-text-muted font-mono">{e.trigger || "—"}</td>
                        <td className="px-3 py-2.5 font-semibold text-text">{e.action || "—"}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${e.error_message ? "bg-danger/20 text-danger" : "bg-success-soft text-success"}`}>{e.error_message ? "error" : (e.result || "ok")}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          {e.folder_created
                            ? <span className="text-success font-mono text-[10px]" title={e.folder_path}>✓ {e.folder_path ? e.folder_path.split("/").pop() : "created"}</span>
                            : <span className="text-text-faint">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-5 py-3 border-t border-border text-[11px] text-text-faint">
              Every folder creation, download, and workflow change writes an immutable audit record.
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}