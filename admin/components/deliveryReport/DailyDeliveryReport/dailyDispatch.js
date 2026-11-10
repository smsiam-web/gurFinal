import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/app/utils/firebase";
import { jsPDF } from "jspdf"; // Import jsPDF
import "jspdf-autotable";

const DailyDispatch = () => {
  const router = useRouter();
  const [dispatchData, setDispatchData] = useState([]);
  const [dispatchId, setDispatchId] = useState(router.asPath?.split("=")[1]);

  // Get order from firebase database
  const filters = () => {
    const unsubscribe = db
      .collection("dispatch")
      .doc(dispatchId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setDispatchData(doc.data());
          }
        },
        (error) => {
          console.error("Error fetching real-time updates:", error);
        }
      );

    // Return the unsubscribe function to stop listening when needed
    return unsubscribe;
  };

  useEffect(() => {
    filters();
  }, []);

  // Validate and extract valid order IDs
  const maxOrders = dispatchData?.dispatches?.length;
  const limitedOrders = dispatchData?.dispatches?.slice(0, maxOrders); // Slice to limit the orders

  // Create a 10x10 grid (array of arrays)
  const gridData = Array.from({ length: 20 }, (_, rowIndex) =>
    Array.from({ length: 10 }, (_, colIndex) => {
      const orderIndex = rowIndex * 20 + colIndex;
      return limitedOrders && limitedOrders[orderIndex]
        ? limitedOrders[orderIndex].sfc
        : ""; // Show length of ID
    })
  );

  // Function to generate PDF
  const generatePDF = () => {
    const doc = new jsPDF();

    // Define the table columns (5 columns for Order IDs)
    const tableColumns = [
      "#SL",
      "Order ID",
      "Order ID",
      "Order ID",
      "Order ID",
      "Order ID",
    ];

    // Prepare rows, ensuring we have 10 rows and 5 columns for the grid
    const tableRows = [];
    let serial = 1;
    for (let i = 0; i <= dispatchData?.dispatches?.length + 1; i += 5) {
      tableRows.push([
        serial++, // Row Serial
        dispatchData?.dispatches[i]?.sfc || "",
        dispatchData?.dispatches[i + 1]?.sfc || "",
        dispatchData?.dispatches[i + 2]?.sfc || "",
        dispatchData?.dispatches[i + 3]?.sfc || "",
        dispatchData?.dispatches[i + 4]?.sfc || "",
        dispatchData?.dispatches[i + 5]?.sfc || "",
      ]);
    }

    // Add centered title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40); // Increase font size for the title
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleText = "Rajshahir Aam Wala";
    doc.text(titleText, pageWidth / 2, 15, { align: "center" });

    // Add additional information under the title
    doc.setFont("helvetica", "normal");
    doc.setFontSize(24); // Smaller font size for details
    doc.text("Merchant ID: #141700", pageWidth / 2, 24, { align: "center" });
    doc.text(`Dispatch ID: #${dispatchData?.dispatchID}`, pageWidth / 2, 33, {
      align: "center",
    });
    doc.setFontSize(22); // Smaller font size for details
    doc.text(
      `Total Parcel: ${dispatchData?.dispatches?.length <= 9 ? "0" : ""}${
        dispatchData?.dispatches?.length
      }`,
      pageWidth / 2,
      42,
      {
        align: "center",
      }
    );
    // doc.setFontSize(18);
    doc.text(`Date: ${dispatchData?.date}`, pageWidth / 2, 51, {
      align: "center",
    });

    // Generate the table with autoTable plugin
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 56, // Start the table below the title
      theme: "grid", // Add grid lines to the table
      styles: {
        cellPadding: 2,
        fontSize: 16,
        halign: "center",
      },
      headStyles: {
        fillColor: [22, 160, 133], // Custom color for headers
        textColor: 255, // White text in the header
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240], // Light gray rows
      },
    });

    // Save the generated PDF
    doc.save(
      `${dispatchId}(${dispatchData?.dispatches?.length <= 9 ? "0" : ""}${
        dispatchData?.dispatches?.length
      }).pdf`
    );
  };

  return (
    <div className="overflow-x-auto">
      {gridData.length === 0 ? (
        <p>No valid orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table-auto border-collapse border border-gray-200 w-full">
            <thead>
              <tr className="bg-gray-100">
                {Array.from({ length: 10 }).map((_, index) => (
                  <th key={index} className="border border-gray-200 px-4 py-2">
                    Col {index + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
                >
                  {row.map((cell, colIndex) => (
                    <td
                      key={colIndex}
                      className="border border-gray-200 px-4 py-2 text-center"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Button to generate PDF */}
      <button
        onClick={generatePDF}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Generate PDF
      </button>
    </div>
  );
};

export default DailyDispatch;
