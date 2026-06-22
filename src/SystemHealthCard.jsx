import React, { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Loader } from "lucide-react";

const API = `http://${window.location.hostname}:5050/api/system/health`;
const POLL_MS = 30_000;

const STATUS_META = {
  online:      { color: "text-success", bg: "bg-success-soft", dot: "bg-success", label: "Online" },
  degraded:    { color: "text-warning",   bg: "bg-warning/10",   dot: "bg-warning",   label: "Degraded" },
  stopped:     { color: "text-danger",    bg: "bg-danger-soft",    dot: "bg-danger",    label: "Stopped" },
  errored:     { color: "text-danger",    bg: "bg-danger-soft",    dot: "bg-danger",    label: "Errored" },
  down:        { color: "text-danger",    bg: "bg-danger-soft",    dot: "bg-danger",    label: "Down" },
  unknown:     { color: "text-text-muted",   bg: "bg-bg-subtle/10",   dot: "bg-bg-subtle",   label: "Unknown" },
  "not managed": { color: "text-text-faint", bg: "bg-bg-subtle/10",   dot: "bg-bg-subtle",   label: "Unmanaged" },
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
    <div className="bg-surface/60 border border-border rounded-3xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${allUp ? "text-success" : "text-warning"}`} />
          <span className="text-xs font-bold text-text-faint uppercase tracking-widest">System Health</span>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-[10px] text-text-faint">
              {lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="text-text-faint hover:text-text-secondary transition-colors disabled:opacity-40"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Summary badge */}
      <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-bg-app/50 border border-border">
        {loading && !data ? (
          <Loader className="w-5 h-5 text-text-muted animate-spin" />
        ) : error ? (
          <XCircle className="w-5 h-5 text-danger" />
        ) : allUp ? (
          <CheckCircle2 className="w-5 h-5 text-success" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-warning" />
        )}
        <div>
          {error ? (
            <div className="text-sm font-bold text-danger">Cannot reach Flask API</div>
          ) : (
            <div className={`text-sm font-bold ${allUp ? "text-success" : "text-warning"}`}>
              {upCount} / {total} services online
            </div>
          )}
          <div className="text-[10px] text-text-faint uppercase tracking-widest font-bold">
            {allUp ? "All systems nominal" : error ? "Start bid-flask-api first" : "Degraded — check below"}
          </div>
        </div>
      </div>

      {/* Service rows */}
      {error ? (
        <div className="text-xs text-text-faint italic text-center py-4">
          Run: <code className="text-text-muted font-mono">pm2 start ~/Developer/ecosystem.config.cjs</code>
        </div>
      ) : (
        <div className="space-y-2">
          {(data?.services ?? []).map(svc => {
            const m = STATUS_META[svc.status] ?? STATUS_META.unknown;
            return (
              <div key={svc.name}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl border border-border/60 ${m.bg}`}
              >
                <div className="flex items-center gap-2.5">
                  <StatusDot status={svc.status} />
                  <span className="text-sm font-mono text-text">{svc.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-text-faint">:{svc.port}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${m.color}`}>
                    {m.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 text-[10px] text-text-faint text-right">
        Auto-refreshes every 30 s · PM2 managed
      </div>
    </div>
  );
}
