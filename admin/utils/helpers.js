import { jsPDF } from "jspdf";
import "./fonts/lialinurBanglaFont";
import "./fonts/LiAnis-normal";
import "./fonts/SolaimanLipi-normal";
import { format } from "date-fns";
import autoTable from "jspdf-autotable";
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>;

// create random unique id
export const uuid = () => {
  return "xxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const formatDate = (date) => {
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  let dd = date.getDate();
  let mm = month[date.getMonth()];
  let yyyy = date.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  date = `${mm} ${dd}, ${yyyy}`;
  return date;
};

export const formatDates = (isoDate) => {
  if (!isoDate) return ""; // or return null, or "N/A"
  try {
    return format(new Date(isoDate), "MMM dd, yyyy");
  } catch {
    return "MMM dd, yyyy"; // fallback if invalid date string
  }
};

export const Last7Days = () => {
  const today = new Date();
  const oneDayAgo = new Date(today);
  const twoDaysAgo = new Date(today);
  const threeDaysAgo = new Date(today);
  const fourDaysAgo = new Date(today);
  const fiveDaysAgo = new Date(today);
  const sixDaysAgo = new Date(today);

  oneDayAgo.setDate(today.getDate() - 1);
  twoDaysAgo.setDate(today.getDate() - 2);
  threeDaysAgo.setDate(today.getDate() - 3);
  fourDaysAgo.setDate(today.getDate() - 4);
  fiveDaysAgo.setDate(today.getDate() - 5);
  sixDaysAgo.setDate(today.getDate() - 6);

  const result0 = formatDate(today);
  const result1 = formatDate(oneDayAgo);
  const result2 = formatDate(twoDaysAgo);
  const result3 = formatDate(threeDaysAgo);
  const result4 = formatDate(fourDaysAgo);
  const result5 = formatDate(fiveDaysAgo);
  const result6 = formatDate(sixDaysAgo);

  const result = [
    result0,
    result1,
    result2,
    result3,
    result4,
    result5,
    result6,
  ];

  return result.reverse();
};

export const Today = () => {
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  let date = new Date();
  let dd = date.getDate();
  let mm = month[date.getMonth()];
  let yyyy = date.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  date = `${mm} ${dd}, ${yyyy}`;
  return date;
};
export const TimeStampToDate = (timestamp) => {
  const month = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (!timestamp?.seconds) return "";

  let date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6);
  let dd = date.getDate();
  let mm = month[date.getMonth()];
  let yyyy = date.getFullYear();

  if (dd < 10) {
    dd = "0" + dd;
  }

  return `${mm} ${dd}, ${yyyy}`;
};

export const ToDateAndTime = (timestamp) => {
  if (
    !timestamp?.toDate ||
    !timestamp ||
    typeof timestamp.toDate !== "function"
  ) {
    return ""; // or return "N/A"
  }

  const date = timestamp.toDate();

  const dateStr = date.toLocaleDateString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Dhaka",
  });

  const timeStr = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  });

  return `${dateStr} at ${timeStr}`;
};

export const TodayDate = () => {
  let date = new Date();
  let dd = date.getDate();
  let mm = date.getMonth() + 1;
  let yyyy = date.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  date = `${dd}.${mm}.${yyyy}`;
  return date;
};

export const doubleDigit = (value) => {
  return value && value > 9 ? value : `0${value}`;
};

export const daysInMonth = (month, year) => {
  return new Date(year, month, 0).getDate();
};

//invoice
export const invoiceGenerate = (item) => {
  const date = formatDates(item?.created_at);
  const doc = new jsPDF();

  let item_01 = "",
    item_01_quantity = "",
    item_01_price = "",
    item_01_total_price = "",
    item_02 = "",
    item_02_quantity = "",
    item_02_price = "",
    item_02_total_price = "",
    item_03 = "",
    item_03_quantity = "",
    item_03_price = "",
    item_03_total_price = "",
    item_04 = "",
    item_04_quantity = "",
    item_04_price = "",
    item_04_total_price = "",
    item_05 = "",
    item_05_quantity = "",
    item_05_price = "",
    item_05_total_price = "",
    item_06 = "",
    item_06_quantity = "",
    item_06_price = "",
    item_06_total_price = "";

  item.items.map((e, i) => {
    const opt = Array.isArray(e?.option)
      ? e.option.map((o) => `${o.value || o.value}`).join(", ")
      : "";
    const title = opt ? `${e.title} (${opt})` : e.title;
    i++;
    if (i === 1) {
      item_01 = title || "";
      item_01_quantity = `${e.quantity}`;
      item_01_price = `${e.price}`;
      item_01_total_price = `${e.line_total}/-`;
    } else if (i === 2) {
      item_02 = title || "";
      item_02_quantity = `${e.quantity}`;
      item_02_price = `${e.price}`;
      item_02_total_price = `${e.line_total}/-`;
    } else if (i === 3) {
      item_03 = title || "";
      item_03_quantity = `${e.quantity}`;
      item_03_price = `${e.price}`;
      item_03_total_price = `${e.line_total}/-`;
    } else if (i === 4) {
      item_04 = title || "";
      item_04_quantity = `${e.quantity}`;
      item_04_price = `${e.price}`;
      item_04_total_price = `${e.line_total}/-`;
    } else if (i === 5) {
      item_05 = title || "";
      item_05_quantity = `${e.quantity}`;
      item_05_price = `${e.price}`;
      item_05_total_price = `${e.line_total}/-`;
    } else if (i === 6) {
      item_06 = title || "";
      item_06_quantity = `${e.quantity}`;
      item_06_price = `${e.price}`;
      item_06_total_price = `${e.line_total}/-`;
    }
  });

  // doc.text(document.querySelector(".content > h2").innerHTML, 5, 75);
  // doc.setFont("LiAbuUnicode");
  // doc.setFont("LiAnis");
  doc.setFont("SolaimanLipi");
  doc.addImage("/invoice/invoice.jpg", 0, 0, 210, 297);
  doc.text(item?.fulfillment?.order_status || "Pending", 91, 77);
  doc.text(item?.fulfillment?.courier || "N/A", 153.5, 77);
  doc.text(item?.customer?.name, 33, 91.4);
  doc.text(item?.customer?.phone, 33.3, 99);

  doc.text(item_01, 30, 139.6);
  doc.text(item_01_quantity, 116, 139.6);
  doc.text(item_01_price, 137, 139.6);
  doc.text(item_01_total_price, 168, 139.6);

  doc.text(item_02, 30, 154);
  doc.text(item_02_quantity, 116, 154);
  doc.text(item_02_price, 137, 154);
  doc.text(item_02_total_price, 168, 154);

  doc.text(item_03, 30, 167);
  doc.text(item_03_quantity, 116, 167);
  doc.text(item_03_price, 137, 167);
  doc.text(item_03_total_price, 168, 167);

  doc.text(item_04, 30, 180.8);
  doc.text(item_04_quantity, 116, 180.8);
  doc.text(item_04_price, 137, 180.8);
  doc.text(item_04_total_price, 168, 180.8);

  doc.text(item_05, 30, 194.6);
  doc.text(item_05_quantity, 116, 194.6);
  doc.text(item_05_price, 137, 194.6);
  doc.text(item_05_total_price, 168, 194.6);

  doc.text(item_06, 30, 208.2);
  doc.text(item_06_quantity, 116, 208.2);
  doc.text(item_06_price, 137, 208.2);
  doc.text(item_06_total_price, 168, 208.2);

  doc.setFontSize(12).text(`[Note: ${item?.meta?.notes || ""}]`, 8, 218.2, {
    maxWidth: 120,
    align: "left",
  });
  doc.text(`${item?.totals?.items}/-`.toString(), 161, 225.5);
  doc.text(`${item?.totals?.shipping}/-`, 161, 233.8);
  doc.text(`-${item?.totals?.discount}/-`.toString(), 161, 242.2);

  doc.setFontSize(12).text(`${item?.shipping_address?.street}`, 36.4, 106.5, {
    maxWidth: 165,
    align: "left",
  });
  doc.text(date, 93, 83.5);
  doc.setFont(undefined, "bold");
  doc.setFontSize(15).text(item?.orderID, 43, 83.5);
  doc
    .setFontSize(18)
    .text(`${item?.totals?.grand.toString()}.00/-`, 161, 255.5);

  // 🔥 Enable PDF auto-print (adds OpenAction in the PDF)
  doc.autoPrint();

  const fileName = `${item?.orderID || item?.fulfillment?.consignment_id || "order"
    }.pdf`;

  // Make a Blob + URL
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);

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
    window.open(url, "_blank");
  }

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();

  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
function barcodeDataURL(value, options = {}) {
  const canvas = document.createElement("canvas");
  console.log(value);
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
  // “৳” দেখাতে চাইলে:
  // const symbol = currency === "BDT" ? "৳" : currency + " ";
  // return `${symbol}${n.toFixed(2)}`;
  return `${n.toFixed(2)}`;
}

//Sticker
export const generateStick = (item) => {
  const doc = new jsPDF();
  // ✅ Get page width once
  const pageWidth = doc.internal.pageSize.getWidth();

  // ✅ Center the barcode
  // let image = `${barCodeImageLink}`;
  const img = barcodeDataURL(item?.fulfillment?.consignment_id);
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

  // ডেটা মেপ করুন
  const bodyRows = items.map((it, i) => {
    const opt = Array.isArray(it?.option)
      ? it.option.map((o) => `${o.value || o.value}`).join(", ")
      : "";
    const title = opt ? `${it.title} (${opt})` : it.title;
    const qty = Number(it?.quantity || 0);
    // const price = Number(it?.price || 0);
    // const total = Number(it?.line_total ?? qty * price);
    // const title = String(it?.title || "");
    return [
      i + 1,
      title,
      qty > 0 ? `${qty} ${it?.unit || ""}`.trim() : "",
      // formatMoney(price),
      // formatMoney(total),
    ];
  });

  // ফিটিং রো সংখ্যা নির্ণয় করুন
  const availableHeight = stopY - startY - headerHeight;
  const maxRows = Math.max(0, Math.floor(availableHeight / rowHeight));
  let renderedBody = bodyRows.slice(0, maxRows);
  const hiddenCount = bodyRows.length - renderedBody.length;
  const title = process.env.APP_TITLE || "";
  const address = process.env.SENDER_ADDRESS || "";
  const hotline = process.env.SENDER_HOTLINE || "";

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
        fontSize: 22,
        fontStyle: "bold",
        cellPadding: 2,
        textColor: [0, 0, 0], // টেক্সট কালো
        lineColor: [0, 0, 0], // সেলের বর্ডার কালো
        lineWidth: 0.2,
        fillColor: null, // কোন ব্যাকগ্রাউন্ড না
        fontStyle: "bold",
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
        2: { cellWidth: 16, halign: "right" }, // Qty
        2: { cellWidth: 26, halign: "center" }, // Qty
        // 3: { cellWidth: 26, halign: "right" }, // Price
        // 4: { cellWidth: 30, halign: "right" }, // Total

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

    doc.setFont(undefined, "bold");

    doc.text("No items", 16, startY + 6);
  }

  doc.setFontSize(22).text(`Created by SM.Devware.`, 105, 285);
  doc.setFontSize(28);
  doc.text(`Name`, 22, 100);
  doc.text(`Phone`, 22, 112);
  doc.text(`${item?.customer?.name}`, 65, 100);
  doc.text(`${item?.customer?.phone}`, 65, 112);

  doc.text(`:`, 60, 124);
  doc.text(`:`, 60, 100);
  doc.text(`:`, 60, 112);

  doc.text(`Address`, 22, 124);

  doc.setFontSize(16).text(item?.shipping_address?.street, 65, 124, {
    maxWidth: 140,
    align: "left",
  });

  const centerText = (text, y, fontSize = 36) => {
    doc.setFontSize(fontSize);
    const textWidth = doc.getTextWidth(text);
    const x = (pageWidth - textWidth) / 2;
    doc.text(text, x, y);
  };
  centerText(
    `${item?.fulfillment?.courier}(#${item?.fulfillment?.consignment_id})`,
    74,
    30
  );
  centerText(`Address: ${address}`, 259, 28);
  centerText(`Hotline: +88 ${hotline}`, 247, 28);
  doc.setFont(undefined, "bold");
  centerText(`${title}`, 235, 36); // centered version
  centerText(`HOME DELIVERY`, 205, 40);
  centerText(`COD: ${item?.totals?.grand}/-`, 218, 40);

  doc.setFontSize(34).text("Receiver:", 15, 88);
  doc.setFontSize(34).text(`${item?.orderID}`, 120, 88);
  doc.setFontSize(34).text("Sender:", 15, 226);

  // Top brand title (can also be centered if you prefer)
  centerText(`${title}`, 25, 55);

  centerText("Thanks for being with us.", 273, 34);

  // 🔥 Enable PDF auto-print (adds OpenAction in the PDF)
  doc.autoPrint();

  const fileName = `${item?.orderID || item?.fulfillment?.consignment_id || "order"
    }.pdf`;

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

  // 🟦 (Optional) আলাদা বাটনে/অ্যাকশনে কাস্টম ফাইলনেম ডাউনলোড
  // একই blob URL ইউজ করলে খুব তাড়াতাড়ি revoke করবেন না
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();

  // ⚠️ খুব তাড়াতাড়ি revoke করলে নতুন ট্যাব লোড হতে নাও পারে। একটু দেরিতে revoke করুন:
  setTimeout(() => URL.revokeObjectURL(url), 60000); // 60s পরে নিরাপদে রিভোক

  // doc.save(fileName);
  // doc.autoPrint();
  // doc.output("dataurlnewwindow");
};

export const updateOrderStatus = async (db, orderId, orderData, newStatus) => {
  try {
    await db
      .collection("orders")
      .doc(orderId)
      .set(
        {
          ...orderData,
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    return true; // Indicate success
  } catch (error) {
    console.error("Error updating status:", error);
    return false; // Indicate failure
  }
};
export const updateOrderStatusAam = async (db, orderId, orderData, newStatus) => {
  try {
    await db
      .collection("ordersAam")
      .doc(orderId)
      .set(
        {
          ...orderData,
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    return true; // Indicate success
  } catch (error) {
    console.error("Error updating status:", error);
    return false; // Indicate failure
  }
};
export const updateOrderStatusGur = async (db, orderId, orderData, newStatus) => {
  try {
    await db
      .collection("ordersGur")
      .doc(orderId)
      .set(
        {
          ...orderData,
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    return true; // Indicate success
  } catch (error) {
    console.error("Error updating status:", error);
    return false; // Indicate failure
  }
};
export const updateWebOrderList = async (db, orderId, orderData, newStatus) => {
  try {
    await db
      .collection("ordersGur")
      .doc(orderId)
      .set(
        {
          ...orderData,
          status: newStatus,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    return true; // Indicate success
  } catch (error) {
    console.error("Error updating status:", error);
    return false; // Indicate failure
  }
};

export const formatDateToDDMMYYYY = async (date) => {
  return new Promise((resolve) => {
    const day = String(date.getDate()).padStart(2, "0"); // Get the day and pad with 0 if needed
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based, so add 1
    const year = date.getFullYear(); // Get the full year

    const formattedDate = `${day}${month}${year}`;
    resolve(formattedDate);
  });
};
