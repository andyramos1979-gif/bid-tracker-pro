// Bid Tracker — weekly ops checklist modal (Phase 0.5A extraction). Moved verbatim.
import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { OPS_SCHEMA } from "./constants";
import { ProgressRing } from "./atoms";

export function OpsChecklistModal({ onClose, onSave, stats }) {
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
