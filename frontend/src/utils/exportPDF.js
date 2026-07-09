import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GH_GREEN = [0, 107, 63];
const GH_GOLD  = [252, 209, 22];
const GH_RED   = [206, 17, 38];

export function exportResultsPDF(candidates, totals, constituencies, stationCount, electionStatus) {
  // ── Page 1: Portrait — national summary ──────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait" });
  const grandTotal = totals.reduce((s, v) => s + Number(v), 0);
  const today = new Date().toLocaleString("en-GH");

  doc.setFillColor(...GH_GREEN);
  doc.rect(0, 0, 210, 38, "F");

  doc.setTextColor(...GH_GOLD);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("ELECTORAL COMMISSION OF GHANA", 105, 11, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("2024 Presidential Election — Collation Results", 105, 20, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${today}   |   Status: ${electionStatus}   |   Blockchain Verified`, 105, 28, { align: "center" });
  doc.text(`Contract: 0x94e6E38cf797651519eff81d4507c6CA1d7A047B · Polygon Amoy`, 105, 34, { align: "center" });

  doc.setFillColor(...GH_RED);
  doc.rect(0, 38, 70, 3, "F");
  doc.setFillColor(...GH_GOLD);
  doc.rect(70, 38, 70, 3, "F");
  doc.setFillColor(...GH_GREEN);
  doc.rect(140, 38, 70, 3, "F");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const lockedCount = constituencies.filter(c => c.locked).length;
  const stats = [
    ["Total Stations Reported", stationCount],
    ["Total Constituencies",    constituencies.length],
    ["Locked Constituencies",   lockedCount],
    ["Total Votes Counted",     grandTotal.toLocaleString()],
  ];
  stats.forEach(([label, value], i) => {
    const x = i < 2 ? 14 : 110;
    const y = 50 + (i % 2) * 7;
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", x, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), x + 55, y);
  });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GH_GREEN);
  doc.text("Presidential Standings", 14, 72);

  const standingsData = candidates
    .map((c, i) => ({
      name:  c.name,
      party: c.party,
      votes: Number(totals[i] || 0),
      pct:   grandTotal > 0 ? ((Number(totals[i] || 0) / grandTotal) * 100).toFixed(2) + "%" : "0.00%",
    }))
    .sort((a, b) => b.votes - a.votes);

  autoTable(doc, {
    startY: 76,
    head: [["Rank", "Candidate", "Party", "Votes", "Percentage"]],
    body: standingsData.map((r, i) => [i === 0 ? "1st ★" : i + 1, r.name, r.party, r.votes.toLocaleString(), r.pct]),
    headStyles: { fillColor: GH_GREEN, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 248, 244] },
    columnStyles: { 0: { cellWidth: 18, halign: "center" }, 3: { halign: "right" }, 4: { halign: "right" } },
  });

  // ── Following pages: Landscape — constituency breakdown, grouped by region ──
  if (constituencies.length > 0) {
    // Group constituencies by region, preserving a stable region order
    const byRegion = new Map();
    for (const c of constituencies) {
      const region = c.region || "Unspecified Region";
      if (!byRegion.has(region)) byRegion.set(region, []);
      byRegion.get(region).push(c);
    }
    const regionNames = Array.from(byRegion.keys()).sort();

    doc.addPage("a4", "landscape");
    doc.setFillColor(...GH_GREEN);
    doc.rect(0, 0, 297, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Constituency Breakdown by Region", 148.5, 9, { align: "center" });

    // Table head: Constituency, District, one column per candidate, Total, Stations, Status
    const head = [
      "Constituency", "District",
      ...candidates.map(c => c.party || c.name),
      "Total Votes", "Stations", "Status",
    ];

    let cursorY = 20;

    for (const region of regionNames) {
      const rows = byRegion.get(region);

      // Region subheader band
      doc.setFillColor(...GH_GOLD);
      doc.rect(10, cursorY, 277, 6, "F");
      doc.setTextColor(30, 30, 20);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(region.toUpperCase(), 13, cursorY + 4.3);
      cursorY += 9;

      const body = rows.map(c => {
        const votesArr = c.totals || [];
        return [
          c.name,
          c.district || "-",
          ...candidates.map((_, i) => Number(votesArr[i] || 0).toLocaleString()),
          Number(c.grandTotal || 0).toLocaleString(),
          c.reported || 0,
          c.locked ? "Locked" : "In Progress",
        ];
      });

      autoTable(doc, {
        startY: cursorY,
        margin: { left: 10, right: 10 },
        head: [head],
        body,
        headStyles: { fillColor: [26, 61, 40], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 7 },
        bodyStyles: { fontSize: 7 },
        alternateRowStyles: { fillColor: [240, 248, 244] },
        columnStyles: {
          0: { cellWidth: 34 },
          1: { cellWidth: 30 },
          [head.length - 3]: { halign: "right", cellWidth: 22 },
          [head.length - 2]: { halign: "center", cellWidth: 16 },
          [head.length - 1]: { halign: "center", cellWidth: 20 },
        },
        didDrawPage: () => { cursorY = 20; },
      });

      cursorY = doc.lastAutoTable.finalY + 6;

      // Start a fresh page if the next region wouldn't fit
      if (cursorY > 180 && region !== regionNames[regionNames.length - 1]) {
        doc.addPage("a4", "landscape");
        doc.setFillColor(...GH_GREEN);
        doc.rect(0, 0, 297, 14, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("Constituency Breakdown by Region (continued)", 148.5, 9, { align: "center" });
        cursorY = 20;
      }
    }
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(
      `EC Ghana Blockchain Collation System   |   Page ${i} of ${pageCount}   |   ${today}`,
      pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: "center" }
    );
  }

  doc.save(`EC-Ghana-Results-${new Date().toISOString().split("T")[0]}.pdf`);
}