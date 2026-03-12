import React, { useState, useEffect, useMemo, useCallback } from "react";
import Papa from "papaparse";
import { 
  Zap, LayoutGrid, List as ListIcon, Star, Plus, Download, X, Search, 
  ChevronUp, ChevronDown, ChevronsUpDown, CheckCircle2, Circle, 
  FileText, DollarSign, BarChart2, HardHat, Building, Mail, 
  ShieldCheck, Trash2, ClipboardCheck, ArrowRight, Save,
  Briefcase, FolderKanban, AlertTriangle, Clock, TrendingUp, CheckSquare, Wallet, AlertCircle, Play, Pause
} from "lucide-react";

// --- BIDS CONSTANTS ---
const CHECK_FIELDS = [
  { key: "chk_sf1449", label: "SF1449", Icon: FileText },
  { key: "chk_sow_pws", label: "SOW/PWS", Icon: ClipboardCheck },
  { key: "chk_pricing", label: "Pricing", Icon: DollarSign },
  { key: "chk_past_perf", label: "Past Perf", Icon: BarChart2 },
  { key: "chk_osha_safety", label: "OSHA", Icon: HardHat },
  { key: "chk_licenses", label: "Licenses", Icon: CheckCircle2 },
  { key: "chk_site_visit", label: "Site Visit", Icon: Building },
  { key: "chk_sub_loi", label: "Sub LOI", Icon: Mail },
  { key: "chk_compliance", label: "Compliance", Icon: ShieldCheck },
];

const CATEGORIES = ["All", "Electrical", "Inspection", "HVAC", "Grounds", "Construction", "Plumbing"];

const PRIORITIES = {
  Critical: { text: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", hex: "#fb7185" },
  High: { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", hex: "#fb923c" },
  Medium: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", hex: "#fbbf24" },
  Low: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", hex: "#34d399" }
};

const STATUS_COLORS = {
  Open: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", hex: "#34d399" },
  Awarded: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", hex: "#fbbf24" },
  Closed: { text: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", hex: "#94a3b8" }
};

// --- PROJECTS CONSTANTS ---
const PROJECT_STATUS = {
  "In Progress": { text: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", hex: "#60a5fa" },
  "On Hold": { text: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/30", hex: "#fb923c" },
  "Completed": { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", hex: "#34d399" },
  "Cancelled": { text: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/30", hex: "#fb7185" }
};

const PROJECT_PHASES = ["Planning", "Design", "Procurement", "Execution", "Closeout"];

const INITIAL_PROJECTS = [
  {
    id: "p1", title: "Electrical Upgrade Phase 2", facility: "Bedford VAMC", status: "In Progress", phase: "Execution", progress: 65, startDate: "2026-01-15", endDate: "2026-06-30", contractValue: 245000, collectedValue: 120000,
    milestones: [{ id: 1, title: "Site Mobilization", completed: true }, { id: 2, title: "Rough-in Electrical", completed: true }, { id: 3, title: "Final Inspection", completed: false }],
    invoices: [{ id: 1, amount: 80000, status: "Paid" }, { id: 2, amount: 40000, status: "Pending" }],
    issues: [{ id: 1, title: "Supply chain delay on main breakers", status: "Open" }], notes: ["Approved for weekend work."]
  },
  {
    id: "p2", title: "HVAC Unit Replacement", facility: "Boston VAMC", status: "On Hold", phase: "Procurement", progress: 20, startDate: "2026-02-01", endDate: "2026-08-15", contractValue: 450000, collectedValue: 50000,
    milestones: [{ id: 1, title: "PO Issued", completed: true }, { id: 2, title: "Equipment Delivery", completed: false }],
    invoices: [{ id: 1, amount: 50000, status: "Paid" }],
    issues: [{ id: 1, title: "Awaiting structural approval", status: "Open" }], notes: []
  }
];

// --- SHARED COMPONENTS ---
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="font-mono text-sm font-medium text-sky-400">{now.toLocaleTimeString()}</span>;
}

function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  const styles = type === "success" ? "bg-emerald-500 text-slate-900" : type === "warn" ? "bg-amber-500 text-slate-900" : "bg-sky-500 text-slate-900";
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
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((data[data.length - 1] - min) / (max - min || 1)) * h} r="3" fill={color} />
    </svg>
  );
}

function Countdown({ dueDate, compact }) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const calc = () => {
      if (!dueDate) return setTimeLeft({ expired: false, missing: true });
      const diff = new Date(dueDate + "T23:59:59") - new Date();
      if (diff <= 0) return setTimeLeft({ expired: true });
      setTimeLeft({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), mins: Math.floor((diff % 3600000) / 60000), secs: Math.floor((diff % 60000) / 1000), expired: false });
    };
    calc(); const t = setInterval(calc, 1000); return () => clearInterval(t);
  }, [dueDate]);
  
  if (timeLeft.missing) return <span className="text-slate-500 font-bold text-xs">No Date</span>;
  if (timeLeft.expired) return <span className="text-rose-500 font-bold text-xs uppercase tracking-wider">Expired</span>;
  if (!("days" in timeLeft)) return null;
  
  const color = timeLeft.days < 3 ? "text-rose-400 border-rose-400/30 bg-rose-400/10" : timeLeft.days < 7 ? "text-orange-400 border-orange-400/30 bg-orange-400/10" : "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
  const txtColor = timeLeft.days < 3 ? "text-rose-400" : timeLeft.days < 7 ? "text-orange-400" : "text-emerald-400";
  
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

function ProgressRing({ pct, size = 44, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct === 100 ? "#34d399" : pct > 50 ? "#fbbf24" : "#fb7185";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round" className="transition-all duration-500 ease-out" />
      </svg>
      <span className="absolute font-mono text-[10px] font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

// --- BIDS COMPONENTS ---
function KanbanView({ bids, onSelect, onToggleStar }) {
  const cols = ["Open", "Closed", "Awarded"];
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 min-h-[400px]">
      {cols.map(col => {
        const colBids = bids.filter(b => b.status === col);
        const style = STATUS_COLORS[col] || STATUS_COLORS["Open"];
        return (
          <div key={col} className="min-w-[320px] flex-1">
            <div className={`flex items-center gap-2 mb-4 px-4 py-3 bg-slate-900/80 rounded-xl border ${style.border}`}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.hex }} />
              <span className={`font-bold text-sm ${style.text}`}>{col}</span>
              <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}>{colBids.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {colBids.map(bid => {
                const pct = Math.round(CHECK_FIELDS.filter(f => bid[f.key]).length / CHECK_FIELDS.length * 100);
                const pStyle = PRIORITIES[bid.priority] || PRIORITIES["Medium"];
                return (
                  <div key={bid.id} onClick={() => onSelect(bid)} className="group bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-all relative overflow-hidden shadow-sm hover:shadow-md">
                    <div className="absolute top-0 left-0 h-0.5 transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: style.hex }} />
                    <div className="flex justify-between items-start mb-3">
                      <span className={`border rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pStyle.bg} ${pStyle.border} ${pStyle.text}`}>{bid.priority || "Medium"}</span>
                      <button onClick={e => { e.stopPropagation(); onToggleStar(bid.id); }} className={`p-1 rounded-md transition-colors ${bid.starred ? "text-amber-400" : "text-slate-600 hover:text-slate-400 hover:bg-slate-800"}`}>
                        <Star className="w-4 h-4" fill={bid.starred ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <h3 className="text-slate-200 text-sm font-semibold leading-tight mb-3 line-clamp-2 group-hover:text-sky-400 transition-colors">{bid.title}</h3>
                    <div className="flex justify-between items-end mt-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 text-xs flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />{bid.city}{bid.state ? `, ${bid.state}` : ''}</span>
                      </div>
                      <Countdown dueDate={bid.dueDate} compact />
                    </div>
                  </div>
                );
              })}
              {colBids.length === 0 && <div className="text-slate-600 text-sm text-center py-8 border border-dashed border-slate-800 rounded-xl">No {col.toLowerCase()} bids</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const InputField = ({ label, value, onChange, placeholder, type = "text", as = "input", options = [], min, max }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
    {as === "select" ? (
      <select value={value || ""} onChange={onChange} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : as === "textarea" ? (
      <textarea value={value || ""} onChange={onChange} placeholder={placeholder} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all min-h-[80px] resize-y" />
    ) : (
      <input type={type} min={min} max={max} value={value || ""} onChange={onChange} placeholder={placeholder} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all" />
    )}
  </div>
);

function BidModal({ bid, onClose, onSave, onDelete, toast }) {
  const [form, setForm] = useState({ ...bid });
  const [newNote, setNewNote] = useState("");
  const [tab, setTab] = useState("details");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addNote = () => { if (!newNote.trim()) return; set("notes", [...(form.notes || []), `${new Date().toLocaleDateString()}: ${newNote}`]); setNewNote(""); };
  const pct = Math.round(CHECK_FIELDS.filter(f => form[f.key]).length / CHECK_FIELDS.length * 100);
  const pStyle = PRIORITIES[form.priority] || PRIORITIES["Medium"];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-6">
              <div className="flex gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${pStyle.bg} ${pStyle.text}`}>{form.priority || "Medium"} Priority</span>
                <span className="px-2.5 py-1 rounded text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">{form.category || "General"}</span>
              </div>
              <h2 className="text-xl font-bold text-white leading-snug">{form.title}</h2>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <ProgressRing pct={pct} size={48} stroke={4} />
              <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="flex gap-6 border-b border-slate-800">
            {["details", "checklist", "notes"].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-colors ${tab === t ? "border-sky-400 text-sky-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {tab === "details" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <InputField label="Bid Amount ($)" value={form.bidAmount} onChange={e => set("bidAmount", e.target.value)} placeholder="e.g. 150000" />
                <InputField label="Awarded Amount ($)" value={form.awardedAmount} onChange={e => set("awardedAmount", e.target.value)} placeholder="e.g. 145000" />
                <InputField label="VISN" value={form.visn} onChange={e => set("visn", e.target.value)} />
                <InputField label="NCO" value={form.nco} onChange={e => set("nco", e.target.value)} />
                <InputField label="Contractor" value={form.contractor} onChange={e => set("contractor", e.target.value)} />
                <InputField label="Contract #" value={form.contractNo} onChange={e => set("contractNo", e.target.value)} />
                <InputField label="Status" value={form.status} onChange={e => set("status", e.target.value)} as="select" options={["Open", "Closed", "Awarded"]} />
                <InputField label="Priority" value={form.priority} onChange={e => set("priority", e.target.value)} as="select" options={["Critical", "High", "Medium", "Low"]} />
              </div>
              <InputField label="Reason / Description" value={form.reason} onChange={e => set("reason", e.target.value)} as="textarea" placeholder="Provide context or reason for current status..." />
            </div>
          )}
          {tab === "checklist" && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {CHECK_FIELDS.map(f => {
                const checked = form[f.key];
                return (
                  <label key={f.key} onClick={() => set(f.key, !checked)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-900 border-slate-700 hover:border-slate-500"}`}>
                    <div className={`p-2 rounded-lg ${checked ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}><f.Icon className="w-5 h-5" /></div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${checked ? "text-emerald-400" : "text-slate-300"}`}>{f.label}</div>
                      <div className={`text-xs ${checked ? "text-emerald-500/70" : "text-slate-500"}`}>{checked ? "Complete" : "Pending"}</div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checked ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}>
                      {checked && <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          {tab === "notes" && (
            <div className="flex flex-col h-full">
              <div className="flex gap-3 mb-6">
                <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()} placeholder="Type a note and press Enter..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all" />
                <button onClick={addNote} className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold text-sm transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                {(!form.notes || form.notes.length === 0) && <div className="text-slate-500 text-center py-12 text-sm bg-slate-900/50 rounded-xl border border-dashed border-slate-800">No notes added yet.</div>}
                {(form.notes || []).slice().reverse().map((n, i) => {
                  const [date, ...rest] = n.split(":");
                  return (
                    <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col gap-1.5">
                      <span className="text-sky-400 text-xs font-mono font-medium">{date}</span>
                      <p className="text-slate-300 text-sm leading-relaxed">{rest.join(":")}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center flex-shrink-0 rounded-b-2xl">
          <button onClick={() => { if (window.confirm("Are you sure you want to delete this bid?")) { onDelete(bid.id); onClose(); } }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-rose-400 hover:bg-rose-400/10 text-sm font-semibold transition-colors"><Trash2 className="w-4 h-4" /> Delete Bid</button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors">Cancel</button>
            <button onClick={() => { onSave(form); toast("Bid saved successfully", "success"); onClose(); }} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 text-sm font-bold shadow-lg shadow-sky-500/20 transition-all"><Save className="w-4 h-4" /> Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddBidModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ status: "Open", dueDate: "", title: "", state: "", city: "", facility: "", bidAmount: "", awardedAmount: "", reason: "", visn: "", nco: "", contractor: "", contractNo: "", priority: "Medium", category: "Electrical", notes: [], starred: false, chk_sf1449: false, chk_sow_pws: false, chk_pricing: false, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><Plus className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold text-white">Create New Bid</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          <InputField label="Bid Title *" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Electrical Upgrade Phase 2" />
          <div className="grid grid-cols-2 gap-5">
            <InputField label="Due Date *" type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
            <InputField label="Facility" value={form.facility} onChange={e => set("facility", e.target.value)} placeholder="e.g. Bedford VAMC" />
            <InputField label="City" value={form.city} onChange={e => set("city", e.target.value)} />
            <InputField label="State" value={form.state} onChange={e => set("state", e.target.value)} />
            <InputField label="Priority" value={form.priority} onChange={e => set("priority", e.target.value)} as="select" options={["Critical", "High", "Medium", "Low"]} />
            <InputField label="Category" value={form.category} onChange={e => set("category", e.target.value)} as="select" options={CATEGORIES.slice(1)} />
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={() => { if (!form.title || !form.dueDate) return alert("Title and Due Date are required."); onAdd({ ...form, id: Date.now() }); onClose(); }} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"><Plus className="w-4 h-4" /> Create Bid</button>
        </div>
      </div>
    </div>
  );
}

// --- PROJECTS COMPONENTS ---
function ProjectCard({ project, onClick }) {
  const pStyle = PROJECT_STATUS[project.status] || PROJECT_STATUS["In Progress"];
  const completedMilestones = project.milestones.filter(m => m.completed).length;
  const totalMilestones = project.milestones.length;

  return (
    <div onClick={() => onClick(project)} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer hover:border-slate-600 transition-all relative overflow-hidden shadow-sm hover:shadow-md group">
      <div className="flex justify-between items-start mb-4">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${pStyle.bg} ${pStyle.border} ${pStyle.text}`}>{project.status}</span>
        <span className="text-slate-500 text-xs font-semibold">{project.phase}</span>
      </div>
      
      <h3 className="text-slate-200 text-lg font-bold leading-tight mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{project.title}</h3>
      <p className="text-slate-400 text-sm flex items-center gap-1.5 mb-5"><Building className="w-3.5 h-3.5" /> {project.facility}</p>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-end mb-1.5">
          <span className="text-xs font-bold text-slate-400">Progress</span>
          <span className="text-xs font-mono font-bold text-blue-400">{project.progress}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      {/* Financials & Milestones */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/50">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Wallet className="w-3 h-3" /> Collected</div>
          <div className="text-sm font-mono font-bold text-emerald-400">${(project.collectedValue / 1000).toFixed(0)}k <span className="text-slate-600 text-xs">/ ${(project.contractValue / 1000).toFixed(0)}k</span></div>
        </div>
        <div className="bg-slate-950/50 rounded-lg p-2.5 border border-slate-800/50">
          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><CheckSquare className="w-3 h-3" /> Milestones</div>
          <div className="text-sm font-mono font-bold text-slate-300">{completedMilestones} <span className="text-slate-600 text-xs">/ {totalMilestones} Done</span></div>
        </div>
      </div>

      {/* Milestone Strip */}
      <div className="flex gap-1 mb-5">
        {project.milestones.map(m => (
          <div key={m.id} title={m.title} className={`flex-1 h-1.5 rounded-full ${m.completed ? 'bg-emerald-500' : 'bg-slate-800'}`} />
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
        <div className="flex -space-x-2">
           {/* Mock avatars for team */}
           <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">AR</div>
           <div className="w-7 h-7 rounded-full bg-emerald-600 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">JS</div>
        </div>
        <Countdown dueDate={project.endDate} compact />
      </div>
    </div>
  );
}

function ProjectModal({ project, onClose, onSave, toast }) {
  const [form, setForm] = useState({ ...project });
  const [tab, setTab] = useState("overview");
  
  const [newMilestone, setNewMilestone] = useState("");
  const [newInvoiceAmt, setNewInvoiceAmt] = useState("");
  const [newIssue, setNewIssue] = useState("");
  const [newNote, setNewNote] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMilestone = (id) => {
    set("milestones", form.milestones.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };
  const addMilestone = () => {
    if (!newMilestone) return;
    set("milestones", [...form.milestones, { id: Date.now(), title: newMilestone, completed: false }]);
    setNewMilestone("");
  };

  const addInvoice = (status) => {
    if (!newInvoiceAmt) return;
    const inv = { id: Date.now(), amount: Number(newInvoiceAmt), status };
    const updatedInvoices = [...form.invoices, inv];
    set("invoices", updatedInvoices);
    if (status === "Paid") set("collectedValue", Number(form.collectedValue) + inv.amount);
    setNewInvoiceAmt("");
  };

  const addIssue = () => {
    if (!newIssue) return;
    set("issues", [...form.issues, { id: Date.now(), title: newIssue, status: "Open" }]);
    setNewIssue("");
  };
  const resolveIssue = (id) => {
    set("issues", form.issues.map(i => i.id === id ? { ...i, status: "Resolved" } : i));
  };

  const addNote = () => {
    if (!newNote) return;
    set("notes", [...(form.notes || []), `${new Date().toLocaleDateString()}: ${newNote}`]);
    setNewNote("");
  };

  const pStyle = PROJECT_STATUS[form.status] || PROJECT_STATUS["In Progress"];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-6">
              <div className="flex gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold border ${pStyle.bg} ${pStyle.border} ${pStyle.text}`}>{form.status}</span>
                <span className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">{form.phase} Phase</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-snug">{form.title}</h2>
              <p className="text-slate-400 text-sm mt-1 flex items-center gap-1.5"><Building className="w-4 h-4"/> {form.facility}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="flex gap-6 border-b border-slate-800 overflow-x-auto">
            {["overview", "milestones", "invoices", "issues", "notes"].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-semibold capitalize border-b-2 whitespace-nowrap transition-colors ${tab === t ? "border-blue-500 text-blue-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}>
                {t}
                {t === "issues" && form.issues.filter(i => i.status === "Open").length > 0 && (
                  <span className="ml-2 bg-rose-500/20 text-rose-400 py-0.5 px-1.5 rounded-full text-[10px]">{form.issues.filter(i => i.status === "Open").length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/30">
          {tab === "overview" && (
            <div className="flex flex-col gap-6">
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-4">
                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contract Value</div>
                    <div className="text-xl font-mono font-bold text-slate-200">${Number(form.contractValue).toLocaleString()}</div>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Collected</div>
                    <div className="text-xl font-mono font-bold text-emerald-400">${Number(form.collectedValue).toLocaleString()}</div>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Time Remaining</div>
                    <div className="text-xl font-mono font-bold text-slate-200"><Countdown dueDate={form.endDate} compact /></div>
                 </div>
                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Current Phase</div>
                    <div className="text-xl font-bold text-blue-400">{form.phase}</div>
                 </div>
              </div>

              {/* Progress Slider */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-bold text-slate-300">Project Progress</label>
                  <span className="text-2xl font-mono font-extrabold text-blue-400">{form.progress}%</span>
                </div>
                <input type="range" min="0" max="100" value={form.progress} onChange={e => set("progress", Number(e.target.value))} className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-5">
                <InputField label="Project Title" value={form.title} onChange={e => set("title", e.target.value)} />
                <InputField label="Facility" value={form.facility} onChange={e => set("facility", e.target.value)} />
                <InputField label="Status" value={form.status} onChange={e => set("status", e.target.value)} as="select" options={Object.keys(PROJECT_STATUS)} />
                <InputField label="Phase" value={form.phase} onChange={e => set("phase", e.target.value)} as="select" options={PROJECT_PHASES} />
                <InputField label="Start Date" type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
                <InputField label="End Date" type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
                <InputField label="Contract Value ($)" type="number" value={form.contractValue} onChange={e => set("contractValue", e.target.value)} />
                <InputField label="Collected Value ($)" type="number" value={form.collectedValue} onChange={e => set("collectedValue", e.target.value)} />
              </div>
            </div>
          )}

          {tab === "milestones" && (
            <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
              <div className="flex gap-3 mb-6">
                <input value={newMilestone} onChange={e => setNewMilestone(e.target.value)} onKeyDown={e => e.key === "Enter" && addMilestone()} placeholder="Add new milestone..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500" />
                <button onClick={addMilestone} className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold text-sm"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-col gap-2">
                {form.milestones.map(m => (
                  <div key={m.id} onClick={() => toggleMilestone(m.id)} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${m.completed ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-900 border-slate-800 hover:border-slate-600"}`}>
                    <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${m.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-600"}`}>
                      {m.completed && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
                    </div>
                    <span className={`text-sm font-medium ${m.completed ? "text-emerald-400 line-through opacity-70" : "text-slate-200"}`}>{m.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "invoices" && (
            <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="text-xs font-bold text-emerald-500/70 uppercase">Paid Total</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">${form.invoices.filter(i => i.status === "Paid").reduce((s, i) => s + i.amount, 0).toLocaleString()}</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="text-xs font-bold text-amber-500/70 uppercase">Pending Total</div>
                  <div className="text-xl font-mono font-bold text-amber-400">${form.invoices.filter(i => i.status === "Pending").reduce((s, i) => s + i.amount, 0).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex gap-3 mb-6 bg-slate-900 p-4 rounded-xl border border-slate-800 items-end">
                <InputField label="Invoice Amount ($)" type="number" value={newInvoiceAmt} onChange={e => setNewInvoiceAmt(e.target.value)} />
                <button onClick={() => addInvoice("Pending")} className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-sm hover:bg-amber-500/30">Add Pending</button>
                <button onClick={() => addInvoice("Paid")} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-sm hover:bg-emerald-500/30">Add Paid</button>
              </div>
              <div className="flex flex-col gap-2">
                {form.invoices.slice().reverse().map((inv, idx) => (
                  <div key={inv.id || idx} className="flex justify-between items-center p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-200 font-mono font-bold">${inv.amount.toLocaleString()}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === "Paid" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>{inv.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "issues" && (
            <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
               <div className="flex gap-3 mb-6">
                <input value={newIssue} onChange={e => setNewIssue(e.target.value)} onKeyDown={e => e.key === "Enter" && addIssue()} placeholder="Describe new issue..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-rose-500" />
                <button onClick={addIssue} className="px-5 py-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-900 font-bold text-sm">Log Issue</button>
              </div>
              <div className="flex flex-col gap-3">
                {form.issues.filter(i => i.status === "Open").map(issue => (
                  <div key={issue.id} className="flex justify-between items-center p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <span className="text-slate-200 text-sm font-medium">{issue.title}</span>
                    </div>
                    <button onClick={() => resolveIssue(issue.id)} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 text-xs font-bold transition-colors">Resolve</button>
                  </div>
                ))}
                {form.issues.filter(i => i.status === "Resolved").length > 0 && (
                  <>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Resolved Issues</div>
                    {form.issues.filter(i => i.status === "Resolved").map(issue => (
                      <div key={issue.id} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-800 rounded-xl opacity-60">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-slate-400 text-sm line-through">{issue.title}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {tab === "notes" && (
            <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
              <div className="flex gap-3 mb-6">
                <input value={newNote} onChange={e => setNewNote(e.target.value)} onKeyDown={e => e.key === "Enter" && addNote()} placeholder="Type a note..." className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500" />
                <button onClick={addNote} className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-900 font-bold text-sm">Add</button>
              </div>
              <div className="flex flex-col gap-3">
                {(form.notes || []).slice().reverse().map((n, i) => {
                  const [date, ...rest] = n.split(":");
                  return (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5">
                      <span className="text-blue-400 text-xs font-mono font-medium">{date}</span>
                      <p className="text-slate-300 text-sm leading-relaxed">{rest.join(":")}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={() => { onSave(form); toast("Project updated!", "success"); onClose(); }} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-900 text-sm font-bold shadow-lg shadow-blue-500/20 transition-all">
            <Save className="w-4 h-4" /> Save Project
          </button>
        </div>
      </div>
    </div>
  );
}

function AddProjectModal({ onClose, onAdd, initialData, isConversion }) {
  const [form, setForm] = useState(() => initialData || { title: "", facility: "", status: "In Progress", phase: "Planning", progress: 0, startDate: "", endDate: "", contractValue: "", collectedValue: 0, milestones: [], invoices: [], issues: [], notes: [] });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Briefcase className="w-5 h-5" /></div>
            <h2 className="text-lg font-bold text-white">{isConversion ? "Convert Bid to Project" : "New Project Tracker"}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          <InputField label="Project Title *" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Boiler Replacement" />
          <div className="grid grid-cols-2 gap-5">
            <InputField label="Facility" value={form.facility} onChange={e => set("facility", e.target.value)} />
            <InputField label="Phase" value={form.phase} onChange={e => set("phase", e.target.value)} as="select" options={PROJECT_PHASES} />
            <InputField label="Start Date *" type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} />
            <InputField label="Target End Date *" type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} />
            <InputField label="Total Contract Value ($)" type="number" value={form.contractValue} onChange={e => set("contractValue", e.target.value)} />
          </div>
        </div>
        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={() => { if (!form.title || !form.startDate) return alert("Title and Start Date are required."); onAdd({ ...form, id: `p-${Date.now()}` }); onClose(); }} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-900 text-sm font-bold shadow-lg shadow-blue-500/20 transition-all"><Plus className="w-4 h-4" /> {isConversion ? "Convert to Project" : "Start Project"}</button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function App() {
  const [activeTab, setActiveTab] = useState("bids"); // "bids" | "projects"
  
  // Bids State
  const [bids, setBids] = useState([]);
  const [selectedBid, setSelectedBid] = useState(null);
  const [showAddBid, setShowAddBid] = useState(false);
  const [view, setView] = useState("table");
  const [filter, setFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("dueDate");
  const [sortDir, setSortDir] = useState("asc");
  const [showStarred, setShowStarred] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  // Projects State
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [bidToConvert, setBidToConvert] = useState(null); // Triggers the conversion modal

  // Shared State
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = "info") => setToast({ msg, type }), []);

  // Fetch Google Sheets Data (Bids)
  useEffect(() => {
    const SHEET_ID = '1n35yVc-lpZbmjAdHYbCwmUhrllMfPmlBfy2Hp9uA2Hg';
    const SHEET_NAME = 'HISTORICAL DATA';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

    fetch(csvUrl)
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,        
          dynamicTyping: true, 
          skipEmptyLines: true,
          complete: (result) => {
            const liveData = result.data.map((row, index) => {
              let rawDate = row['Current Date Offers Due'];
              let formattedDate = "";
              if (rawDate) {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) formattedDate = d.toISOString().split('T')[0];
                else formattedDate = String(rawDate).trim(); 
              }
              return {
                id: row['Notice ID:'] || `sheet-row-${index}`,
                status: row['STATUS'] || 'Open',
                dueDate: formattedDate,
                title: row['TITLE'] || 'Unknown Title',
                state: row['STATE'] || '',
                city: row['CITY'] || '',
                facility: row['Office'] || 'VA Medical Center',
                bidAmount: row['BID AMOUNT'] || '',
                awardedAmount: row['AWARDED AMOUNT'] || '',
                reason: row['REASON FOR LOSS'] || '',
                contractor: row['AWARDED CONTRACTOR'] || '',
                contractNo: row['CONTRACT NUMBER'] || '',
                priority: 'Medium', category: 'Electrical', visn: '', nco: '', starred: false, notes: [],
                chk_sf1449: false, chk_sow_pws: false, chk_pricing: false, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false
              };
            });
            setBids(liveData);
          }
        });
      }).catch(err => console.error("Error loading from Google Sheets:", err));
  }, []);

  // --- BIDS LOGIC ---
  const toggleCheck = useCallback((id, field) => setBids(bs => bs.map(b => b.id === id ? { ...b, [field]: !b[field] } : b)), []);
  const toggleStar = useCallback((id) => setBids(bs => bs.map(b => b.id === id ? { ...b, starred: !b.starred } : b)), []);
  
  // Save bid with intercept for "Awarded" status
  const saveBid = useCallback(updated => {
    const original = bids.find(b => b.id === updated.id);
    setBids(bs => bs.map(b => b.id === updated.id ? updated : b));
    
    // Intercept: If status changed to Awarded, trigger conversion prompt
    if (original && original.status !== "Awarded" && updated.status === "Awarded") {
      setTimeout(() => setBidToConvert(updated), 400); 
    }
  }, [bids]);

  const deleteBid = useCallback(id => { setBids(bs => bs.filter(b => b.id !== id)); showToast("Bid deleted", "warn"); }, [showToast]);
  const addBid = useCallback(bid => { setBids(bs => [...bs, bid]); showToast("New bid created! 🎉", "success"); }, [showToast]);

  const filteredBids = useMemo(() => {
    return bids
      .filter(b => (filter === "All" || b.status === filter) && (catFilter === "All" || b.category === catFilter) && (!showStarred || b.starred) && (!search || [b.title, b.city, b.state, b.facility, b.contractor].some(f => f && String(f).toLowerCase().includes(search.toLowerCase()))))
      .sort((a, b) => {
        let av = a[sortKey] || "", bv = b[sortKey] || "";
        if (sortKey === "dueDate") { av = new Date(av); bv = new Date(bv); }
        return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
  }, [bids, filter, catFilter, showStarred, search, sortKey, sortDir]);

  const bidStats = useMemo(() => ({
    total: bids.length,
    open: bids.filter(b => b.status === "Open").length,
    urgent: bids.filter(b => { 
      if (!b.dueDate) return false;
      const d = new Date(b.dueDate) - new Date(); 
      return d > 0 && d < 3 * 86400000; 
    }).length,
    awarded: bids.filter(b => b.status === "Awarded").length,
    totalValue: bids.reduce((s, b) => s + (Number(b.bidAmount) || 0), 0),
  }), [bids]);

  const exportToCSV = useCallback(() => {
    if (filteredBids.length === 0) return showToast("No bids to export!", "warn");
    const headers = ["Status", "Due Date", "Title", "Facility", "City", "State", "Bid Amount", "Awarded Amount", "Priority", "Category", "Contractor"];
    const csvRows = filteredBids.map(b => [b.status, b.dueDate, `"${(b.title || "").replace(/"/g, '""')}"`, `"${(b.facility || "").replace(/"/g, '""')}"`, `"${b.city || ""}"`, b.state, b.bidAmount, b.awardedAmount, b.priority, b.category, `"${(b.contractor || "").replace(/"/g, '""')}"`].join(","));
    const blob = new Blob([[headers.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Bids_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click(); document.body.removeChild(link);
    showToast("Exported to CSV! 📊", "success");
  }, [filteredBids, showToast]);

  const toggleSort = (key) => { if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } };
  const SortBtn = ({ k, label }) => (
    <div onClick={() => toggleSort(k)} className={`flex items-center gap-1 cursor-pointer select-none transition-colors ${sortKey === k ? "text-sky-400" : "text-slate-400 hover:text-slate-200"}`}>
      {label} {sortKey === k ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
    </div>
  );

  // --- PROJECTS LOGIC ---
  const saveProject = useCallback(updated => setProjects(ps => ps.map(p => p.id === updated.id ? updated : p)), []);
  const addProject = useCallback(project => { setProjects(ps => [...ps, project]); showToast("Project started! 🚀", "success"); }, [showToast]);
  
  const projectStats = useMemo(() => ({
    active: projects.filter(p => p.status === "In Progress").length,
    onHold: projects.filter(p => p.status === "On Hold").length,
    completed: projects.filter(p => p.status === "Completed").length,
    openIssues: projects.reduce((acc, p) => acc + p.issues.filter(i => i.status === "Open").length, 0),
    portfolioValue: projects.reduce((acc, p) => acc + Number(p.contractValue), 0)
  }), [projects]);


  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-sky-500/30">
      
      {/* Global Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg text-white transition-colors ${activeTab === 'bids' ? 'from-sky-500 to-blue-700 shadow-sky-500/20' : 'from-blue-500 to-indigo-700 shadow-blue-500/20'}`}>
              {activeTab === 'bids' ? <Zap className="w-6 h-6 fill-current" /> : <Briefcase className="w-6 h-6 fill-current" />}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                {activeTab === 'bids' ? 'BidTracker' : 'Project'}<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Pro</span>
              </h1>
              <p className="text-xs font-medium text-slate-500 tracking-wide uppercase mt-0.5">VA Contracting Intelligence</p>
            </div>
          </div>

          {/* Module Switcher (The Core Navigation) */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-inner">
            <button onClick={() => setActiveTab("bids")} className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "bids" ? "bg-slate-800 text-sky-400 shadow-md" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}>
              <FolderKanban className="w-4 h-4" /> Bids Pipeline
              {bidStats.urgent > 0 && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{bidStats.urgent}</span>}
            </button>
            <button onClick={() => setActiveTab("projects")} className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "projects" ? "bg-slate-800 text-blue-400 shadow-md" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"}`}>
              <Briefcase className="w-4 h-4" /> Active Projects
              {projectStats.openIssues > 0 && <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded-full">{projectStats.openIssues}</span>}
            </button>
          </div>
          
          <div className="hidden md:flex bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 items-center gap-3 shadow-inner">
            <div className={`w-2 h-2 rounded-full animate-pulse ${activeTab === 'bids' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
            <LiveClock />
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 flex flex-col gap-6">
        
        {/* ======================= */}
        {/* BIDS TAB VIEW      */}
        {/* ======================= */}
        {activeTab === "bids" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Tracked", value: bidStats.total, color: "#38bdf8", data: [3,4,5,5,6] },
                { label: "Active Open", value: bidStats.open, color: "#34d399", data: [2,3,3,4,4] },
                { label: "Urgent (<3d)", value: bidStats.urgent, color: "#fb7185", data: [0,1,1,2,2] },
                { label: "Won / Awarded", value: bidStats.awarded, color: "#fbbf24", data: [0,0,1,1,1] },
                { label: "Pipeline Value", value: `$${(bidStats.totalValue / 1000).toFixed(0)}K`, color: "#a78bfa", data: [200,300,485,795,795] },
              ].map(s => (
                <div key={s.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:bg-slate-900 transition-colors shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500" style={{ backgroundColor: s.color }} />
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                    <Sparkline data={s.data} color={s.color} />
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Actions Row */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-2 md:p-3 flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
                <button onClick={() => setView("table")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${view === "table" ? "bg-slate-800 text-sky-400 shadow-sm" : "text-slate-400 hover:text-slate-300"}`}><ListIcon className="w-4 h-4" /> Table</button>
                <button onClick={() => setView("kanban")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${view === "kanban" ? "bg-slate-800 text-sky-400 shadow-sm" : "text-slate-400 hover:text-slate-300"}`}><LayoutGrid className="w-4 h-4" /> Board</button>
              </div>
              <button onClick={() => setShowStarred(s => !s)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${showStarred ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800"}`}>
                <Star className="w-4 h-4" fill={showStarred ? "currentColor" : "none"} /> Starred
              </button>
              
              <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input placeholder="Search bids..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 outline-none focus:border-sky-500" />
              </div>
              
              <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
                {["All", "Open", "Awarded", "Closed"].map(s => (
                  <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === s ? "bg-slate-800 text-sky-400 shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"}`}>{s}</button>
                ))}
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
              </select>
              <button onClick={() => setShowAddBid(true)} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-bold shadow-lg shadow-emerald-500/20"><Plus className="w-4 h-4" /> New Bid</button>
              <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold border border-slate-700"><Download className="w-4 h-4" /></button>
            </div>

            {/* Bids Main View */}
            {view === "kanban" ? <KanbanView bids={filteredBids} onSelect={setSelectedBid} onToggleStar={toggleStar} /> : (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                        <th className="px-4 py-4 w-[40px]"></th>
                        <th className="px-4 py-4"><SortBtn k="status" label="Status" /></th>
                        <th className="px-4 py-4"><SortBtn k="dueDate" label="Deadline" /></th>
                        <th className="px-4 py-4"><SortBtn k="title" label="Title & Location" /></th>
                        <th className="px-4 py-4"><SortBtn k="bidAmount" label="Value" /></th>
                        <th className="px-4 py-4"><SortBtn k="priority" label="Priority" /></th>
                        <th className="px-4 py-4 text-center">Completion</th>
                        <th className="px-4 py-4 w-[240px]">Requirements Checklist</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {filteredBids.length === 0 && <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500 bg-slate-900/20">No matching bids found.</td></tr>}
                      {filteredBids.map(bid => {
                        const pct = Math.round(CHECK_FIELDS.filter(f => bid[f.key]).length / CHECK_FIELDS.length * 100);
                        const sc = STATUS_COLORS[bid.status] || STATUS_COLORS["Open"];
                        const pc = PRIORITIES[bid.priority] || PRIORITIES["Medium"];
                        const isExp = expandedRow === bid.id;
                        
                        return (
                          <React.Fragment key={bid.id}>
                            <tr className={`group transition-colors cursor-pointer ${isExp ? "bg-slate-800/40" : "hover:bg-slate-800/20"}`} onClick={() => setSelectedBid(bid)}>
                              <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}><button onClick={() => toggleStar(bid.id)} className={`transition-colors ${bid.starred ? "text-amber-400" : "text-slate-600 hover:text-slate-400"}`}><Star className="w-4 h-4" fill={bid.starred ? "currentColor" : "none"} /></button></td>
                              <td className="px-4 py-4 align-top pt-5"><span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${sc.bg} ${sc.border} ${sc.text}`}>{bid.status}</span></td>
                              <td className="px-4 py-4 align-top pt-4"><div className="text-slate-400 text-xs mb-1.5 font-medium">{bid.dueDate ? new Date(bid.dueDate).toLocaleDateString() : "No Date"}</div><Countdown dueDate={bid.dueDate} /></td>
                              <td className="px-4 py-4">
                                <div className="text-sm font-semibold text-slate-200 mb-1.5 group-hover:text-sky-400 transition-colors line-clamp-2 pr-4">{bid.title}</div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-slate-400 flex items-center gap-1"><Building className="w-3 h-3" /> {bid.facility}</span>
                                  {bid.city && <><span className="w-1 h-1 rounded-full bg-slate-700" /><span className="text-slate-500">{bid.city}</span></>}
                                  {bid.category && <><span className="w-1 h-1 rounded-full bg-slate-700" /><span className="text-sky-500/70 font-medium">{bid.category}</span></>}
                                </div>
                              </td>
                              <td className="px-4 py-4 align-top pt-5">
                                <div className={`text-sm font-mono font-medium ${bid.bidAmount ? "text-emerald-400" : "text-slate-600"}`}>{bid.bidAmount ? `$${Number(bid.bidAmount).toLocaleString()}` : "—"}</div>
                                {bid.awardedAmount && <div className="text-[10px] text-amber-500 font-mono mt-1" title="Awarded Amount">Aw: ${Number(bid.awardedAmount).toLocaleString()}</div>}
                              </td>
                              <td className="px-4 py-4 align-top pt-5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${pc.bg} ${pc.border} ${pc.text}`}>{bid.priority || "Medium"}</span></td>
                              <td className="px-4 py-4 text-center align-top pt-3 relative" onClick={e => { e.stopPropagation(); setExpandedRow(isExp ? null : bid.id); }}>
                                <ProgressRing pct={pct} size={42} stroke={3} />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-sm rounded-lg m-2"><ChevronsUpDown className="w-4 h-4 text-sky-400" /></div>
                              </td>
                              <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                                <div className="grid grid-cols-5 gap-1.5 w-max">
                                  {CHECK_FIELDS.map(f => (
                                    <div key={f.key} title={f.label} className="relative group/btn flex flex-col items-center gap-1">
                                      <button onClick={() => toggleCheck(bid.id, f.key)} className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all duration-200 ${bid[f.key] ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]" : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-400"}`}><f.Icon className="w-3.5 h-3.5" /></button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                            {isExp && (
                              <tr className="bg-slate-900/80 border-b border-slate-800">
                                <td colSpan="8" className="px-8 py-5">
                                  <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Requirements</h4>
                                      <div className="flex flex-wrap gap-2">{CHECK_FIELDS.map(f => (<div key={f.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${bid[f.key] ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-800/50 border-slate-700 text-slate-400"}`}><f.Icon className="w-3 h-3" /> {f.label}</div>))}</div>
                                    </div>
                                    <div className="flex items-end shrink-0">
                                      <button onClick={() => setSelectedBid(bid)} className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-lg text-sm font-semibold transition-colors">Edit Full Details <ArrowRight className="w-4 h-4" /></button>
                                    </div>
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
          </div>
        )}

        {/* ======================= */}
        {/* PROJECTS TAB VIEW    */}
        {/* ======================= */}
        {activeTab === "projects" && (
          <div className="animate-in fade-in duration-300 flex flex-col gap-6">
            {/* Project Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Active Execution", value: projectStats.active, color: "#60a5fa", icon: <Play className="w-4 h-4 text-blue-400" />, data: [2,3,4,4,5] },
                { label: "On Hold", value: projectStats.onHold, color: "#fb923c", icon: <Pause className="w-4 h-4 text-orange-400" />, data: [1,1,2,1,1] },
                { label: "Completed", value: projectStats.completed, color: "#34d399", icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />, data: [10,12,15,18,20] },
                { label: "Open Issues", value: projectStats.openIssues, color: "#fb7185", icon: <AlertCircle className="w-4 h-4 text-rose-400" />, data: [0,2,1,3,1] },
                { label: "Portfolio Value", value: `$${(projectStats.portfolioValue / 1000).toFixed(0)}K`, color: "#a78bfa", icon: <TrendingUp className="w-4 h-4 text-purple-400" />, data: [400,450,450,600,695] },
              ].map(s => (
                <div key={s.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:bg-slate-900 transition-colors shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-500" style={{ backgroundColor: s.color }} />
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.icon} {s.label}</div>
                    <Sparkline data={s.data} color={s.color} />
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Actions Row */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-200 px-2 flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-blue-400" /> Contract Execution
              </h2>
              <button onClick={() => setShowAddProject(true)} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-900 text-sm font-bold shadow-lg shadow-blue-500/20"><Plus className="w-4 h-4" /> Start Project</button>
            </div>

            {/* Project Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {projects.length === 0 && <div className="col-span-full text-center py-12 text-slate-500">No active projects yet. Convert a won bid to get started.</div>}
              {projects.map(p => <ProjectCard key={p.id} project={p} onClick={setSelectedProject} />)}
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      {selectedBid && <BidModal bid={bids.find(b => b.id === selectedBid.id) || selectedBid} onClose={() => setSelectedBid(null)} onSave={saveBid} onDelete={deleteBid} toast={showToast} />}
      {showAddBid && <AddBidModal onClose={() => setShowAddBid(false)} onAdd={addBid} />}
      
      {/* Bid Conversion Modal */}
      {bidToConvert && (
        <AddProjectModal 
          isConversion={true}
          initialData={{
            title: bidToConvert.title,
            facility: bidToConvert.facility,
            contractValue: bidToConvert.awardedAmount || bidToConvert.bidAmount || "",
            status: "In Progress",
            phase: "Planning",
            progress: 0,
            startDate: new Date().toISOString().split("T")[0],
            endDate: "",
            collectedValue: 0,
            milestones: [], invoices: [], issues: [], notes: []
          }}
          onClose={() => setBidToConvert(null)} 
          onAdd={(newProj) => {
            addProject(newProj);
            setBidToConvert(null);
            setActiveTab("projects"); // Seamlessly switch tabs!
          }} 
        />
      )}

      {selectedProject && <ProjectModal project={projects.find(p => p.id === selectedProject.id) || selectedProject} onClose={() => setSelectedProject(null)} onSave={saveProject} toast={showToast} />}
      {showAddProject && <AddProjectModal onClose={() => setShowAddProject(false)} onAdd={addProject} />}

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}