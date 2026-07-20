// Bid Tracker — pipeline KPI metric panels (Phase 0.5 extraction).
// Moved verbatim from Bid_Tracker_Pro.jsx. Presentational; take stats + onFilter
// props. Depend only on Lucide icons.
import {
  Play, Pause, CheckCircle2, AlertCircle, TrendingUp,
  Target, Send, Trophy, AlertTriangle, BarChart2, ChevronRight,
} from "lucide-react";

export function CyberStatsPanel({ stats }) {
  const portfolioK = `$${(stats.portfolioValue / 1000).toFixed(0)}K`;

  const cards = [
    { label: "ACTIVE",    value: stats.active,     icon: <Play size={18} />,          color: "sky",    gradient: "from-sky-500 to-blue-600",      shadow: "shadow-info/20",    showRing: true,  showPct: true  },
    { label: "ON HOLD",   value: stats.onHold,     icon: <Pause size={18} />,          color: "orange", gradient: "from-orange-600 to-warning",  shadow: "shadow-warning/20", showRing: true,  showPct: false },
    { label: "COMPLETED", value: stats.completed,  icon: <CheckCircle2 size={18} />,   color: "emerald",gradient: "from-emerald-600 to-info",  shadow: "shadow-success/20",showRing: false, showPct: false },
    { label: "OPEN ISSUES",value: stats.openIssues,icon: <AlertCircle size={18} />,    color: "rose",   gradient: "from-rose-600 to-red-600",      shadow: "shadow-danger/20",   showRing: false, showPct: false },
    { label: "VALUE",     value: portfolioK,       icon: <TrendingUp size={18} />,     color: "purple", gradient: "from-purple-600 to-violet-600", shadow: "shadow-special/20", showRing: false, showPct: false },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={`relative overflow-hidden p-6 rounded-[2rem] border border-border/10 transition-all hover:-translate-y-1 hover:brightness-110 ${
            idx === 0
              ? `bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-2xl`
              : "bg-[#151926] hover:border-border/20"
          }`}
        >
          <div className="flex flex-col h-full justify-between gap-4">
            <div className="flex justify-between items-start">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${idx === 0 ? "text-white/70" : "text-text-faint"}`}>
                {card.label}
              </p>
              <div className={`p-2 rounded-xl ${idx === 0 ? "bg-surface/20" : `bg-${card.color}-500/10 text-${card.color}-400`}`}>
                {card.icon}
              </div>
            </div>

            <div className="flex items-end gap-3 mt-2">
              {card.showRing && (
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className={idx === 0 ? "text-white/20" : "text-text"} />
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="126" strokeDashoffset={126 - (126 * 63 / 100)} className={idx === 0 ? "text-white" : `text-${card.color}-500`} />
                  </svg>
                </div>
              )}
              <h3 className="text-4xl font-black tracking-tighter text-white">
                {card.value}
                {card.showPct && <span className="text-xl opacity-60 ml-1">%</span>}
              </h3>
              {card.sub && <span className="text-sm font-bold text-white/50 mb-1.5">{card.sub}</span>}
            </div>

            <div className="mt-2">
              <button className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${idx === 0 ? "text-white/80" : "text-text-muted hover:text-white"}`}>
                Click to filter <ChevronRight size={12} />
              </button>
            </div>
          </div>
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 rounded-full ${idx === 0 ? "bg-surface" : `bg-${card.color}-500`}`} />
        </div>
      ))}
    </div>
  );
}

// ── Bids panel icons ─────────────────────────────────────────────────────────

export function CyberBidsPanel({ stats, onFilter }) {
  const pipelineK  = `$${(stats.pipelineValue / 1000).toFixed(0)}K`;
  const submittedK = `$${(stats.submittedValue / 1000).toFixed(0)}K`;

  // Phase 3G-D — lifecycle KPIs: ACTIVE · SUBMITTED · AWARDED · DUE SOON · PIPELINE · WIN RATE.
  const cards = [
    { label: "ACTIVE",     value: stats.active,    icon: <Target size={18} />,        color: "violet",  gradient: "from-violet-600 to-indigo-600", shadow: "shadow-info/20",    showRing: true,  showPct: false, filterVal: "Active Bid" },
    { label: "SUBMITTED",  value: stats.submitted, sub: submittedK, icon: <Send size={18} />, color: "blue", gradient: "from-blue-600 to-info", shadow: "shadow-info/20",  showRing: false, showPct: false, filterVal: "Submitted"  },
    { label: "AWARDED",    value: stats.awarded,   icon: <Trophy size={18} />,        color: "amber",   gradient: "from-amber-500 to-yellow-600",  shadow: "shadow-warning/20", showRing: false, showPct: false, filterVal: "Awarded"    },
    { label: "DUE SOON",   value: stats.urgent,    icon: <AlertTriangle size={18} />, color: "orange",  gradient: "from-orange-600 to-warning",    shadow: "shadow-warning/20", showRing: false, showPct: false, filterVal: "All"        },
    { label: "PIPELINE $", value: pipelineK,       icon: <TrendingUp size={18} />,    color: "purple",  gradient: "from-purple-600 to-violet-600", shadow: "shadow-special/20", showRing: false, showPct: false, filterVal: "All"        },
    { label: "WIN RATE",   value: stats.winRate,   sub: `${stats.won}W / ${stats.lost}L`, showPct: true, icon: <BarChart2 size={18} />, color: "emerald", gradient: "from-emerald-600 to-info", shadow: "shadow-success/20", showRing: false, filterVal: "Closed" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          onClick={() => onFilter && onFilter(card.filterVal)}
          className={`relative overflow-hidden p-6 rounded-[2rem] border border-border/10 transition-all hover:-translate-y-1 hover:brightness-110 cursor-pointer ${
            idx === 0
              ? `bg-gradient-to-br ${card.gradient} ${card.shadow} shadow-2xl`
              : "bg-[#151926] hover:border-border/20"
          }`}
        >
          <div className="flex flex-col h-full justify-between gap-4">
            <div className="flex justify-between items-start">
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${idx === 0 ? "text-white/70" : "text-text-faint"}`}>
                {card.label}
              </p>
              <div className={`p-2 rounded-xl ${idx === 0 ? "bg-surface/20" : `bg-${card.color}-500/10 text-${card.color}-400`}`}>
                {card.icon}
              </div>
            </div>

            <div className="flex items-end gap-3 mt-2">
              {card.showRing && (
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className={idx === 0 ? "text-white/20" : "text-text"} />
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="126" strokeDashoffset={126 - (126 * 63 / 100)} className={idx === 0 ? "text-white" : `text-${card.color}-500`} />
                  </svg>
                </div>
              )}
              <h3 className="text-4xl font-black tracking-tighter text-white">
                {card.value}
                {card.showPct && <span className="text-xl opacity-60 ml-1">%</span>}
              </h3>
              {card.sub && <span className="text-sm font-bold text-white/50 mb-1.5">{card.sub}</span>}
            </div>

            <div className="mt-2">
              <button className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${idx === 0 ? "text-white/80" : "text-text-muted hover:text-white"}`}>
                Click to filter <ChevronRight size={12} />
              </button>
            </div>
          </div>
          <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 rounded-full ${idx === 0 ? "bg-surface" : `bg-${card.color}-500`}`} />
        </div>
      ))}
    </div>
  );
}
