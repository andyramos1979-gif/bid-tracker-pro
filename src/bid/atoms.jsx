// Bid Tracker — shared presentational atoms (Phase 0.5 extraction).
// Moved verbatim from Bid_Tracker_Pro.jsx. Pure UI: depend only on React hooks
// and props — no app state, constants, or side effects beyond their own timers.
import { useState, useEffect } from "react";

export function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return <span className="font-mono text-sm font-medium text-info">{now.toLocaleTimeString()}</span>;
}

export function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  const styles =
    type === "success" ? "bg-success text-text" :
    type === "warn"    ? "bg-warning text-text"   :
                         "bg-info text-text";
  return (
    <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg font-bold text-sm shadow-xl z-[9999] animate-in slide-in-from-bottom-5 ${styles}`}>
      {message}
    </div>
  );
}

export function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const w = 80, h = 28;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`
  ).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible opacity-80">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - ((data[data.length - 1] - min) / (max - min || 1)) * h}
        r="3" fill={color}
      />
    </svg>
  );
}

export function Countdown({ dueDate, compact }) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const calc = () => {
      if (!dueDate) return setTimeLeft({ expired: false, missing: true });
      const parsed = new Date(dueDate);
      if (isNaN(parsed)) return setTimeLeft({ expired: false, missing: true });
      const dateStr = parsed.toISOString().split("T")[0];
      const target = new Date(dateStr + "T23:59:59");
      const diff = target - new Date();
      if (diff <= 0) return setTimeLeft({ expired: true });
      setTimeLeft({
        days:  Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins:  Math.floor((diff % 3600000) / 60000),
        secs:  Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [dueDate]);

  if (timeLeft.missing)          return <span className="text-text-faint font-bold text-xs">No Date</span>;
  if (timeLeft.expired)          return <span className="text-danger font-bold text-xs uppercase tracking-wider">Expired</span>;
  if (!("days" in timeLeft))     return null;

  const txtColor = timeLeft.days < 3 ? "text-danger" : timeLeft.days < 7 ? "text-warning" : "text-success";
  const color    = timeLeft.days < 3
    ? "text-danger border-danger/30 bg-danger-soft"
    : timeLeft.days < 7
    ? "text-warning border-warning/30 bg-warning-soft"
    : "text-success border-success/30 bg-success-soft";

  if (compact) return <span className={`text-xs font-mono font-bold ${txtColor}`}>{timeLeft.days}d {timeLeft.hours}h</span>;

  return (
    <div className="flex gap-1.5">
      {[{ v: timeLeft.days, l: "d" }, { v: timeLeft.hours, l: "h" }, { v: timeLeft.mins, l: "m" }, { v: timeLeft.secs, l: "s" }].map(({ v, l }) => (
        <div key={l} className={`border rounded px-1.5 py-0.5 min-w-[32px] text-center flex flex-col items-center justify-center ${color}`}>
          <div className="text-xs font-extrabold font-mono leading-none">{String(v).padStart(2, "0")}</div>
          <div className="text-[9px] uppercase font-semibold opacity-70 mt-0.5">{l}</div>
        </div>
      ))}
    </div>
  );
}

export function ProgressRing({ pct, size = 44, stroke = 4, customColor }) {
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const color = customColor || (pct === 100 ? "var(--color-success)" : pct > 50 ? "var(--color-warning)" : "var(--color-danger)");
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--color-surface-raised)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          strokeLinecap="round" className="transition-all duration-500 ease-out" />
      </svg>
      <span className="absolute font-mono text-[10px] font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

export const InputField = ({ label, value, onChange, placeholder, type = "text", as = "input", options = [] }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</label>
    {as === "select" ? (
      <select value={value || ""} onChange={onChange}
        className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-info focus:ring-1 focus:ring-info transition-all">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : as === "textarea" ? (
      <textarea value={value || ""} onChange={onChange} placeholder={placeholder}
        className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-info focus:ring-1 focus:ring-info transition-all min-h-[80px] resize-y" />
    ) : (
      <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder}
        className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text outline-none focus:border-info focus:ring-1 focus:ring-info transition-all" />
    )}
  </div>
);
