// useAutoRefresh — the reusable auto-refresh hook.
//
// Give it a key, an interval, and a refresh() function (anything: a React Query
// invalidate/refetch, a fetch, a store reload). It will:
//   • poll on the interval via RealtimeService (which pauses when the tab is hidden
//     and fires once immediately when the user returns)
//   • time each run and report last-updated / duration / failures to the status store
//   • retry with exponential backoff on failure
//   • expose refresh() for manual/force refresh and register it with the global
//     Sync button (force-refresh-all)
//
// Transport-agnostic — swapping RealtimeService to WebSockets/SSE later needs no change
// here. Portable to Crew Tracker / Bid Tracker (drop in with refreshConfig + RefreshStatus).
import { useCallback, useEffect, useRef, useState } from "react";
import { realtimeService } from "../realtime/RealtimeService";
import { BACKOFF } from "../realtime/refreshConfig";
import { useRefreshReporter, useRegisterForceRefresh, useUnregisterChannel } from "../realtime/RefreshStatus";

export function useAutoRefresh({ key, intervalMs, refresh, enabled = true }) {
  const report = useRefreshReporter();
  const registerForce = useRegisterForceRefresh();
  const unregister = useUnregisterChannel();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const failRef = useRef(0);
  const retryTimer = useRef(null);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const run = useCallback(async ({ force = false } = {}) => {
    if (!enabled && !force) return;
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    setIsRefreshing(true);
    const t0 = (typeof performance !== "undefined" ? performance.now() : Date.now());
    try {
      await refreshRef.current?.();
      failRef.current = 0;
      report(key, { ok: true, durationMs: (performance?.now?.() ?? Date.now()) - t0, intervalMs });
    } catch (err) {
      failRef.current += 1;
      report(key, {
        ok: false, durationMs: (performance?.now?.() ?? Date.now()) - t0,
        error: err, intervalMs, failCount: failRef.current,
      });
      // exponential backoff (capped, jittered) — retry sooner than the next poll
      const base = Math.min(BACKOFF.maxMs, BACKOFF.baseMs * BACKOFF.factor ** (failRef.current - 1));
      const delay = base * (1 + (Math.random() * 2 - 1) * BACKOFF.jitter);
      retryTimer.current = setTimeout(() => run({ force: false }), delay);
    } finally {
      setIsRefreshing(false);
    }
  }, [enabled, key, intervalMs, report]);

  // Poll registration (RealtimeService owns the timer + tab-visibility pause/resume).
  useEffect(() => {
    if (!enabled) { realtimeService.unsubscribe(key); unregister(key); return undefined; }
    const unsub = realtimeService.subscribe(key, () => run({ force: false }), intervalMs);
    return () => { unsub(); if (retryTimer.current) clearTimeout(retryTimer.current); };
  }, [key, intervalMs, enabled, run, unregister]);

  // Drop this channel's status record when the surface truly unmounts (its page closed),
  // so a stale "5 min ago" entry can't flip overall health to Delayed. Keyed on `key`
  // only, so it does NOT fire on interval/run changes (no flicker while mounted).
  useEffect(() => () => unregister(key), [key, unregister]);

  // Global force-refresh (the Sync button triggers every registered channel).
  useEffect(() => registerForce(key, () => run({ force: true })), [key, run, registerForce]);

  return { refresh: () => run({ force: true }), isRefreshing };
}

// React Query adapter — the common Financial Hub case. Auto-refreshes a set of query
// keys by invalidating them (background refetch; no page reload, no flash).
export function useAutoRefreshQueries({ key, intervalMs, queryClient, queryKeys, enabled = true }) {
  const refresh = useCallback(
    () => Promise.all((queryKeys || []).map((qk) => queryClient.invalidateQueries({ queryKey: qk }))),
    [queryClient, queryKeys],
  );
  return useAutoRefresh({ key, intervalMs, refresh, enabled });
}
