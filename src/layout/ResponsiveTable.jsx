// ResponsiveTable — the shared data table that never horizontal-scrolls on a phone
// (Adaptive Layout, Phase 0).
//
// The audit's biggest true gap: Bid Tracker's tables are raw `overflow-x-auto >
// <table min-w-[1100px]>` that force horizontal scrolling on mobile. This
// renders a real <table> at md+ and REFLOWS each row into a stacked label/value
// card below md — nothing is dropped.
//
// Data-driven. Token-driven styling (bg-surface / border-border / shadow-card)
// so the app palette and Dark Mode apply automatically. Note: replaces the
// off-token `divide-slate-800` styling with the shared border token.
//
// column shape: { key, header, render?(row), cellClassName?, headerClassName?,
//                  primary?, hideOnCard? }

function cell(col, row) {
  return col.render ? col.render(row) : row[col.key];
}

export function ResponsiveTable({ columns, rows, rowKey, onRowClick, empty, dense = false, bare = false, className = "" }) {
  if (!rows || !rows.length) {
    return (
      <div className={`p-8 text-center text-sm text-text-faint ${bare ? "" : "rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]"}`}>
        {empty || "No records."}
      </div>
    );
  }

  const pad = dense ? "px-2.5 py-1.5" : "px-3.5 py-2.5";
  const primary = columns.find((c) => c.primary) || columns[0];
  const cardCols = columns.filter((c) => c !== primary && !c.hideOnCard);
  const clickable = typeof onRowClick === "function";
  const mdWrap = bare
    ? "hidden md:block overflow-x-auto"
    : "hidden md:block overflow-x-auto rounded-xl border border-border bg-surface shadow-[var(--shadow-card)]";
  const cardCls = bare
    ? "rounded-xl border border-border bg-surface-sunken/40 p-3.5"
    : "rounded-xl border border-border bg-surface p-3.5 shadow-[var(--shadow-card)]";

  return (
    <div className={className}>
      {/* Tablet & up: real table (overflow-x safety net for extreme widths) */}
      <div className={mdWrap}>
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-sunken/60">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`${pad} text-[10.5px] font-bold uppercase tracking-wide text-text-muted whitespace-nowrap ${c.headerClassName || ""}`}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={clickable ? () => onRowClick(row) : undefined}
                className={`transition-colors ${clickable ? "cursor-pointer hover:bg-surface-sunken/50" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`${pad} text-text align-top ${c.cellClassName || ""}`}>
                    {cell(c, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: each row becomes a stacked card — no horizontal scroll */}
      <div className="md:hidden space-y-2.5">
        {rows.map((row, i) => (
          <div
            key={rowKey(row, i)}
            onClick={clickable ? () => onRowClick(row) : undefined}
            className={`${cardCls} ${clickable ? "cursor-pointer active:bg-surface-sunken/50" : ""}`}
          >
            <div className="text-sm font-bold text-text mb-2 leading-tight">{cell(primary, row)}</div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
              {cardCols.map((c) => (
                <div key={c.key} className="flex flex-col min-w-0">
                  <dt className="text-[9.5px] font-bold uppercase tracking-wide text-text-faint">{c.header}</dt>
                  <dd className="text-[12.5px] text-text-secondary truncate">{cell(c, row)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ResponsiveTable;
