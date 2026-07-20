// Adaptive Layout Registry (Phase 0) — the single source of truth for what
// experience each module should present at each device class. Kept in sync with
// the audit doc and the copies in Crew Tracker / Financial Hub.
//
// Breakpoint standard (stock Tailwind + one added 3xl token in index.css):
//   mobile   < 768   (base, sm)
//   tablet   768–1279 (md, lg, xl-)
//   laptop   1280–1535 (xl)
//   desktop  1536–1919 (2xl)
//   ultrawide 1920+   (3xl)

/** px lower-bounds for each device class (for JS-side matchMedia if ever needed). */
export const DEVICE_MIN_WIDTH = {
  mobile: 0,
  tablet: 768,
  laptop: 1280,
  desktop: 1536,
  ultrawide: 1920,
};

export const ADAPTIVE_LAYOUT_REGISTRY = [
  {
    module: "Crew Tracker",
    primaryView: "OPS",
    experiences: {
      mobile: { role: "Field Worker", intent: "1-col fast actions" },
      tablet: { role: "Supervisor", intent: "crew status, 2-col" },
      laptop: { role: "Operations", intent: "3-col workflow" },
      desktop: { role: "Command Center", intent: "6-col dashboard" },
      ultrawide: { role: "Owner Center", intent: "8-col, all panels" },
    },
  },
  {
    module: "Projects",
    primaryView: "OWNER",
    experiences: {
      mobile: { role: "Summary", intent: "stacked cards" },
      tablet: { role: "PM View", intent: "2-col grid" },
      laptop: { role: "PM View", intent: "3-col grid" },
      desktop: { role: "Project Dashboard", intent: "4-col + margin rail" },
      ultrawide: { role: "Portfolio Dashboard", intent: "5-col wall + KPI band" },
    },
  },
  {
    module: "Payroll",
    primaryView: "PAYROLL",
    experiences: {
      mobile: { role: "Employee Hours", intent: "my timecard" },
      tablet: { role: "Approval Queue", intent: "review list" },
      laptop: { role: "Processing", intent: "timesheet grid" },
      desktop: { role: "Payroll Center", intent: "grid + approvals side" },
      ultrawide: { role: "Workforce Analytics", intent: "grid + trends + WH-347" },
    },
  },
  {
    module: "Dispatch",
    primaryView: "OPS",
    experiences: {
      mobile: { role: "My Jobs", intent: "job cards" },
      tablet: { role: "Dispatcher", intent: "queue + map" },
      laptop: { role: "Dispatcher", intent: "3-col board" },
      desktop: { role: "Dispatch Center", intent: "board + live-ops rail" },
      ultrawide: { role: "Regional Command", intent: "board + map + feed" },
    },
  },
  {
    module: "Financial Hub",
    primaryView: "OWNER",
    experiences: {
      mobile: { role: "Money Snapshot", intent: "bottom-nav, KPI stack" },
      tablet: { role: "Bookkeeper", intent: "list + detail drawer" },
      laptop: { role: "Operations Finance", intent: "master-detail" },
      desktop: { role: "Finance Cockpit", intent: "3–4 col report wall" },
      ultrawide: { role: "CFO Command", intent: "5-col: cash+AR+AP+P&L" },
    },
  },
  {
    module: "Bid Tracker",
    primaryView: "OWNER",
    experiences: {
      mobile: { role: "Due Soon", intent: "card reflow of table" },
      tablet: { role: "Estimator", intent: "table + filters" },
      laptop: { role: "Estimator", intent: "table + analytics" },
      desktop: { role: "Pipeline Center", intent: "table + board split" },
      ultrawide: { role: "Growth Command", intent: "pipeline + geo + win-rate" },
    },
  },
  {
    module: "Calendar",
    primaryView: "OPS",
    experiences: {
      mobile: { role: "Agenda", intent: "day list" },
      tablet: { role: "Week", intent: "scrollable week" },
      laptop: { role: "Month", intent: "7-col month" },
      desktop: { role: "Month + rail", intent: "month + event panel" },
      ultrawide: { role: "Ops Calendar", intent: "month + resources + feed" },
    },
  },
  {
    module: "Command Center",
    primaryView: "OWNER",
    experiences: {
      mobile: { role: "Alerts", intent: "what needs me now" },
      tablet: { role: "Daily Ops", intent: "2-col KPIs" },
      laptop: { role: "Operations", intent: "KPIs + panels" },
      desktop: { role: "Command Center", intent: "6-col, fill vertical" },
      ultrawide: { role: "Owner Command", intent: "9-tile wall, no scroll" },
    },
  },
];

/** Look up a module's registry entry by name (case-insensitive). */
export function moduleLayout(module) {
  const m = String(module || "").toLowerCase();
  return ADAPTIVE_LAYOUT_REGISTRY.find((r) => r.module.toLowerCase() === m);
}
