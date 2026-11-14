import { TodayDate } from "@/admin/utils/helpers";
import jsPDF from "jspdf";

/**
 * Summary logic (same rule as before)
 */
function getSummary(orders) {
  const COMBO_IDS = ["1107", "1108", "1109", "1110", "1111", "1112", "1113", "50004"];
  const SPECIAL_ID = "2001";
  const summary = {};

  orders.forEach((order) => {
    const items = order.items || [];
    let label = "Others";

    // 🔹 Special case: if any item has product_id === 2001
    const has2001 = items.some(
      (item) => String(item.product_id) === SPECIAL_ID
    );

    if (has2001) {
      label = "Ghee";
    }
    // 🔹 Existing combo logic
    else if (
      items.length === 1 &&
      COMBO_IDS.includes(String(items[0].product_id))
    ) {
      label =
        items[0].quantity > 1
          ? "Double Combo"
          : items[0].title;
    }

    summary[label] = (summary[label] || 0) + 1;
  });

  return summary;
}


/**
 * Thermal printer friendly PDF
 */
export default function generateThermalSummary(orders) {
  // 🔥 80mm thermal size (change to 58 if needed)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [75, 100],
  });
    const DEFAULT_FILENAME = TodayDate();

  let y = 10;

  // 🔹 Header
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("ORDER SUMMARY", 40, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("--------------------------------", 5, y);
  y += 6;

  // 🔹 Body (plain text)
  const summary = getSummary(orders);
  let total = 0;

  Object.entries(summary).forEach(([name, qty]) => {
    doc.setFontSize(11);
    doc.text(name, 5, y);
    doc.text(String(qty), 75, y, { align: "right" });
    y += 6;
    total += qty;
  });

  y += 4;
  doc.text("--------------------------------", 5, y);
  y += 6;

  // 🔹 Footer
  doc.setFont(undefined, "bold");
  doc.setFontSize(12);
  doc.text(`TOTAL ORDERS: ${total}`, 40, y, { align: "center" });
  y += 6;
  doc.text(`${DEFAULT_FILENAME}`, 40, y, { align: "center" });

  doc.autoPrint();
    const fileName = `Order Summery(${orders.length})_${DEFAULT_FILENAME}.pdf`;

  // Make a Blob + URL
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);

  // ✅ Preview in a new tab + try to auto-print as soon as it loads
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(`
    <html>
      <head><title>${fileName}</title></head>
      <body style="margin:0">
        <iframe id="pdf" src="${url}" style="border:0;width:100%;height:100vh;"></iframe>
        <script>
          const frame = document.getElementById('pdf');
          frame.addEventListener('load', () => {
            try {
              // Chrome সাধারণত OpenAction (autoPrint) রেস্পেক্ট করে।
              // তবু সেফটির জন্য প্রোগ্রাম্যাটিক প্রিন্টও ট্রাই করি:
              frame.contentWindow && frame.contentWindow.focus();
              frame.contentWindow && frame.contentWindow.print();
            } catch (e) {}
          });
          // ট্যাব বন্ধ হলে URL revoke
          window.addEventListener('beforeunload', () => URL.revokeObjectURL('${url}'));
        <\/script>
      </body>
    </html>
  `);
    w.document.close();
  } else {
    // popup blocked হলে fallback: শুধু ওপেন করুন
    window.open(url, "_blank");
  }
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();

}
