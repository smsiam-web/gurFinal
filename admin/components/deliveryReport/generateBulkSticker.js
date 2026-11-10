import jsPDF from "jspdf";
import "jspdf-autotable";
import "../../utils/fonts/SolaimanLipi-normal";
import { TodayDate } from "@/admin/utils/helpers";

// Barcode generation helper function
const generateBarcode = (barcodeValue) => {
  const barcodeCanvas = document.createElement("canvas");
  JsBarcode(barcodeCanvas, barcodeValue, {
    format: "CODE128", // Barcode format
    displayValue: false, // Show value below the barcode
    lineColor: "#000000", // Barcode line color
    width: 4, // Width of barcode lines
    height: 60, // Height of barcode
  });

  return barcodeCanvas.toDataURL("image/png"); // Return image data URL
};

function generateBulkSticker(invoiceArray) {
  console.log(invoiceArray);
  const doc = new jsPDF();
  const DEFAULT_FILENAME = TodayDate();

  invoiceArray.forEach((item, index) => {
    // Generate Barcode
    const barcodeImage = generateBarcode(item?.sfc?.consignment_id || "123456");

    if (item?.status === "Processing") {
      // Add text and other details
      doc.setFontSize(22).text(`Created by SM.Devware.`, 105, 285);
      doc.setFontSize(34);
      doc.text(`${index + 1}`, 10, 288); // Title
      doc.text(`Name: ${item?.customer_details.customer_name}`, 22, 100);
      doc.text(`Phone: ${item?.customer_details.phone_number}`, 22, 112);
      doc.text(`Hotline: +88 09647323700`, 30, 238);
      doc.text(`Address: Nouhata, Paba, Rajshahi.`, 9, 250);
      doc.text(`Address: `, 22, 124);
      doc
        .setFontSize(24)
        .text(item?.customer_details.customer_address, 72, 124, {
          maxWidth: 135,
          align: "left",
        });
      doc.setFontSize(36).text(`${item?.sfc?.consignment_id}`, 70, 75);
      doc.setFont(undefined, "bold");
      doc.setFontSize(26).text(`(WGT: ${item?.weight}kg)`, 6, 74);
      doc.setFontSize(36).text("Rajshahir Aam Wala", 38, 225);
      doc
        .setFontSize(40)
        .text(
          `${item?.customer_details.delivery_type ? "HOME" : "POINT"} DELIVERY`,
          42,
          180
        );
      doc
        .setFontSize(40)
        .text(`COD: ${item?.customer_details.salePrice}/-`, 65, 195);
      doc.setFontSize(36).text("Receiver:", 15, 88);
      doc.setFontSize(36).text(`${item?.id}`, 120, 88);
      doc.setFontSize(36).text("Sender:", 15, 210);
      doc.setFontSize(55).text("Rajshahir Aam Wala", 6, 25);
      doc.setFontSize(36).text("Thanks for being with us.", 24, 270);

      // Add Barcode Image
      doc.addImage(barcodeImage, "PNG", 30, 30, 140, 35); // Adjust position and size as needed
    } else {
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(34);
      doc.text(`${index + 1}`, 10, 288);
      doc.setFont(undefined, "bold");
      doc.setFontSize(36).text(`${item?.id}`, pageWidth / 2, 100);
      doc
        .setFontSize(100)
        .text(`${item?.status}`, pageWidth / 2, pageHeight / 2, {
          align: "center",
        });
      // doc.setFontSize(50).text(`${item?.status}`, 42, 180);
    }

    // Add a new page unless it's the last data
    if (index < invoiceArray.length - 1) {
      doc.setFont(undefined, "normal");
      doc.addPage();
    }
  });

  // Save the PDF
  doc.save(`Bulk-Sticker(${invoiceArray.length})_${DEFAULT_FILENAME}.pdf`);
  doc.autoPrint();
  doc.output("dataurlnewwindow");
}

export default generateBulkSticker;
