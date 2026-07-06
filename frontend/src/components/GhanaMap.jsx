import React from "react";

// Tile positions approximating Ghana's geography (x, y in grid units)
const REGION_TILES = [
  { region: "Upper West",    x: 0.4, y: 0,   w: 1.3 },
  { region: "Upper East",    x: 2.1, y: 0,   w: 1.3 },
  { region: "North East",    x: 2.4, y: 1.1, w: 1.2 },
  { region: "Savannah",      x: 0.3, y: 1.3, w: 1.6 },
  { region: "Northern",      x: 2.0, y: 2.2, w: 1.6 },
  { region: "Bono",          x: 0.2, y: 3.1, w: 1.2 },
  { region: "Bono East",     x: 1.5, y: 3.3, w: 1.3 },
  { region: "Oti",           x: 3.0, y: 3.3, w: 1.0 },
  { region: "Ahafo",         x: 0.5, y: 4.2, w: 1.0 },
  { region: "Ashanti",       x: 1.6, y: 4.4, w: 1.4 },
  { region: "Volta",         x: 3.2, y: 4.4, w: 1.0 },
  { region: "Western North", x: 0.2, y: 5.3, w: 1.2 },
  { region: "Eastern",       x: 2.3, y: 5.4, w: 1.3 },
  { region: "Western",       x: 0.5, y: 6.4, w: 1.2 },
  { region: "Central",       x: 1.8, y: 6.5, w: 1.2 },
  { region: "Greater Accra", x: 3.1, y: 6.3, w: 1.3 },
];

const CELL = 84;       // grid unit size
const TILE_H = 66;     // tile height

export default function GhanaMap({ constituencies, selectedRegion, onSelectRegion }) {

  function regionStats(region) {
    const list = constituencies.filter(c => c.region === region);
    const locked    = list.filter(c => c.locked).length;
    const active    = list.filter(c => !c.locked && c.reported > 0).length;
    const total     = list.length;
    return { total, locked, active };
  }

  function tileColor(region) {
    const { total, locked, active } = regionStats(region);
    if (total === 0)            return { fill: "rgba(28,61,40,0.35)",  stroke: "var(--border)",           text: "var(--text2)" };  // no data
    if (locked === total)       return { fill: "rgba(0,146,79,0.35)",  stroke: "var(--accent2)",          text: "var(--bright)" }; // fully locked
    if (locked > 0 || active>0) return { fill: "rgba(252,209,22,0.18)",stroke: "rgba(252,209,22,0.5)",    text: "var(--bright)" }; // in progress
    return { fill: "rgba(206,17,38,0.12)", stroke: "rgba(206,17,38,0.35)", text: "var(--text)" };                                  // pending
  }

  const maxX = Math.max(...REGION_TILES.map(t => t.x + t.w));
  const maxY = Math.max(...REGION_TILES.map(t => t.y)) + 1;

  return (
    <div className="panel" style={{ marginBottom: "16px" }}>
      <div className="panel-title">
        <div className="dot" style={{ background: "var(--red)" }} />
        Ghana Collation Map — 16 Regions
        {selectedRegion && (
          <button
            onClick={() => onSelectRegion(null)}
            style={{
              marginLeft: "auto", background: "none", border: "1px solid var(--border2)",
              color: "var(--text2)", borderRadius: "20px", padding: "3px 12px",
              fontSize: "10px", cursor: "pointer",
            }}
          >
            Clear filter: {selectedRegion} ✕
          </button>
        )}
      </div>

      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${maxX * CELL + 20} ${maxY * CELL + 10}`}
          style={{ width: "100%", maxWidth: "560px", display: "block", margin: "0 auto" }}
        >
          {REGION_TILES.map(t => {
            const { total, locked, active } = regionStats(t.region);
            const colors = tileColor(t.region);
            const isSelected = selectedRegion === t.region;
            const x = t.x * CELL + 6;
            const y = t.y * CELL + 6;
            const w = t.w * CELL - 8;

            return (
              <g
                key={t.region}
                onClick={() => onSelectRegion(isSelected ? null : t.region)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  x={x} y={y} width={w} height={TILE_H}
                  rx={9}
                  fill={colors.fill}
                  stroke={isSelected ? "var(--gold)" : colors.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                />
                <text
                  x={x + w / 2} y={y + 24}
                  textAnchor="middle"
                  style={{
                    fill: colors.text, fontSize: "11px", fontWeight: 700,
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  {t.region.length > 12 ? t.region.replace(" ", "\u00A0").slice(0, 13) : t.region}
                </text>
                <text
                  x={x + w / 2} y={y + 42}
                  textAnchor="middle"
                  style={{
                    fill: colors.text, fontSize: "10px",
                    fontFamily: "DM Mono, monospace", opacity: 0.85,
                  }}
                >
                  {total > 0 ? `${locked}/${total} locked` : "no data"}
                </text>
                {active > 0 && (
                  <circle cx={x + w - 12} cy={y + 12} r={4} fill="var(--gold)">
                    <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
        {[
          { color: "rgba(0,146,79,0.6)",   label: "Fully locked" },
          { color: "rgba(252,209,22,0.6)", label: "Collating" },
          { color: "rgba(206,17,38,0.4)",  label: "Pending" },
          { color: "rgba(28,61,40,0.6)",   label: "No submissions" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "var(--text2)" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: "9px", color: "var(--text3)", marginTop: "8px" }}>
        Click a region to filter the constituency list below
      </div>
    </div>
  );
}