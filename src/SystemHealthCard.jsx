import React, { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Loader } from "lucide-react";

const API = `http://${window.location.hostname}:5050/api/system/health`;
const POLL_MS = 30_000;

const STATUS_META = {
  online:      { color: "text-emerald-400", bg: "bg-emerald-400/10", dot: "bg-emerald-400", label: "Online" },
  degraded:    { color: "text-amber-400",   bg: "bg-amber-400/10",   dot: "bg-amber-400",   label: "Degraded" },
  stopped:     { color: "text-rose-400",    bg: "bg-rose-400/10",    dot: "bg-rose-400",    label: "Stopped" },
  errored:     { color: "text-rose-400",    bg: "bg-rose-400/10",    dot: "bg-rose-500",    label: "Errored" },
  down:        { color: "text-rose-400",    bg: "bg-rose-400/10",    dot: "bg-rose-400",    label: "Down" },
  unknown:     { color: "text-slate-400",   bg: "bg-slate-400/10",   dot: "bg-slate-400",   label: "Unknown" },
  "not managed": { color: "text-slate-500", bg: "bg-slate-500/10",   dot: "bg-slate-500",   label: "Unmanaged" },
};

function StatusDot({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.unknown;
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === "online" && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${m.dot} opacity-50`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${m.dot}`} />
    </span>
  );
}

export default function SystemHealthCard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLastFetch(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, POLL_MS);
    return () => clearInterval(id);
  }, [fetchHealth]);

  const upCount   = data?.services?.filter(s => s.status === "online").length ?? 0;
  const total     = data?.services?.length ?? 0;
  const allUp     = data?.all_up ?? false;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${allUp ? "text-emerald-400" : "text-amber-400"}`} />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Health</span>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-[10px] text-slate-600">
              {lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary badge */}
      <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-slate-950/50 border border-slate-800">
        {loading && !data ? (
          <Loader className="w-5 h-5 text-slate-400 animate-spin" />
        ) : error ? (
          <XCircle className="w-5 h-5 text-rose-400" />
        ) : allUp ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        )}
        <div>
          {error ? (
            <div className="text-sm font-bold text-rose-400">Cannot reach Flask API</div>
          ) : (
            <div className={`text-sm font-bold ${allUp ? "text-emerald-400" : "text-amber-400"}`}>
              {upCount} / {total} services online
            </div>
          )}
          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            {allUp ? "All systems nominal" : error ? "Start bid-flask-api first" : "Degraded — check below"}
          </div>
        </div>
      </div>

      {/* Service rows */}
      {error ? (
        <div className="text-xs text-slate-500 italic text-center py-4">
          Run: <code className="text-slate-400 font-mono">pm2 start ~/Developer/ecosystem.config.cjs</code>
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.services ?? []).map(svc => {
            const m = STATUS_META[svc.status] ?? STATUS_META.unknown;
            return (
              <div key={svc.name}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-800/60 ${m.bg}`}
              >
                <div className="flex items-center gap-2.5">
                  <StatusDot status={svc.status} />
                  <span className="text-sm font-mono text-slate-200">{svc.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-500">:{svc.port}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${m.color}`}>
                    {m.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 text-[10px] text-slate-600 text-right">
        Auto-refreshes every 30 s · PM2 managed
      </div>
    </div>
  );
}
