import jsPDF from "jspdf";
import "../../utils/fonts/SolaimanLipi-normal";
import { formatDates, TodayDate } from "@/admin/utils/helpers";

function generateBulkPrintInvoice(invoiceArray) {
  console.log(invoiceArray);
  const doc = new jsPDF();
  const DEFAULT_FILENAME = TodayDate();

  invoiceArray.forEach((item, index) => {
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
      const opt =
        Array.isArray(e?.options) && e?.options[0]?.values
          ? e.options.map((o) => `${o.values ? o.values : ""}`).join(", ")
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
    doc.text(`${index < 10 && 0}${index + 1}`, 6, 290); // Title

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
    const date = formatDates(item?.created_at);
    doc.text(date, 93, 83.5);
    doc.setFont(undefined, "bold");
    doc.setFontSize(15).text(item?.orderID, 43, 83.5);
    doc
      .setFontSize(18)
      .text(`${item?.totals?.grand.toString()}.00/-`, 161, 255.5);

    // Add a new page unless it's the last data
    if (index < invoiceArray.length - 1) {
      doc.setFont(undefined, "normal");
      doc.addPage();
    }
  });

  doc.autoPrint();

  const fileName = `bulk_inv(${invoiceArray.length})_${DEFAULT_FILENAME}.pdf`;

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
}

export default generateBulkPrintInvoice;
