// RealtimeService — transport abstraction for live data delivery.
//
// TODAY: polling (interval-driven pulls). FUTURE: swap the transport to WebSockets or
// Server-Sent Events WITHOUT touching call sites — subscribers keep the same API.
//
// A subscriber registers a channel (e.g. "banking") with a pull() function and an
// interval; the service invokes pull() on schedule while the tab is visible, pauses
// when hidden, and resumes on return. When we later add a WS/SSE transport, it will
// push into the same channels and the polling loop becomes a fallback — call sites
// (useAutoRefresh) never change.
//
// Framework-agnostic (no React). Portable across Financial Hub / Bid Tracker / Crew.

export const Transport = Object.freeze({
  POLLING: "polling",
  WEBSOCKET: "websocket",   // future
  SSE: "sse",               // future
});

class RealtimeServiceImpl {
  constructor() {
    this._transport = Transport.POLLING;
    this._channels = new Map();   // id -> { pull, intervalMs, timer, paused, lastRun }
    this._visibilityBound = false;
    this._bindVisibility();
  }

  get transport() { return this._transport; }

  // Reserved for the future migration. Setting a non-polling transport today is a no-op
  // beyond recording intent; the polling loop still runs until a real WS/SSE transport
  // is wired. This is the seam that makes migration a config change, not a rewrite.
  setTransport(t) { this._transport = t; }

  _bindVisibility() {
    if (this._visibilityBound || typeof document === "undefined") return;
    this._visibilityBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") this._resumeAll();
      else this._pauseAll();
    });
  }

  /**
   * Register (or replace) a channel.
   * @returns unsubscribe()
   */
  subscribe(id, pull, intervalMs) {
    this.unsubscribe(id);
    const ch = { pull, intervalMs, timer: null, paused: document?.visibilityState === "hidden", lastRun: 0 };
    this._channels.set(id, ch);
    if (this._transport === Transport.POLLING && !ch.paused) this._schedule(id);
    return () => this.unsubscribe(id);
  }

  unsubscribe(id) {
    const ch = this._channels.get(id);
    if (ch?.timer) clearTimeout(ch.timer);
    this._channels.delete(id);
  }

  _schedule(id) {
    const ch = this._channels.get(id);
    if (!ch || ch.paused || this._transport !== Transport.POLLING) return;
    if (ch.timer) clearTimeout(ch.timer);
    ch.timer = setTimeout(async () => {
      ch.lastRun = Date.now();
      try { await ch.pull?.(); } catch { /* useAutoRefresh owns error/backoff */ }
      this._schedule(id);
    }, ch.intervalMs);
  }

  _pauseAll() {
    for (const [id, ch] of this._channels) {
      ch.paused = true;
      if (ch.timer) { clearTimeout(ch.timer); ch.timer = null; }
    }
  }

  _resumeAll() {
    for (const [id, ch] of this._channels) {
      if (!ch.paused) continue;
      ch.paused = false;
      // Fire once immediately on return so the user sees fresh data, then reschedule.
      Promise.resolve(ch.pull?.()).catch(() => {});
      this._schedule(id);
    }
  }
}

// Singleton — one scheduler per tab.
export const realtimeService = new RealtimeServiceImpl();
