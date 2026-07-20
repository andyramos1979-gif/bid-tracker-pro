// Adaptive Layout foundation (Phase 0) — shared, token-driven, responsive
// primitives. Reused across Crew Tracker, Financial Hub, and Bid Tracker.
// Build sections on these instead of hand-rolling grids/shells/tables.
export { ResponsiveShell } from "./ResponsiveShell";
export { ResponsiveGrid } from "./ResponsiveGrid";
export { ResponsiveKPIGrid } from "./ResponsiveKPIGrid";
export { ResponsiveTable } from "./ResponsiveTable";
export { ADAPTIVE_LAYOUT_REGISTRY, DEVICE_MIN_WIDTH, moduleLayout } from "./layoutRegistry";
