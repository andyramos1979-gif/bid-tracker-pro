// ResponsiveKPIGrid — the one KPI/stat-strip ladder (Adaptive Layout, Phase 0).
//
// The audit found many different KPI grids for the same concept. This
// standardizes them: always 2 columns on a phone (never a mobile crush), 4 on
// tablet, then the target density at xl, and 8 at the 2xl desktop tier for the
// widest strips. It owns the grid, not the card. Static class strings only.

const LADDER = {
  4: "grid grid-cols-2 md:grid-cols-4 gap-3",
  6: "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3",
  8: "grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3",
};

export function ResponsiveKPIGrid({ max = 6, className = "", children }) {
  return <div className={`${LADDER[max] || LADDER[6]} ${className}`}>{children}</div>;
}

export default ResponsiveKPIGrid;
