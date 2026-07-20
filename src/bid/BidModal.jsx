// Bid Tracker — bid detail/edit modal (Phase 0.5A extraction). Moved verbatim.
import { useState } from "react";
import { CheckCircle2, X, Trophy, Plus, ArrowRight, Trash2, Save } from "lucide-react";
import { CHECK_FIELDS, PRIORITIES } from "./constants";
import { ProgressRing, InputField } from "./atoms";

export function BidModal({ bid, onClose, onSave, onDelete, toast }) {
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
