import React from "react";
import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";
import Button from "../components/shared/Button";
import { AiOutlinePrinter } from "react-icons/ai";
import { BsCloudDownload } from "react-icons/bs";

const GeneratePdf = ({ html, disabled, item, id }) => {
  const generate = (e) => {
    e.stopPropagation();
    generateInvoice();
  };

  const generateInvoice = () => {
    const doc = new jsPDF();

    let image = document.getElementById("image").getAttribute("src");
    // get data
    let invoiceNo = doc.splitTextToSize(
      document.getElementById("invoiceNo").innerText,
      300
    );
    let status = doc.splitTextToSize(
      document.getElementById("status").innerText,
      300
    );
    let name = doc.splitTextToSize(
      document.getElementById("name").innerText,
      200
    );
    let phone = doc.splitTextToSize(
      document.getElementById("phone").innerText,
      200
    );
    let address = doc.splitTextToSize(
      document.getElementById("address").innerText,
      200
    );
    // get item_01
    let item_01 = doc.splitTextToSize(
      document.getElementById("item_01").innerText,
      200
    );
    let item_01_quantity = doc.splitTextToSize(
      document.getElementById("item_01_quantity")?.innerText,
      200
    );
    let item_01_price = doc.splitTextToSize(
      document.getElementById("item_01_price")?.innerText,
      200
    );
    let item_01_total_price = doc.splitTextToSize(
      document.getElementById("item_01_total_price")?.innerText,
      200
    );
    // get item_02
    let item_02 = doc.splitTextToSize(
      document.getElementById("item_02")?.innerText || "",
      200
    );
    let item_02_quantity = doc.splitTextToSize(
      document.getElementById("item_02_quantity")?.innerText || "",
      200
    );
    let item_02_price = doc.splitTextToSize(
      document.getElementById("item_02_price")?.innerText || "",
      200
    );
    let item_02_total_price = doc.splitTextToSize(
      document.getElementById("item_02_total_price")?.innerText || "",
      200
    );
    // get item_03
    let item_03 = doc.splitTextToSize(
      document.getElementById("item_03")?.innerText || "",
      200
    );
    let item_03_quantity = doc.splitTextToSize(
      document.getElementById("item_03_quantity")?.innerText || "",
      200
    );
    let item_03_price = doc.splitTextToSize(
      document.getElementById("item_03_price")?.innerText || "",
      200
    );
    let item_03_total_price = doc.splitTextToSize(
      document.getElementById("item_03_total_price")?.innerText || "",
      200
    );
    // get item_04
    let item_04 = doc.splitTextToSize(
      document.getElementById("item_04")?.innerText || "",
      200
    );
    let item_04_quantity = doc.splitTextToSize(
      document.getElementById("item_04_quantity")?.innerText || "",
      200
    );
    let item_04_price = doc.splitTextToSize(
      document.getElementById("item_04_price")?.innerText || "",
      200
    );
    let item_04_total_price = doc.splitTextToSize(
      document.getElementById("item_04_total_price")?.innerText || "",
      200
    );
    // get item_05
    let item_05 = doc.splitTextToSize(
      document.getElementById("item_05")?.innerText || "",
      200
    );
    let item_05_quantity = doc.splitTextToSize(
      document.getElementById("item_05_quantity")?.innerText || "",
      200
    );
    let item_05_price = doc.splitTextToSize(
      document.getElementById("item_05_price")?.innerText || "",
      200
    );
    let item_05_total_price = doc.splitTextToSize(
      document.getElementById("item_05_total_price")?.innerText || "",
      200
    );
    // get item_06
    let item_06 = doc.splitTextToSize(
      document.getElementById("item_06")?.innerText || "",
      200
    );
    let item_06_quantity = doc.splitTextToSize(
      document.getElementById("item_06_quantity")?.innerText || "",
      200
    );
    let item_06_price = doc.splitTextToSize(
      document.getElementById("item_06_price")?.innerText || "",
      200
    );
    let item_06_total_price = doc.splitTextToSize(
      document.getElementById("item_06_total_price")?.innerText || "",
      200
    );

    let subTotal = doc.splitTextToSize(
      document.getElementById("subTotal").innerText,
      200
    );
    let shipping_type = doc.splitTextToSize(
      document.getElementById("shipping_type").innerText,
      200
    );
    let shipping_cost = doc.splitTextToSize(
      document.getElementById("shipping_cost").innerText,
      200
    );
    let discount = doc.splitTextToSize(
      document.getElementById("discount").innerText,
      200
    );
    let total = doc.splitTextToSize(
      document.getElementById("total").innerText,
      200
    );

    // doc.text(document.querySelector(".content > h1").innerHTML, 5, 75);
    doc.addImage(image, 0, 0, 210, 297);
    doc.text(invoiceNo, 43, 83.5);
    doc.text(status, 91, 77);
    doc.text(name, 33, 91.4);
    doc.text(phone, 33.3, 99);
    doc.text(address, 36.4, 106.5);

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
    doc.text(item_06, 30, 208.2);
    doc.text(item_06_quantity, 116, 208.2);
    doc.text(item_06_price, 137, 208.2);
    doc.text(item_06_total_price, 168, 208.2);

    doc.text(note, 30, 208.2);
    doc.text(subTotal, 161, 225.5);
    doc.text(shipping_type, 182, 233.8);
    doc.text(shipping_cost, 161, 233.8);
    doc.text(discount, 161, 242.2);
    doc.text(total, 161, 255.5);
    doc.save(invoiceNo);
    doc.autoPrint();
    //This is a key for printing
    doc.output("dataurlnewwindow");
  };

  const generateImage = async () => {
    htmlToImage.toJpeg(html.current, { quality: 1 }).then(function (dataUrl) {
      var link = document.createElement("a");
      link.download = invoiceNo?.innerText;
      link.href = dataUrl;
      link.click();
    });
  };
  return (
    <div>
      <Button
        icon={<BsCloudDownload size={26} />}
        onClick={generateImage}
        title="Download Invoice"
        className="bg-sky-400 font-medium hover:bg-sky-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14 text-md sm:text-lg "
      />
    </div>
  );
};

export default GeneratePdf;
