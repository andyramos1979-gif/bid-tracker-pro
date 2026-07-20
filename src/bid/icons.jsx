// Bid Tracker — Capture-Intelligence SVG icons (Phase 0.5 extraction).
// Pure presentational SVG components; each takes a color prop `c`. No deps.

export function CsIconPlayBox({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* body */}
      <rect x="4" y="12" width="60" height="38" rx="3" stroke={c} strokeWidth="1.4" fill={c + "12"}/>
      {/* top strip */}
      <rect x="4" y="5"  width="60" height="9"  rx="2" stroke={c} strokeWidth="1.4" fill={c + "22"}/>
      {/* inner frame */}
      <rect x="10" y="18" width="48" height="26" rx="2" stroke={c} strokeWidth="0.8" opacity="0.45"/>
      {/* corner dots */}
      <circle cx="8"  cy="9.5" r="1.8" fill={c}/>
      <circle cx="60" cy="9.5" r="1.8" fill={c}/>
      {/* play triangle */}
      <path d="M26 24 L44 31 L26 38 Z" fill={c}/>
      {/* side connectors */}
      <line x1="0" y1="26" x2="4" y2="26" stroke={c} strokeWidth="1.5"/>
      <line x1="64" y1="26" x2="68" y2="26" stroke={c} strokeWidth="1.5"/>
      <line x1="0" y1="33" x2="4" y2="33" stroke={c} strokeWidth="1"/>
      <line x1="64" y1="33" x2="68" y2="33" stroke={c} strokeWidth="1"/>
    </svg>
  );
}

export function CsIconRings({ c }) {
  const ticks = Array.from({ length: 16 }, (_, i) => {
    const a = ((i * 22.5) - 90) * Math.PI / 180;
    return {
      x1: 27 + 23 * Math.cos(a), y1: 27 + 23 * Math.sin(a),
      x2: 27 + 20 * Math.cos(a), y2: 27 + 20 * Math.sin(a),
    };
  });
  return (
    <svg viewBox="0 0 54 54" width="54" height="54" fill="none">
      <circle cx="27" cy="27" r="25" stroke={c} strokeWidth="1.4" opacity="0.9"/>
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={c} strokeWidth="1.4"/>
      ))}
      <circle cx="27" cy="27" r="18" stroke={c} strokeWidth="1"   opacity="0.55"/>
      <circle cx="27" cy="27" r="11" stroke={c} strokeWidth="1"   opacity="0.45"/>
      <circle cx="27" cy="27" r="7"  fill={c + "30"} stroke={c} strokeWidth="1.4"/>
      <path d="M24 23.5 L32 27 L24 30.5 Z" fill={c}/>
    </svg>
  );
}

export function CsIconLockBox({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* box */}
      <rect x="10" y="20" width="48" height="30" rx="3" stroke={c} strokeWidth="1.4" fill={c + "12"}/>
      <rect x="10" y="14" width="48" height="8"  rx="2" stroke={c} strokeWidth="1.4" fill={c + "22"}/>
      {/* padlock body */}
      <rect x="26" y="5"  width="16" height="13" rx="3" stroke={c} strokeWidth="1.4" fill={c + "18"}/>
      {/* shackle */}
      <path d="M29 5 Q29 0 34 0 Q39 0 39 5" stroke={c} strokeWidth="1.4" fill="none"/>
      {/* keyhole */}
      <circle cx="34" cy="10" r="2.2" fill={c}/>
      <rect x="33" y="10" width="2" height="4" fill={c}/>
      {/* chain left */}
      <path d="M6 24 Q3 28 6 32 Q9 36 6 40 Q3 44 6 48" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85"/>
      {/* chain right */}
      <path d="M62 24 Q65 28 62 32 Q59 36 62 40 Q65 44 62 48" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.85"/>
      {/* rivets */}
      <circle cx="16" cy="21" r="1.5" fill={c} opacity="0.7"/>
      <circle cx="52" cy="21" r="1.5" fill={c} opacity="0.7"/>
    </svg>
  );
}

export function CsIconHexGrid({ c }) {
  const hex = (cx, cy, r) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 - 30) * Math.PI / 180;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    });
    return `M${pts.join("L")}Z`;
  };
  const pos = [
    [16,14],[34,14],[52,14],
    [16,38],[34,38],[52,38],
  ];
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {pos.map(([cx, cy], i) => (
        <g key={i}>
          <path d={hex(cx, cy, 12)} stroke={c} strokeWidth="1.2" fill={c + "10"}/>
          {/* tiny lock */}
          <rect x={cx-3.5} y={cy-0.5} width="7" height="5.5" rx="1" stroke={c} strokeWidth="0.9"/>
          <path d={`M${cx-2} ${cy-0.5} Q${cx-2} ${cy-3.8} ${cx} ${cy-3.8} Q${cx+2} ${cy-3.8} ${cx+2} ${cy-0.5}`}
            stroke={c} strokeWidth="0.9" fill="none"/>
        </g>
      ))}
    </svg>
  );
}

export function CsIconIsoCube({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* top face */}
      <path d="M34 4 L58 18 L34 32 L10 18 Z" stroke={c} strokeWidth="1.4" fill={c + "28"}/>
      {/* left face */}
      <path d="M10 18 L10 40 L34 50 L34 32 Z" stroke={c} strokeWidth="1.4" fill={c + "10"}/>
      {/* right face */}
      <path d="M58 18 L58 40 L34 50 L34 32 Z" stroke={c} strokeWidth="1.4" fill={c + "1A"}/>
      {/* checkmark on top */}
      <path d="M24 17 L31 25 L46 10" stroke={c} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function CsIconHoneycomb({ c }) {
  const hex = (cx, cy, r) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = i * 60 * Math.PI / 180;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    });
    return `M${pts.join("L")}Z`;
  };
  const r = 9, cols = 4, rows = 3;
  const pos = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++)
      pos.push([col * r * 1.5 + 12, row * r * 1.732 + (col % 2 === 0 ? 10 : 18)]);
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none" style={{ overflow: "hidden" }}>
      {pos.map(([cx, cy], i) => (
        <path key={i} d={hex(cx, cy, r)} stroke={c} strokeWidth="1" fill={c + "14"}/>
      ))}
    </svg>
  );
}

export function CsIconSiren({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* spinning rays group */}
      <g className="csSirenRays">
        <line x1="34" y1="6"  x2="34" y2="0"  stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <line x1="48" y1="10" x2="54" y2="4"  stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <line x1="20" y1="10" x2="14" y2="4"  stroke={c} strokeWidth="2"   strokeLinecap="round"/>
        <line x1="56" y1="24" x2="63" y2="20" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="12" y1="24" x2="5"  y2="20" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="58" y1="36" x2="65" y2="36" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="10" y1="36" x2="3"  y2="36" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
      </g>
      {/* dome */}
      <path d="M14 44 Q14 18 34 18 Q54 18 54 44" stroke={c} strokeWidth="1.4" fill={c + "14"}/>
      {/* inner light */}
      <ellipse cx="34" cy="36" rx="11" ry="9" fill={c + "35"} stroke={c} strokeWidth="1"/>
      <ellipse cx="34" cy="36" rx="5"  ry="4" fill={c} opacity="0.85"/>
      {/* base */}
      <rect x="20" y="43" width="28" height="6" rx="2" stroke={c} strokeWidth="1.4" fill={c + "20"}/>
      <rect x="16" y="48" width="36" height="4" rx="1" fill={c + "30"} stroke={c} strokeWidth="1"/>
    </svg>
  );
}

export function CsIconWaveform({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* grid */}
      {[10,22,33,44].map(y => (
        <line key={y} x1="0" y1={y} x2="68" y2={y} stroke={c} strokeWidth="0.35" opacity="0.25"/>
      ))}
      {[0,17,34,51,68].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="54" stroke={c} strokeWidth="0.35" opacity="0.25"/>
      ))}
      {/* erratic waveform */}
      <polyline
        points="0,27 5,25 10,10 15,30 20,34 26,12 31,38 36,18 41,40 46,8 52,32 57,20 62,36 68,25"
        stroke={c} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {/* data points */}
      {[[10,10],[26,12],[41,40],[46,8]].map(([x,y], i) => (
        <circle key={i} cx={x} cy={y} r="2.2" fill={c}/>
      ))}
    </svg>
  );
}

export function CsIconUpArrow({ c }) {
  return (
    <svg viewBox="0 0 44 54" width="44" height="54" fill="none">
      {/* shaft */}
      <rect x="17" y="24" width="10" height="26" rx="2" fill={c + "2A"} stroke={c} strokeWidth="1.4"/>
      {/* head */}
      <path d="M5 26 L22 4 L39 26 Z" fill={c + "50"} stroke={c} strokeWidth="1.4"/>
      {/* tip glow dot */}
      <circle cx="22" cy="7"  r="2.2" fill={c} opacity="0.8"/>
      <circle cx="13" cy="20" r="1.5" fill={c} opacity="0.35"/>
      <circle cx="31" cy="20" r="1.5" fill={c} opacity="0.35"/>
    </svg>
  );
}

export function CsIconWaveCurve({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      <g className="csWaveGroup">
        {/* fill */}
        <path d="M0 38 Q10 20 20 30 Q30 40 40 20 Q50 0 60 14 L68 10 L68 54 L0 54 Z"
          fill={c + "12"}/>
        {/* line */}
        <path d="M0 38 Q10 20 20 30 Q30 40 40 20 Q50 0 60 14 L68 10"
          stroke={c} strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* dots */}
        <circle cx="20" cy="30" r="2"   fill={c} opacity="0.65"/>
        <circle cx="40" cy="20" r="2"   fill={c} opacity="0.65"/>
        <circle cx="60" cy="14" r="2"   fill={c} opacity="0.65"/>
        {/* glowing star at end */}
        <circle cx="67" cy="10" r="3.5" fill={c} opacity="0.90"/>
        <circle cx="67" cy="10" r="6"   fill={c} opacity="0.20"/>
        <line x1="67" y1="5"  x2="67" y2="1"  stroke={c} strokeWidth="1.2" opacity="0.6"/>
        <line x1="72" y1="10" x2="76" y2="10" stroke={c} strokeWidth="1.2" opacity="0.6"/>
        <line x1="62" y1="10" x2="58" y2="10" stroke={c} strokeWidth="1.2" opacity="0.6"/>
        <line x1="71" y1="6"  x2="74" y2="3"  stroke={c} strokeWidth="1"   opacity="0.5"/>
        <line x1="63" y1="6"  x2="60" y2="3"  stroke={c} strokeWidth="1"   opacity="0.5"/>
      </g>
    </svg>
  );
}

export function CsIconGem({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* top crown */}
      <path d="M22 18 L34 4 L46 18" stroke={c} strokeWidth="1.4" fill={c + "15"}/>
      {/* middle band */}
      <path d="M10 18 L22 18 L34 4 L46 18 L58 18 L34 50 Z" stroke={c} strokeWidth="1.4" fill={c + "20"}/>
      {/* facet lines */}
      <line x1="22" y1="18" x2="34" y2="50" stroke={c} strokeWidth="0.8" opacity="0.5"/>
      <line x1="46" y1="18" x2="34" y2="50" stroke={c} strokeWidth="0.8" opacity="0.5"/>
      <line x1="10" y1="18" x2="34" y2="28" stroke={c} strokeWidth="0.6" opacity="0.4"/>
      <line x1="58" y1="18" x2="34" y2="28" stroke={c} strokeWidth="0.6" opacity="0.4"/>
      <line x1="34" y1="4"  x2="34" y2="50" stroke={c} strokeWidth="0.6" opacity="0.35"/>
      {/* glow highlight on top */}
      <path d="M28 12 L34 4 L40 12 L34 16 Z" fill={c} opacity="0.40"/>
    </svg>
  );
}

export function CsIconCircuit({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* horizontal rails */}
      <line x1="0"  y1="14" x2="68" y2="14" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      <line x1="0"  y1="27" x2="68" y2="27" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      <line x1="0"  y1="40" x2="68" y2="40" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      {/* vertical rails */}
      <line x1="12" y1="0"  x2="12" y2="54" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      <line x1="34" y1="0"  x2="34" y2="54" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      <line x1="56" y1="0"  x2="56" y2="54" stroke={c} strokeWidth="0.8" opacity="0.35"/>
      {/* nodes at intersections */}
      {[[12,14],[34,14],[56,14],[12,27],[34,27],[56,27],[12,40],[34,40],[56,40]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="3" stroke={c} strokeWidth="1.2" fill={c + "20"}/>
      ))}
      {/* highlighted nodes */}
      <circle cx="34" cy="27" r="4.5" stroke={c} strokeWidth="1.4" fill={c + "40"}/>
      <circle cx="12" cy="14" r="3.5" fill={c} opacity="0.7"/>
      <circle cx="56" cy="40" r="3.5" fill={c} opacity="0.6"/>
      {/* connection traces */}
      <path d="M12 14 L34 14 L34 27" stroke={c} strokeWidth="1.4" fill="none"/>
      <path d="M56 40 L34 40 L34 27" stroke={c} strokeWidth="1.4" fill="none"/>
    </svg>
  );
}

export function CsIconCanister({ c }) {
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* body */}
      <rect x="20" y="10" width="28" height="36" rx="4" stroke={c} strokeWidth="1.4" fill={c + "12"}/>
      {/* top cap */}
      <rect x="24" y="5"  width="20" height="8"  rx="2" stroke={c} strokeWidth="1.4" fill={c + "22"}/>
      {/* bands */}
      <line x1="20" y1="22" x2="48" y2="22" stroke={c} strokeWidth="1.2" opacity="0.6"/>
      <line x1="20" y1="34" x2="48" y2="34" stroke={c} strokeWidth="1.2" opacity="0.6"/>
      {/* warning stripes */}
      <path d="M22 22 L26 34" stroke={c} strokeWidth="1.4" opacity="0.5" strokeLinecap="round"/>
      <path d="M30 22 L34 34" stroke={c} strokeWidth="1.4" opacity="0.5" strokeLinecap="round"/>
      <path d="M38 22 L42 34" stroke={c} strokeWidth="1.4" opacity="0.5" strokeLinecap="round"/>
      {/* bottom base */}
      <rect x="18" y="44" width="32" height="6" rx="2" stroke={c} strokeWidth="1.2" fill={c + "18"}/>
      {/* warning ! */}
      <line x1="34" y1="14" x2="34" y2="19" stroke={c} strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="34" cy="22" r="1.2" fill={c}/>
    </svg>
  );
}

export function CsIconMedallion({ c }) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * 30 - 90) * Math.PI / 180;
    const r1 = 22, r2 = i % 3 === 0 ? 18 : 20;
    return {
      x1: 34 + r1 * Math.cos(a), y1: 28 + r1 * Math.sin(a),
      x2: 34 + r2 * Math.cos(a), y2: 28 + r2 * Math.sin(a),
    };
  });
  return (
    <svg viewBox="0 0 68 54" width="68" height="54" fill="none">
      {/* outer ring */}
      <circle cx="34" cy="28" r="23" stroke={c} strokeWidth="1.4" fill="none"/>
      {/* tick marks */}
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={c} strokeWidth="1.2"/>
      ))}
      {/* crosshair lines */}
      <line x1="34" y1="6"  x2="34" y2="50" stroke={c} strokeWidth="0.8" opacity="0.4"/>
      <line x1="12" y1="28" x2="56" y2="28" stroke={c} strokeWidth="0.8" opacity="0.4"/>
      {/* mid ring */}
      <circle cx="34" cy="28" r="14" stroke={c} strokeWidth="1"   fill={c + "10"}/>
      {/* inner filled circle */}
      <circle cx="34" cy="28" r="7"  fill={c + "35"} stroke={c} strokeWidth="1.4"/>
      {/* center dot */}
      <circle cx="34" cy="28" r="2.5" fill={c}/>
    </svg>
  );
}
