// Bid Tracker — Kanban board view (Phase 0.5 extraction). Moved verbatim.
import { Star, Building } from "lucide-react";
import { STATUS_COLORS, CHECK_FIELDS, PRIORITIES } from "./constants";
import { Countdown } from "./atoms";

export function KanbanView({ bids, onSelect, onToggleStar, isMobileView }) {
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
