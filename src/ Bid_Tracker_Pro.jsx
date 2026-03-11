import React, { useState, useEffect, useMemo, useCallback } from "react";

const initialBids = [
  { id: 1, status: "Open", dueDate: "2026-03-16", title: "UPS Revitalization and Preventive Maintenance for the Bedford VA Medical Center", state: "MA", city: "Bedford", facility: "Bedford VA Medical Center", bidAmount: "", awardedAmount: "", reason: "", visn: "1", nco: "NCO 1", contractor: "Andy Ramos Electric LLC", contractNo: "", priority: "High", category: "Electrical", chk_sf1449: false, chk_sow_pws: true, chk_pricing: false, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: true, chk_sub_loi: false, chk_compliance: false, notes: [], starred: true },
  { id: 2, status: "Open", dueDate: "2026-03-13", title: "Triennial Electrical Inspections for VA Wilkes-Barre", state: "PA", city: "Wilkes-Barre", facility: "VA Wilkes-Barre", bidAmount: "", awardedAmount: "", reason: "", visn: "4", nco: "NCO 4", contractor: "Andy Ramos Electric LLC", contractNo: "", priority: "Critical", category: "Inspection", chk_sf1449: true, chk_sow_pws: true, chk_pricing: false, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false, notes: [], starred: false },
  { id: 3, status: "Awarded", dueDate: "2026-02-28", title: "HVAC System Replacement – Lebanon VA Medical Center", state: "PA", city: "Lebanon", facility: "Lebanon VA Medical Center", bidAmount: "485000", awardedAmount: "472500", reason: "Lowest responsive bid", visn: "4", nco: "NCO 4", contractor: "Apex Mechanical LLC", contractNo: "VA244-26-C-0182", priority: "Medium", category: "HVAC", chk_sf1449: true, chk_sow_pws: true, chk_pricing: true, chk_past_perf: true, chk_osha_safety: true, chk_licenses: true, chk_site_visit: true, chk_sub_loi: true, chk_compliance: true, notes: ["Awarded to Apex Mechanical"], starred: false },
  { id: 4, status: "Open", dueDate: "2026-03-25", title: "Grounds Maintenance and Landscaping Services – Togus VA Medical Center", state: "ME", city: "Togus", facility: "Togus VA Medical Center", bidAmount: "", awardedAmount: "", reason: "", visn: "1", nco: "NCO 1", contractor: "", contractNo: "", priority: "Low", category: "Grounds", chk_sf1449: true, chk_sow_pws: true, chk_pricing: true, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false, notes: [], starred: false },
  { id: 5, status: "Closed", dueDate: "2026-03-01", title: "Elevator Modernization – Providence VA Medical Center", state: "RI", city: "Providence", facility: "Providence VA Medical Center", bidAmount: "310000", awardedAmount: "", reason: "Under review", visn: "1", nco: "NCO 1", contractor: "Andy Ramos Electric LLC", contractNo: "", priority: "Medium", category: "Construction", chk_sf1449: true, chk_sow_pws: true, chk_pricing: true, chk_past_perf: true, chk_osha_safety: true, chk_licenses: true, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false, notes: ["Bid submitted, pending award"], starred: false },
  { id: 6, status: "Open", dueDate: "2026-04-02", title: "Plumbing Infrastructure Upgrade – White River Junction VAMC", state: "VT", city: "White River Junction", facility: "White River Junction VAMC", bidAmount: "", awardedAmount: "", reason: "", visn: "1", nco: "NCO 1", contractor: "", contractNo: "", priority: "Medium", category: "Plumbing", chk_sf1449: false, chk_sow_pws: false, chk_pricing: false, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false, notes: [], starred: false },
];

const CHECK_FIELDS = [
  { key: "chk_sf1449", label: "SF1449", icon: "📄" },
  { key: "chk_sow_pws", label: "SOW/PWS", icon: "📝" },
  { key: "chk_pricing", label: "Pricing", icon: "💰" },
  { key: "chk_past_perf", label: "Past Perf", icon: "📊" },
  { key: "chk_osha_safety", label: "OSHA", icon: "🦺" },
  { key: "chk_licenses", label: "Licenses", icon: "📋" },
  { key: "chk_site_visit", label: "Site Visit", icon: "🏗️" },
  { key: "chk_sub_loi", label: "Sub LOI", icon: "✉️" },
  { key: "chk_compliance", label: "Compliance", icon: "✅" },
];

const CATEGORIES = ["All", "Electrical", "Inspection", "HVAC", "Grounds", "Construction", "Plumbing"];
const PRIORITIES = { Critical: "#ff4757", High: "#ff6b35", Medium: "#ffa502", Low: "#2ed573" };

// OPTIMIZATION: Isolated Clock Component
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { 
    const t = setInterval(() => setNow(new Date()), 1000); 
    return () => clearInterval(t); 
  }, []);
  return <span style={{ fontFamily: "monospace", fontSize: 13, color: "#4fc3f7" }}>{now.toLocaleTimeString()}</span>;
}

function Toast({ message, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [onDone]);
  const bg = type === "success" ? "#2ed573" : type === "warn" ? "#ffa502" : "#4fc3f7";
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: bg, color: "#000", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, zIndex: 9999, boxShadow: "0 8px 32px #0008", animation: "slideUp 0.3s ease" }}>
      {message}
    </div>
  );
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const w = 80, h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((data[data.length - 1] - min) / (max - min || 1)) * h} r="3" fill={color} />
    </svg>
  );
}

function Countdown({ dueDate, compact }) {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = new Date(dueDate + "T23:59:59") - new Date();
      if (diff <= 0) return setTimeLeft({ expired: true });
      setTimeLeft({ days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), mins: Math.floor((diff % 3600000) / 60000), secs: Math.floor((diff % 60000) / 1000), expired: false });
    };
    calc(); const t = setInterval(calc, 1000); return () => clearInterval(t);
  }, [dueDate]);
  if (timeLeft.expired) return <span style={{ color: "#ff4757", fontWeight: 700, fontSize: 11 }}>EXPIRED</span>;
  if (!("days" in timeLeft)) return null;
  const color = timeLeft.days < 3 ? "#ff4757" : timeLeft.days < 7 ? "#ffa502" : "#2ed573";
  if (compact) return <span style={{ color, fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>{timeLeft.days}d {timeLeft.hours}h</span>;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[{ v: timeLeft.days, l: "d" }, { v: timeLeft.hours, l: "h" }, { v: timeLeft.mins, l: "m" }, { v: timeLeft.secs, l: "s" }].map(({ v, l }) => (
        <div key={l} style={{ background: `${color}20`, border: `1px solid ${color}50`, borderRadius: 4, padding: "2px 4px", minWidth: 26, textAlign: "center" }}>
          <div style={{ color, fontSize: 12, fontWeight: 800, fontFamily: "monospace", lineHeight: 1 }}>{String(v).padStart(2, "0")}</div>
          <div style={{ color: "#557799", fontSize: 8 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}

function ProgressRing({ pct, size = 44, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = pct === 100 ? "#2ed573" : pct > 50 ? "#ffa502" : "#ff6b6b";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1a2e45" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease" }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central" fill={color} fontSize={10} fontWeight={800} style={{ transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px`, fontFamily: "monospace" }}>{pct}%</text>
    </svg>
  );
}

function KanbanView({ bids, onSelect, onToggleStar }) {
  const cols = ["Open", "Closed", "Awarded"];
  const colColors = { Open: "#2ed573", Closed: "#8899aa", Awarded: "#ffa502" };
  return (
    <div style={{ display: "flex", gap: 16, padding: "0 0 16px", overflowX: "auto", minHeight: 400 }}>
      {cols.map(col => {
        const colBids = bids.filter(b => b.status === col);
        return (
          <div key={col} style={{ minWidth: 280, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "8px 12px", background: "#0a1628", borderRadius: 8, border: `1px solid ${colColors[col]}33` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: colColors[col] }} />
              <span style={{ color: colColors[col], fontWeight: 700, fontSize: 13 }}>{col}</span>
              <span style={{ marginLeft: "auto", background: `${colColors[col]}22`, color: colColors[col], borderRadius: 10, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{colBids.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {colBids.map(bid => {
                const pct = Math.round(CHECK_FIELDS.filter(f => bid[f.key]).length / CHECK_FIELDS.length * 100);
                return (
                  <div key={bid.id} onClick={() => onSelect(bid)} style={{ background: "#0a1628", border: "1px solid #1a2e45", borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "all 0.15s", position: "relative", overflow: "hidden" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = colColors[col] + "66"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#1a2e45"}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: `${pct}%`, height: 2, background: colColors[col], transition: "width 0.4s" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ background: `${PRIORITIES[bid.priority]}22`, color: PRIORITIES[bid.priority], border: `1px solid ${PRIORITIES[bid.priority]}44`, borderRadius: 4, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>{bid.priority}</span>
                      <button onClick={e => { e.stopPropagation(); onToggleStar(bid.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, opacity: bid.starred ? 1 : 0.3 }}>⭐</button>
                    </div>
                    <div style={{ color: "#a0c8e8", fontSize: 12, fontWeight: 600, lineHeight: 1.4, marginBottom: 8 }}>{bid.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#3a5a72", fontSize: 10 }}>{bid.city}, {bid.state}</div>
                      <Countdown dueDate={bid.dueDate} compact />
                    </div>
                    <div style={{ marginTop: 8, height: 3, background: "#1a2e45", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: colColors[col], borderRadius: 2, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
              {colBids.length === 0 && <div style={{ color: "#2a3a4a", fontSize: 12, textAlign: "center", padding: "24px 0" }}>No bids</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BidModal({ bid, onClose, onSave, onDelete, toast }) {
  const [form, setForm] = useState({ ...bid });
  const [newNote, setNewNote] = useState("");
  const [tab, setTab] = useState("details");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addNote = () => { if (!newNote.trim()) return; set("notes", [...form.notes, `${new Date().toLocaleDateString()}: ${newNote}`]); setNewNote(""); };
  const inp = { background: "#0b1929", border: "1px solid #1e3a5f", borderRadius: 6, color: "#cfe2f3", padding: "7px 10px", fontSize: 13, width: "100%", outline: "none", fontFamily: "inherit" };
  const pct = Math.round(CHECK_FIELDS.filter(f => form[f.key]).length / CHECK_FIELDS.length * 100);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "#000c", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#091525", border: "1px solid #1e3a5f", borderRadius: 14, width: 680, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 100px #0009" }}>
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #1a2e45", marginBottom: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{ flex: 1, marginRight: 16 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <span style={{ background: `${PRIORITIES[form.priority]}22`, color: PRIORITIES[form.priority], border: `1px solid ${PRIORITIES[form.priority]}44`, borderRadius: 4, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{form.priority}</span>
                <span style={{ background: "#4fc3f722", color: "#4fc3f7", border: "1px solid #4fc3f733", borderRadius: 4, padding: "2px 8px", fontSize: 10 }}>{form.category}</span>
              </div>
              <h2 style={{ color: "#e8f4ff", fontSize: 15, fontWeight: 700, lineHeight: 1.4, margin: 0 }}>{form.title}</h2>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <ProgressRing pct={pct} />
              <button onClick={onClose} style={{ background: "#1a2e45", border: "none", color: "#8899aa", width: 28, height: 28, borderRadius: 6, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            {["details", "checklist", "notes"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", background: "none", border: "none", borderBottom: tab === t ? "2px solid #4fc3f7" : "2px solid transparent", color: tab === t ? "#4fc3f7" : "#5577aa", cursor: "pointer", fontSize: 12, fontWeight: 600, textTransform: "capitalize", marginBottom: -1, transition: "all 0.15s" }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {tab === "details" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                {[["Bid Amount ($)", "bidAmount"], ["Awarded Amount ($)", "awardedAmount"], ["VISN", "visn"], ["NCO", "nco"], ["Contractor", "contractor"], ["Contract #", "contractNo"]].map(([lbl, k]) => (
                  <div key={k}>
                    <div style={{ color: "#4a6a88", fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>{lbl}</div>
                    <input style={inp} value={form[k]} onChange={e => set(k, e.target.value)} placeholder="—" />
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ color: "#4a6a88", fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</div>
                  <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inp, width: "100%" }}>
                    {["Open", "Closed", "Awarded"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ color: "#4a6a88", fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Priority</div>
                  <select value={form.priority} onChange={e => set("priority", e.target.value)} style={{ ...inp, width: "100%" }}>
                    {["Critical", "High", "Medium", "Low"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{ color: "#4a6a88", fontSize: 10, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Reason / Notes</div>
                <textarea style={{ ...inp, resize: "vertical", minHeight: 60 }} value={form.reason} onChange={e => set("reason", e.target.value)} />
              </div>
            </>
          )}

          {tab === "checklist" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {CHECK_FIELDS.map(f => (
                <label key={f.key} onClick={() => set(f.key, !form[f.key])} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: `1px solid ${form[f.key] ? "#2ed57344" : "#1a2e45"}`, background: form[f.key] ? "#2ed57310" : "transparent", cursor: "pointer", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 18 }}>{f.icon}</span>
                  <div>
                    <div style={{ color: form[f.key] ? "#2ed573" : "#8899aa", fontSize: 12, fontWeight: 600 }}>{f.label}</div>
                    <div style={{ color: form[f.key] ? "#2ed57399" : "#334455", fontSize: 10 }}>{form[f.key] ? "Complete" : "Pending"}</div>
                  </div>
                  <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${form[f.key] ? "#2ed573" : "#334455"}`, background: form[f.key] ? "#2ed573" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                    {form[f.key] && <svg width="10" height="10" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </div>
                </label>
              ))}
            </div>
          )}

          {tab === "notes" && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input style={{ ...inp, flex: 1 }} value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." onKeyDown={e => e.key === "Enter" && addNote()} />
                  <button onClick={addNote} style={{ padding: "7px 16px", borderRadius: 6, border: "none", background: "linear-gradient(135deg,#1a6fa8,#0d4f80)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>+ Add</button>
                </div>
              </div>
              {form.notes.length === 0 && <div style={{ color: "#2a3a4a", textAlign: "center", padding: "32px 0", fontSize: 13 }}>No notes yet</div>}
              {[...form.notes].reverse().map((n, i) => (
                <div key={i} style={{ background: "#0b1929", border: "1px solid #1a2e45", borderRadius: 8, padding: "10px 12px", marginBottom: 8, color: "#a0b8cc", fontSize: 12, lineHeight: 1.5 }}>
                  <span style={{ color: "#4fc3f7", fontSize: 10, fontFamily: "monospace" }}>{n.split(":")[0]}: </span>
                  {n.split(":").slice(1).join(":")}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "0 24px 20px", display: "flex", justifyContent: "space-between" }}>
          <button onClick={() => { if (window.confirm("Delete this bid?")) { onDelete(bid.id); onClose(); } }} style={{ padding: "7px 14px", borderRadius: 6, border: "1px solid #ff475733", background: "transparent", color: "#ff4757", cursor: "pointer", fontSize: 12 }}>🗑 Delete</button>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "7px 18px", borderRadius: 6, border: "1px solid #1e3a5f", background: "transparent", color: "#8899aa", cursor: "pointer", fontSize: 13 }}>Cancel</button>
            <button onClick={() => { onSave(form); toast("Bid saved! ✓", "success"); onClose(); }} style={{ padding: "7px 20px", borderRadius: 6, border: "none", background: "linear-gradient(135deg,#1a6fa8,#0d4f80)", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddBidModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ status: "Open", dueDate: "", title: "", state: "", city: "", facility: "", bidAmount: "", awardedAmount: "", reason: "", visn: "", nco: "", contractor: "Andy Ramos Electric LLC", contractNo: "", priority: "Medium", category: "Electrical", notes: [], starred: false, chk_sf1449: false, chk_sow_pws: false, chk_pricing: false, chk_past_perf: false, chk_osha_safety: false, chk_licenses: false, chk_site_visit: false, chk_sub_loi: false, chk_compliance: false });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = { background: "#0b1929", border: "1px solid #1e3a5f", borderRadius: 6, color: "#cfe2f3", padding: "7px 10px", fontSize: 13, width: "100%", outline: "none", fontFamily: "inherit" };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, background: "#000c", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#091525", border: "1px solid #4fc3f733", borderRadius: 14, width: 620, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 32px 100px #0009" }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid #1a2e45" }}>
          <h2 style={{ color: "#4fc3f7", fontSize: 16, fontWeight: 700, margin: 0 }}>➕ New Bid</h2>
        </div>
        <div style={{ padding: "18px 24px" }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: "#4a6a88", fontSize: 10, marginBottom: 4, textTransform: "uppercase" }}>Title *</div>
            <input style={inp} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Bid title..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[["Due Date", "dueDate", "date"], ["Facility", "facility", "text"], ["City", "city", "text"], ["State", "state", "text"], ["VISN", "visn", "text"], ["NCO", "nco", "text"]].map(([lbl, k, type]) => (
              <div key={k}>
                <div style={{ color: "#4a6a88", fontSize: 10, marginBottom: 4, textTransform: "uppercase" }}>{lbl}</div>
                <input type={type} style={inp} value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ color: "#4a6a88", fontSize: 10, marginBottom: 4, textTransform: "uppercase" }}>Priority</div>
              <select style={inp} value={form.priority} onChange={e => set("priority", e.target.value)}>
                {["Critical", "High", "Medium", "Low"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <div style={{ color: "#4a6a88", fontSize: 10, marginBottom: 4, textTransform: "uppercase" }}>Category</div>
              <select style={inp} value={form.category} onChange={e => set("category", e.target.value)}>
                {CATEGORIES.slice(1).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "7px 18px", borderRadius: 6, border: "1px solid #1e3a5f", background: "transparent", color: "#8899aa", cursor: "pointer", fontSize: 13 }}>Cancel</button>
          <button onClick={() => { if (!form.title || !form.dueDate) return alert("Title and due date required"); onAdd({ ...form, id: Date.now() }); onClose(); }} style={{ padding: "7px 20px", borderRadius: 6, border: "none", background: "linear-gradient(135deg,#2ed573,#1aab55)", color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Create Bid</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [bids, setBids] = useState(initialBids);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [view, setView] = useState("table");
  const [filter, setFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("dueDate");
  const [sortDir, setSortDir] = useState("asc");
  const [toast, setToast] = useState(null);
  const [showStarred, setShowStarred] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  // OPTIMIZATION: useCallback for handlers
  const showToast = useCallback((msg, type = "info") => setToast({ msg, type }), []);
  const toggleCheck = useCallback((id, field) => setBids(bs => bs.map(b => b.id === id ? { ...b, [field]: !b[field] } : b)), []);
  const toggleStar = useCallback((id) => setBids(bs => bs.map(b => b.id === id ? { ...b, starred: !b.starred } : b)), []);
  const saveBid = useCallback(updated => setBids(bs => bs.map(b => b.id === updated.id ? updated : b)), []);
  const deleteBid = useCallback(id => { setBids(bs => bs.filter(b => b.id !== id)); showToast("Bid deleted", "warn"); }, [showToast]);
  const addBid = useCallback(bid => { setBids(bs => [...bs, bid]); showToast("New bid created! 🎉", "success"); }, [showToast]);

  // OPTIMIZATION: useMemo for filtering/sorting logic
  const filtered = useMemo(() => {
    return bids
      .filter(b => (filter === "All" || b.status === filter) && 
                   (catFilter === "All" || b.category === catFilter) && 
                   (!showStarred || b.starred) && 
                   (!search || [b.title, b.city, b.state, b.facility, b.contractor].some(f => f && f.toLowerCase().includes(search.toLowerCase()))))
      .sort((a, b) => {
        let av = a[sortKey] || "", bv = b[sortKey] || "";
        if (sortKey === "dueDate") { av = new Date(av); bv = new Date(bv); }
        return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
      });
  }, [bids, filter, catFilter, showStarred, search, sortKey, sortDir]);

  // OPTIMIZATION: useMemo for stats calculation
  const stats = useMemo(() => ({
    total: bids.length,
    open: bids.filter(b => b.status === "Open").length,
    urgent: bids.filter(b => { const d = new Date(b.dueDate) - new Date(); return d > 0 && d < 3 * 86400000; }).length,
    awarded: bids.filter(b => b.status === "Awarded").length,
    totalValue: bids.reduce((s, b) => s + (Number(b.bidAmount) || 0), 0),
  }), [bids]);

  // FEATURE: CSV Export
  const exportToCSV = useCallback(() => {
    if (filtered.length === 0) {
      showToast("No bids to export!", "warn");
      return;
    }

    const headers = ["Status", "Due Date", "Title", "Facility", "City", "State", "Bid Amount", "Awarded Amount", "Priority", "Category", "Contractor"];
    
    const csvRows = filtered.map(b => [
      b.status,
      b.dueDate,
      `"${b.title || ""}"`,
      `"${b.facility || ""}"`,
      `"${b.city || ""}"`,
      b.state,
      b.bidAmount,
      b.awardedAmount,
      b.priority,
      b.category,
      `"${b.contractor || ""}"`
    ].join(","));

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Personalized filename default
    link.setAttribute("download", `AndyRamosElectric_Bids_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Exported to CSV! 📊", "success");
  }, [filtered, showToast]);

  const toggleSort = (key) => { if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } };
  const SortBtn = ({ k, label }) => (
    <span onClick={() => toggleSort(k)} style={{ cursor: "pointer", color: sortKey === k ? "#4fc3f7" : "#3a5a72", userSelect: "none" }}>
      {label} {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const getCompletion = bid => Math.round(CHECK_FIELDS.filter(f => bid[f.key]).length / CHECK_FIELDS.length * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#060f1a", fontFamily: "'IBM Plex Sans','Segoe UI',sans-serif", color: "#cfe2f3" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0a1628; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
        .row:hover { background: #0e2035 !important; }
        .row { transition: background 0.12s; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        select option { background: #0a1628; }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(180deg,#0c1d32 0%,#060f1a 100%)", borderBottom: "1px solid #1a2e45", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#1a6fa8,#0a3f6a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 4px 16px #1a6fa844" }}>⚡</div>
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#e8f4ff", letterSpacing: "-0.02em" }}>BidTracker <span style={{ color: "#4fc3f7" }}>Pro</span></h1>
            <div style={{ color: "#2a4a62", fontSize: 10 }}>VA Contracting Intelligence</div>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* View Toggle */}
          <div style={{ display: "flex", background: "#0a1628", border: "1px solid #1a2e45", borderRadius: 7, overflow: "hidden" }}>
            {[["table", "≡ Table"], ["kanban", "⊞ Board"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 13px", border: "none", background: view === v ? "#1a3a5a" : "transparent", color: view === v ? "#4fc3f7" : "#4a6a88", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>{l}</button>
            ))}
          </div>
          <button onClick={() => setShowStarred(s => !s)} style={{ padding: "6px 12px", borderRadius: 7, border: `1px solid ${showStarred ? "#ffa50244" : "#1a2e45"}`, background: showStarred ? "#ffa50211" : "transparent", color: showStarred ? "#ffa502" : "#4a6a88", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>⭐ Starred</button>
          <button onClick={() => setShowAdd(true)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: "linear-gradient(135deg,#2ed573,#1aab55)", color: "#000", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ New Bid</button>
          <div style={{ background: "#0a1628", border: "1px solid #1a2e45", borderRadius: 7, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ed573", animation: "pulse 2s infinite" }} />
            <LiveClock />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ padding: "16px 24px 0", display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          { label: "Total Bids", value: stats.total, color: "#4fc3f7", sub: "All tracked", data: [3,4,5,5,6] },
          { label: "Open", value: stats.open, color: "#2ed573", sub: "Active bids", data: [2,3,3,4,4] },
          { label: "Urgent", value: stats.urgent, color: "#ff4757", sub: "< 3 days left", data: [0,1,1,2,2] },
          { label: "Awarded", value: stats.awarded, color: "#ffa502", sub: "Won", data: [0,0,1,1,1] },
          { label: "Pipeline Value", value: `$${(stats.totalValue / 1000).toFixed(0)}K`, color: "#a78bfa", sub: "Total bid $", data: [200,300,485,795,795] },
        ].map(s => (
          <div key={s.label} style={{ flex: "1 1 140px", background: "#0a1628", border: "1px solid #1a2e45", borderRadius: 10, padding: "12px 14px", boxShadow: "0 4px 16px #0005", minWidth: 120 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ color: "#2a4a62", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
              <Sparkline data={s.data} color={s.color} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: "#2a4a62", fontSize: 10, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ padding: "12px 24px 0", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 7, color: "#cfe2f3", padding: "7px 12px", fontSize: 13, width: 220, outline: "none", fontFamily: "inherit" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {["All", "Open", "Awarded", "Closed"].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: "5px 12px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", border: filter === s ? "1.5px solid #4fc3f7" : "1.5px solid #1e3a5f", background: filter === s ? "#4fc3f722" : "transparent", color: filter === s ? "#4fc3f7" : "#4a6a88", transition: "all 0.13s" }}>{s}</button>
          ))}
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ background: "#0a1628", border: "1px solid #1e3a5f", borderRadius: 6, color: catFilter !== "All" ? "#4fc3f7" : "#4a6a88", padding: "5px 10px", fontSize: 11, outline: "none", fontFamily: "inherit" }}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
        </select>
        
        {/* CSV Export Button */}
        <button onClick={exportToCSV} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1e3a5f", background: "#0c1e30", color: "#a0b8cc", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s", marginLeft: 8 }} onMouseEnter={e => e.currentTarget.style.borderColor = "#4fc3f7"} onMouseLeave={e => e.currentTarget.style.borderColor = "#1e3a5f"}>
          📥 Export CSV
        </button>

        <div style={{ marginLeft: "auto", color: "#2a4a62", fontSize: 11 }}>{filtered.length} of {bids.length} bids</div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 24px 32px" }}>
        {view === "kanban" ? (
          <KanbanView bids={filtered} onSelect={setSelected} onToggleStar={toggleStar} />
        ) : (
          <div style={{ borderRadius: 10, border: "1px solid #1a2e45", overflow: "hidden", overflowX: "auto", minWidth: 900 }}>
            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "28px 88px 150px 1fr 55px 105px 100px 95px 95px 80px 190px", background: "#0c1e30", borderBottom: "1px solid #1a2e45", padding: "0 10px" }}>
              {[["", ""], ["status", "Status"], ["dueDate", "Deadline"], ["title", "Title"], ["state", "St"], ["city", "City"], ["bidAmount", "Bid Amt"], ["awardedAmount", "Awarded"], ["priority", "Priority"], ["", "Done"], ["", "Checklist"]].map(([k, lbl]) => (
                <div key={lbl + k} style={{ padding: "9px 6px", color: "#2a4a62", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em" }}>
                  {k ? <SortBtn k={k} label={lbl} /> : lbl}
                </div>
              ))}
            </div>

            {filtered.length === 0 && <div style={{ padding: "48px", textAlign: "center", color: "#2a4a62" }}>No bids match.</div>}

            {filtered.map((bid, i) => {
              const pct = getCompletion(bid);
              const sc = bid.status === "Open" ? "#2ed573" : bid.status === "Awarded" ? "#ffa502" : "#5577aa";
              const pc = PRIORITIES[bid.priority];
              const isExp = expandedRow === bid.id;

              return (
                <div key={bid.id}>
                  <div className="row" style={{ display: "grid", gridTemplateColumns: "28px 88px 150px 1fr 55px 105px 100px 95px 95px 80px 190px", background: isExp ? "#0e2035" : i % 2 === 0 ? "#080f1a" : "#091322", borderBottom: "1px solid #0f1e2e", padding: "0 10px", alignItems: "center", minHeight: 64 }}>
                    {/* Star */}
                    <div style={{ padding: "0 4px" }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleStar(bid.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: bid.starred ? 1 : 0.2, transition: "opacity 0.15s" }}>⭐</button>
                    </div>
                    {/* Status */}
                    <div style={{ padding: "6px 6px" }} onClick={() => setSelected(bid)}>
                      <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 20, background: `${sc}18`, border: `1px solid ${sc}40`, color: sc, fontSize: 9, fontWeight: 700 }}>{bid.status}</span>
                    </div>
                    {/* Deadline */}
                    <div style={{ padding: "6px 6px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ color: "#3a5a72", fontSize: 9, marginBottom: 3 }}>{new Date(bid.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                      <Countdown dueDate={bid.dueDate} />
                    </div>
                    {/* Title */}
                    <div style={{ padding: "6px" }} onClick={() => setSelected(bid)}>
                      <div style={{ color: "#7ec8e3", fontSize: 12, fontWeight: 500, lineHeight: 1.35, marginBottom: 2, cursor: "pointer" }}>{bid.title}</div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ color: "#2a4a62", fontSize: 9 }}>{bid.facility}</span>
                        {bid.category && <span style={{ background: "#4fc3f711", color: "#4fc3f799", borderRadius: 3, padding: "0px 5px", fontSize: 8 }}>{bid.category}</span>}
                      </div>
                    </div>
                    <div style={{ padding: "6px", color: "#6688aa", fontSize: 12, fontWeight: 600 }} onClick={() => setSelected(bid)}>{bid.state}</div>
                    <div style={{ padding: "6px", color: "#8899aa", fontSize: 11 }} onClick={() => setSelected(bid)}>{bid.city}</div>
                    <div style={{ padding: "6px", color: bid.bidAmount ? "#2ed573" : "#1e3a5f", fontSize: 11, fontFamily: "monospace" }} onClick={() => setSelected(bid)}>{bid.bidAmount ? `$${Number(bid.bidAmount).toLocaleString()}` : "—"}</div>
                    <div style={{ padding: "6px", color: bid.awardedAmount ? "#ffa502" : "#1e3a5f", fontSize: 11, fontFamily: "monospace" }} onClick={() => setSelected(bid)}>{bid.awardedAmount ? `$${Number(bid.awardedAmount).toLocaleString()}` : "—"}</div>
                    {/* Priority */}
                    <div style={{ padding: "6px" }} onClick={() => setSelected(bid)}>
                      <span style={{ background: `${pc}18`, color: pc, border: `1px solid ${pc}40`, borderRadius: 4, padding: "2px 7px", fontSize: 9, fontWeight: 700 }}>{bid.priority}</span>
                    </div>
                    {/* Completion ring */}
                    <div style={{ padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setExpandedRow(isExp ? null : bid.id)}>
                      <ProgressRing pct={pct} size={38} stroke={3} />
                    </div>
                    {/* Checklist */}
                    <div style={{ padding: "6px", display: "flex", flexWrap: "wrap", gap: 3 }} onClick={e => e.stopPropagation()}>
                      {CHECK_FIELDS.map(f => (
                        <div key={f.key} title={f.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                          <button onClick={() => toggleCheck(bid.id, f.key)} style={{ width: 18, height: 18, borderRadius: 3, border: bid[f.key] ? "1.5px solid #2ed573" : "1.5px solid #1e3a5f", background: bid[f.key] ? "#2ed57322" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.12s" }}>
                            {bid[f.key] && <svg width="9" height="9" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#2ed573" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </button>
                          <span style={{ fontSize: 6, color: "#1e3a5f" }}>{f.label.slice(0, 5)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Expanded Row */}
                  {isExp && (
                    <div style={{ background: "#0c1d2e", borderBottom: "1px solid #1a2e45", padding: "12px 24px", display: "flex", gap: 24, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#3a5a72", fontSize: 10, marginBottom: 6, textTransform: "uppercase" }}>Checklist Progress</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {CHECK_FIELDS.map(f => (
                            <div key={f.key} style={{ display: "flex", align: "center", gap: 5, padding: "4px 8px", borderRadius: 6, background: bid[f.key] ? "#2ed57318" : "#1a2e4588", border: `1px solid ${bid[f.key] ? "#2ed57333" : "#1a2e45"}` }}>
                              <span style={{ fontSize: 12 }}>{f.icon}</span>
                              <span style={{ fontSize: 10, color: bid[f.key] ? "#2ed573" : "#4a6a88" }}>{f.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {bid.reason && <div style={{ maxWidth: 220 }}>
                        <div style={{ color: "#3a5a72", fontSize: 10, marginBottom: 4, textTransform: "uppercase" }}>Notes</div>
                        <div style={{ color: "#8899aa", fontSize: 11, lineHeight: 1.5 }}>{bid.reason}</div>
                      </div>}
                      <button onClick={() => setSelected(bid)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #1e3a5f", background: "transparent", color: "#4fc3f7", cursor: "pointer", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>Edit Full Details →</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && <BidModal bid={bids.find(b => b.id === selected.id)} onClose={() => setSelected(null)} onSave={saveBid} onDelete={deleteBid} toast={showToast} />}
      {showAdd && <AddBidModal onClose={() => setShowAdd(false)} onAdd={addBid} />}
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}