// Auto-refresh interval standard — one source of truth per surface, per the
// UI Auto-Refresh Architecture upgrade. Values are milliseconds. Tune here, never
// scatter magic numbers through components.
//
// Portable: copy this file into Crew Tracker / Bid Tracker unchanged; each app reads
// only the keys it uses.
export const REFRESH_MS = {
  // Financial Hub
  dashboardKpis: 30_000,
  banking:       30_000,
  transactions:  30_000,
  receipts:      30_000,
  cashPosition:  30_000,
  analytics:     60_000,
  budgets:       60_000,

  // Bid Tracker
  bidDashboard:      15_000,
  opportunityLists:  15_000,
  projectPipeline:   15_000,
  opsDashboard:      15_000,

  // Crew Tracker
  crewRoster:     10_000,
  activeClockIns: 10_000,
  laborDashboard: 10_000,
  dispatchBoard:  10_000,
  jobAssignments: 10_000,

  // Fallback for anything unspecified
  default: 30_000,
};

// Health thresholds (ms). A surface is "delayed" once it's this far past its interval,
// "offline" once a refresh has actually failed (network unreachable).
export const HEALTH = {
  delayedFactor: 2.5,   // overdue = interval * this
  offlineAfterFailures: 2,
};

// Retry / backoff for a failed refresh (exponential, capped, jittered).
export const BACKOFF = {
  baseMs: 2_000,
  maxMs:  60_000,
  factor: 2,
  jitter: 0.25,
};
