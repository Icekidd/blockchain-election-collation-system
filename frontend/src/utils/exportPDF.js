import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportResultsPDF(candidates, totals, constituencies, stationCount, electionStatus) {
  const doc = new jsPDF();
  const grandTotal = totals.reduce((s, v) => s + Number(v), 0);
  const today = new Date().toLocaleString("en-GH");

  // ── Header background ──────────────────────────────────────────────────────
  doc.setFillColor(0, 107, 63);
  doc.rect(0, 0, 210, 38, "F");

  // EC Ghana title
  doc.setTextColor(252, 209, 22);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("ELECTORAL COMMISSION OF GHANA", 105, 11, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("2024 Presidential Election — Collation Results", 105, 20, { align: "center" });

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${today}   |   Status: ${electionStatus}   |   Blockchain Verified`, 105, 28, { align: "center" });
  doc.text(`Contract: 0xe3299C6E42AcB56104E1b5D4354b56d518cc66Cd · Polygon Amoy`, 105, 34, { align: "center" });

  // ── Ghana flag stripe ──────────────────────────────────────────────────────
  doc.setFillColor(206, 17, 38);
  doc.rect(0, 38, 70, 3, "F");
  doc.setFillColor(252, 209, 22);
  doc.rect(70, 38, 70, 3, "F");
  doc.setFillColor(0, 107, 63);
  doc.rect(140, 38, 70, 3, "F");

  // ── Summary stats ──────────────────────────────────────────────────────────
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const stats = [
    ["Total Stations Reported", stationCount],
    ["Total Constituencies",    constituencies.length],
    ["Locked Constituencies",   constituencies.filter(c => c.locked).length],
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

  // ── Presidential standings ─────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 107, 63);
  doc.text("Presidential Standings", 14, 72);

  const standingsData = candidates
    .map((c, i) => ({
      name:  c.name,
      party: c.party,
      votes: Number(totals[i] || 0),
      pct:   grandTotal > 0
        ? ((Number(totals[i] || 0) / grandTotal) * 100).toFixed(2) + "%"
        : "0.00%",
    }))
    .sort((a, b) => b.votes - a.votes);

  autoTable(doc, {
    startY: 76,
    head: [["Rank", "Candidate", "Party", "Votes", "Percentage"]],
    body: standingsData.map((r, i) => [
      i === 0 ? "1st ★" : i + 1,
      r.name,
      r.party,
      r.votes.toLocaleString(),
      r.pct,
    ]),
    headStyles: {
      fillColor:  [0, 107, 63],
      textColor:  [255, 255, 255],
      fontStyle:  "bold",
      fontSize:   9,
    },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 248, 244] },
    columnStyles: {
      0: { cellWidth: 18, halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
  });

  // ── Constituency breakdown ─────────────────────────────────────────────────
  if (constituencies.length > 0) {
    doc.addPage();

    // Page 2 header
    doc.setFillColor(0, 107, 63);
    doc.rect(0, 0, 210, 16, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Constituency Breakdown", 105, 11, { align: "center" });

    autoTable(doc, {
      startY: 20,
      head: [["Constituency", "District", "Region", "Stations", "Total Votes", "Status"]],
      body: constituencies.map(c => [
        c.name,
        c.district || "-",
        c.region   || "-",
        c.reported || 0,
        Number(c.total || 0).toLocaleString(),
        c.locked ? "Locked" : "In Progress",
      ]),
      headStyles: {
        fillColor: [0, 107, 63],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize:  8,
      },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 248, 244] },
      columnStyles: {
        4: { halign: "right" },
        5: { halign: "center" },
      },
    });
  }

  // ── Footer on every page ───────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(
      `EC Ghana Blockchain Collation System   |   Page ${i} of ${pageCount}   |   ${today}`,
      105, 290, { align: "center" }
    );
  }

  // Save
  const filename = `EC-Ghana-Results-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
}