import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Zap, LayoutGrid, List as ListIcon, Star, Plus, Download, X, Search, 
  ChevronUp, ChevronDown, ChevronsUpDown, CheckCircle2, Circle, 
  FileText, DollarSign, BarChart2, HardHat, Building, Mail, 
  ShieldCheck, Trash2, ClipboardCheck, ArrowRight, Save
} from "lucide-react";

const initialBids = [
  { id: 1, status: "Open", dueDate: "2026-03-16", title: "UPS Revitalization and Preventive Maintenance for the Bedford VA Medical Center", state: "MA", city: "Bedford", facility: "Bedford VA Medical Center", bidAmount: "", awardedAmount: "", reason: "", visn: "1", nco: "NCO 1", contractor: "Andy Ramos Electric LLC", contractNo: "", priority: "High", category: "Electrical", chk_sf1449: false, chk_sow_pws: true, chk_pricing: false, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: true, chk_sub_loi: false, chk_compliance: false, notes: [], starred: true },
  { id: 2, status: "Open", dueDate: "2026-03-13", title: "Triennial Electrical Inspections for VA Wilkes-Barre", state: "PA", city: "Wilkes-Barre", facility: "VA Wilkes-Barre", bidAmount: "", awardedAmount: "", reason: "", visn: "4", nco: "NCO 4", contractor: "Andy Ramos Electric LLC", contractNo: "", priority: "Critical", category: "Inspection", chk_sf1449: true, chk_sow_pws: true, chk_pricing: false, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false, notes: [], starred: false },
  { id: 3, status: "Awarded", dueDate: "2026-02-28", title: "HVAC System Replacement – Lebanon VA Medical Center", state: "PA", city: "Lebanon", facility: "Lebanon VA Medical Center", bidAmount: "485000", awardedAmount: "472500", reason: "Lowest responsive bid", visn: "4", nco: "NCO 4", contractor: "Apex Mechanical LLC", contractNo: "VA244-26-C-0182", priority: "Medium", category: "HVAC", chk_sf1449: true, chk_sow_pws: true, chk_pricing: true, chk_past_perf: true, chk_osha_safety: true, chk_licenses: true, chk_site_visit: true, chk_sub_loi: true, chk_compliance: true, notes: ["Awarded to Apex Mechanical"], starred: false },
  { id: 4, status: "Open", dueDate: "2026-03-25", title: "Grounds Maintenance and Landscaping Services – Togus VA Medical Center", state: "ME", city: "Togus", facility: "Togus VA Medical Center", bidAmount: "", awardedAmount: "", reason: "", visn: "1", nco: "NCO 1", contractor: "", contractNo: "", priority: "Low", category: "Grounds", chk_sf1449: true, chk_sow_pws: true, chk_pricing: true, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false, notes: [], starred: false },
  { id: 5, status: "Closed", dueDate: "2026-03-01", title: "Elevator Modernization – Providence VA Medical Center", state: "RI", city: "Providence", facility: "Providence VA Medical Center", bidAmount: "310000", awardedAmount: "", reason: "Under review", visn: "1", nco: "NCO 1", contractor: "Andy Ramos Electric LLC", contractNo: "", priority: "Medium", category: "Construction", chk_sf1449: true, chk_sow_pws: true, chk_pricing: true, chk_past_perf: true, chk_osha_safety: true, chk_licenses: true, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false, notes: ["Bid submitted, pending award"], starred: false },
  { id: 6, status: "Open", dueDate: "2026-04-02", title: "Plumbing Infrastructure Upgrade – White River Junction VAMC", state: "VT", city: "White River Junction", facility: "White River Junction VAMC", bidAmount: "", awardedAmount: "", reason: "", visn: "1", nco: "NCO 1", contractor: "", contractNo: "", priority: "Medium", category: "Plumbing", chk_sf1449: false, chk_sow_pws: false, chk_pricing: false, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false, notes: [], starred: false },
];

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

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { 
    const t = setInterval(() => setNow(new Date()), 1000); 
    return () => clearInterval(t); 
  }, []);
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
      const diff = new Date(dueDate + "T23:59:59") - new Date();
      if (diff <= 0) return setTimeLeft({ expired: true });
      setTimeLeft({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), mins: Math.floor((diff % 3600000) / 60000), secs: Math.floor((diff % 60000) / 1000), expired: false });
    };
    calc(); const t = setInterval(calc, 1000); return () => clearInterval(t);
  }, [dueDate]);
  
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

function KanbanView({ bids, onSelect, onToggleStar }) {
  const cols = ["Open", "Closed", "Awarded"];
  return (
    <div className="flex gap-6 overflow-x-auto pb-6 min-h-[400px]">
      {cols.map(col => {
        const colBids = bids.filter(b => b.status === col);
        const style = STATUS_COLORS[col];
        
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
                const pStyle = PRIORITIES[bid.priority];
                
                return (
                  <div key={bid.id} onClick={() => onSelect(bid)} className="group bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-600 transition-all relative overflow-hidden shadow-sm hover:shadow-md">
                    {/* Top Progress Bar */}
                    <div className="absolute top-0 left-0 h-0.5 transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: style.hex }} />
                    
                    <div className="flex justify-between items-start mb-3">
                      <span className={`border rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${pStyle.bg} ${pStyle.border} ${pStyle.text}`}>{bid.priority}</span>
                      <button onClick={e => { e.stopPropagation(); onToggleStar(bid.id); }} className={`p-1 rounded-md transition-colors ${bid.starred ? "text-amber-400" : "text-slate-600 hover:text-slate-400 hover:bg-slate-800"}`}>
                        <Star className="w-4 h-4" fill={bid.starred ? "currentColor" : "none"} />
                      </button>
                    </div>
                    
                    <h3 className="text-slate-200 text-sm font-semibold leading-tight mb-3 line-clamp-2 group-hover:text-sky-400 transition-colors">{bid.title}</h3>
                    
                    <div className="flex justify-between items-end mt-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-500 text-xs flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />{bid.city}, {bid.state}</span>
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

function BidModal({ bid, onClose, onSave, onDelete, toast }) {
  const [form, setForm] = useState({ ...bid });
  const [newNote, setNewNote] = useState("");
  const [tab, setTab] = useState("details");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addNote = () => { if (!newNote.trim()) return; set("notes", [...form.notes, `${new Date().toLocaleDateString()}: ${newNote}`]); setNewNote(""); };
  const pct = Math.round(CHECK_FIELDS.filter(f => form[f.key]).length / CHECK_FIELDS.length * 100);

  const Input = ({ label, value, onChange, placeholder, type = "text", as = "input", options = [] }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {as === "select" ? (
        <select value={value} onChange={onChange} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : as === "textarea" ? (
        <textarea value={value} onChange={onChange} placeholder={placeholder} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all min-h-[80px] resize-y" />
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all" />
      )}
    </div>
  );

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-6">
              <div className="flex gap-2 mb-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${PRIORITIES[form.priority].bg} ${PRIORITIES[form.priority].text}`}>{form.priority} Priority</span>
                <span className="px-2.5 py-1 rounded text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">{form.category}</span>
              </div>
              <h2 className="text-xl font-bold text-white leading-snug">{form.title}</h2>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <ProgressRing pct={pct} size={48} stroke={4} />
              <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6 border-b border-slate-800">
            {["details", "checklist", "notes"].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-colors ${tab === t ? "border-sky-400 text-sky-400" : "border-transparent text-slate-400 hover:text-slate-300"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === "details" && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-5">
                <Input label="Bid Amount ($)" value={form.bidAmount} onChange={e => set("bidAmount", e.target.value)} placeholder="e.g. 150000" />
                <Input label="Awarded Amount ($)" value={form.awardedAmount} onChange={e => set("awardedAmount", e.target.value)} placeholder="e.g. 145000" />
                <Input label="VISN" value={form.visn} onChange={e => set("visn", e.target.value)} />
                <Input label="NCO" value={form.nco} onChange={e => set("nco", e.target.value)} />
                <Input label="Contractor" value={form.contractor} onChange={e => set("contractor", e.target.value)} />
                <Input label="Contract #" value={form.contractNo} onChange={e => set("contractNo", e.target.value)} />
                <Input label="Status" value={form.status} onChange={e => set("status", e.target.value)} as="select" options={["Open", "Closed", "Awarded"]} />
                <Input label="Priority" value={form.priority} onChange={e => set("priority", e.target.value)} as="select" options={["Critical", "High", "Medium", "Low"]} />
              </div>
              <Input label="Reason / Description" value={form.reason} onChange={e => set("reason", e.target.value)} as="textarea" placeholder="Provide context or reason for current status..." />
            </div>
          )}

          {tab === "checklist" && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {CHECK_FIELDS.map(f => {
                const checked = form[f.key];
                return (
                  <label key={f.key} onClick={() => set(f.key, !checked)} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-900 border-slate-700 hover:border-slate-500"}`}>
                    <div className={`p-2 rounded-lg ${checked ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                      <f.Icon className="w-5 h-5" />
                    </div>
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
                <button onClick={addNote} className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold text-sm transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
              
              <div className="flex-1 flex flex-col gap-3">
                {form.notes.length === 0 && <div className="text-slate-500 text-center py-12 text-sm bg-slate-900/50 rounded-xl border border-dashed border-slate-800">No notes added yet.</div>}
                {[...form.notes].reverse().map((n, i) => {
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

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center flex-shrink-0 rounded-b-2xl">
          <button onClick={() => { if (window.confirm("Are you sure you want to delete this bid?")) { onDelete(bid.id); onClose(); } }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-rose-400 hover:bg-rose-400/10 text-sm font-semibold transition-colors">
            <Trash2 className="w-4 h-4" /> Delete Bid
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors">Cancel</button>
            <button onClick={() => { onSave(form); toast("Bid saved successfully", "success"); onClose(); }} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 text-sm font-bold shadow-lg shadow-sky-500/20 transition-all">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}

function AddBidModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ status: "Open", dueDate: "", title: "", state: "", city: "", facility: "", bidAmount: "", awardedAmount: "", reason: "", visn: "", nco: "", contractor: "Andy Ramos Electric LLC", contractNo: "", priority: "Medium", category: "Electrical", notes: [], starred: false, chk_sf1449: false, chk_sow_pws: false, chk_pricing: false, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const Input = ({ label, value, onChange, placeholder, type = "text", as = "input", options = [] }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {as === "select" ? (
        <select value={value} onChange={onChange} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all">
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all" />
      )}
    </div>
  );

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
          <Input label="Bid Title *" value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Electrical Upgrade Phase 2" />
          
          <div className="grid grid-cols-2 gap-5">
            <Input label="Due Date *" type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
            <Input label="Facility" value={form.facility} onChange={e => set("facility", e.target.value)} placeholder="e.g. Bedford VAMC" />
            <Input label="City" value={form.city} onChange={e => set("city", e.target.value)} />
            <Input label="State" value={form.state} onChange={e => set("state", e.target.value)} />
            <Input label="Priority" value={form.priority} onChange={e => set("priority", e.target.value)} as="select" options={["Critical", "High", "Medium", "Low"]} />
            <Input label="Category" value={form.category} onChange={e => set("category", e.target.value)} as="select" options={CATEGORIES.slice(1)} />
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors">Cancel</button>
          <button onClick={() => { if (!form.title || !form.dueDate) return alert("Title and Due Date are required."); onAdd({ ...form, id: Date.now() }); onClose(); }} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
            <Plus className="w-4 h-4" /> Create Bid
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [bids, setBids] = useState(initialBids);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState("table");
  const [filter, setFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("dueDate");
  const [sortDir, setSortDir] = useState("asc");
  const [toast, setToast] = useState(null);
  const [showStarred, setShowStarred] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const showToast = useCallback((msg, type = "info") => setToast({ msg, type }), []);
  const toggleCheck = useCallback((id, field) => setBids(bs => bs.map(b => b.id === id ? { ...b, [field]: !b[field] } : b)), []);
  const toggleStar = useCallback((id) => setBids(bs => bs.map(b => b.id === id ? { ...b, starred: !b.starred } : b)), []);
  const saveBid = useCallback(updated => setBids(bs => bs.map(b => b.id === updated.id ? updated : b)), []);
  const deleteBid = useCallback(id => { setBids(bs => bs.filter(b => b.id !== id)); showToast("Bid deleted", "warn"); }, [showToast]);
  const addBid = useCallback(bid => { setBids(bs => [...bs, bid]); showToast("New bid created! 🎉", "success"); }, [showToast]);

  const filtered = useMemo(() => {
    return bids
      .filter(b => (filter === "All" || b.status === filter) && 
                   (catFilter === "All" || b.category === catFilter) && 
                   (!showStarred || b.starred) && 
                   (!search || [b.title, b.city, b.state, b.facility, b.contractor].some(f => f && f.toLowerCase().includes(search.toLowerCase()))))
      .sort((a, b) => {
        let av = a[sortKey] || "", bv = b[sortKey] || "";
        if (sortKey === "dueDate") { av = new Date(av); bv = new Date(bv); }
        return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
  }, [bids, filter, catFilter, showStarred, search, sortKey, sortDir]);

  const stats = useMemo(() => ({
    total: bids.length,
    open: bids.filter(b => b.status === "Open").length,
    urgent: bids.filter(b => { const d = new Date(b.dueDate) - new Date(); return d > 0 && d < 3 * 86400000; }).length,
    awarded: bids.filter(b => b.status === "Awarded").length,
    totalValue: bids.reduce((s, b) => s + (Number(b.bidAmount) || 0), 0),
  }), [bids]);

  const exportToCSV = useCallback(() => {
    if (filtered.length === 0) return showToast("No bids to export!", "warn");
    const headers = ["Status", "Due Date", "Title", "Facility", "City", "State", "Bid Amount", "Awarded Amount", "Priority", "Category", "Contractor"];
    const csvRows = filtered.map(b => [b.status, b.dueDate, `"${b.title || ""}"`, `"${b.facility || ""}"`, `"${b.city || ""}"`, b.state, b.bidAmount, b.awardedAmount, b.priority, b.category, `"${b.contractor || ""}"`].join(","));
    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Bids_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported to CSV! 📊", "success");
  }, [filtered, showToast]);

  const toggleSort = (key) => { if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } };
  
  const SortBtn = ({ k, label }) => (
    <div onClick={() => toggleSort(k)} className={`flex items-center gap-1 cursor-pointer select-none transition-colors ${sortKey === k ? "text-sky-400" : "text-slate-400 hover:text-slate-200"}`}>
      {label}
      {sortKey === k ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-sky-500/30">
      
      {/* App Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">BidTracker <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Pro</span></h1>
              <p className="text-xs font-medium text-slate-500 tracking-wide uppercase mt-0.5">VA Contracting Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button onClick={() => setView("table")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${view === "table" ? "bg-slate-800 text-sky-400 shadow-sm" : "text-slate-400 hover:text-slate-300"}`}><ListIcon className="w-4 h-4" /> Table</button>
              <button onClick={() => setView("kanban")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${view === "kanban" ? "bg-slate-800 text-sky-400 shadow-sm" : "text-slate-400 hover:text-slate-300"}`}><LayoutGrid className="w-4 h-4" /> Board</button>
            </div>
            
            <button onClick={() => setShowStarred(s => !s)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${showStarred ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"}`}>
              <Star className="w-4 h-4" fill={showStarred ? "currentColor" : "none"} /> Starred
            </button>
            
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all">
              <Plus className="w-4 h-4" /> New Bid
            </button>
            
            <div className="hidden md:flex bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 items-center gap-3 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <LiveClock />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 flex flex-col gap-6">
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Tracked", value: stats.total, color: "#38bdf8", data: [3,4,5,5,6] },
            { label: "Active Open", value: stats.open, color: "#34d399", data: [2,3,3,4,4] },
            { label: "Urgent (<3d)", value: stats.urgent, color: "#fb7185", data: [0,1,1,2,2] },
            { label: "Won / Awarded", value: stats.awarded, color: "#fbbf24", data: [0,0,1,1,1] },
            { label: "Pipeline Value", value: `$${(stats.totalValue / 1000).toFixed(0)}K`, color: "#a78bfa", data: [200,300,485,795,795] },
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

        {/* Filters Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-2 md:p-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input placeholder="Search titles, cities, facilities..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-600" />
          </div>
          
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
            {["All", "Open", "Awarded", "Closed"].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${filter === s ? "bg-slate-800 text-sky-400 shadow-sm" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900"}`}>
                {s}
              </button>
            ))}
          </div>
          
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 outline-none focus:border-sky-500 transition-all appearance-none min-w-[160px]">
            {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
          </select>
          
          <button onClick={exportToCSV} className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors border border-slate-700 hover:border-slate-500">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="animate-in fade-in duration-300">
          {view === "kanban" ? (
            <KanbanView bids={filtered} onSelect={setSelected} onToggleStar={toggleStar} />
          ) : (
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
                    {filtered.length === 0 && (
                      <tr><td colSpan="8" className="px-6 py-12 text-center text-slate-500 bg-slate-900/20">No matching bids found. Try adjusting your filters.</td></tr>
                    )}
                    {filtered.map(bid => {
                      const pct = Math.round(CHECK_FIELDS.filter(f => bid[f.key]).length / CHECK_FIELDS.length * 100);
                      const sc = STATUS_COLORS[bid.status];
                      const pc = PRIORITIES[bid.priority];
                      const isExp = expandedRow === bid.id;
                      
                      return (
                        <React.Fragment key={bid.id}>
                          <tr className={`group transition-colors cursor-pointer ${isExp ? "bg-slate-800/40" : "hover:bg-slate-800/20"}`} onClick={() => setSelected(bid)}>
                            <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                              <button onClick={() => toggleStar(bid.id)} className={`transition-colors ${bid.starred ? "text-amber-400" : "text-slate-600 hover:text-slate-400"}`}>
                                <Star className="w-4 h-4" fill={bid.starred ? "currentColor" : "none"} />
                              </button>
                            </td>
                            <td className="px-4 py-4 align-top pt-5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${sc.bg} ${sc.border} ${sc.text}`}>{bid.status}</span>
                            </td>
                            <td className="px-4 py-4 align-top pt-4">
                              <div className="text-slate-400 text-xs mb-1.5 font-medium">{new Date(bid.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                              <Countdown dueDate={bid.dueDate} />
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm font-semibold text-slate-200 mb-1.5 group-hover:text-sky-400 transition-colors line-clamp-2 pr-4">{bid.title}</div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-slate-400 flex items-center gap-1"><Building className="w-3 h-3" /> {bid.facility}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-700" />
                                <span className="text-slate-500">{bid.city}, {bid.state}</span>
                                {bid.category && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="text-sky-500/70 font-medium">{bid.category}</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top pt-5">
                              <div className={`text-sm font-mono font-medium ${bid.bidAmount ? "text-emerald-400" : "text-slate-600"}`}>{bid.bidAmount ? `$${Number(bid.bidAmount).toLocaleString()}` : "—"}</div>
                              {bid.awardedAmount && <div className="text-[10px] text-amber-500 font-mono mt-1" title="Awarded Amount">Aw: ${Number(bid.awardedAmount).toLocaleString()}</div>}
                            </td>
                            <td className="px-4 py-4 align-top pt-5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${pc.bg} ${pc.border} ${pc.text}`}>{bid.priority}</span>
                            </td>
                            <td className="px-4 py-4 text-center align-top pt-3 relative" onClick={e => { e.stopPropagation(); setExpandedRow(isExp ? null : bid.id); }}>
                              <ProgressRing pct={pct} size={42} stroke={3} />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-sm rounded-lg m-2">
                                <ChevronsUpDown className="w-4 h-4 text-sky-400" />
                              </div>
                            </td>
                            <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                              <div className="grid grid-cols-5 gap-1.5 w-max">
                                {CHECK_FIELDS.map(f => (
                                  <div key={f.key} title={f.label} className="relative group/btn flex flex-col items-center gap-1">
                                    <button onClick={() => toggleCheck(bid.id, f.key)} className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all duration-200 ${bid[f.key] ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.15)]" : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-400"}`}>
                                      <f.Icon className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Details Row */}
                          {isExp && (
                            <tr className="bg-slate-900/80 border-b border-slate-800">
                              <td colSpan="8" className="px-8 py-5">
                                <div className="flex flex-col md:flex-row gap-8">
                                  <div className="flex-1">
                                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Requirement Details</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {CHECK_FIELDS.map(f => (
                                        <div key={f.key} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${bid[f.key] ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-slate-800/50 border-slate-700 text-slate-400"}`}>
                                          <f.Icon className="w-3 h-3" /> {f.label}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {bid.reason && (
                                    <div className="flex-1 max-w-sm">
                                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Current Context / Notes</h4>
                                      <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">{bid.reason}</p>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-end shrink-0">
                                    <button onClick={() => setSelected(bid)} className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 rounded-lg text-sm font-semibold transition-colors">
                                      Edit Full Details <ArrowRight className="w-4 h-4" />
                                    </button>
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
      </main>

      {/* Modals & Toasts */}
      {selected && <BidModal bid={bids.find(b => b.id === selected.id)} onClose={() => setSelected(null)} onSave={saveBid} onDelete={deleteBid} toast={showToast} />}
      {showAdd && <AddBidModal onClose={() => setShowAdd(false)} onAdd={addBid} />}
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      
    </div>
  );
}