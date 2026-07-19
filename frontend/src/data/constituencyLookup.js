import { GHANA_STATIONS } from "./ghana_stations.js";

// GHANA_STATIONS keys are ALL-CAPS (e.g. "WESTERN NORTH"); GhanaMap's tile
// list uses Title Case (e.g. "Western North"). This map bridges the two so
// region names line up exactly with GhanaMap's REGION_TILES, and reads
// nicer in the PDF report too.
const REGION_DISPLAY = {
  "WESTERN": "Western", "CENTRAL": "Central", "GREATER ACCRA": "Greater Accra",
  "VOLTA": "Volta", "EASTERN": "Eastern", "ASHANTI": "Ashanti",
  "WESTERN NORTH": "Western North", "AHAFO": "Ahafo", "BONO": "Bono",
  "BONO EAST": "Bono East", "OTI": "Oti", "NORTHERN": "Northern",
  "SAVANNAH": "Savannah", "UPPER WEST": "Upper West",
  "NORTH EAST": "North East", "UPPER EAST": "Upper East",
};

export const TOTAL_CONSTITUENCIES = 276; // real EC 2024 count, verified from source extraction

// Flat map: constituency name -> { district, region } (region in Title Case).
// Built once from the real EC seed data — every constituency maps to exactly
// one district (verified against the full 40,648-row source).
export const CONSTITUENCY_INFO = (() => {
  const map = {};
  for (const region of Object.keys(GHANA_STATIONS)) {
    const displayRegion = REGION_DISPLAY[region] || region;
    for (const constituency of Object.keys(GHANA_STATIONS[region])) {
      const stations = GHANA_STATIONS[region][constituency];
      map[constituency] = {
        district: stations[0]?.district || "",
        region: displayRegion,
      };
    }
  }
  return map;
})();

export function getConstituencyInfo(name) {
  return CONSTITUENCY_INFO[name] || { district: "", region: "" };
}