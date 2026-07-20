// Bid Tracker — create/convert-project modal (Phase 0.5A extraction). Moved verbatim.
import { useState } from "react";
import { Briefcase, X, Plus } from "lucide-react";
import { PROJECT_PHASES } from "./constants";
import { InputField } from "./atoms";

export function AddProjectModal({ onClose, onAdd, initialData, isConversion }) {
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
