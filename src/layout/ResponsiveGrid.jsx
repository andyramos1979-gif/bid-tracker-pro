// ResponsiveGrid — the standard panel/card grid ladder (Adaptive Layout, Phase 0).
//
// Replaces divergent, hand-rolled `grid grid-cols-1 lg:grid-cols-N` strings.
// Class strings are STATIC (looked up by column count) so Tailwind always emits
// them — never interpolate `xl:grid-cols-${n}`.
//
// Ladder: 1 col on phones, 2 on tablet (md), the target count at xl, and an
// extra column at the 3xl (1920px) tier so big monitors gain columns.

const COLS = {
  2: "grid grid-cols-1 md:grid-cols-2",
  3: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
  5: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5",
  6: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-6",
};

const GAP = { sm: "gap-3", md: "gap-4", lg: "gap-6" };

export function ResponsiveGrid({ cols = 3, gap = "md", itemsStart = false, className = "", children }) {
  return (
    <div className={`${COLS[cols] || COLS[3]} ${GAP[gap] || GAP.md} ${itemsStart ? "items-start" : ""} ${className}`}>
      {children}
    </div>
  );
}

export default ResponsiveGrid;
