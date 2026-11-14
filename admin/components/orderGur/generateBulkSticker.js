import jsPDF from "jspdf";
import "../../utils/fonts/SolaimanLipi-normal";
import { TodayDate } from "@/admin/utils/helpers";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";

function generateBulkPrintStickers(invoiceArray) {
  console.log(invoiceArray);
  const doc = new jsPDF();
  const DEFAULT_FILENAME = TodayDate();
  function barcodeDataURL(value, options = {}) {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, String(value), {
      format: "CODE128",
      width: 2, // bar thickness (increase for denser bars)
      height: 60, // bar height (px)
      displayValue: false,
      margin: 0,
      ...options,
    });
    return canvas.toDataURL("image/png"); // "data:image/png;base64,...."
  }
  function formatMoney(v) {
    const n = Number(v || 0);
    return `${n.toFixed(2)}`;
  }
  const single = invoiceArray[0]?.items || [];
  const itemTitle = ((single.length === 1) &&
      (single[0].product_id === "1107" ||
      single[0].product_id === "1108" ||
      single[0].product_id === "1109" ||
      single[0].product_id === "1110" ||
      single[0].product_id === "1111" ||
      single[0].product_id === "1112" ||
      single[0].product_id === "50004" ||
      single[0].product_id === "1113")
        ? (single[0].quantity > 1 ? "Double Combo" : single[0]?.title) : (single.some(
      (item) => String(item.product_id) === "2001"
    ) ? "Ghee" : "Others" )) || "N/A"

  function addBatchPage(doc, count, title = itemTitle) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.addPage();

    // 🔹 TITLE (medium size, center)
    if (title) {
      doc.setFont(undefined, "bold");
      doc.setFontSize(46);

      const titleWidth = doc.getTextWidth(title);
      const titleX = (pageWidth - titleWidth) / 2;
      const titleY = pageHeight / 2 - 50;

      doc.text(title, titleX, titleY);
    }

    // 🔹 COUNT (big but balanced)
    doc.setFont(undefined, "bold");
    doc.setFontSize(120);

    const text = String(count);
    const textWidth = doc.getTextWidth(text);
    const textX = (pageWidth - textWidth) / 2;
    const textY = pageHeight / 2 + 30;

    doc.text(text, textX, textY);

    doc.setFont(undefined, "normal");
  }

  invoiceArray.forEach((item, index) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    // ✅ Center the barcode
    // let image = `${barCodeImageLink}`;
    const img = barcodeDataURL(item?.fulfillment?.consignment_id);
    const barcodeWidth = 150;
    const barcodeHeight = 25;
    const barcodeX = (pageWidth - barcodeWidth) / 2; // center horizontally
    doc.addImage(img, barcodeX, 26, barcodeWidth, barcodeHeight);

    const startY = 110;
    const stopY = 185;
    const rowHeight = 5; // approx per row
    const headerHeight = 5;

    const items = Array.isArray(item?.items) ? item.items : [];

    // ডেটা মেপ করুন
    const bodyRows = items.map((it, i) => {
      const opt =
        Array.isArray(it?.options) && it?.options[0]?.values
          ? it.options.map((o) => `${o.values ? o.values : ""}`).join(", ")
          : "";

      const title = opt ? `${it.title} (${opt})` : it.title;
      const qty = Number(it?.quantity || 0);
      return [i + 1, title, qty > 0 ? `${qty} ${it?.unit || ""}`.trim() : ""];
    });

    // ফিটিং রো সংখ্যা নির্ণয় করুন
    const availableHeight = stopY - startY - headerHeight;
    const maxRows = Math.max(0, Math.floor(availableHeight / rowHeight));
    let renderedBody = bodyRows.slice(0, maxRows);
    const hiddenCount = bodyRows.length - renderedBody.length;
    const title = process.env.APP_TITLE_02 || "";
    const address = process.env.SENDER_ADDRESS_02 || "";
    const hotline = process.env.SENDER_HOTLINE_02 || "";

    if (hiddenCount > 0) {
      // শেষ লাইনে “+N more” দেখান
      renderedBody[renderedBody.length - 1][1] += `  (+${hiddenCount} more…)`;
    }

    if (renderedBody.length > 0) {
      autoTable(doc, {
        startY,
        margin: { left: 15, right: 15 },
        body: renderedBody, // 5-কলামের রো: [#, Item, Qty, Price, Total]
        theme: "grid",

        // 🔥 গ্লোবাল সেল স্টাইল
        styles: {
          fontSize: 28,
          fontStyle: "normal",
          cellPadding: 1,
          textColor: [0, 0, 0], // টেক্সট কালো
          lineColor: [0, 0, 0], // সেলের বর্ডার কালো
          lineWidth: 0.2,
          fillColor: null, // কোন ব্যাকগ্রাউন্ড না
        },
        bodyStyles: {
          textColor: [0, 0, 0], // বডি টেক্সট কালো
        },

        // 🔥 টেবিলের আউটার বর্ডারও কালো/পুরু
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.2,

        columnStyles: {
          0: { cellWidth: 10, halign: "center" }, // #
          1: { cellWidth: "auto" }, // Item
          2: { cellWidth: "auto", halign: "center" }, // Qty
        },

        // (ঐচ্ছিক) একদম নিশ্চিত করতে:
        didDrawCell: (data) => {
          const d = data.doc;
          d.setTextColor(0, 0, 0);
          d.setDrawColor(0, 0, 0);
        },
      });
    } else {
      // কোন আইটেম না থাকলে ছোটো একটা নোট
      doc.setFontSize(22);
      doc.text("No items", 16, startY + 6);
    }

    doc.setFontSize(22).text(`Created by TS.Devware.`, 105, 285);
    doc.setFontSize(26);
    doc.text(`Name`, 22, 81);
    doc.text(`Phone`, 22, 91);
    doc.text(`${item?.customer?.name}`, 65, 81);
    doc.text(`${item?.customer?.phone}`, 65, 91);
    doc.text(`${index < 10 ? 0 : ""}${index + 1}`, 10, 283); // Title
    doc.text(`:`, 60, 81);
    doc.text(`:`, 60, 91);

    const centerText = (text, y, fontSize = 36) => {
      doc.setFontSize(fontSize);
      const textWidth = doc.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      doc.text(text, x, y);
    };
    centerText(
      `${item?.fulfillment?.courier}(#${item?.fulfillment?.consignment_id})`,
      61,
      30
    );
    centerText(`Hotline: +88 ${hotline}`, 259, 26);
    centerText(`Address: ${address}`, 267, 26);
    doc.setFont(undefined, "bold");
    centerText(`${title}`, 249, 36); // centered version
    centerText(`HOME DELIVERY`, 218, 44);
    centerText(`COD: ${item?.totals?.cod}/-`, 230, 40);

    doc.setFontSize(34).text("Receiver:", 15, 72);
    doc.setFontSize(34).text(`${item?.orderID}`, 120, 72);
    doc.setFontSize(34).text("Sender:", 15, 238);
    doc.setFontSize(34).text("Items:", 15, 105);

    // Top brand title (can also be centered if you prefer)
    centerText(`${title}`, 20, 55);

    centerText("Thanks for being with us.", 277, 32);
    // Add a new page unless it's the last data
    if (index < invoiceArray.length - 1) {
      doc.setFont(undefined, "normal");
      const printedCount = index + 1;
      const isLastItem = index === invoiceArray.length - 1;

      if (printedCount % 100 === 0 && !isLastItem) {
        addBatchPage(doc, 100);
      }
      doc.addPage();
    }
  });
  const remainder = invoiceArray.length % 100;

  if (remainder !== 0) {
    addBatchPage(doc, remainder);
  }
  doc.autoPrint();

  const fileName = `bulk_sticker(${invoiceArray.length})_${DEFAULT_FILENAME}.pdf`;

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

  // ⚠️ খুব তাড়াতাড়ি revoke করলে নতুন ট্যাব লোড হতে নাও পারে। একটু দেরিতে revoke করুন:
  setTimeout(() => URL.revokeObjectURL(url), 60000); // 60s পরে নিরাপদে রিভোক
}

export default generateBulkPrintStickers;
