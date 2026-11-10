import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { AiOutlinePrinter } from "react-icons/ai";
import { useSelector } from "react-redux";
import { selectConfig } from "@/app/redux/slices/configSlice";
import Button from "../components/shared/Button";

const GenerateStick = ({ html }) => {
  const [config, setConfig] = useState();

  const data = useSelector(selectConfig);

  useEffect(() => {
    !!data && setConfig(data[0].values);
  }, []);

  const generateSticker = () => {
    const doc = new jsPDF();

    let image = document.getElementById("bar_code").getAttribute("src");
    // get data
    let invoiceNo = doc.splitTextToSize(
      document.getElementById("invoiceNo").innerText,
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

    let shipping_type = doc.splitTextToSize(
      document.getElementById("shipping_type").innerText,
      200
    );
    let total = doc.splitTextToSize(
      document.getElementById("total").innerText,
      200
    );

    doc.addImage(image, 30, 30, 140, 35);

    doc.setFontSize(22).text(`Created by SM.Devware.`, 105, 285);
    doc.setFontSize(34);
    doc.text(`Name: ${name}`, 22, 100);
    doc.text(`Phone: ${phone}`, 22, 112);

    doc.text(`Hotline: +88${config?.company_contact}`, 30, 238);
    doc.text(`Address: ${config?.address}`, 9, 250);

    doc.text(`Address: `, 22, 124);
    doc
      .setFontSize(28)
      .text(address, 72, 124, { maxWidth: 160, align: "left" });
    // doc.text(`Note: `, 22, 136);
    // doc.setFontSize(28).text(`Some Note`, 54, 136);
    doc.setFontSize(36).text(invoiceNo, 70, 74);
    doc.setFont(undefined, "bold");
    doc.setFontSize(36).text(config?.company_name, 38, 225);
    doc.setFontSize(40).text(`${shipping_type} DELIVERY`, 40, 180);
    doc.setFontSize(40).text(`COD: ${total}`, 50, 195);
    doc.setFontSize(36).text("Receiver:", 15, 88);
    doc.setFontSize(36).text("Sender:", 15, 210);
    doc.setFontSize(55).text(config?.company_name, 4, 25);
    doc.setFontSize(36).text("Thanks for being with us.", 24, 270);

    // doc.save(invoiceNo);
    doc.autoPrint();
    //This is a key for printing
    doc.output("dataurlnewwindow");
  };

  return (
    <div className="col-span-2 sm:col-span-1">
      <Button
        icon={<AiOutlinePrinter size={26} />}
        onClick={generateSticker}
        title="Print Sticker"
        className="bg-green-400 font-medium  hover:bg-green-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14 text-md sm:text-lg "
      />
    </div>
  );
};

export default GenerateStick;
