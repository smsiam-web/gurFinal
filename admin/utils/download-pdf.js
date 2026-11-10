// utils/download-pdf.js
import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Download a PDF summary:
 *  - Section 1: "Overall (Date-wise)"
 *  - Section 2: "Date + Source"
 *
 * overallRows: [{date, item_key, title, product_id, qty, unit}]
 * sourceRows:  [{date, source, item_key, title, product_id, qty, unit}]
 */
export const downloadSummaryPdf = ({
  overallRows = [],
  sourceRows = [],
  fileName = `order-summary-${new Date().toISOString().slice(0,10)}.pdf`,
} = {}) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 36; // 0.5in
  let y = margin;

  const addTitle = (text) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(text, margin, y);
    y += 14;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
  };

  const addSpacer = (h = 10) => (y += h);

  // --- SECTION 1: Overall (Date-wise) ---
  addTitle("Overall (Date-wise)");
  addSpacer(6);

  // group overallRows by date
  const overallByDate = overallRows.reduce((acc, r) => {
    (acc[r.date] ||= []).push(r);
    return acc;
  }, {});

  const dates = Object.keys(overallByDate).sort(); // oldest->newest

  for (const date of dates) {
    const rows = overallByDate[date];

    // section subtitle with totals & avg
    const totalKg = rows.reduce((a, r) => a + Number(r.qty || 0), 0);
    const orderCount = new Set(rows.map(r => r.order_id || `${r.date}-${r.item_key}`)).size; // fallback
    const avgKg = orderCount ? totalKg / orderCount : 0;

    doc.setFont("helvetica", "bold");
    doc.text(`${date}  —  Total: ${totalKg.toFixed(1)} kg  •  Per Order: ${avgKg.toFixed(1)} kg`, margin, y);
    doc.setFont("helvetica", "normal");
    addSpacer(6);

    doc.autoTable({
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, overflow: "linebreak" },
      headStyles: { fillColor: [240, 240, 240] },
      head: [[ "Item", "Product ID", "Qty", "Unit" ]],
      body: rows.map(r => [
        r.title || r.item_key,
        r.product_id || "",
        Number(r.qty || 0),
        r.unit || "",
      ]),
      didDrawPage: (data) => {
        y = data.cursor.y + 12;
      },
    });

    // page break if needed
    if (y > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      y = margin;
    }
  }

  // --- SECTION 2: Date + Source ---
  if (sourceRows.length) {
    if (y > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      y = margin;
    } else {
      addSpacer(6);
    }
    addTitle("Date + Source");
    addSpacer(6);

    // group by date -> source
    const byDate = sourceRows.reduce((acc, r) => {
      (acc[r.date] ||= []).push(r);
      return acc;
    }, {});
    const dkeys = Object.keys(byDate).sort();

    for (const date of dkeys) {
      const subset = byDate[date];
      const bySrc = subset.reduce((acc, r) => {
        (acc[r.source] ||= []).push(r);
        return acc;
      }, {});

      doc.setFont("helvetica", "bold");
      doc.text(date, margin, y);
      doc.setFont("helvetica", "normal");
      addSpacer(6);

      for (const src of Object.keys(bySrc)) {
        const rows = bySrc[src];
        const totalKg = rows.reduce((a, r) => a + Number(r.qty || 0), 0);

        doc.text(`${src} — Total: ${totalKg.toFixed(1)} kg`, margin, y);
        addSpacer(6);

        doc.autoTable({
          startY: y,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9 },
          headStyles: { fillColor: [240, 240, 240] },
          head: [[ "Item", "Qty", "Unit" ]],
          body: rows.map(r => [
            r.title || r.item_key,
            Number(r.qty || 0),
            r.unit || "",
          ]),
          didDrawPage: (data) => {
            y = data.cursor.y + 12;
          },
        });

        if (y > doc.internal.pageSize.getHeight() - 120) {
          doc.addPage();
          y = margin;
        }
      }
    }
  }

  doc.save(fileName);
};
