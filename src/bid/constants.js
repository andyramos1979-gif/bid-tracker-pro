// Bid Tracker — extracted constants & pure formatting helpers (Phase 0.5).
// Moved verbatim from Bid_Tracker_Pro.jsx — no behavior, styling, or value
// changes. CHECK_FIELDS references Lucide icon components, so this module imports
// them directly. Pure module: no React state, no side effects.
import {
  FileText, ClipboardCheck, DollarSign, BarChart2, HardHat,
  CheckCircle2, Building, Mail, ShieldCheck,
} from "lucide-react";

export const CHECK_FIELDS = [
  { key: "chk_sf1449",    label: "SF1449",    Icon: FileText },
  { key: "chk_sow_pws",   label: "SOW/PWS",   Icon: ClipboardCheck },
  { key: "chk_pricing",   label: "Pricing",   Icon: DollarSign },
  { key: "chk_past_perf", label: "Past Perf", Icon: BarChart2 },
  { key: "chk_osha_safety",label:"OSHA",      Icon: HardHat },
  { key: "chk_licenses",  label: "Licenses",  Icon: CheckCircle2 },
  { key: "chk_site_visit",label: "Site Visit",Icon: Building },
  { key: "chk_sub_loi",   label: "Sub LOI",   Icon: Mail },
  { key: "chk_compliance",label: "Bid Submitted",Icon: ShieldCheck },
];

export const OPS_SCHEMA = [
  { id: "cash",     title: "Cash, Finance & Admin",  items: ["Bank balances reviewed", "Open invoices followed up", "Bills scheduled", "Tax reserves confirmed"] },
  { id: "pipeline", title: "Estimating & Sales",     items: ["New opportunities reviewed", "Active estimates checked", "Pricing validated", "Follow-ups scheduled"] },
  { id: "jobs",     title: "Active Jobs Control",    items: ["Jobs reviewed (Track/Risk)", "Work scheduled", "Budget checked", "Change orders logged"] },
];

export const CATEGORIES    = ["All", "Electrical", "Inspection", "HVAC", "Grounds", "Construction", "Plumbing"];

// Capture Intelligence decision → badge styling (dashboard columns/badges).
export const DECISION_BADGE = {
  "Recommended":   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Manual Review": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Archived":      "bg-slate-500/15 text-slate-400 border-slate-500/30",
};
// Workflow-stage filter chips (stages as filters, not separate storage buckets).
// Filters on the mutable workflowStatus (Recommended → Prospect → Active Bid).
// Federal contracting lifecycle nav (Phase 3G-B). Submitted is primary; Prospect
// is moved after the main stages (still filterable, just not a primary KPI).
export const STAGE_FILTERS = [
  { val: "All",        label: "All" },
  { val: "Recommended", label: "Recommended" },
  { val: "Active Bid", label: "Active" },
  { val: "Submitted",  label: "Submitted" },
  { val: "Awarded",    label: "Awarded" },
  { val: "Closed",     label: "Closed" },       // matches any Closed * state
  { val: "Prospect",   label: "Prospect" },
];
export const STAGE_CHIP_ON = {
  "Recommended":   "bg-emerald-500/20 text-emerald-400",
  "Prospect":      "bg-slate-500/20 text-slate-300",
  "Active Bid":    "bg-violet-500/20 text-violet-400",
  "Submitted":     "bg-blue-500/20 text-blue-400",
  "Awarded":       "bg-yellow-500/20 text-yellow-400",
  "Closed":        "bg-emerald-600/20 text-emerald-300",
  "All":           "bg-surface-raised text-info",
};
// Result/status badge colors (Phase 3G-K).
export const RESULT_BADGE = {
  "Submitted":         "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Awarded":           "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Closed Won":        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Closed Lost":       "bg-red-500/15 text-red-400 border-red-500/30",
  "Closed Cancelled":  "bg-slate-500/15 text-slate-400 border-slate-500/30",
  "Closed Withdrawn":  "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

// Phase 3H — Submitted-bid aging + follow-up + probability helpers.
export const daysSince = (d) => {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
};
// Aging color bands: 0-15 green · 16-30 yellow · 31-60 orange · 60+ red.
export const agingBadge = (days) => {
  if (days == null) return null;
  const cls = days <= 15 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            : days <= 30 ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
            : days <= 60 ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
            : "bg-red-500/15 text-red-400 border-red-500/30";
  return { label: `${days}d waiting`, cls };
};
export const PROBABILITY_OPTS = [25, 50, 75, 90];
export const FOLLOWUP_OPTS = ["Not Started", "Waiting", "Contacted", "Response Received"];
export const FOLLOWUP_CLS = {
  "Not Started":       "text-text-faint",
  "Waiting":           "text-amber-400",
  "Contacted":         "text-blue-400",
  "Response Received": "text-emerald-400",
};
// Compact/abbreviated ($1.6K) — for KPI cards & summary chips ONLY.
export const money = (n) => {
  const v = Number(n) || 0;
  return v >= 1000 ? `$${(v / 1000).toFixed(v >= 100000 ? 0 : 1)}K` : `$${v.toLocaleString()}`;
};

// Shared exact money formatter — ALWAYS 2 decimals, never rounded/abbreviated.
// Use for all accounting/financial amounts (contract values, invoices, A/R, payments):
//   formatCurrency(1575.58) -> "$1,575.58" · formatCurrency(0) -> "$0.00" · negatives OK.
export const formatCurrency = (amount) => {
  const n = Number(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
};
export const PROJECT_PHASES = ["Planning", "Design", "Procurement", "Execution", "Closeout"];

export const PRIORITIES = {
  Critical: { text: "text-danger",    bg: "bg-danger-soft",    border: "border-danger/20",    hex: "var(--color-danger)" },
  High:     { text: "text-warning",  bg: "bg-warning-soft",  border: "border-warning/20",  hex: "var(--color-warning)" },
  Medium:   { text: "text-warning",   bg: "bg-warning/10",   border: "border-warning/20",   hex: "var(--color-warning)" },
  Low:      { text: "text-success", bg: "bg-success-soft", border: "border-success/20", hex: "var(--color-success)" },
};

export const STATUS_COLORS = {
  Open:    { text: "text-success", bg: "bg-success-soft", border: "border-success/20", hex: "var(--color-success)" },
  Awarded: { text: "text-warning",   bg: "bg-warning/10",   border: "border-warning/20",   hex: "var(--color-warning)" },
  Closed:  { text: "text-text-muted",   bg: "bg-bg-subtle/10",   border: "border-border/20",   hex: "var(--color-text-faint)" },
};

export const PROJECT_STATUS = {
  "In Progress": { text: "text-info",    bg: "bg-info-soft",    border: "border-info/30",    hex: "#60a5fa" },
  "On Hold":     { text: "text-warning",  bg: "bg-warning-soft",  border: "border-warning/30",  hex: "var(--color-warning)" },
  "Completed":   { text: "text-success", bg: "bg-success-soft", border: "border-success/30", hex: "var(--color-success)" },
  "Cancelled":   { text: "text-danger",    bg: "bg-danger-soft",    border: "border-danger/30",    hex: "var(--color-danger)" },
};

export const GEO_WIN_RATES = [
  { name: "Testing",        pct: 53, color: "var(--color-success)" },
  { name: "Arc Flash",      pct: 24, color: "var(--color-info)" },
  { name: "Generator/ATS",  pct: 12, color: "var(--color-danger)" },
  { name: "HVAC",           pct: 38, color: "var(--color-warning)" },
  { name: "Construction",   pct: 29, color: "#a78bfa" },
];
