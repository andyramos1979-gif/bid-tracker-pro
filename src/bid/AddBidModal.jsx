// Bid Tracker — create-bid modal (Phase 0.5A extraction). Moved verbatim.
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { CATEGORIES } from "./constants";
import { InputField } from "./atoms";

export function AddBidModal({ onClose, onAdd }) {
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
