// Bid Tracker — project detail modal (Phase 0.5A extraction). Moved verbatim.
import { useState } from "react";
import { Building, X, CheckCircle2, Plus, FileText, AlertTriangle, Globe, ArrowRight, Save } from "lucide-react";
import { PROJECT_STATUS, PROJECT_PHASES } from "./constants";
import { Countdown, InputField } from "./atoms";

export function ProjectModal({ project, onClose, onSave, toast }) {
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
