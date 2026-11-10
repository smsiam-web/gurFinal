import React, { useEffect, useState } from "react";
import Button from "../shared/Button";
import { useDispatch, useSelector } from "react-redux";
import generateBulkPrintInvoice from "./generateBulkPrint";
import { selectBulkOrder, updateBulkOrder } from "@/app/redux/slices/bulkSlice";
import { IoPrintOutline } from "react-icons/io5";
import { selectAllOrder } from "@/app/redux/slices/allOrder";
import { notifications } from "@mantine/notifications";
import {updateOrderStatusGur } from "@/admin/utils/helpers";
import { db } from "@/app/utils/firebase";
import { selectUser } from "@/app/redux/slices/authSlice";
import generateBulkPrintStickers from "./generateBulkSticker";
import ExportCSVGur from "../shared/ExportCSVGur";
import generatePdfSummary from "./pdfOrderSummary";

const OrderDropDownload = () => {
  const [orders, setOrders] = useState(useSelector(selectAllOrder));
  const [bulkOrder, setBulkOrder] = useState(useSelector(selectAllOrder));
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const bulkOrders = useSelector(selectBulkOrder);
  const allOrders = useSelector(selectAllOrder);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    const fetchOrders = async () => {
      setOrders(allOrders); // Directly set the orders
    };
    fetchOrders();
  }, [allOrders]);

  useEffect(() => {
    setBulkOrder(bulkOrders);
  }, [bulkOrders]);

  const BulkAction = async () => {
    setLoading(true);
    setBulkOrder(bulkOrders); // Update the state
    if (!!bulkOrder.length && !loading) {
      generateBulkPrintInvoice(bulkOrder);
    } else {
      notifications.show({
        title: "Bulk Print Failed. Orders(0)",
        message: "An error occurred! Please select pending orders.",
        color: "red",
        autoClose: 3000,
      });
    }
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
  const OrderSummery = async () => {
    setLoading(true);
    setBulkOrder(bulkOrders); // Update the state
    if (!!bulkOrder.length && !loading) {
      generatePdfSummary(bulkOrder);
    } else {
      notifications.show({
        title: "Summery Print Failed. Orders(0)",
        message: "An error occurred! Please select pending orders.",
        color: "red",
        autoClose: 3000,
      });
    }
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
  const BulkSticker = async () => {
    setLoading(true);
    setBulkOrder(bulkOrders); // Update the state
    if (!!bulkOrder.length && !loading) {
      generateBulkPrintStickers(bulkOrder);
    } else {
      notifications.show({
        title: "Bulk Print Failed. Orders(0)",
        message: "An error occurred! Please select pending orders.",
        color: "red",
        autoClose: 3000,
      });
    }
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const selectStatus = async (e) => {
    e.preventDefault();
    const statusFilter = e.target.value;
    setStatus(statusFilter);
  };

  const ChangeToStatus = async () => {
    setLoading(true);
    try {
      bulkOrder.map((item, i) => {
        // if(item?.status === "pending" && status === "shipped" ){
        //     notifications.show({
        //     title: "Pending to Shipped not allawed",
        //     message: "An error occurred while updating the status.",
        //     color: "red",
        //     autoClose: 5000,
        //   });
        //   return
        // }

        const sucess = updateOrderStatusGur(db, item.id, item, status);
        if (!sucess) {
          notifications.show({
            title: "Status Update Failed",
            message: "An error occurred while updating the status.",
            color: "red",
            autoClose: 5000,
          });
        }
      });
    } catch (error) {
      notifications.show({
        title: "Status Update Failed",
        message: "An error occurred while updating the status.",
        color: "red",
        autoClose: 5000,
      });
    } finally {
      
      notifications.show({
        title: "Status Updated Successfully",
        message: `Bulk Order status changed to ${status}.`,
        color: "blue",
      });
    }
    setLoading(false);
  };

  // update status on firebase
  const updateStatus = async (order, newStatus) => {
    const success = await updateOrderStatusGur(db, order.id, order, newStatus);
    if (success) {
      notifications.show({
        title: "Status Updated Successfully",
        message: `Order #${order.id} status changed to ${newStatus}.`,
        color: "blue",
        autoClose: 4000,
      });
      close();
    } else {
      notifications.show({
        title: "Status Update Failed",
        message: "An error occurred while updating the status.",
        color: "red",
        autoClose: 5000,
      });
    }
  };




  return (
    <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50  shadow-xs mb-5">
      <div className="p-4">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-3">
          <div className="col-span-2">
            <div className="flex gap-3">
              <select
                className="block w-full px-2 py-1 text-sm  focus:outline-none rounded-md form-select focus:border-gray-200 border-gray-200  focus:shadow-none leading-5 border h-14 bg-gray-100 border-transparent focus:bg-gray-50"
                id="roleItem"
                name="roleItem"
                // defaultValue={selectedSubNav}
                onChange={(e) => selectStatus(e)}
              >
                <option>Status Change to</option>
                <option value="pending">Change status to Pending</option>
                <option value="processing">Change status to Processing</option>
                <option value="shipped">Change status to Shipped</option>
                <option value="delivered">Change status to Delivered</option>
                <option value="hold">Change status to Hold</option>
                <option value="cancelled">Change status to Cancelled</option>
              </select>
              <Button
                onClick={() => ChangeToStatus()}
                disabled={loading}
                loading={loading}
                title="Apply"
                className="bg-green-400 hover:bg-green-500 hover:shadow-lg transition-all duration-300 text-white w-fit h-14"
                // icon=<IoPrintOutline size={24} />
              />
            </div>
          </div>
          <div className="col-span-2 gap-4 md:col-span-2 xl:col-span-1 min-w-full">
            <div className="grid grid-cols-2 gap-2">
              <div className="md:col-span-1 col-span-2">
                <Button
                  onClick={() => BulkSticker()}
                  disabled={loading}
                  loading={loading}
                  title="Bulk Sticker"
                  className="bg-green-400 hover:bg-green-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                  icon=<IoPrintOutline size={24} />
                />
              </div>
              <div className="md:col-span-1 col-span-2">
                <Button
                  onClick={() => BulkAction()}
                  disabled={loading}
                  loading={loading}
                  title="Bulk Print"
                  className="bg-green-400 hover:bg-green-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                  icon=<IoPrintOutline size={24} />
                />
              </div>
              <div className="md:col-span-1 col-span-2">
                <Button
                  onClick={() => OrderSummery()}
                  disabled={loading}
                  loading={loading}
                  title="Order Summery"
                  className="bg-green-400 hover:bg-green-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                  icon=<IoPrintOutline size={24} />
                />
              </div>
              <div className="md:col-span-1 col-span-2">
                <ExportCSVGur />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDropDownload;
