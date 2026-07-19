import React from "react";
import { GHANA_REGION_SHAPES, GHANA_MAP_VIEWBOX } from "../data/ghanaRegionShapes.js";

export default function GhanaMap({ constituencies, selectedRegion, onSelectRegion }) {

  function regionStats(region) {
    const list = constituencies.filter(c => c.region === region);
    const fullyReported = list.filter(c => c.locked).length; // "locked" field = fully reported
    const active        = list.filter(c => !c.locked && c.reported > 0).length;
    const total          = list.length;
    return { total, fullyReported, active };
  }

  function tileColor(region) {
    const { total, fullyReported, active } = regionStats(region);
    if (total === 0)                    return { fill: "rgba(28,61,40,0.55)",  stroke: "rgba(255,255,255,0.15)", text: "var(--text2)" };  // no data
    if (fullyReported === total)        return { fill: "rgba(0,146,79,0.75)",  stroke: "var(--accent2)",          text: "#ffffff" }; // fully reported
    if (fullyReported > 0 || active>0)  return { fill: "rgba(252,209,22,0.55)",stroke: "rgba(252,209,22,0.8)",    text: "#1a1a12" }; // in progress
    return { fill: "rgba(206,17,38,0.35)", stroke: "rgba(206,17,38,0.6)", text: "#ffffff" };                                        // pending
  }

  const regionKeys = Object.keys(GHANA_REGION_SHAPES);

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
          viewBox={GHANA_MAP_VIEWBOX}
          style={{ width: "100%", maxWidth: "460px", display: "block", margin: "0 auto" }}
        >
          {regionKeys.map(key => {
            const shape = GHANA_REGION_SHAPES[key];
            const { total, fullyReported, active } = regionStats(key);
            const colors = tileColor(key);
            const isSelected = selectedRegion === key;

            return (
              <g
                key={key}
                onClick={() => onSelectRegion(isSelected ? null : key)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={shape.d}
                  fill={colors.fill}
                  stroke={isSelected ? "var(--gold)" : colors.stroke}
                  strokeWidth={isSelected ? 2.5 : 1}
                  strokeLinejoin="round"
                  style={{ transition: "fill 0.4s ease, stroke 0.2s ease" }}
                />
                {active > 0 && (
                  <circle cx={shape.cx} cy={shape.cy - 10} r={3.5} fill="var(--gold)">
                    <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Labels drawn in a second pass so they sit above every region's fill/stroke */}
          {regionKeys.map(key => {
            const shape = GHANA_REGION_SHAPES[key];
            const { total, fullyReported } = regionStats(key);
            const colors = tileColor(key);
            return (
              <g key={`label-${key}`} style={{ pointerEvents: "none" }}>
                <text
                  x={shape.cx} y={shape.cy}
                  textAnchor="middle"
                  style={{ fill: colors.text, fontSize: "8.5px", fontWeight: 700, fontFamily: "DM Sans, sans-serif", paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: "2px" }}
                >
                  {shape.label}
                </text>
                {total > 0 && (
                  <text
                    x={shape.cx} y={shape.cy + 10}
                    textAnchor="middle"
                    style={{ fill: colors.text, fontSize: "7.5px", fontFamily: "DM Mono, monospace", opacity: 0.9, paintOrder: "stroke", stroke: "rgba(0,0,0,0.35)", strokeWidth: "2px" }}
                  >
                    {fullyReported}/{total}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "12px", flexWrap: "wrap" }}>
        {[
          { color: "rgba(0,146,79,0.75)",   label: "Fully reported" },
          { color: "rgba(252,209,22,0.7)",  label: "Collating" },
          { color: "rgba(206,17,38,0.5)",   label: "Pending" },
          { color: "rgba(28,61,40,0.7)",    label: "No stations registered" },
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