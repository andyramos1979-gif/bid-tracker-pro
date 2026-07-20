// ResponsiveShell — the one page container for the platform (Adaptive Layout, Phase 0).
//
// Standardizes the hand-rolled shell (`max-w-[1600px] mx-auto p-6`). Centers
// content and caps line length on ultra-wide monitors so wide screens gain
// operational value instead of empty gutters. Purely presentational.
//
// Widths (all mx-auto centered):
//   command  → 1800px  full command-center canvas (pipeline, ops)
//   content  → 1400px  standard record/detail pages
//   reading  → 1024px  single-column reading
//   full     → uncapped

const MAX = {
  command: "max-w-[1800px]",
  content: "max-w-[1400px]",
  reading: "max-w-[1024px]",
  full: "max-w-none",
};

export function ResponsiveShell({ width = "command", gap = "space-y-6", className = "", children }) {
  return (
    <div className={`mx-auto w-full ${MAX[width] || MAX.command} px-4 md:px-6 py-5 md:py-6 ${gap} ${className}`}>
      {children}
    </div>
  );
}

export default ResponsiveShell;
