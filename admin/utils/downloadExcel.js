// utils/download-excel.js
import * as XLSX from "xlsx";

/**
 * Download Excel with two sheets:
 *  - "Overall" (date-wise per-item rows)
 *  - "Date+Source" (date+source per-item rows)
 * rows shape should be array of objects (flat), e.g. from your helpers.
 */
export const downloadSummaryExcel = ({
  overallRows = [],
  sourceRows = [],
  fileName = `order-summary-${new Date().toISOString().slice(0,10)}.xlsx`,
} = {}) => {
  const wb = XLSX.utils.book_new();

  // Ensure some friendly column order
  const overall = overallRows.map(r => ({
    Date: r.date,
    "Item Key": r.item_key,
    "Item Title": r.title,
    "Product ID": r.product_id,
    Qty: Number(r.qty || 0),
    Unit: r.unit || "",
  }));
  const wsOverall = XLSX.utils.json_to_sheet(overall);
  XLSX.utils.book_append_sheet(wb, wsOverall, "Overall");

  const bySource = sourceRows.map(r => ({
    Date: r.date,
    Source: r.source,
    "Item Key": r.item_key,
    "Item Title": r.title,
    "Product ID": r.product_id,
    Qty: Number(r.qty || 0),
    Unit: r.unit || "",
  }));
  const wsSource = XLSX.utils.json_to_sheet(bySource);
  XLSX.utils.book_append_sheet(wb, wsSource, "Date+Source");

  // Auto width
  [wsOverall, wsSource].forEach(ws => {
    const cols = Object.keys((overall[0] || bySource[0] || { A: "" })).map(() => ({ wch: 14 }));
    ws["!cols"] = cols;
  });

  XLSX.writeFile(wb, fileName);
};
