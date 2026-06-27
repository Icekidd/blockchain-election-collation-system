import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportResultsPDF(candidates, totals, constituencies, stationCount, electionStatus) {
  const doc = new jsPDF();
  const grandTotal = totals.reduce((s, v) => s + Number(v), 0);

  // Header
  doc.setFillColor(0, 107, 63);
  doc.rect(0, 0, 210, 35, "F");

  doc.setTextColor(252, 209, 22);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ELECTORAL COMMISSION OF GHANA", 105, 12, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text("2024 Presidential Election — Collation Results", 105, 20, { align: "center" });

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()} | Status: ${electionStatus}`, 105, 28, { align: "center" });

  // Ghana flag stripe
  doc.setFillColor(206, 17, 38);
  doc.rect(0, 35, 70, 3, "F");
  doc.setFillColor(252, 209, 22);
  doc.rect(70, 35, 70, 3, "F");
  doc.setFillColor(0, 107, 63);
  doc.rect(140, 35, 70, 3, "F");

  // Summary stats
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Stations Reported: ${stationCount}`, 14, 48);
  doc.text(`Total Constituencies: ${constituencies.length}`, 14, 55);
  doc.text(`Total Votes Counted: ${grandTotal.toLocaleString()}`, 14, 62);
  doc.text(`Locked Constituencies: ${constituencies.filter(c => c.locked).length}`, 110, 48);

  // Presidential standings table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 107, 63);
  doc.text("Presidential Standings", 14, 75);

  const standingsData = candidates
    .map((c, i) => ({
      name:  c.name,
      party: c.party,
      votes: Number(totals[i] || 0),
      pct:   grandTotal > 0 ? ((Number(totals[i] || 0) / grandTotal) * 100).toFixed(2) + "%" : "0%",
    }))
    .sort((a, b) => b.votes - a.votes);

  autoTable(doc, {
    startY: 80,
    head: [["#", "Candidate", "Party", "Votes", "Percentage"]],
    body: standingsData.map((r, i) => [
      i + 1,
      r.name,
      r.party,
      r.votes.toLocaleString(),
      r.pct,
    ]),
    headStyles: { fillColor: [0, 107, 63], textColor: [255, 255, 255], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 248, 244] },
    columnStyles: { 0: { cellWidth: 10 }, 3: { halign: "right" }, 4: { halign: "right" } },
  });

  // Constituency breakdown
  if (constituencies.length > 0) {
    doc.addPage();

    doc.setFillColor(0, 107, 63);
    doc.rect(0, 0, 210, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Constituency Breakdown", 105, 10, { align: "center" });

    autoTable(doc, {
      startY: 20,
      head: [["Constituency", "District", "Region", "Stations", "Status"]],
      body: constituencies.map(c => [
        c.name,
        c.district || "-",
        c.region || "-",
        c.reported || 0,
        c.locked ? "Locked" : "In Progress",
      ]),
      headStyles: { fillColor: [0, 107, 63], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 248, 244] },
      bodyStyles: { fontSize: 8 },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `EC Ghana Blockchain Collation System | Contract: 0xe3299C6E42AcB56104E1b5D4354b56d518cc66Cd | Page ${i} of ${pageCount}`,
      105, 290, { align: "center" }
    );
  }

  doc.save(`EC-Ghana-Results-${new Date().toISOString().split("T")[0]}.pdf`);
}