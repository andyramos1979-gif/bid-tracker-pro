import { useState, useEffect, useCallback, useRef } from "react";

const POLL_MS = 30_000;

export default function CompactSystemHealth() {
  const [data,      setData]      = useState(null);
  const [hovered,   setHovered]   = useState(false);
  const [lastFetch, setLastFetch] = useState(null);
  const wrapRef = useRef(null);

  const fetchHealth = useCallback(async () => {
    try {
      // M-17: relative path -> vite proxy -> 127.0.0.1:5050 (Flask API is
      // localhost-bound; direct :5050 fetch would break for remote UI users).
      const res = await fetch(
        `/api/system/health`,
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

  const dotColor  = !hasData ? "bg-bg-subtle" : allUp ? "bg-success" : "bg-warning";
  const pingColor = !hasData ? "bg-bg-subtle" : allUp ? "bg-success" : "bg-warning";

  const statusColor = (s) => {
    if (s === "online")   return "text-success";
    if (s === "degraded") return "text-warning";
    return "text-danger";
  };
  const dotBg = (s) => {
    if (s === "online")   return "bg-success";
    if (s === "degraded") return "bg-warning";
    return "bg-danger";
  };

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Pill button ── */}
      <button className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg bg-info hover:bg-info text-white text-[12.5px] font-semibold transition-colors shadow-sm select-none">
        {/* Pulsing dot */}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColor} opacity-70`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
        <span className="font-mono tracking-wide">
          SYS&nbsp;
          <span className={allUp && hasData ? "text-success-fg" : "text-warning-fg"}>
            {hasData ? `${upCount}/${total}` : "—"}
          </span>
        </span>
      </button>

      {/* ── Hover dropdown ── */}
      {hovered && (
        <div className="absolute top-full right-0 mt-2 w-72 z-50 rounded-xl border border-border/60 bg-[#0f141e] shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-widest ${allUp && hasData ? "text-success" : "text-warning"}`}>
                {!hasData ? "Cannot reach API" : allUp ? "All Systems Nominal" : `${total - upCount} service${total - upCount !== 1 ? "s" : ""} down`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {lastFetch && (
                <span className="text-[10px] text-text-faint font-mono">
                  {lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <button onClick={fetchHealth} title="Refresh" className="text-text-faint hover:text-text-secondary transition-colors">
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
              <li className="text-[11px] text-text-faint italic text-center py-3">
                {hasData ? "No services reported" : "Run: pm2 start ~/Developer/ecosystem.config.cjs"}
              </li>
            ) : services.map(svc => (
              <li key={svc.name}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-raised/50 border border-border/30">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotBg(svc.status)}`} />
                  <span className="text-[11px] font-mono text-text">{svc.name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono text-text-faint">:{svc.port}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${statusColor(svc.status)}`}>
                    {svc.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="px-4 py-2 border-t border-border text-[10px] text-text-faint text-right">
            Auto-refreshes every 30 s · PM2
          </div>
        </div>
      )}
    </div>
  );
}
