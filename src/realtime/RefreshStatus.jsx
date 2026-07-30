// RefreshStatus — shared store + UI for the auto-refresh framework.
//
// Provides: a per-channel status store (last-updated, duration, failures, error),
// a force-refresh registry (for the manual Sync button), and three UI pieces:
//   <SyncHealthDot/>      ● Connected / Delayed / Offline
//   <LastUpdated/>        "Last Updated: just now / 10 sec ago / 2 min ago"
//   <RefreshStatusBar/>   the header bar: health + last-updated + Sync + diagnostics
//
// Framework-agnostic (React only — no React Query). Portable to Crew / Bid Tracker.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { HEALTH } from "./refreshConfig";

const Ctx = createContext(null);

export function RefreshStatusProvider({ children }) {
  const [store, setStore] = useState({});          // key -> record
  const forceRegistry = useRef(new Map());         // key -> forceFn

  const report = useCallback((key, { ok, durationMs, error, intervalMs, failCount }) => {
    setStore((s) => {
      const prev = s[key] || {};
      return {
        ...s,
        [key]: {
          intervalMs: intervalMs ?? prev.intervalMs,
          lastAttemptAt: Date.now(),
          lastUpdatedAt: ok ? Date.now() : (prev.lastUpdatedAt ?? null),
          lastDurationMs: Math.round(durationMs ?? prev.lastDurationMs ?? 0),
          ok,
          failCount: ok ? 0 : (failCount ?? (prev.failCount || 0) + 1),
          lastError: ok ? null : String(error?.message || error || "error"),
        },
      };
    });
  }, []);

  const registerForce = useCallback((key, fn) => {
    forceRegistry.current.set(key, fn);
    return () => forceRegistry.current.delete(key);
  }, []);

  const forceAll = useCallback(async () => {
    const results = await Promise.allSettled([...forceRegistry.current.values()].map((f) => f()));
    return results.every((r) => r.status === "fulfilled");
  }, []);

  // Drop a channel's record when its surface unmounts, so a closed page's stale entry
  // never drags overall health to "Delayed".
  const unregister = useCallback((key) => {
    setStore((s) => { if (!(key in s)) return s; const { [key]: _drop, ...rest } = s; return rest; });
  }, []);

  const value = useMemo(() => ({ store, report, registerForce, unregister, forceAll }),
    [store, report, registerForce, unregister, forceAll]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useCtx() {
  const c = useContext(Ctx);
  if (!c) throw new Error("RefreshStatus components must be inside <RefreshStatusProvider>");
  return c;
}
export const useRefreshReporter = () => useCtx().report;
export const useRegisterForceRefresh = () => useCtx().registerForce;
export const useUnregisterChannel = () => useCtx().unregister;
export const useForceRefreshAll = () => useCtx().forceAll;
export const useRefreshStore = () => useCtx().store;

// ── derived health + freshness ────────────────────────────────────────────────
function aggregate(store) {
  const rows = Object.entries(store).map(([key, r]) => ({ key, ...r }));
  const lastUpdatedAt = rows.reduce((m, r) => Math.max(m, r.lastUpdatedAt || 0), 0) || null;
  const now = Date.now();
  const offline = rows.some((r) => r.ok === false && (r.failCount || 0) >= HEALTH.offlineAfterFailures);
  const delayed = rows.some((r) => r.lastUpdatedAt && r.intervalMs
    && now - r.lastUpdatedAt > r.intervalMs * HEALTH.delayedFactor);
  const health = offline ? "offline" : delayed ? "delayed" : "connected";
  return { rows, lastUpdatedAt, health };
}

function relAge(ts, now) {
  if (!ts) return "—";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s} sec ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return `${h} hr ago`;
}

// live 1-second tick so relative ages update without a data refresh
function useNow(activeMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), activeMs); return () => clearInterval(id); }, [activeMs]);
  return now;
}

const HEALTH_META = {
  connected: { color: "#34d399", label: "Connected" },
  delayed:   { color: "#fbbf24", label: "Delayed" },
  offline:   { color: "#fb7185", label: "Offline" },
};

export function SyncHealthDot({ health }) {
  const m = HEALTH_META[health] || HEALTH_META.connected;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: m.color }}>
      <span className="h-2 w-2 rounded-full" style={{ background: m.color, boxShadow: `0 0 6px 1px ${m.color}` }} />
      {m.label}
    </span>
  );
}

export function LastUpdated({ ts }) {
  const now = useNow();
  return (
    <span className="text-[11px] text-text-muted tabular-nums">
      Last Updated: <span className="font-semibold text-text-secondary">{relAge(ts, now)}</span>
    </span>
  );
}

// The header bar: health · last-updated · Sync (force-refresh; Alt+Click = diagnostics).
export function RefreshStatusBar({ compact = false, onToast }) {
  const { store, forceAll } = useCtx();
  const { lastUpdatedAt, health, rows } = useMemo(() => aggregate(store), [store]);
  const [busy, setBusy] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [flash, setFlash] = useState(null);   // { msg, ok } — self-contained toast
  const now = useNow();

  const doForce = async () => {
    setBusy(true);
    setFlash({ msg: "Refreshing…", ok: true, pending: true });
    let ok = false;
    try { ok = await forceAll(); }
    catch { ok = false; }
    finally {
      setBusy(false);
      const done = { msg: ok ? "Refresh Complete" : "Refresh Failed", ok };
      setFlash(done);
      onToast?.(done.msg, ok);
      setTimeout(() => setFlash((f) => (f && !f.pending ? null : f)), 2500);
    }
  };

  // Diagnostics are hidden — open with Alt+Click on Sync (or via ?devmode).
  const onSyncClick = (e) => {
    if (e.altKey) { setDiagOpen((o) => !o); return; }
    doForce();
  };

  // Close diagnostics on Esc or an outside click (in addition to Alt+Click toggle + X).
  const barRef = useRef(null);
  useEffect(() => {
    if (!diagOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setDiagOpen(false); };
    const onDown = (e) => { if (barRef.current && !barRef.current.contains(e.target)) setDiagOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, [diagOpen]);

  return (
    <div ref={barRef} className="relative inline-flex items-center gap-3">
      <SyncHealthDot health={health} />
      {!compact && <LastUpdated ts={lastUpdatedAt} />}
      <button
        onClick={onSyncClick} disabled={busy}
        title="Sync — force refresh all data (Alt+Click for diagnostics)"
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border border-border text-[11.5px] font-semibold text-text-secondary hover:bg-bg-subtle transition disabled:opacity-50">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4"
          className={busy ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
        {busy ? "Syncing…" : "Sync"}
      </button>
      {flash && (
        <span className={`text-[11px] font-semibold ${flash.ok ? "text-emerald-400" : "text-rose-400"}`}>{flash.msg}</span>
      )}
      {diagOpen && (
        <div className="absolute right-0 top-9 z-50 w-80 rounded-xl border border-border bg-surface shadow-2xl p-3 text-[11px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold uppercase tracking-wider text-text-muted text-[10px]">Refresh Diagnostics</span>
            <SyncHealthDot health={health} />
            <button onClick={() => setDiagOpen(false)} aria-label="Close diagnostics"
              className="ml-auto h-5 w-5 grid place-items-center rounded text-text-muted hover:text-text hover:bg-bg-subtle transition">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="text-[9px] text-text-faint mb-1.5">Esc, click outside, or Alt+Click Sync to close</div>
          <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
            {rows.length === 0 && <div className="text-text-faint py-2">No channels registered yet.</div>}
            {rows.map((r) => (
              <div key={r.key} className="py-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-text">{r.key}</span>
                  <span className={r.ok === false ? "text-rose-400" : "text-emerald-400"}>{r.ok === false ? "FAIL" : "OK"}</span>
                </div>
                <div className="text-text-faint tabular-nums">
                  {relAge(r.lastUpdatedAt, now)} · {r.lastDurationMs ?? "—"}ms
                  {r.failCount ? ` · ${r.failCount} fails` : ""} · every {Math.round((r.intervalMs || 0) / 1000)}s
                </div>
                {r.lastError && <div className="text-rose-400 truncate">{r.lastError}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
