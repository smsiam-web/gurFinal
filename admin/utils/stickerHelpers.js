export const generateStick = (item) => {
  const doc = new jsPDF();
// ✅ Get page width once
const pageWidth = doc.internal.pageSize.getWidth();

// ✅ Center the barcode
// let image = `${barCodeImageLink}`;
const img = barcodeDataURL(item?.courier?.consignment_id);
const barcodeWidth = 150;
const barcodeHeight = 30;
const barcodeX = (pageWidth - barcodeWidth) / 2; // center horizontally
doc.addImage(img, barcodeX, 30, barcodeWidth, barcodeHeight);



    // টেবিলটা 140–185 mm এর মধ্যে রাখছি যাতে নিচের HOME DELIVERY / COD না ঢেকে দেয়
  const startY = 140;
  const stopY = 185;
  const rowHeight = 5; // approx per row
  const headerHeight = 5;

  const items = Array.isArray(item?.items) ? item.items : [];
  const currency = String(item?.currency || "BDT").toUpperCase();

  // ডেটা মেপ করুন
  const bodyRows = items.map((it, i) => {
    const qty = Number(it?.quantity || 0);
    const price = Number(it?.price || 0);
    const total = Number(it?.line_total ?? qty * price);
    const title = String(it?.title || "");
    return [
      i + 1,
      title,
      qty > 0 ? `${qty} ${it?.unit || ""}`.trim() : "",
      formatMoney(price, currency),
      formatMoney(total, currency),
    ];
  });

    // ---------- items table ----------

    // অপশনগুলো থাকলে টাইটেলে যোগ করি (e.g., Color: Black, Size: M)
    const opt = Array.isArray(it?.options)
      ? it.options
          .filter((o) => o?.name && (o?.value[0].name || o?.value))
          .map((o) => `${o.name}: ${o.value[0].name || o.value}`)
          .join(", ")
      : "";
    const title = opt ? `${it.title} (${opt})` : it.title;


  // ফিটিং রো সংখ্যা নির্ণয় করুন
  const availableHeight = stopY - startY - headerHeight;
  const maxRows = Math.max(0, Math.floor(availableHeight / rowHeight));
  let renderedBody = bodyRows.slice(0, maxRows);
  const hiddenCount = bodyRows.length - renderedBody.length;

  if (hiddenCount > 0) {
    // শেষ লাইনে “+N more” দেখান
    renderedBody[renderedBody.length - 1][1] += `  (+${hiddenCount} more…)`;
  }

  if (renderedBody.length > 0) {
    autoTable(doc, {
      startY,
      margin: { left: 15, right: 15 },
      // head: [["#", "Item", "Qty", "Price", "Total"]],
      body: renderedBody,
      styles: { fontSize: 14, cellPadding: 2, lineColor: 100, lineWidth: 0.1 },
      headStyles: {
        fontStyle: "bold",
        fillColor: [240, 240, 240],
        textColor: 100,
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" }, // #
        1: { cellWidth: "auto" },               // Item (flex)
        2: { cellWidth: 26, halign: "center" }, // Qty
        3: { cellWidth: 26, halign: "right" },  // Price
        4: { cellWidth: 30, halign: "right" },  // Total
      },
      theme: "grid",
      pageBreak: "avoid", // single label page only
      didDrawPage: (d) => {
        // Optional: draw a light separator above/below table if needed
      },
    });
  } else {
    // কোন আইটেম না থাকলে ছোটো একটা নোট
    doc.setFontSize(14);
    doc.text("No items", 16, startY + 6);
  }


  doc.setFontSize(22).text(`Created by SM.Devware.`, 105, 285);
  doc.setFontSize(28);
  doc.text(`Name`, 22, 100);
  doc.text(`Phone`, 22, 112);
  doc.text(`${item?.customer?.name}`, 65, 100);
  doc.text(`${item?.customer?.phone}`, 65, 112);

  doc.text(`:`, 60,  124);
  doc.text(`:`, 60, 100);
  doc.text(`:`, 60, 112);

  doc.text(`Address`, 22, 124);

  doc.setFontSize(26).text(item?.shipping_address?.street, 65, 124, {
    maxWidth: 140,
    align: "left",
  });

  // ✅ Center the consignment ID text
const consignmentId = `${item?.fulfillment?.consignment_id}`;
doc.setFontSize(34);
const textWidth = doc.getTextWidth(consignmentId);
const textX = (pageWidth - textWidth) / 2;
doc.text(consignmentId, textX, 74);

 
  // doc.setFontSize(26).text(`(WGT: ${item?.weight}kg)`, 6, 74);

  // ✅ Center "Jannat Fashion"
  // const pageWidth = doc.internal.pageSize.getWidth();
  const centerText = (text, y, fontSize = 36) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  };
centerText(`Address: Savar, Dhaka-1216`, 259, 28)
centerText(`Hotline: +88 01773-043533`, 247, 28)
 doc.setFont(undefined, "bold");
  centerText("PORON", 235, 36); // centered version
  centerText(
    `HOME DELIVERY`,
    195,
    40
  );
  centerText(`COD: ${item?.totals?.grand}/-`, 210, 40);

  doc.setFontSize(34).text("Receiver:", 15, 88);
  doc.setFontSize(34).text(`${item?.orderID}`, 120, 88);
  doc.setFontSize(34).text("Sender:", 15, 224);

  // Top brand title (can also be centered if you prefer)
  centerText("PORON", 25, 55);

  centerText("Thanks for being with us.", 273, 34);

  doc.autoPrint();
  doc.output("dataurlnewwindow");
};

// ছোটো হেল্পার—টাকা ফরম্যাট
function formatMoney(v, currency = "BDT") {
  const n = Number(v || 0);
  // “৳” দেখাতে চাইলে:
  // const symbol = currency === "BDT" ? "৳" : currency + " ";
  // return `${symbol}${n.toFixed(2)}`;
  return `${n.toFixed(2)} ${currency}`;
}