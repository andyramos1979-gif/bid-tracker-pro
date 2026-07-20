// Bid Tracker — filter/search/sort toolbar (Phase 0.5B extraction). Moved verbatim.
// Controlled/presentational; parent owns all state. Analytics strips stay in parent.
import { LayoutGrid, List as ListIcon, Star, Search, Plus, Activity, Download } from "lucide-react";
import { CATEGORIES, STAGE_FILTERS, STAGE_CHIP_ON } from "./constants";

export function BidFilters({ view, setView, showStarred, setShowStarred, search, setSearch, filter, setFilter, catFilter, setCatFilter, decisionFilter, setDecisionFilter, bids, isMobileView, setShowAddBid, openAuditLog, exportToCSV }) {
  return (
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
  );
}
