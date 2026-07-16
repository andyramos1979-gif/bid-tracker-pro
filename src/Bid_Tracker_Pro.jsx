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
  Layers, Trophy
} from "lucide-react";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const CHECK_FIELDS = [
  { key: "chk_sf1449",    label: "SF1449",    Icon: FileText },
  { key: "chk_sow_pws",   label: "SOW/PWS",   Icon: ClipboardCheck },
  { key: "chk_pricing",   label: "Pricing",   Icon: DollarSign },
  { key: "chk_past_perf", label: "Past Perf", Icon: BarChart2 },
  { key: "chk_osha_safety",label:"OSHA",      Icon: HardHat },
  { key: "chk_licenses",  label: "Licenses",  Icon: CheckCircle2 },
  { key: "chk_site_visit",label: "Site Visit",Icon: Building },
  { key: "chk_sub_loi",   label: "Sub LOI",   Icon: Mail },
  { key: "chk_compliance",label: "Bid Submitted",Icon: ShieldCheck },
];

const OPS_SCHEMA = [
  { id: "cash",     title: "Cash, Finance & Admin",  items: ["Bank balances reviewed", "Open invoices followed up", "Bills scheduled", "Tax reserves confirmed"] },
  { id: "pipeline", title: "Estimating & Sales",     items: ["New opportunities reviewed", "Active estimates checked", "Pricing validated", "Follow-ups scheduled"] },
  { id: "jobs",     title: "Active Jobs Control",    items: ["Jobs reviewed (Track/Risk)", "Work scheduled", "Budget checked", "Change orders logged"] },
];

const CATEGORIES    = ["All", "Electrical", "Inspection", "HVAC", "Grounds", "Construction", "Plumbing"];

// Capture Intelligence decision → badge styling (dashboard columns/badges).
const DECISION_BADGE = {
  "Recommended":   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Manual Review": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Archived":      "bg-slate-500/15 text-slate-400 border-slate-500/30",
};
// Decision filter chips (workflow as filters, not buckets).
const DECISION_FILTERS = ["All", "Recommended", "Manual Review"];
const PROJECT_PHASES = ["Planning", "Design", "Procurement", "Execution", "Closeout"];

const PRIORITIES = {
  Critical: { text: "text-danger",    bg: "bg-danger-soft",    border: "border-danger/20",    hex: "var(--color-danger)" },
  High:     { text: "text-warning",  bg: "bg-warning-soft",  border: "border-warning/20",  hex: "var(--color-warning)" },
  Medium:   { text: "text-warning",   bg: "bg-warning/10",   border: "border-warning/20",   hex: "var(--color-warning)" },
  Low:      { text: "text-success", bg: "bg-success-soft", border: "border-success/20", hex: "var(--color-success)" },
};

const STATUS_COLORS = {
  Open:    { text: "text-success", bg: "bg-success-soft", border: "border-success/20", hex: "var(--color-success)" },
  Awarded: { text: "text-warning",   bg: "bg-warning/10",   border: "border-warning/20",   hex: "var(--color-warning)" },
  Closed:  { text: "text-text-muted",   bg: "bg-bg-subtle/10",   border: "border-border/20",   hex: "var(--color-text-faint)" },
};

const PROJECT_STATUS = {
  "In Progress": { text: "text-info",    bg: "bg-info-soft",    border: "border-info/30",    hex: "#60a5fa" },
  "On Hold":     { text: "text-warning",  bg: "bg-warning-soft",  border: "border-warning/30",  hex: "var(--color-warning)" },
  "Completed":   { text: "text-success", bg: "bg-success-soft", border: "border-success/30", hex: "var(--color-success)" },
  "Cancelled":   { text: "text-danger",    bg: "bg-danger-soft",    border: "border-danger/30",    hex: "var(--color-danger)" },
};

const GEO_WIN_RATES = [
  { name: "Testing",        pct: 53, color: "var(--color-success)" },
  { name: "Arc Flash",      pct: 24, color: "var(--color-info)" },
  { name: "Generator/ATS",  pct: 12, color: "var(--color-danger)" },
  { name: "HVAC",           pct: 38, color: "var(--color-warning)" },
  { name: "Construction",   pct: 29, color: "#a78bfa" },
];

// ─── SHARED UTILITY COMPONENTS ───────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="font-mono text-sm font-medium text-info">{now.toLocaleTimeString()}</span>;
}

function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  const styles =
    type === "success" ? "bg-success text-text" :
    type === "warn"    ? "bg-warning text-text"   :
                         "bg-info text-text";
  return (
    <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg font-bold text-sm shadow-xl z-[9999] animate-in slide-in-from-bottom-5 ${styles}`}>
      {message}
    </div>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const w = 80, h = 28;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`
  ).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - ((data[data.length - 1] - min) / (max - min || 1)) * h}
        r="3" fill={color}
      />
    </svg>
  );
}

function Countdown({ dueDate, compact }) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const calc = () => {
      if (!dueDate) return setTimeLeft({ expired: false, missing: true });
      const parsed = new Date(dueDate);
      if (isNaN(parsed)) return setTimeLeft({ expired: false, missing: true });
      const dateStr = parsed.toISOString().split("T")[0];
      const target = new Date(dateStr + "T23:59:59");
      const diff = target - new Date();
      if (diff <= 0) return setTimeLeft({ expired: true });
      setTimeLeft({
        days:  Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins:  Math.floor((diff % 3600000) / 60000),
        secs:  Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [dueDate]);

  if (timeLeft.missing)          return <span className="text-text-faint font-bold text-xs">No Date</span>;
  if (timeLeft.expired)          return <span className="text-danger font-bold text-xs uppercase tracking-wider">Expired</span>;
  if (!("days" in timeLeft))     return null;

  const txtColor = timeLeft.days < 3 ? "text-danger" : timeLeft.days < 7 ? "text-warning" : "text-success";
  const color    = timeLeft.days < 3
    ? "text-danger border-danger/30 bg-danger-soft"
    : timeLeft.days < 7
    ? "text-warning border-warning/30 bg-warning-soft"
    : "text-success border-success/30 bg-success-soft";

  if (compact) return <span className={`text-xs font-mono font-bold ${txtColor}`}>{timeLeft.days}d {timeLeft.hours}h</span>;

  return (
    <div className="flex gap-1.5">
      {[{ v: timeLeft.days, l: "d" }, { v: timeLeft.hours, l: "h" }, { v: timeLeft.mins, l: "m" }, { v: timeLeft.secs, l: "s" }].map(({ v, l }) => (
        <div key={l} className={`border rounded px-1.5 py-0.5 min-w-[32px] text-center flex flex-col items-center justify-center ${color}`}>
          <div className="text-xs font-extrabold font-mono leading-none">{String(v).padStart(2, "0")}</div>
          <div className="text-[9px] uppercase font-semibold opacity-70 mt-0.5">{l}</div>
        </div>
      ))}
    </div>
  );
}

function ProgressRing({ pct, size = 44, stroke = 4, customColor }) {
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const color = customColor || (pct === 100 ? "var(--color-success)" : pct > 50 ? "var(--color-warning)" : "var(--color-danger)");
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-surface-raised)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" className="transition-all duration-500 ease-out" />
      </svg>
      <span className="absolute font-mono text-[10px] font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

const InputField = ({ label, value, onChange, placeholder, type = "text", as = "input", options = [] }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</label>
    {as === "select" ? (
      <select value={value || ""} onChange={onChange}
        className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-info focus:ring-1 focus:ring-info transition-all">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : as === "textarea" ? (
      <textarea value={value || ""} onChange={onChange} placeholder={placeholder}
        className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-info focus:ring-1 focus:ring-info transition-all min-h-[80px] resize-y" />
    ) : (
      <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder}
        className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-info focus:ring-1 focus:ring-info transition-all" />
    )}
  </div>
);

// ─── BIDS COMPONENTS ─────────────────────────────────────────────────────────

function KanbanView({ bids, onSelect, onToggleStar, isMobileView }) {
  const cols = ["Open", "Closed", "Awarded"];
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 min-h-[400px]">
      {cols.map(col => {
        const colBids = (bids || []).filter(b => (b.status === col || (col === "Closed" && b.status === "Open" && b.dueDate && new Date(b.dueDate) < new Date())));
        const style   = STATUS_COLORS[col] || STATUS_COLORS["Open"];
        return (
          <div key={col} className="min-w-[320px] flex-1">
            <div className={`flex items-center gap-2 mb-4 px-4 py-3 bg-surface/80 rounded-xl border ${style.border}`}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.hex }} />
              <span className={`font-bold text-sm ${style.text}`}>{col}</span>
              <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}>{colBids.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {colBids.map(bid => {
                const pct    = Math.round(CHECK_FIELDS.filter(f => bid[f.key]).length / CHECK_FIELDS.length * 100);
                const pStyle = PRIORITIES[bid.priority] || PRIORITIES["Medium"];
                return (
                  <div key={bid.id}
                    onClick={() => !isMobileView && onSelect(bid)}
                    className={`group bg-surface border border-border rounded-xl p-4 relative overflow-hidden shadow-sm transition-all ${isMobileView ? "" : "cursor-pointer hover:border-border-strong hover:shadow-md"}`}>
                    <div className="absolute top-0 left-0 h-0.5 transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: style.hex }} />
                    <div className="flex justify-between items-start mb-3">
                      <span className={`border rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pStyle.bg} ${pStyle.border} ${pStyle.text}`}>{bid.priority || "Medium"}</span>
                      <button
                        onClick={e => { e.stopPropagation(); if (!isMobileView) onToggleStar(bid.id); }}
                        className={`p-1 rounded-md transition-colors ${bid.starred ? "text-warning" : "text-text-faint"} ${isMobileView ? "cursor-default" : "hover:text-text-muted hover:bg-surface-raised"}`}>
                        <Star className="w-4 h-4" fill={bid.starred ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <h3 className="text-text text-sm font-semibold leading-tight mb-3 line-clamp-2 group-hover:text-info transition-colors">{bid.title}</h3>
                    <div className="flex justify-between items-end mt-4">
                      <span className="text-text-faint text-xs flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" />{bid.city}{bid.state ? `, ${bid.state}` : ""}
                      </span>
                      <Countdown dueDate={bid.dueDate} compact />
                    </div>
                  </div>
                );
              })}
              {colBids.length === 0 && (
                <div className="text-text-faint text-sm text-center py-8 border border-dashed border-border rounded-xl">No {col.toLowerCase()} bids</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BidModal({ bid, onClose, onSave, onDelete, toast }) {
  const [form, setForm]   = useState({ ...bid });
  const [newNote, setNewNote] = useState("");
  const [tab, setTab]     = useState("details");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addNote = () => {
    if (!newNote.trim()) return;
    set("notes", [...(form.notes || []), `${new Date().toLocaleDateString()}: ${newNote}`]);
    setNewNote("");
  };

  const pct    = Math.round(CHECK_FIELDS.filter(f => form[f.key]).length / CHECK_FIELDS.length * 100);
  const pStyle = PRIORITIES[form.priority] || PRIORITIES["Medium"];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-bg-app/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-6">
              <div className="flex gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${pStyle.bg} ${pStyle.text}`}>{form.priority || "Medium"} Priority</span>
                <span className="px-2.5 py-1 rounded text-xs font-medium bg-info-soft text-info border border-info/20">{form.category || "General"}</span>
              </div>
              <h2 className="text-xl font-bold text-white leading-snug">{form.title}</h2>
              {form.chk_compliance && (
                <div className={`flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider px-3 py-1.5 rounded-xl mt-3 w-fit ${form.wonLoss === "No" ? "bg-danger text-white" : "bg-warning text-text"}`}>
                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${form.wonLoss === "No" ? "text-danger-fg" : "text-success-fg"}`} />
                  BID PACKAGE SUBMITTED
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <ProgressRing pct={pct} size={48} stroke={4} />
              <button onClick={onClose} className="p-2 bg-surface-raised hover:bg-bg-subtle text-text-muted hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex gap-6 border-b border-border">
            {["details", "checklist", "notes", "link", "files"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-colors ${tab === t ? "border-info text-info" : "border-transparent text-text-muted hover:text-text-secondary"}`}>
                {t === "link" ? "🔗 SAM Link" : t === "files" ? "📁 Files" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === "details" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <InputField label="Bid Amount ($)"     value={form.bidAmount}     onChange={e => set("bidAmount",     e.target.value)} placeholder="e.g. 150000" />
                <InputField label="Awarded Amount ($)" value={form.awardedAmount} onChange={e => set("awardedAmount", e.target.value)} placeholder="e.g. 145000" />
                <InputField label="VISN"               value={form.visn}          onChange={e => set("visn",          e.target.value)} />
                <InputField label="NCO"                value={form.nco}           onChange={e => set("nco",           e.target.value)} />
                <InputField label="Contractor"         value={form.contractor}    onChange={e => set("contractor",    e.target.value)} />
                <InputField label="Contract #"         value={form.contractNo}    onChange={e => set("contractNo",    e.target.value)} />
                <InputField label="Status"   value={form.status}   onChange={e => set("status",   e.target.value)} as="select" options={["Open", "Closed", "Awarded"]} />
                <InputField label="Priority" value={form.priority} onChange={e => set("priority", e.target.value)} as="select" options={["Critical", "High", "Medium", "Low"]} />
              </div>

              {/* Won / Loss toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Won / Loss</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => set("wonLoss", form.wonLoss === "Yes" ? "" : "Yes")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold border transition-all ${
                      form.wonLoss === "Yes"
                        ? "bg-success-soft border-success/50 text-success"
                        : "bg-surface-raised border-border text-text-muted hover:border-success/40 hover:text-success"
                    }`}>
                    <Trophy className="w-4 h-4" /> Yes — Won
                  </button>
                  <button
                    type="button"
                    onClick={() => set("wonLoss", form.wonLoss === "No" ? "" : "No")}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold border transition-all ${
                      form.wonLoss === "No"
                        ? "bg-danger/20 border-danger/50 text-danger"
                        : "bg-surface-raised border-border text-text-muted hover:border-danger/40 hover:text-danger"
                    }`}>
                    <X className="w-4 h-4" /> No — Lost
                  </button>
                  {form.wonLoss && (
                    <button
                      type="button"
                      onClick={() => set("wonLoss", "")}
                      className="px-3 py-2 rounded-lg text-xs text-text-faint hover:text-text-secondary transition-colors">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <InputField label="Reason / Description" value={form.reason} onChange={e => set("reason", e.target.value)} as="textarea" placeholder="Provide context or reason for current status..." />
            </div>
          )}

          {tab === "checklist" && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {CHECK_FIELDS.map(f => {
                const checked = form[f.key];
                return (
                  <label key={f.key} onClick={() => set(f.key, !checked)}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? "bg-success-soft border-success/30" : "bg-surface border-border hover:border-border-strong"}`}>
                    <div className={`p-2 rounded-lg ${checked ? "bg-success-soft text-success" : "bg-surface-raised text-text-muted"}`}>
                      <f.Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${checked ? "text-success" : "text-text-secondary"}`}>{f.label}</div>
                      <div className={`text-xs ${checked ? "text-success/70" : "text-text-faint"}`}>{checked ? "Complete" : "Pending"}</div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checked ? "bg-success border-success" : "border-border-strong"}`}>
                      {checked && <CheckCircle2 className="w-3.5 h-3.5 text-text" />}
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          {tab === "notes" && (
            <div className="flex flex-col h-full">
              <div className="flex flex-wrap gap-3 mb-4">
                <button onClick={() => fetch('/open-estimating')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-raised border border-border hover:border-info text-info hover:text-info-fg text-sm font-medium transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  Open Estimating Folder
                </button>
                {form.link && (
                  <a href={form.link} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-raised border border-border hover:border-success text-success hover:text-success-fg text-sm font-medium transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    Open Bid Link
                  </a>
                )}
              </div>
              <div className="flex gap-3 mb-6">
                <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()}
                  placeholder="Type a note and press Enter..."
                  className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text focus:border-info focus:ring-1 focus:ring-info outline-none transition-all" />
                <button onClick={addNote} className="px-5 py-2.5 rounded-lg bg-info hover:bg-info text-text font-bold text-sm transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                {(!form.notes || form.notes.length === 0) && (
                  <div className="text-text-faint text-center py-12 text-sm bg-surface/50 rounded-xl border border-dashed border-border">No notes added yet.</div>
                )}
                {(form.notes || []).slice().reverse().map((n, i) => {
                  const [date, ...rest] = n.split(":");
                  return (
                    <div key={i} className="bg-surface-raised/50 border border-border/50 rounded-xl p-4 flex flex-col gap-1.5">
                      <span className="text-info text-xs font-mono font-medium">{date}</span>
                      <p className="text-text-secondary text-sm leading-relaxed">{rest.join(":")}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "link" && (
            <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full">
              {form.link ? (
                <a href={form.link} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 px-6 py-4 rounded-xl bg-success-soft border border-success/30 text-success font-bold text-sm hover:bg-success-soft transition-all group">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  <span className="flex-1 break-all">{form.link}</span>
                  <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100" />
                </a>
              ) : (
                <div className="text-text-faint text-sm text-center py-6 bg-surface/50 rounded-xl border border-dashed border-border">
                  No SAM link yet — add one below.
                </div>
              )}
              <div className="bg-surface border border-border rounded-xl p-5 flex flex-col gap-3">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">SAM.gov Solicitation URL</label>
                <input
                  value={form.link || ""}
                  onChange={e => set("link", e.target.value)}
                  placeholder="https://sam.gov/workspace/contract/opp/..."
                  className="w-full bg-bg-app border border-border rounded-lg px-4 py-2.5 text-sm text-text outline-none focus:border-info font-mono"
                />
                <p className="text-xs text-text-faint">Paste the SAM.gov solicitation link. It will be saved when you click Save Changes.</p>
              </div>
            </div>
          )}

          {tab === "files" && (
            <div className="flex flex-col gap-5 max-w-2xl mx-auto w-full">
              {form.folderPath ? (
                <>
                  <button
                    onClick={() => fetch(`/api/open-folder?path=${encodeURIComponent(form.folderPath)}`)}
                    className="flex items-center gap-3 px-6 py-4 rounded-xl bg-info-soft border border-info/30 text-info font-bold text-sm hover:bg-info/20 transition-all group text-left w-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-info-fg mb-0.5">Open Estimate Folder in Finder</div>
                      <div className="text-xs text-info/70 font-mono truncate">{form.folderPath.split("/").slice(-1)[0]}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-60 group-hover:opacity-100 flex-shrink-0" />
                  </button>
                  <div className="bg-surface border border-border rounded-xl p-4">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Full Path</p>
                    <p className="text-xs text-text-faint font-mono break-all">{form.folderPath}</p>
                  </div>
                </>
              ) : (
                <div className="text-text-faint text-sm text-center py-12 bg-surface/50 rounded-xl border border-dashed border-border">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mx-auto mb-3 text-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  No estimate folder created yet.<br />
                  <span className="text-xs text-text-faint mt-1 block">Run <code className="bg-surface-raised px-1 rounded">create_estimate_folders.py</code> to generate it.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface/50 flex justify-between items-center flex-shrink-0 rounded-b-2xl">
          <button
            onClick={() => { if (window.confirm("Are you sure you want to delete this bid?")) { onDelete(bid.id); onClose(); } }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-danger hover:bg-danger-soft text-sm font-semibold transition-colors">
            <Trash2 className="w-4 h-4" /> Delete Bid
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-text-secondary hover:bg-surface-raised text-sm font-semibold transition-colors">Cancel</button>
            <button onClick={() => { onSave(form); toast("Bid saved successfully", "success"); onClose(); }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-info hover:bg-info text-text text-sm font-bold shadow-lg shadow-info/20 transition-all">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddBidModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    status: "Open", dueDate: "", title: "", state: "", city: "", facility: "",
    bidAmount: "", awardedAmount: "", reason: "", visn: "", nco: "",
    contractor: "Andy Ramos Electric LLC", contractNo: "", priority: "Medium",
    category: "Electrical", notes: [], starred: false,
    chk_sf1449: false, chk_sow_pws: false, chk_pricing: false, chk_past_perf: false,
    chk_osha_safety: false, chk_licenses: false, chk_site_visit: false,
    chk_sub_loi: false, chk_compliance: false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-bg-app/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border bg-surface flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success-soft text-success rounded-lg"><Plus className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold text-white">Create New Bid</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-surface-raised hover:bg-bg-subtle text-text-muted rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          <InputField label="Bid Title *" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Electrical Upgrade Phase 2" />
          <div className="grid grid-cols-2 gap-5">
            <InputField label="Due Date *"  type="date" value={form.dueDate}   onChange={e => set("dueDate",   e.target.value)} />
            <InputField label="Facility"               value={form.facility}  onChange={e => set("facility",  e.target.value)} placeholder="e.g. Bedford VAMC" />
            <InputField label="City"                   value={form.city}      onChange={e => set("city",      e.target.value)} />
            <InputField label="State"                  value={form.state}     onChange={e => set("state",     e.target.value)} />
            <InputField label="Priority" value={form.priority} onChange={e => set("priority", e.target.value)} as="select" options={["Critical", "High", "Medium", "Low"]} />
            <InputField label="Category" value={form.category} onChange={e => set("category", e.target.value)} as="select" options={CATEGORIES.slice(1)} />
          </div>
        </div>
        <div className="p-6 border-t border-border bg-surface/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-text-secondary hover:bg-surface-raised text-sm font-semibold transition-colors">Cancel</button>
          <button
            onClick={() => { if (!form.title || !form.dueDate) return alert("Title and Due Date are required."); onAdd({ ...form, id: Date.now() }); onClose(); }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-success hover:bg-success text-text text-sm font-bold shadow-lg shadow-success/20 transition-all">
            <Plus className="w-4 h-4" /> Create Bid
          </button>
        </div>
      </div>
    </div>
  );
}

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

function CsIconPlayBox({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* body */}
      <rect x="4" y="12" width="60" height="38" rx="3" stroke={c} strokeWidth="1.4" fill={c + "12"}/>
      {/* top strip */}
      <rect x="4" y="5"  width="60" height="9"  rx="2" stroke={c} strokeWidth="1.4" fill={c + "22"}/>
      {/* inner frame */}
      <rect x="10" y="18" width="48" height="26" rx="2" stroke={c} strokeWidth="0.8" opacity="0.45"/>
      {/* corner dots */}
      <circle cx="8"  cy="9.5" r="1.8" fill={c}/>
      <circle cx="60" cy="9.5" r="1.8" fill={c}/>
      {/* play triangle */}
      <path d="M26 24 L44 31 L26 38 Z" fill={c}/>
      {/* side connectors */}
      <line x1="0" y1="26" x2="4" y2="26" stroke={c} strokeWidth="1.5"/>
      <line x1="64" y1="26" x2="68" y2="26" stroke={c} strokeWidth="1.5"/>
      <line x1="0" y1="33" x2="4" y2="33" stroke={c} strokeWidth="1"/>
      <line x1="64" y1="33" x2="68" y2="33" stroke={c} strokeWidth="1"/>
    </svg>
  );
}

function CsIconRings({ c }) {
  const ticks = Array.from({ length: 16 }, (_, i) => {
    const a = ((i * 22.5) - 90) * Math.PI / 180;
    return {
      x1: 27 + 23 * Math.cos(a), y1: 27 + 23 * Math.sin(a),
      x2: 27 + 20 * Math.cos(a), y2: 27 + 20 * Math.sin(a),
    };
  });
  return (
    <svg viewBox="0 0 54 54" width="54" height="54" fill="none">
      <circle cx="27" cy="27" r="25" stroke={c} strokeWidth="1.4" opacity="0.9"/>
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={c} strokeWidth="1.4"/>
      ))}
      <circle cx="27" cy="27" r="18" stroke={c} strokeWidth="1"   opacity="0.55"/>
      <circle cx="27" cy="27" r="11" stroke={c} strokeWidth="1"   opacity="0.45"/>
      <circle cx="27" cy="27" r="7"  fill={c + "30"} stroke={c} strokeWidth="1.4"/>
      <path d="M24 23.5 L32 27 L24 30.5 Z" fill={c}/>
    </svg>
  );
}

function CsIconLockBox({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* box */}
      <rect x="10" y="20" width="48" height="30" rx="3" stroke={c} strokeWidth="1.4" fill={c + "12"}/>
      <rect x="10" y="14" width="48" height="8"  rx="2" stroke={c} strokeWidth="1.4" fill={c + "22"}/>
      {/* padlock body */}
      <rect x="26" y="5"  width="16" height="13" rx="3" stroke={c} strokeWidth="1.4" fill={c + "18"}/>
      {/* shackle */}
      <path d="M29 5 Q29 0 34 0 Q39 0 39 5" stroke={c} strokeWidth="1.4" fill="none"/>
      {/* keyhole */}
      <circle cx="34" cy="10" r="2.2" fill={c}/>
      <rect x="33" y="10" width="2" height="4" fill={c}/>
      {/* chain left */}
      <path d="M6 24 Q3 28 6 32 Q9 36 6 40 Q3 44 6 48" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85"/>
      {/* chain right */}
      <path d="M62 24 Q65 28 62 32 Q59 36 62 40 Q65 44 62 48" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85"/>
      {/* rivets */}
      <circle cx="16" cy="21" r="1.5" fill={c} opacity="0.7"/>
      <circle cx="52" cy="21" r="1.5" fill={c} opacity="0.7"/>
    </svg>
  );
}

function CsIconHexGrid({ c }) {
  const hex = (cx, cy, r) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 - 30) * Math.PI / 180;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    });
    return `M${pts.join("L")}Z`;
  };
  const pos = [
    [16,14],[34,14],[52,14],
    [16,38],[34,38],[52,38],
  ];
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {pos.map(([cx, cy], i) => (
        <g key={i}>
          <path d={hex(cx, cy, 12)} stroke={c} strokeWidth="1.2" fill={c + "10"}/>
          {/* tiny lock */}
          <rect x={cx-3.5} y={cy-0.5} width="7" height="5.5" rx="1" stroke={c} strokeWidth="0.9"/>
          <path d={`M${cx-2} ${cy-0.5} Q${cx-2} ${cy-3.8} ${cx} ${cy-3.8} Q${cx+2} ${cy-3.8} ${cx+2} ${cy-0.5}`}
            stroke={c} strokeWidth="0.9" fill="none"/>
        </g>
      ))}
    </svg>
  );
}

function CsIconIsoCube({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* top face */}
      <path d="M34 4 L58 18 L34 32 L10 18 Z" stroke={c} strokeWidth="1.4" fill={c + "28"}/>
      {/* left face */}
      <path d="M10 18 L10 40 L34 50 L34 32 Z" stroke={c} strokeWidth="1.4" fill={c + "10"}/>
      {/* right face */}
      <path d="M58 18 L58 40 L34 50 L34 32 Z" stroke={c} strokeWidth="1.4" fill={c + "1A"}/>
      {/* checkmark on top */}
      <path d="M24 17 L31 25 L46 10" stroke={c} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CsIconHoneycomb({ c }) {
  const hex = (cx, cy, r) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = i * 60 * Math.PI / 180;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    });
    return `M${pts.join("L")}Z`;
  };
  const r = 9, cols = 4, rows = 3;
  const pos = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++)
      pos.push([col * r * 1.5 + 12, row * r * 1.732 + (col % 2 === 0 ? 10 : 18)]);
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none" style={{ overflow: "hidden" }}>
      {pos.map(([cx, cy], i) => (
        <path key={i} d={hex(cx, cy, r)} stroke={c} strokeWidth="1" fill={c + "14"}/>
      ))}
    </svg>
  );
}

function CsIconSiren({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* spinning rays group */}
      <g className="csSirenRays">
        <line x1="34" y1="6"  x2="34" y2="0"  stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <line x1="48" y1="10" x2="54" y2="4"  stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <line x1="20" y1="10" x2="14" y2="4"  stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <line x1="56" y1="24" x2="63" y2="20" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="12" y1="24" x2="5"  y2="20" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="58" y1="36" x2="65" y2="36" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="10" y1="36" x2="3"  y2="36" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      </g>
      {/* dome */}
      <path d="M14 44 Q14 18 34 18 Q54 18 54 44" stroke={c} strokeWidth="1.4" fill={c + "14"}/>
      {/* inner light */}
      <ellipse cx="34" cy="36" rx="11" ry="9" fill={c + "35"} stroke={c} strokeWidth="1"/>
      <ellipse cx="34" cy="36" rx="5"  ry="4" fill={c} opacity="0.85"/>
      {/* base */}
      <rect x="20" y="43" width="28" height="6" rx="2" stroke={c} strokeWidth="1.4" fill={c + "20"}/>
      <rect x="16" y="48" width="36" height="4" rx="1" fill={c + "30"} stroke={c} strokeWidth="1"/>
    </svg>
  );
}

function CsIconWaveform({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* grid */}
      {[10,22,33,44].map(y => (
        <line key={y} x1="0" y1={y} x2="68" y2={y} stroke={c} strokeWidth="0.35" opacity="0.25"/>
      ))}
      {[0,17,34,51,68].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="54" stroke={c} strokeWidth="0.35" opacity="0.25"/>
      ))}
      {/* erratic waveform */}
      <polyline
        points="0,27 5,25 10,10 15,30 20,34 26,12 31,38 36,18 41,40 46,8 52,32 57,20 62,36 68,25"
        stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* data points */}
      {[[10,10],[26,12],[41,40],[46,8]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill={c}/>
      ))}
    </svg>
  );
}

function CsIconUpArrow({ c }) {
  return (
    <svg viewBox="0 0 44 54" width="44" height="54" fill="none">
      {/* shaft */}
      <rect x="17" y="24" width="10" height="26" rx="2" fill={c + "2A"} stroke={c} strokeWidth="1.4"/>
      {/* head */}
      <path d="M5 26 L22 4 L39 26 Z" fill={c + "50"} stroke={c} strokeWidth="1.4"/>
      {/* tip glow dot */}
      <circle cx="22" cy="7"  r="2.2" fill={c} opacity="0.8"/>
      <circle cx="13" cy="20" r="1.5" fill={c} opacity="0.35"/>
      <circle cx="31" cy="20" r="1.5" fill={c} opacity="0.35"/>
    </svg>
  );
}

function CsIconWaveCurve({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      <g className="csWaveGroup">
        {/* fill */}
        <path d="M0 38 Q10 20 20 30 Q30 40 40 20 Q50 0 60 14 L68 10 L68 54 L0 54 Z"
          fill={c + "12"}/>
        {/* line */}
        <path d="M0 38 Q10 20 20 30 Q30 40 40 20 Q50 0 60 14 L68 10"
          stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* dots */}
        <circle cx="20" cy="30" r="2"   fill={c} opacity="0.65"/>
        <circle cx="40" cy="20" r="2"   fill={c} opacity="0.65"/>
        <circle cx="60" cy="14" r="2"   fill={c} opacity="0.65"/>
        {/* glowing star at end */}
        <circle cx="67" cy="10" r="3.5" fill={c} opacity="0.90"/>
        <circle cx="67" cy="10" r="6"   fill={c} opacity="0.20"/>
        <line x1="67" y1="5"  x2="67" y2="1"  stroke={c} strokeWidth="1.2" opacity="0.6"/>
        <line x1="72" y1="10" x2="76" y2="10" stroke={c} strokeWidth="1.2" opacity="0.6"/>
        <line x1="62" y1="10" x2="58" y2="10" stroke={c} strokeWidth="1.2" opacity="0.6"/>
        <line x1="71" y1="6"  x2="74" y2="3"  stroke={c} strokeWidth="1"   opacity="0.5"/>
        <line x1="63" y1="6"  x2="60" y2="3"  stroke={c} strokeWidth="1"   opacity="0.5"/>
      </g>
    </svg>
  );
}

function CyberStatsPanel({ stats }) {
  const portfolioK = `$${(stats.portfolioValue / 1000).toFixed(0)}K`;

  const cards = [
    { label: "ACTIVE",    value: stats.active,     icon: <Play size={18} />,          color: "sky",    gradient: "from-sky-500 to-blue-600",      shadow: "shadow-info/20",    showRing: true,  showPct: true  },
    { label: "ON HOLD",   value: stats.onHold,     icon: <Pause size={18} />,          color: "orange", gradient: "from-orange-600 to-warning",  shadow: "shadow-warning/20", showRing: true,  showPct: false },
    { label: "COMPLETED", value: stats.completed,  icon: <CheckCircle2 size={18} />,   color: "emerald",gradient: "from-emerald-600 to-info",  shadow: "shadow-success/20",showRing: false, showPct: false },
    { label: "OPEN ISSUES",value: stats.openIssues,icon: <AlertCircle size={18} />,    color: "rose",   gradient: "from-rose-600 to-red-600",      shadow: "shadow-danger/20",   showRing: false, showPct: false },
    { label: "VALUE",     value: portfolioK,       icon: <TrendingUp size={18} />,     color: "purple", gradient: "from-purple-600 to-violet-600", shadow: "shadow-special/20", showRing: false, showPct: false },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden p-6 rounded-[2rem] border border-border/10 transition-all hover:-translate-y-1 hover:brightness-110 ${
            idx === 0
              ? `bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-2xl`
              : "bg-[#151926] hover:border-border/20"
          }`}
        >
          <div className="flex flex-col h-full justify-between gap-4">
            <div className="flex justify-between items-start">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${idx === 0 ? "text-white/70" : "text-text-faint"}`}>
                {card.label}
              </p>
              <div className={`p-2 rounded-xl ${idx === 0 ? "bg-surface/20" : `bg-${card.color}-500/10 text-${card.color}-400`}`}>
                {card.icon}
              </div>
            </div>

            <div className="flex items-end gap-3 mt-2">
              {card.showRing && (
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className={idx === 0 ? "text-white/20" : "text-text"} />
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="126" strokeDashoffset={126 - (126 * 63 / 100)} className={idx === 0 ? "text-white" : `text-${card.color}-500`} />
                  </svg>
                </div>
              )}
              <h3 className="text-4xl font-black tracking-tighter text-white">
                {card.value}
                {card.showPct && <span className="text-xl opacity-60 ml-1">%</span>}
              </h3>
            </div>

            <div className="mt-2">
              <button className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${idx === 0 ? "text-white/80" : "text-text-muted hover:text-white"}`}>
                Click to filter <ChevronRight size={12} />
              </button>
            </div>
          </div>
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 rounded-full ${idx === 0 ? "bg-surface" : `bg-${card.color}-500`}`} />
        </div>
      ))}
    </div>
  );
}

// ── Bids panel icons ─────────────────────────────────────────────────────────

function CsIconGem({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* top crown */}
      <path d="M22 18 L34 4 L46 18" stroke={c} strokeWidth="1.4" fill={c + "15"}/>
      {/* middle band */}
      <path d="M10 18 L22 18 L34 4 L46 18 L58 18 L34 50 Z" stroke={c} strokeWidth="1.4" fill={c + "20"}/>
      {/* facet lines */}
      <line x1="22" y1="18" x2="34" y2="50" stroke={c} strokeWidth="0.8" opacity="0.5"/>
      <line x1="46" y1="18" x2="34" y2="50" stroke={c} strokeWidth="0.8" opacity="0.5"/>
      <line x1="10" y1="18" x2="34" y2="28" stroke={c} strokeWidth="0.6" opacity="0.4"/>
      <line x1="58" y1="18" x2="34" y2="28" stroke={c} strokeWidth="0.6" opacity="0.4"/>
      <line x1="34" y1="4"  x2="34" y2="50" stroke={c} strokeWidth="0.6" opacity="0.35"/>
      {/* glow highlight on top */}
      <path d="M28 12 L34 4 L40 12 L34 16 Z" fill={c} opacity="0.40"/>
    </svg>
  );
}

function CsIconCircuit({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* horizontal rails */}
      <line x1="0"  y1="14" x2="68" y2="14" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      <line x1="0"  y1="27" x2="68" y2="27" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      <line x1="0"  y1="40" x2="68" y2="40" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      {/* vertical rails */}
      <line x1="12" y1="0"  x2="12" y2="54" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      <line x1="34" y1="0"  x2="34" y2="54" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      <line x1="56" y1="0"  x2="56" y2="54" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      {/* nodes at intersections */}
      {[[12,14],[34,14],[56,14],[12,27],[34,27],[56,27],[12,40],[34,40],[56,40]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="3" stroke={c} strokeWidth="1.2" fill={c + "20"}/>
      ))}
      {/* highlighted nodes */}
      <circle cx="34" cy="27" r="4.5" stroke={c} strokeWidth="1.4" fill={c + "40"}/>
      <circle cx="12" cy="14" r="3.5" fill={c} opacity="0.7"/>
      <circle cx="56" cy="40" r="3.5" fill={c} opacity="0.6"/>
      {/* connection traces */}
      <path d="M12 14 L34 14 L34 27" stroke={c} strokeWidth="1.4" fill="none"/>
      <path d="M56 40 L34 40 L34 27" stroke={c} strokeWidth="1.4" fill="none"/>
    </svg>
  );
}

function CsIconCanister({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* body */}
      <rect x="20" y="10" width="28" height="36" rx="4" stroke={c} strokeWidth="1.4" fill={c + "12"}/>
      {/* top cap */}
      <rect x="24" y="5"  width="20" height="8"  rx="2" stroke={c} strokeWidth="1.4" fill={c + "22"}/>
      {/* bands */}
      <line x1="20" y1="22" x2="48" y2="22" stroke={c} strokeWidth="1.2" opacity="0.6"/>
      <line x1="20" y1="34" x2="48" y2="34" stroke={c} strokeWidth="1.2" opacity="0.6"/>
      {/* warning stripes */}
      <path d="M22 22 L26 34" stroke={c} strokeWidth="1.4" opacity="0.5" strokeLinecap="round"/>
      <path d="M30 22 L34 34" stroke={c} strokeWidth="1.4" opacity="0.5" strokeLinecap="round"/>
      <path d="M38 22 L42 34" stroke={c} strokeWidth="1.4" opacity="0.5" strokeLinecap="round"/>
      {/* bottom base */}
      <rect x="18" y="44" width="32" height="6" rx="2" stroke={c} strokeWidth="1.2" fill={c + "18"}/>
      {/* warning ! */}
      <line x1="34" y1="14" x2="34" y2="19" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="34" cy="22" r="1.2" fill={c}/>
    </svg>
  );
}

function CsIconMedallion({ c }) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    const r1 = 22, r2 = i % 3 === 0 ? 18 : 20;
    return {
      x1: 34 + r1 * Math.cos(a), y1: 28 + r1 * Math.sin(a),
      x2: 34 + r2 * Math.cos(a), y2: 28 + r2 * Math.sin(a),
    };
  });
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* outer ring */}
      <circle cx="34" cy="28" r="23" stroke={c} strokeWidth="1.4" fill="none"/>
      {/* tick marks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={c} strokeWidth="1.2"/>
      ))}
      {/* crosshair lines */}
      <line x1="34" y1="6"  x2="34" y2="50" stroke={c} strokeWidth="0.8" opacity="0.4"/>
      <line x1="12" y1="28" x2="56" y2="28" stroke={c} strokeWidth="0.8" opacity="0.4"/>
      {/* mid ring */}
      <circle cx="34" cy="28" r="14" stroke={c} strokeWidth="1"   fill={c + "10"}/>
      {/* inner filled circle */}
      <circle cx="34" cy="28" r="7"  fill={c + "35"} stroke={c} strokeWidth="1.4"/>
      {/* center dot */}
      <circle cx="34" cy="28" r="2.5" fill={c}/>
    </svg>
  );
}

function CyberBidsPanel({ stats, onFilter }) {
  const pipelineK = `$${(stats.totalValue / 1000).toFixed(0)}K`;

  const cards = [
    { label: "TOTAL TRACKED",  value: stats.total,   icon: <Layers size={18} />,        color: "blue",   gradient: "from-blue-600 to-indigo-600",  shadow: "shadow-info/20",   showRing: true,  showPct: true,  filterVal: "All"      },
    { label: "ACTIVE OPEN",    value: stats.open,    icon: <CheckCircle2 size={18} />,   color: "emerald",gradient: "from-emerald-600 to-info", shadow: "shadow-success/20",showRing: true,  showPct: false, filterVal: "Open"     },
    { label: "URGENT (<3D)",   value: stats.urgent,  icon: <AlertTriangle size={18} />,  color: "orange", gradient: "from-orange-600 to-warning",  shadow: "shadow-warning/20", showRing: false, showPct: false, filterVal: "Open"     },
    { label: "WON / AWARDED",  value: stats.awarded, icon: <Trophy size={18} />,         color: "amber",  gradient: "from-amber-500 to-yellow-600",  shadow: "shadow-warning/20",  showRing: false, showPct: false, filterVal: "Won"      },
    { label: "PIPELINE VALUE", value: pipelineK,     icon: <TrendingUp size={18} />,     color: "purple", gradient: "from-purple-600 to-violet-600", shadow: "shadow-special/20", showRing: false, showPct: false, filterVal: "HasAmount" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          onClick={() => onFilter && onFilter(card.filterVal)}
          className={`relative overflow-hidden p-6 rounded-[2rem] border border-border/10 transition-all hover:-translate-y-1 hover:brightness-110 cursor-pointer ${
            idx === 0
              ? `bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-2xl`
              : "bg-[#151926] hover:border-border/20"
          }`}
        >
          <div className="flex flex-col h-full justify-between gap-4">
            <div className="flex justify-between items-start">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${idx === 0 ? "text-white/70" : "text-text-faint"}`}>
                {card.label}
              </p>
              <div className={`p-2 rounded-xl ${idx === 0 ? "bg-surface/20" : `bg-${card.color}-500/10 text-${card.color}-400`}`}>
                {card.icon}
              </div>
            </div>

            <div className="flex items-end gap-3 mt-2">
              {card.showRing && (
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className={idx === 0 ? "text-white/20" : "text-text"} />
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="126" strokeDashoffset={126 - (126 * 63 / 100)} className={idx === 0 ? "text-white" : `text-${card.color}-500`} />
                  </svg>
                </div>
              )}
              <h3 className="text-4xl font-black tracking-tighter text-white">
                {card.value}
                {card.showPct && <span className="text-xl opacity-60 ml-1">%</span>}
              </h3>
            </div>

            <div className="mt-2">
              <button className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${idx === 0 ? "text-white/80" : "text-text-muted hover:text-white"}`}>
                Click to filter <ChevronRight size={12} />
              </button>
            </div>
          </div>
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 rounded-full ${idx === 0 ? "bg-surface" : `bg-${card.color}-500`}`} />
        </div>
      ))}
    </div>
  );
}

function ProjectModal({ project, onClose, onSave, toast }) {
  const [form, setForm]         = useState({ ...project });
  const [tab, setTab]           = useState("overview");
  const [newMilestone, setNewMilestone] = useState("");
  const [newInvoiceAmt, setNewInvoiceAmt] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [newNote, setNewNote]   = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMilestone = (id) => {
    const updated = { ...form, milestones: (form.milestones || []).map(m => m.id === id ? { ...m, completed: !m.completed } : m) };
    setForm(updated);
    onSave(updated);
  };

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    const updated = { ...form, milestones: [...(form.milestones || []), { id: Date.now(), title: newMilestone.trim(), completed: false }] };
    setForm(updated);
    setNewMilestone("");
    onSave(updated);
  };

  const addInvoice = (status) => {
    if (!newInvoiceAmt) return;
    const inv = { id: Date.now(), amount: Number(newInvoiceAmt), status };
    set("invoices", [...(form.invoices || []), inv]);
    if (status === "Paid") set("collectedValue", Number(form.collectedValue || 0) + inv.amount);
    setNewInvoiceAmt("");
  };

  const addIssue   = () => { if (!newIssue) return; set("issues", [...(form.issues || []), { id: Date.now(), title: newIssue, status: "Open" }]); setNewIssue(""); };
  const resolveIssue = (id) => set("issues", (form.issues || []).map(i => i.id === id ? { ...i, status: "Resolved" } : i));
  const addNote    = () => { if (!newNote) return; set("notes", [...(form.notes || []), `${new Date().toLocaleDateString()}: ${newNote}`]); setNewNote(""); };

  const pStyle = PROJECT_STATUS[form.status] || PROJECT_STATUS["In Progress"];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-bg-app/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-6">
              <div className="flex gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${pStyle.bg} ${pStyle.border} ${pStyle.text}`}>{form.status}</span>
                <span className="px-2.5 py-1 rounded text-xs font-medium bg-surface-raised text-text-secondary border border-border">{form.phase} Phase</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-snug">{form.title}</h2>
              <p className="text-text-muted text-sm mt-1 flex items-center gap-1.5"><Building className="w-4 h-4"/> {form.facility}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-surface-raised hover:bg-bg-subtle text-text-muted hover:text-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex gap-6 border-b border-border overflow-x-auto">
            {["overview", "milestones", "invoices", "issues", "notes", "files"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`pb-3 text-sm font-semibold capitalize border-b-2 whitespace-nowrap transition-colors ${tab === t ? "border-info text-info" : "border-transparent text-text-muted hover:text-text-secondary"}`}>
                {t}
                {t === "issues" && (form.issues || []).filter(i => i.status === "Open").length > 0 && (
                  <span className="ml-2 bg-danger/20 text-danger py-0.5 px-1.5 rounded-full text-[10px]">{(form.issues || []).filter(i => i.status === "Open").length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-bg-app/30">
          {tab === "overview" && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-surface border border-border rounded-xl p-4"><div className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-1">Contract Value</div><div className="text-xl font-mono font-bold text-text">${Number(form.contractValue || 0).toLocaleString()}</div></div>
                <div className="bg-surface border border-border rounded-xl p-4"><div className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-1">Collected</div><div className="text-xl font-mono font-bold text-success">${Number(form.collectedValue || 0).toLocaleString()}</div></div>
                <div className="bg-surface border border-border rounded-xl p-4"><div className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-1">Time Remaining</div><div className="text-xl font-mono font-bold text-text"><Countdown dueDate={form.endDate} compact /></div></div>
                <div className="bg-surface border border-border rounded-xl p-4"><div className="text-[10px] font-bold text-text-faint uppercase tracking-wider mb-1">Current Phase</div><div className="text-xl font-bold text-info">{form.phase}</div></div>
              </div>
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-text-secondary">Project Progress</label>
                  <span className="text-2xl font-mono font-extrabold text-info">{form.progress}%</span>
                </div>
                <input type="range" min="0" max="100" value={form.progress} onChange={e => set("progress", Number(e.target.value))}
                  className="w-full h-2 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <InputField label="Project Title"        value={form.title}         onChange={e => set("title",         e.target.value)} />
                <InputField label="Facility"             value={form.facility}      onChange={e => set("facility",      e.target.value)} />
                <InputField label="Status"   value={form.status}  onChange={e => set("status",  e.target.value)} as="select" options={Object.keys(PROJECT_STATUS)} />
                <InputField label="Phase"    value={form.phase}   onChange={e => set("phase",   e.target.value)} as="select" options={PROJECT_PHASES} />
                <InputField label="Start Date" type="date" value={form.startDate}  onChange={e => set("startDate",      e.target.value)} />
                <InputField label="End Date"   type="date" value={form.endDate}    onChange={e => set("endDate",        e.target.value)} />
                <InputField label="Contract Value ($)" type="number" value={form.contractValue}  onChange={e => set("contractValue",  e.target.value)} />
                <InputField label="Collected Value ($)" type="number" value={form.collectedValue} onChange={e => set("collectedValue", e.target.value)} />
              </div>
            </div>
          )}

          {tab === "milestones" && (
            <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
              <div className="flex gap-3 mb-6">
                <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)} onKeyDown={e => e.key === "Enter" && addMilestone()}
                  placeholder="Add new milestone..."
                  className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text outline-none focus:border-info" />
                <button onClick={addMilestone} className="px-5 py-2.5 rounded-lg bg-info hover:bg-info text-text font-bold text-sm"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-col gap-2">
                {(form.milestones || []).map(m => (
                  <div key={m.id} onClick={() => toggleMilestone(m.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${m.completed ? "bg-success-soft border-success/30" : "bg-surface border-border hover:border-border-strong"}`}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${m.completed ? "bg-success border-success" : "border-border-strong"}`}>
                      {m.completed && <CheckCircle2 className="w-4 h-4 text-text" />}
                    </div>
                    <span className={`text-sm font-medium ${m.completed ? "text-success line-through opacity-70" : "text-text"}`}>{m.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "invoices" && (
            <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-success-soft border border-success/20 rounded-xl p-4"><div className="text-xs font-bold text-success/70 uppercase">Paid Total</div><div className="text-xl font-mono font-bold text-success">${(form.invoices || []).filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0).toLocaleString()}</div></div>
                <div className="bg-warning-soft border border-warning/20 rounded-xl p-4"><div className="text-xs font-bold text-warning/70 uppercase">Pending Total</div><div className="text-xl font-mono font-bold text-warning">${(form.invoices || []).filter(i => i.status === "Pending").reduce((s, i) => s + i.amount, 0).toLocaleString()}</div></div>
              </div>
              <div className="flex gap-3 mb-6 bg-surface p-4 rounded-xl border border-border items-end">
                <InputField label="Invoice Amount ($)" type="number" value={newInvoiceAmt} onChange={e => setNewInvoiceAmt(e.target.value)} />
                <button onClick={() => addInvoice("Pending")} className="px-4 py-2 rounded-lg bg-warning-soft text-warning border border-warning/30 font-bold text-sm hover:bg-warning-soft">Add Pending</button>
                <button onClick={() => addInvoice("Paid")}    className="px-4 py-2 rounded-lg bg-success-soft text-success border border-success/30 font-bold text-sm hover:bg-success/30">Add Paid</button>
              </div>
              <div className="flex flex-col gap-2">
                {(form.invoices || []).slice().reverse().map((inv, idx) => (
                  <div key={inv.id || idx} className="flex justify-between items-center p-4 bg-surface border border-border rounded-xl">
                    <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-text-faint" /><span className="text-text font-mono font-bold">${inv.amount.toLocaleString()}</span></div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === "Paid" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>{inv.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "issues" && (
            <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
              <div className="flex gap-3 mb-6">
                <input value={newIssue} onChange={e => setNewIssue(e.target.value)} onKeyDown={e => e.key === "Enter" && addIssue()}
                  placeholder="Describe new issue..."
                  className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text outline-none focus:border-danger" />
                <button onClick={addIssue} className="px-5 py-2.5 rounded-lg bg-danger hover:bg-danger text-text font-bold text-sm">Log Issue</button>
              </div>
              <div className="flex flex-col gap-3">
                {(form.issues || []).filter(i => i.status === "Open").map(issue => (
                  <div key={issue.id} className="flex justify-between items-center p-4 bg-danger-soft border border-danger/30 rounded-xl">
                    <div className="flex items-center gap-3"><AlertTriangle className="w-5 h-5 text-danger" /><span className="text-text text-sm font-medium">{issue.title}</span></div>
                    <button onClick={() => resolveIssue(issue.id)} className="px-3 py-1.5 bg-success-soft text-success rounded hover:bg-success/30 text-xs font-bold transition-colors">Resolve</button>
                  </div>
                ))}
                {(form.issues || []).filter(i => i.status === "Open").length === 0 && (
                  <div className="text-text-faint text-center py-12 text-sm bg-surface/50 rounded-xl border border-dashed border-border">No open issues. 🎉</div>
                )}
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
              <div className="flex gap-3 mb-6">
                <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()}
                  placeholder="Type a note..."
                  className="flex-1 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm text-text outline-none focus:border-info" />
                <button onClick={addNote} className="px-5 py-2.5 rounded-lg bg-info hover:bg-info text-text font-bold text-sm">Add</button>
              </div>
              <div className="flex flex-col gap-3">
                {(form.notes || []).slice().reverse().map((n, i) => {
                  const [date, ...rest] = n.split(":");
                  return (
                    <div key={i} className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-1.5">
                      <span className="text-info text-xs font-mono font-medium">{date}</span>
                      <p className="text-text-secondary text-sm leading-relaxed">{rest.join(":")}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === "files" && (
            <div className="flex flex-col max-w-2xl mx-auto w-full gap-5">
              <div className="bg-surface border border-border rounded-xl p-5">
                <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-info" /> OneDrive Project Folder
                </div>
                {form.onedriveFolder ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-bg-app border border-border rounded-lg px-4 py-3 font-mono text-xs text-text-muted break-all">
                      {form.onedriveFolder}
                    </div>
                    <button
                      onClick={() => fetch(`/api/open-folder?path=${encodeURIComponent(form.onedriveFolder)}`)}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl bg-info-soft border border-info/30 text-info font-bold text-sm hover:bg-info/20 transition-all w-fit">
                      <ArrowRight className="w-4 h-4" /> Open in Finder
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-text-faint text-sm">No folder linked yet. Enter the path to your OneDrive project folder.</p>
                    <InputField label="OneDrive Folder Path" value={form.onedriveFolder || ""}
                      onChange={e => set("onedriveFolder", e.target.value)}
                      placeholder="/Users/andyramos/Library/CloudStorage/OneDrive-.../03_Project/..." />
                    {form.onedriveFolder && (
                      <button
                        onClick={() => fetch(`/api/open-folder?path=${encodeURIComponent(form.onedriveFolder)}`)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-info-soft border border-info/30 text-info font-bold text-sm hover:bg-info/20 transition-all w-fit">
                        <ArrowRight className="w-4 h-4" /> Open in Finder
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-text-secondary hover:bg-surface-raised text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={() => { onSave(form); toast("Project updated!", "success"); onClose(); }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-info hover:bg-info text-text text-sm font-bold shadow-lg shadow-info/20 transition-all">
            <Save className="w-4 h-4" /> Save Project
          </button>
        </div>
      </div>
    </div>
  );
}

function AddProjectModal({ onClose, onAdd, initialData, isConversion }) {
  const [form, setForm] = useState(() => initialData || {
    title: "", facility: "", status: "In Progress", phase: "Planning",
    progress: 0, startDate: "", endDate: "", contractValue: "", collectedValue: 0,
    milestones: [], invoices: [], issues: [], notes: [],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-bg-app/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-border bg-surface flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-info-soft text-info rounded-lg"><Briefcase className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold text-white">{isConversion ? "Convert Bid to Project" : "New Project Tracker"}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-surface-raised hover:bg-bg-subtle text-text-muted rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          <InputField label="Project Title *" value={form.title}    onChange={e => set("title",    e.target.value)} placeholder="e.g. Boiler Replacement" />
          <div className="grid grid-cols-2 gap-5">
            <InputField label="Facility"         value={form.facility}       onChange={e => set("facility",       e.target.value)} />
            <InputField label="Phase"  value={form.phase} onChange={e => set("phase", e.target.value)} as="select" options={PROJECT_PHASES} />
            <InputField label="Start Date *" type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            <InputField label="Target End Date *" type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
            <InputField label="Total Contract Value ($)" type="number" value={form.contractValue} onChange={e => set("contractValue", e.target.value)} />
          </div>
        </div>
        <div className="p-6 border-t border-border bg-surface flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-text-secondary hover:bg-surface-raised text-sm font-semibold transition-colors">Cancel</button>
          <button
            onClick={() => { if (!form.title || !form.startDate) return alert("Title and Start Date are required."); onAdd({ ...form, id: `p-${Date.now()}` }); onClose(); }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-info hover:bg-info text-text text-sm font-bold shadow-lg shadow-info/20 transition-all">
            <Plus className="w-4 h-4" /> {isConversion ? "Convert to Project" : "Start Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

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

function OpsChecklistModal({ onClose, onSave, stats }) {
  const [activeTab, setActiveTab] = useState("cash");
  const [checked, setChecked]     = useState({});
  const toggle = (key) => setChecked(c => ({ ...c, [key]: !c[key] }));
  const allItems  = OPS_SCHEMA.flatMap(s => s.items);
  const doneCount = allItems.filter((_, i) => checked[i]).length;
  const pct       = Math.round((doneCount / allItems.length) * 100);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-bg-app/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Weekly Operating System</h2>
            <p className="text-xs text-text-faint mt-1">Status: Unsigned • Reviewing March 2026</p>
          </div>
          <div className="flex items-center gap-4">
            <ProgressRing pct={pct} size={44} stroke={4} customColor="#818cf8" />
            <button onClick={onClose} className="p-2 bg-surface-raised hover:bg-bg-subtle text-text-muted rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex border-b border-border">
          {OPS_SCHEMA.map(s => (
            <button key={s.id} onClick={() => setActiveTab(s.id)}
              className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === s.id ? "bg-surface-raised text-info border-b-2 border-info" : "text-text-faint hover:text-text-secondary"}`}>
              {s.title}
            </button>
          ))}
        </div>

        <div className="p-8 overflow-y-auto flex-1 bg-bg-app/20">
          <div className="flex flex-col gap-4">
            {OPS_SCHEMA.find(s => s.id === activeTab).items.map((item, i) => {
              const globalIdx = OPS_SCHEMA.slice(0, OPS_SCHEMA.findIndex(s => s.id === activeTab)).flatMap(s => s.items).length + i;
              const isDone    = checked[globalIdx];
              return (
                <label key={i} onClick={() => toggle(globalIdx)}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${isDone ? "bg-special-soft border-special/30" : "bg-surface border-border hover:border-border-strong"}`}>
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isDone ? "bg-special border-special" : "border-border-strong"}`}>
                    {isDone && <CheckCircle2 className="w-4 h-4 text-text" />}
                  </div>
                  <span className={`font-medium ${isDone ? "text-special line-through opacity-70" : "text-text"}`}>{item}</span>
                </label>
              );
            })}

            {activeTab === "cash" && (
              <div className="mt-4 p-4 bg-info-soft border border-info/20 rounded-xl">
                <div className="text-xs font-bold text-info uppercase mb-1">Live A/R Insight</div>
                <div className="text-sm text-text-secondary">Total Open A/R detected from Projects: <span className="text-info font-bold">${stats.openAR.toLocaleString()}</span></div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-between items-center flex-shrink-0">
          <span className="text-xs text-text-faint font-mono">{doneCount} / {allItems.length} completed</span>
          <button onClick={() => { onSave && onSave(); onClose(); }}
            className="px-8 py-3 bg-special hover:bg-special text-text rounded-xl font-black shadow-lg shadow-special/20 transition-all">
            SAVE & SIGN OFF
          </button>
        </div>
      </div>
    </div>
  );
}

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
          (decisionFilter === "All" || b.decision === decisionFilter) &&
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

  const bidStats = useMemo(() => ({
    total:      (bids || []).length,
    open:       (bids || []).filter(b => effectiveStatus(b) === "Open").length,
    awarded:    (bids || []).filter(b => b.wonLoss === "Yes").length,
    urgent:     (bids || []).filter(b => effectiveStatus(b) === "Open" && b.dueDate && (new Date(b.dueDate) - new Date() > 0) && (new Date(b.dueDate) - new Date() < 3 * 86400000)).length,
    totalValue: (bids || []).reduce((s, b) => s + (Number(b.bidAmount) || 0), 0),
  }), [bids, effectiveStatus]);

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
      <main className="max-w-[1600px] mx-auto p-6 flex flex-col gap-6">

        {/* ════════════ BIDS TAB ════════════ */}
        {activeTab === "bids" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-6">

            {/* Stats row */}
            <CyberBidsPanel stats={bidStats} onFilter={setFilter} />

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

              {/* Capture decision filter chips */}
              <div className="flex items-center gap-1 bg-bg-app border border-border rounded-xl p-1">
                {DECISION_FILTERS.map(dv => {
                  const active = decisionFilter === dv;
                  const on = dv === "Recommended" ? "bg-emerald-500/20 text-emerald-400"
                           : dv === "Manual Review" ? "bg-amber-500/20 text-amber-400"
                           : "bg-surface-raised text-info";
                  return (
                    <button key={dv} onClick={() => setDecisionFilter(dv)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${active ? on : "text-text-faint hover:text-text-secondary"}`}>
                      {dv}{dv !== "All" ? ` (${(bids || []).filter(b => b.decision === dv).length})` : ""}
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

              <button onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-surface-raised rounded-xl text-sm font-semibold border border-border hover:bg-bg-subtle transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Kanban or Table */}
            {view === "kanban" ? (
              <KanbanView bids={filteredBids} onSelect={isMobileView ? () => {} : setSelectedBid} onToggleStar={toggleStar} isMobileView={isMobileView} />
            ) : (
              <div className="bg-surface/40 border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
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
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-text-muted flex items-center gap-1"><Building className="w-3 h-3" /> {bid.facility}</span>
                                  {bid.city && <><span className="w-1 h-1 rounded-full bg-bg-subtle" /><span className="text-text-faint">{bid.city}</span></>}
                                  {bid.category && <><span className="w-1 h-1 rounded-full bg-bg-subtle" /><span className="text-info/70 font-medium">{bid.category}</span></>}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}