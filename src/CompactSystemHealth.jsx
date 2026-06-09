import { useState, useEffect, useCallback, useRef } from "react";

const POLL_MS = 30_000;

export default function CompactSystemHealth() {
  const [data,      setData]      = useState(null);
  const [hovered,   setHovered]   = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const wrapRef = useRef(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(
        `http://${window.location.hostname}:5050/api/system/health`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLastFetch(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, POLL_MS);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const services  = data?.services ?? [];
  const upCount   = services.filter(s => s.status === "online").length;
  const total     = services.length;
  const allUp     = data?.all_up ?? false;
  const hasData   = data !== null;

  const dotColor  = !hasData ? "bg-slate-400" : allUp ? "bg-emerald-400" : "bg-amber-400";
  const pingColor = !hasData ? "bg-slate-400" : allUp ? "bg-emerald-400" : "bg-amber-400";

  const statusColor = (s) => {
    if (s === "online")   return "text-emerald-400";
    if (s === "degraded") return "text-amber-400";
    return "text-rose-400";
  };
  const dotBg = (s) => {
    if (s === "online")   return "bg-emerald-400";
    if (s === "degraded") return "bg-amber-400";
    return "bg-rose-400";
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Pill button ── */}
      <button className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12.5px] font-semibold transition-colors shadow-sm select-none">
        {/* Pulsing dot */}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-70`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
        <span className="font-mono tracking-wide">
          SYS&nbsp;
          <span className={allUp && hasData ? "text-emerald-300" : "text-amber-300"}>
            {hasData ? `${upCount}/${total}` : "—"}
          </span>
        </span>
      </button>

      {/* ── Hover dropdown ── */}
      {hovered && (
        <div className="absolute top-full right-0 mt-2 w-72 z-50 rounded-xl border border-slate-700/60 bg-[#0f141e] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${allUp && hasData ? "text-emerald-400" : "text-amber-400"}`}>
                {!hasData ? "Cannot reach API" : allUp ? "All Systems Nominal" : `${total - upCount} service${total - upCount !== 1 ? "s" : ""} down`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {lastFetch && (
                <span className="text-[10px] text-slate-600 font-mono">
                  {lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <button onClick={fetchHealth} title="Refresh" className="text-slate-500 hover:text-slate-300 transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Service rows */}
          <ul className="px-3 py-2.5 space-y-1.5">
            {services.length === 0 ? (
              <li className="text-[11px] text-slate-500 italic text-center py-3">
                {hasData ? "No services reported" : "Run: pm2 start ~/Developer/ecosystem.config.cjs"}
              </li>
            ) : services.map(svc => (
              <li key={svc.name}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotBg(svc.status)}`} />
                  <span className="text-[11px] font-mono text-slate-200">{svc.name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-slate-600">:{svc.port}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${statusColor(svc.status)}`}>
                    {svc.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="px-4 py-2 border-t border-slate-800 text-[10px] text-slate-600 text-right">
            Auto-refreshes every 30 s · PM2
          </div>
        </div>
      )}
    </div>
  );
}
