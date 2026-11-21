
import React, { useEffect, useState } from "react";
import * as FileSaver from "file-saver";
import * as XLSX from "xlsx";
import Button from "./Button";
import { TodayDate } from "../../utils/helpers";
import { notifications } from "@mantine/notifications";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/redux/slices/authSlice";
import { selectOrder } from "@/app/redux/slices/orderSlice";
import { IoMdCloudDownload } from "react-icons/io";

const ExportCSVGur = () => {
  const [access, setAccess] = useState(true);

  const user = useSelector(selectUser);
  const orders = useSelector(selectOrder);

  const DEFAULT_FILENAME = TodayDate();

  // HR and Admin access control
  useEffect(() => {
    if (
      user?.staff_role === "HR" ||
      user?.staff_role === "Admin"
    ) {
      setAccess(false);
    } else {
      setAccess(true);
    }
  }, [user]);

  const fileType =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

  const fileExtension = ".xlsx";

  // Export Redux Orders to Excel
  const exportToCSV = async () => {
    if (access) return;

    try {
      // Ensure Redux data is an array
      if (!Array.isArray(orders) || orders.length === 0) {
        notifications.show({
          title: "Not Found!!",
          message: "There are no orders available for download.",
          color: "red",
        });
        return;
      }

      // Format all Redux orders
      const formattedOrders = orders.map((item) => {
        // Support both Firestore document and normal Redux object
        const data =
          typeof item?.data === "function"
            ? item.data()
            : item?.data || item;

        const items = Array.isArray(data?.items)
          ? data.items
          : [];

        return {
          Invoice:
            item?.id ||
            data?.id ||
            data?.invoice ||
            "N/A",

          Name:
            data?.customer?.name || "N/A",

          Address:
            data?.shipping_address?.street || "N/A",

          Phone:
            data?.customer?.phone || "N/A",

          item_description: items
            .map(
              (product, index) =>
                `${index + 1}. ${product?.title || "N/A"} (Qty: ${
                  product?.quantity ?? 0
                }, Price: ${product?.line_total ?? 0})`
            )
            .join("\n"),

          Weight:
            data?.status === "Cancelled"
              ? 0
              : data?.totals?.qtySum ?? "N/A",

          Amount:
            data?.totals?.grand ?? "N/A",

          Discount:
            data?.totals?.discount ?? "N/A",

          Payment:
            data?.totals?.payment ?? "N/A",

          COD:
            data?.totals?.cod ?? "N/A",

          Created:
            data?.created_at ?? "N/A",

          Status:
            data?.status ?? "N/A",

          order_from:
            data?.meta?.source || "null",

          Placed_By:
            data?.created_user || "N/A",

          Note:
            data?.notes || "N/A",
        };
      });

      // Reverse order to maintain previous Excel ordering
      const finalOrders = [...formattedOrders].reverse();

      // Create Excel worksheet
      const ws = XLSX.utils.json_to_sheet(finalOrders);

      // Create workbook
      const wb = {
        Sheets: {
          data: ws,
        },
        SheetNames: ["data"],
      };

      // Generate Excel file
      const excelBuffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
      });

      const data = new Blob(
        [excelBuffer],
        { type: fileType }
      );

      // Download Excel
      FileSaver.saveAs(
        data,
        DEFAULT_FILENAME + fileExtension
      );

      // Success notification
      notifications.show({
        title: "Successful",
        message: `Download Successfully 😊 Total Data: ${finalOrders.length}`,
        color: "blue",
      });

    } catch (error) {
      console.error("Excel Export Error:", error);

      notifications.show({
        title: "Export Failed!",
        message: "Something went wrong while exporting orders.",
        color: "red",
      });
    }
  };

  return (
    <>
      <Button
        disabled={access}
        onClick={exportToCSV}
        title="Download"
        icon={<IoMdCloudDownload size={24} />}
        className={`bg-blue-400 ${
          !access && "hover:bg-blue-500 hover:shadow-lg"
        } transition-all duration-300 text-white w-full h-14`}
      />
    </>
  );
};

export default ExportCSVGur;
