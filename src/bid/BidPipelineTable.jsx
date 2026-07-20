// Bid Tracker — pipeline table + mobile-card fallback (Phase 0.5B extraction).
// Moved verbatim from Bid_Tracker_Pro.jsx. Presentational; parent owns state/handlers.
import React from "react";
import {
  Star, Building, ChevronUp, ChevronDown, ChevronsUpDown, DollarSign, ArrowRight,
  ExternalLink, HardHat, Plus, Send, Target, Trophy, CheckCircle2,
} from "lucide-react";
import {
  CHECK_FIELDS, STATUS_COLORS, PRIORITIES, DECISION_BADGE, RESULT_BADGE,
  FOLLOWUP_CLS, PROBABILITY_OPTS, FOLLOWUP_OPTS, agingBadge, daysSince, money,
} from "./constants";
import { ProgressRing, Countdown } from "./atoms";

export function BidPipelineTable({ filteredBids, costData, startupData, expandedRow, setExpandedRow, isMobileView, sortKey, sortDir, setSortKey, setSortDir, effectiveStatus, setSelectedBid, setStage, updateMeta, toggleStar, toggleCheck, viewCosts, promoteBid, initProject }) {
  const SortBtn = ({ k, label }) => (
    <div
      onClick={() => { if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(k); setSortDir("asc"); } }}
      className={`flex items-center gap-1 cursor-pointer select-none transition-colors ${sortKey === k ? "text-info" : "text-text-muted hover:text-text"}`}>
      {label}
      {sortKey === k ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
    </div>
  );

  return (
              <div className="bg-surface/40 border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="hidden md:block overflow-x-auto">
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
                                <div className="flex items-center gap-2 text-xs flex-wrap">
                                  <span className="text-text-muted flex items-center gap-1"><Building className="w-3 h-3" /> {bid.facility}</span>
                                  {bid.city && <><span className="w-1 h-1 rounded-full bg-bg-subtle" /><span className="text-text-faint">{bid.city}</span></>}
                                  {bid.category && <><span className="w-1 h-1 rounded-full bg-bg-subtle" /><span className="text-info/70 font-medium">{bid.category}</span></>}
                                  {bid.workflowStatus === "Submitted" && (() => {
                                    const ag = agingBadge(daysSince(bid.submittedDate));
                                    return (<>
                                      {ag && <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${ag.cls}`}>{ag.label}</span>}
                                      {bid.awardProbability > 0 && <span className="px-1.5 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold">{bid.awardProbability}% win</span>}
                                      {bid.followUpStatus && bid.followUpStatus !== "Not Started" && <span className={`text-[10px] font-semibold ${FOLLOWUP_CLS[bid.followUpStatus] || "text-text-faint"}`}>· {bid.followUpStatus}</span>}
                                    </>);
                                  })()}
                                  {String(bid.workflowStatus || "").startsWith("Closed") && (
                                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${RESULT_BADGE[bid.workflowStatus] || ""}`}>{bid.resultStatus || bid.workflowStatus.replace("Closed ", "")}</span>
                                  )}
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
                                  {/* Workflow actions — Follow → Bid On This → Archive */}
                                  <div className="flex flex-wrap items-center gap-2 mb-4" onClick={e => e.stopPropagation()}>
                                    <span className="text-[10px] font-bold text-text-faint uppercase tracking-wider mr-1">Workflow</span>
                                    {(bid.workflowStatus === "Recommended" || bid.workflowStatus === "Manual Review") && (
                                      <button onClick={() => setStage(bid, "Prospect")}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/25 transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Follow
                                      </button>
                                    )}
                                    {bid.workflowStatus === "Prospect" && (
                                      <button onClick={() => setStage(bid, "Active Bid")}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 text-xs font-bold hover:bg-violet-500/25 transition-colors">
                                        <Target className="w-3.5 h-3.5" /> Bid On This
                                      </button>
                                    )}
                                    {bid.workflowStatus === "Active Bid" && (
                                      <>
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 text-xs font-bold">
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Active Bid — folder authorized
                                        </span>
                                        <button onClick={() => setStage(bid, "Submitted")}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/25 transition-colors">
                                          <Send className="w-3.5 h-3.5" /> Submit Bid
                                        </button>
                                      </>
                                    )}
                                    {bid.workflowStatus === "Submitted" && (
                                      <>
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold">
                                          <Send className="w-3.5 h-3.5" /> Submitted{bid.submittedDate ? ` ${bid.submittedDate}` : ""} — awaiting decision
                                        </span>
                                        <button onClick={() => setStage(bid, "Awarded")}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-xs font-bold hover:bg-yellow-500/25 transition-colors">
                                          <Trophy className="w-3.5 h-3.5" /> Mark Awarded
                                        </button>
                                        <button onClick={() => setStage(bid, "Closed Lost")}
                                          className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/25 text-xs font-bold hover:bg-red-500/20 transition-colors">Close Lost</button>
                                        <button onClick={() => setStage(bid, "Closed Cancelled")}
                                          className="px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-500/25 text-xs font-bold hover:bg-slate-500/20 transition-colors">Close Cancelled</button>
                                        <button onClick={() => setStage(bid, "Closed Withdrawn")}
                                          className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/25 text-xs font-bold hover:bg-orange-500/20 transition-colors">Withdraw</button>
                                      </>
                                    )}
                                    {String(bid.workflowStatus || "").startsWith("Closed") && (
                                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${RESULT_BADGE[bid.workflowStatus] || RESULT_BADGE["Closed Cancelled"]}`}>
                                        <CheckCircle2 className="w-3.5 h-3.5" /> {bid.resultStatus || bid.workflowStatus.replace("Closed ", "")}
                                        {bid.closedDate ? ` · ${bid.closedDate}` : ""}
                                        <span className="text-text-faint font-normal">(read-only)</span>
                                      </span>
                                    )}
                                    {bid.workflowStatus === "Awarded" && (<>
                                      <div className="w-full flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-text-muted mb-1">
                                        {(bid.awardedAmount || bid.bidAmount) ? <span>Award: <span className="text-yellow-400 font-semibold">{money(bid.awardedAmount || bid.bidAmount)}</span></span> : null}
                                        {bid.promotionDate && <span>Award date: <span className="text-text-secondary">{bid.promotionDate}</span></span>}
                                        {bid.jobNumber && <span>Job #: <span className="text-text-secondary font-mono">{bid.jobNumber}</span></span>}
                                        <span>Promotion: <span className={bid.financialHubProjectId ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>{bid.financialHubProjectId ? "Promoted" : "Awaiting promotion"}</span></span>
                                      </div>
                                      {bid.financialHubProjectId ? (
                                        <div className="flex flex-col gap-2 w-full">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                                              <CheckCircle2 className="w-3.5 h-3.5" /> PROJECT CREATED · {bid.jobNumber || `#${bid.financialHubProjectId}`}
                                            </span>
                                            <a href={`http://${window.location.hostname}:5175/projects`} target="_blank" rel="noreferrer"
                                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-bg-subtle transition-colors">
                                              <ExternalLink className="w-3.5 h-3.5" /> Open in Financial Hub
                                            </a>
                                            {bid.jobNumber && (
                                              <button onClick={() => viewCosts(bid)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-bg-subtle transition-colors">
                                                <DollarSign className="w-3.5 h-3.5" /> {costData[bid.id] && !costData[bid.id].loading ? "Hide Costs" : "View Costs"}
                                              </button>
                                            )}
                                            {bid.jobNumber && (() => {
                                              const sd = startupData[bid.id];
                                              if (sd?.loading) return <span className="text-[11px] text-text-faint">Initializing startup pack…</span>;
                                              if (sd?.pack) return null;   // execution status shown below
                                              return (
                                                <button onClick={() => initProject(bid)}
                                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs font-bold hover:bg-orange-500/25 transition-colors">
                                                  <HardHat className="w-3.5 h-3.5" /> Initialize Project
                                                </button>
                                              );
                                            })()}
                                            {bid.promotionDate && <span className="text-[11px] text-text-faint">Promoted {bid.promotionDate}</span>}
                                          </div>
                                          {startupData[bid.id]?.pack && (() => {
                                            const pack = startupData[bid.id].pack;
                                            const tasks = pack.tasks || [], checklist = pack.checklist || [], ms = pack.milestones || [];
                                            const pm = (pack.crew || []).find(c => c.role === "Project Manager")?.name;
                                            const isActive = pack.status === "Active" || pack.project_status === "ACTIVE";
                                            const foldersOk = pack.folder_path && !String(pack.folder_path).startsWith("(");
                                            return (
                                              <div className="flex flex-wrap items-center gap-1.5">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${isActive ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>
                                                  {isActive ? "Active" : `Startup ${pack.status}`} · {pack.completion_pct}%
                                                </span>
                                                {[
                                                  ["PM", pm || "unassigned"],
                                                  ["Tasks", `${tasks.filter(t => t.done).length}/${tasks.length}`],
                                                  ["Checklist", `${checklist.filter(c => c.done).length}/${checklist.length}`],
                                                  ["Milestones", `${ms.filter(m => m.completed).length}/${ms.length || (pack.milestone_ids || []).length}`],
                                                  ["Folders", foldersOk ? "12" : "0"],
                                                ].map(([k, v]) => (
                                                  <span key={k} className="px-2 py-1 rounded-md border border-border bg-surface-raised/40 text-[11px] text-text-muted" title={pack.folder_path || ""}>
                                                    <span className="text-text-faint">{k}:</span> <span className="font-mono font-semibold text-text-secondary">{v}</span>
                                                  </span>
                                                ))}
                                                <a href={`http://${window.location.hostname}:5175`} target="_blank" rel="noreferrer"
                                                  className="text-[11px] font-semibold text-orange-400 hover:underline">Manage startup in Financial Hub →</a>
                                              </div>
                                            );
                                          })()}
                                          {costData[bid.id] && (
                                            costData[bid.id].loading ? (
                                              <span className="text-[11px] text-text-faint">Loading project costs…</span>
                                            ) : costData[bid.id].error ? (
                                              <span className="text-[11px] text-danger">{costData[bid.id].error}</span>
                                            ) : (
                                              <div className="flex flex-col gap-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                  {[
                                                    ["Committed", `$${Number(costData[bid.id].committed_cost || 0).toLocaleString()} · ${costData[bid.id].committed_po_count || 0} PO`],
                                                    ["Actual", `$${Number(costData[bid.id].actual_cost || 0).toLocaleString()}`],
                                                    ["Projected", `$${Number(costData[bid.id].projected_cost || 0).toLocaleString()}`],
                                                    ["Contract", `$${Number(costData[bid.id].contract_value || 0).toLocaleString()}`],
                                                    ["Margin", `${costData[bid.id].margin_pct ?? 0}%`],
                                                  ].map(([k, v]) => (
                                                    <span key={k} className="px-2 py-1 rounded-md border border-border bg-surface-raised/40 text-[11px] text-text-muted">
                                                      <span className="text-text-faint">{k}:</span> <span className="font-mono font-semibold text-text-secondary">{v}</span>
                                                    </span>
                                                  ))}
                                                </div>
                                                {Array.isArray(costData[bid.id].categories) && costData[bid.id].categories.length > 0 && (
                                                  <div className="overflow-x-auto">
                                                    <table className="text-[11px] border border-border rounded-lg overflow-hidden w-auto">
                                                      <thead>
                                                        <tr className="text-text-faint bg-surface-raised/40 uppercase tracking-wide text-[10px]">
                                                          <th className="text-left px-2.5 py-1 font-semibold">Cost Category</th>
                                                          <th className="text-right px-2.5 py-1 font-semibold">Budget</th>
                                                          <th className="text-right px-2.5 py-1 font-semibold">Actual</th>
                                                          <th className="text-right px-2.5 py-1 font-semibold">Remaining</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {costData[bid.id].categories.map(cc => (
                                                          <tr key={cc.category} className="border-t border-border">
                                                            <td className="px-2.5 py-1 text-text-secondary">{cc.category}</td>
                                                            <td className="px-2.5 py-1 text-right font-mono text-text-muted">${Number(cc.budget || 0).toLocaleString()}</td>
                                                            <td className="px-2.5 py-1 text-right font-mono text-text-muted">${Number(cc.actual || 0).toLocaleString()}</td>
                                                            <td className={`px-2.5 py-1 text-right font-mono ${Number(cc.remaining) < 0 ? "text-danger" : "text-text-muted"}`}>${Number(cc.remaining || 0).toLocaleString()}</td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          )}
                                        </div>
                                      ) : (
                                        <button onClick={() => promoteBid(bid)}
                                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 text-xs font-bold hover:bg-yellow-500/25 transition-colors">
                                          <Trophy className="w-3.5 h-3.5" /> Promote to Financial Hub Project
                                        </button>
                                      )}
                                      <button onClick={() => setStage(bid, "Closed Won")}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-500/25 transition-colors">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Close Won
                                      </button>
                                    </>)}
                                    {bid.workflowStatus && !["Archived", "Awarded"].includes(bid.workflowStatus) && !String(bid.workflowStatus).startsWith("Closed") && (
                                      <button onClick={() => setStage(bid, "Archived")}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs font-bold hover:bg-slate-500/20 transition-colors">
                                        Archive
                                      </button>
                                    )}
                                    {(bid.workflowStatus === "Prospect" || bid.workflowStatus === "Archived" || bid.workflowStatus === "Active Bid") && (
                                      <button onClick={() => setStage(bid, "Recommended")}
                                        className="px-3 py-1.5 rounded-lg text-text-faint hover:text-text-secondary text-xs font-semibold transition-colors">
                                        ↩ Back to Recommended
                                      </button>
                                    )}
                                  </div>
                                  {bid.workflowStatus === "Submitted" && (() => {
                                    const ag = agingBadge(daysSince(bid.submittedDate));
                                    const inp = "flex-1 h-7 rounded border border-border bg-surface px-2 text-[11px] text-text focus:outline-none focus:border-blue-500/50";
                                    return (
                                      <div className="mb-5 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-3" onClick={e => e.stopPropagation()}>
                                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                          <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Submission Tracking</h4>
                                          {ag && <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ag.cls}`}>{ag.label}</span>}
                                          {bid.submittedDate && <span className="text-[11px] text-text-faint">Submitted {bid.submittedDate}</span>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                          <span className="text-[11px] text-text-faint w-24">Win Probability</span>
                                          {PROBABILITY_OPTS.map(pp => (
                                            <button key={pp} onClick={() => updateMeta(bid, { awardProbability: pp })}
                                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${Number(bid.awardProbability) === pp ? "bg-blue-500/20 text-blue-400 border-blue-500/40" : "border-border text-text-muted hover:text-text"}`}>{pp}%</button>
                                          ))}
                                          {bid.awardProbability > 0 && <span className="text-[11px] text-text-faint">Weighted: {money((Number(bid.bidAmount) || 0) * (Number(bid.awardProbability) / 100))}</span>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                          <span className="text-[11px] text-text-faint w-24">Follow-Up</span>
                                          {FOLLOWUP_OPTS.map(f => (
                                            <button key={f} onClick={() => updateMeta(bid, { followUpStatus: f, lastFollowUp: f !== "Not Started" ? new Date().toISOString().slice(0, 10) : "" })}
                                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${bid.followUpStatus === f ? `bg-surface-raised border-border-strong ${FOLLOWUP_CLS[f] || ""}` : "border-border text-text-muted hover:text-text"}`}>{f}</button>
                                          ))}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                          <label className="flex items-center gap-2 text-[11px] text-text-faint">Next follow-up
                                            <input type="date" defaultValue={bid.nextFollowUp || ""} onBlur={e => e.target.value !== (bid.nextFollowUp || "") && updateMeta(bid, { nextFollowUp: e.target.value })} className={inp} /></label>
                                          <label className="flex items-center gap-2 text-[11px] text-text-faint">CO Name
                                            <input defaultValue={bid.coName || ""} onBlur={e => e.target.value !== (bid.coName || "") && updateMeta(bid, { coName: e.target.value })} className={inp} /></label>
                                          <label className="flex items-center gap-2 text-[11px] text-text-faint">CO Email
                                            <input defaultValue={bid.coEmail || ""} onBlur={e => e.target.value !== (bid.coEmail || "") && updateMeta(bid, { coEmail: e.target.value })} className={inp} /></label>
                                          <label className="flex items-center gap-2 text-[11px] text-text-faint">Notes
                                            <input defaultValue={bid.followUpNotes || ""} onBlur={e => e.target.value !== (bid.followUpNotes || "") && updateMeta(bid, { followUpNotes: e.target.value })} className={inp} /></label>
                                        </div>
                                      </div>
                                    );
                                  })()}
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
                {/* Mobile fallback (Phase 4): read-only cards, no horizontal scroll; tap opens
                    the full bid modal (richer than the desktop inline expand). Table above untouched. */}
                <div className="md:hidden divide-y divide-border">
                  {filteredBids.length === 0 ? (
                    <div className="px-4 py-10 text-center text-text-faint text-sm">No matching bids found.</div>
                  ) : filteredBids.map(bid => {
                    const pct = Math.round(CHECK_FIELDS.filter(f => bid[f.key]).length / CHECK_FIELDS.length * 100);
                    const st  = effectiveStatus(bid);
                    const sc  = STATUS_COLORS[st] || STATUS_COLORS["Open"];
                    const pc  = PRIORITIES[bid.priority] || PRIORITIES["Medium"];
                    return (
                      <button key={bid.id} onClick={() => setSelectedBid(bid)} className="w-full text-left px-4 py-3 hover:bg-surface-raised/20 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5">
                          {bid.starred && <Star className="w-3.5 h-3.5 text-warning flex-shrink-0" fill="currentColor" />}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${sc.bg} ${sc.border} ${sc.text}`}>{st}</span>
                          <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border ${pc.bg} ${pc.border} ${pc.text}`}>{bid.priority || "Medium"}</span>
                        </div>
                        <div className="text-sm font-semibold text-text line-clamp-2 mb-1">{bid.title}</div>
                        <div className="flex items-center gap-x-2 gap-y-0.5 text-[11px] text-text-muted flex-wrap">
                          <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {bid.facility}</span>
                          {bid.city && <span>· {bid.city}</span>}
                          <span className="ml-auto font-mono font-semibold text-success">{bid.bidAmount ? `$${Number(bid.bidAmount).toLocaleString()}` : "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-faint">
                          <span>Due {bid.dueDate ? new Date(bid.dueDate).toLocaleDateString() : "—"}</span>
                          <span className="ml-auto">{pct}% complete</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
  );
}
