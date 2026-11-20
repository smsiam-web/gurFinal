
import React, { useEffect, useState } from "react";
import { Tooltip, Modal, Pagination } from "@mantine/core";
import Link from "next/link";

import { db } from "@/app/utils/firebase";
import { notifications } from "@mantine/notifications";

import { useDispatch, useSelector } from "react-redux";
import { selectOrder, updateOrder } from "@/app/redux/slices/orderSlice";
import { selectUser } from "@/app/redux/slices/authSlice";
import { updateConfig } from "@/app/redux/slices/configSlice";

import NotFound from "../shared/NotFound";

import {
  formatDates,
  invoiceGenerate,
  updateOrderStatusGur,
} from "@/admin/utils/helpers";

import { HiOutlineDocumentDownload } from "react-icons/hi";
import { FiEdit, FiPhone, FiUser, FiMapPin } from "react-icons/fi";
import { AiOutlinePrinter } from "react-icons/ai";
import { FaPrint } from "react-icons/fa";
import { RiDeleteBinLine } from "react-icons/ri";
import { IoIosSend } from "react-icons/io";
import {
  MdOutlineLocalShipping,
  MdOutlineShoppingBag,
} from "react-icons/md";
import { TbRefresh, TbTruckDelivery } from "react-icons/tb";

import generateBulkPrintStickers from "./generateBulkSticker";

// --------------------------------------------------
// STATUS CONFIGURATION
// --------------------------------------------------

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  hold: {
    label: "Hold",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-500",
  },
  processing: {
    label: "Processing",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  shipped: {
    label: "Shipped",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  returned: {
    label: "Returned",
    color: "bg-teal-50 text-teal-700 border-teal-200",
    dot: "bg-teal-500",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
};

const getStatus = (status) => {
  const key = String(status || "pending").toLowerCase();

  return STATUS_CONFIG[key] || {
    label: status || "Unknown",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  };
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  });

// --------------------------------------------------
// STATUS BADGE
// --------------------------------------------------

const StatusBadge = ({ status }) => {
  const config = getStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${config.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

// --------------------------------------------------
// ACTION BUTTON
// --------------------------------------------------

const ActionButton = ({
  title,
  onClick,
  children,
  color = "gray",
}) => {
  const colors = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white",
    green: "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white",
    red: "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white",
    gray: "bg-gray-50 text-gray-600 hover:bg-gray-200",
  };

  return (
    <Tooltip label={title} withArrow>
      <button
        type="button"
        onClick={onClick}
        aria-label={title}
        className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${colors[color]}`}
      >
        {children}
      </button>
    </Tooltip>
  );
};

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

const AllOrder = () => {
  const dispatch = useDispatch();

  const order = useSelector(selectOrder);
  const user = useSelector(selectUser);

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filterOrder, setFilterOrder] = useState(null);
  const [opened, setOpened] = useState(false);

  const role = user?.staff_role || "";

  const isHR = role === "HR";
  const isAdmin = role === "Admin";
  const isSalesManager = role === "Sales Manager";

  const canChangeStatus = isHR || isAdmin || isSalesManager;
  const canManageOrders = isHR || isAdmin;

  // --------------------------------------------------
  // REDUX SYNC
  // --------------------------------------------------

  useEffect(() => {
    setOrders(Array.isArray(order) ? order : []);
  }, [order]);

  // --------------------------------------------------
  // MODAL
  // --------------------------------------------------

  const closeModal = () => {
    setOpened(false);
    setFilterOrder(null);
  };

  const deleteItem = (item) => {
    setFilterOrder(item);
    setOpened(true);
  };

  // --------------------------------------------------
  // UPDATE STATUS
  // --------------------------------------------------

  const updateStatus = async (item, newStatus) => {
    try {
      const success = await updateOrderStatusGur(
        db,
        item.id,
        item,
        newStatus
      );

      if (success) {
        notifications.show({
          title: "Status Updated Successfully",
          message: `Order #${item.orderID || item.id} status changed to ${newStatus}.`,
          color: "blue",
          autoClose: 4000,
        });

        setOpened(false);
      } else {
        notifications.show({
          title: "Status Update Failed",
          message: "An error occurred while updating the status.",
          color: "red",
          autoClose: 5000,
        });
      }
    } catch (error) {
      console.error("Status update error:", error);

      notifications.show({
        title: "Status Update Failed",
        message: error.message || "Please try again.",
        color: "red",
      });
    }
  };

  const onStatusChanged = async (e, id) => {
    e.preventDefault();

    const newStatus = e.target.value;
    const selectedOrder = orders.find((item) => item.id === id);

    if (selectedOrder) {
      await updateStatus(selectedOrder, newStatus);
    }
  };

  // --------------------------------------------------
  // INVOICE PRINT
  // --------------------------------------------------

  const statusUpdate = async (item) => {
    if (item.status === "pending") {
      invoiceGenerate(item);
      await updateStatus(item, "processing");
    }
  };

  // --------------------------------------------------
  // STICKER PRINT
  // --------------------------------------------------

  const stickerStatus = async (item) => {
    try {
      if (item.status === "processing") {
        await generateBulkPrintStickers([item]);
        await updateStatus(item, "shipped");
      } else {
        await generateBulkPrintStickers([item]);
      }
    } catch (error) {
      console.error("Sticker generation error:", error);

      notifications.show({
        title: "Sticker Generation Failed",
        message: error.message || "Please try again.",
        color: "red",
      });
    }
  };

  // --------------------------------------------------
  // DELETE ORDER
  // --------------------------------------------------

  const DeleteOrder = async (item) => {
    if (!item?.id) return;

    setOpened(false);

    try {
      await db
        .collection("ordersGur")
        .doc(item.id)
        .delete();

      notifications.show({
        title: "Delete Successfully",
        message: `Order ID: #${item.orderID || item.id} has been deleted.`,
        color: "orange",
      });

      setFilterOrder(null);
    } catch (error) {
      console.error("Delete order error:", error);

      notifications.show({
        title: "Delete Failed",
        message: error.message || "Unable to delete order.",
        color: "red",
      });
    }
  };

  // --------------------------------------------------
  // FIREBASE ORDER LISTENER
  // --------------------------------------------------

  useEffect(() => {
    setLoading(true);

    const unSub = db
      .collection("ordersGur")
      .orderBy("created_at", "desc")
      .limit(30)
      .onSnapshot(
        (snap) => {
          const orderData = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          dispatch(updateOrder(orderData));
          setOrders(orderData);
          setLoading(false);
        },
        (error) => {
          console.error("Order loading error:", error);
          setLoading(false);

          notifications.show({
            title: "Order Loading Failed",
            message: error.message,
            color: "red",
          });
        }
      );

    return () => unSub();
  }, [dispatch]);

  // --------------------------------------------------
  // CONFIG LISTENER
  // --------------------------------------------------

  useEffect(() => {
    const unSub = db.collection("config").onSnapshot(
      (snap) => {
        const configData = snap.docs.map((doc) => doc.data());
        dispatch(updateConfig(configData));
      },
      (error) => {
        console.error("Config loading error:", error);
      }
    );

    return () => unSub();
  }, [dispatch]);

  // --------------------------------------------------
  // PATHAO COURIER RESEND
  // --------------------------------------------------

  const retryCourier = async (item) => {
    const orderID = item.orderID || item.id;

    try {
      const orderPayload = {
        store_id: 344188,
        merchant_order_id: `${orderID}`,
        recipient_name: `${item?.customer?.name || ""}`,
        recipient_phone: `${item?.customer?.phone || ""}`,
        recipient_address: `${item?.shipping_address?.street || ""}`,
        delivery_type: 48,
        item_type: 2,
        special_instruction: `${item?.notes || ""}`,
        item_quantity: 1,
        item_weight: `${item?.totals?.qtySum || 1}`,
        item_description: `${item?.notes || ""}`,
        amount_to_collect: `${item?.totals?.cod || 0}`,
      };

      const resp = await fetch(
        "/api/pathaoAamWala/place-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderPayload),
        }
      );

      const result = await resp.json();

      if (!resp.ok || result?.type === "error") {
        throw new Error(
          result?.message || "Pathao order failed"
        );
      }

      const fulfillmentPatch = {
        courier: "Pathao",

        consignment_id:
          result?.data?.consignment_id ??
          result?.data?.data?.consignment_id ??
          null,

        tracking_code:
          result?.data?.tracking_code ??
          result?.data?.data?.tracking_code ??
          null,

        pathao_raw: result?.data,
      };

      const normalized = {
        ...item,
        fulfillment: {
          ...fulfillmentPatch,
        },
      };

      await db
        .collection("ordersGur")
        .doc(item.id)
        .update(normalized);

      notifications.show({
        title: "Pathao Success",
        message: `Order sent successfully${
          fulfillmentPatch.consignment_id
            ? ` · CN: ${fulfillmentPatch.consignment_id}`
            : ""
        }`,
        color: "green",
        autoClose: 6000,
      });

    } catch (error) {
      console.error("Courier create failed:", error);

      notifications.show({
        title: "Courier Create Failed",
        message: error.message || "Please try again later.",
        color: "orange",
        autoClose: 6000,
      });
    }
  };

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  const pageSize = 15;

  const totalPages = Math.ceil(orders.length / pageSize);

  const paginatedOrders = orders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // --------------------------------------------------
  // ORDER SUMMARY
  // --------------------------------------------------

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (item) => item.status?.toLowerCase() === "pending"
  ).length;

  const processingOrders = orders.filter(
    (item) => item.status?.toLowerCase() === "processing"
  ).length;

  const shippedOrders = orders.filter(
    (item) => item.status?.toLowerCase() === "shipped"
  ).length;

  const deliveredOrders = orders.filter(
    (item) => item.status?.toLowerCase() === "delivered"
  ).length;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
   <main className="w-full min-w-0 max-w-full overflow-x-hidden space-y-5">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <MdOutlineShoppingBag size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-800">
              All Orders
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              View and manage all your store orders
            </p>
          </div>

        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Live Order Updates
        </span>

      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">

        {[
          {
            title: "Total Orders",
            value: totalOrders,
            icon: MdOutlineShoppingBag,
            color: "blue",
          },
          {
            title: "Pending",
            value: pendingOrders,
            icon: TbRefresh,
            color: "amber",
          },
          {
            title: "Processing",
            value: processingOrders,
            icon: FiEdit,
            color: "indigo",
          },
          {
            title: "Shipped",
            value: shippedOrders,
            icon: MdOutlineLocalShipping,
            color: "teal",
          },
          {
            title: "Delivered",
            value: deliveredOrders,
            icon: TbTruckDelivery,
            color: "green",
          },
        ].map((card) => {

          const colors = {
            blue: "bg-blue-50 text-blue-600",
            amber: "bg-amber-50 text-amber-600",
            indigo: "bg-indigo-50 text-indigo-600",
            teal: "bg-teal-50 text-teal-600",
            green: "bg-green-50 text-green-600",
          };

          return (
            <div
              key={card.title}
              className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    {card.title}
                  </p>

                  <h3 className="mt-2 text-2xl font-bold text-gray-800">
                    {String(card.value).padStart(2, "0")}
                  </h3>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${colors[card.color]}`}
                >
                  <card.icon size={21} />
                </div>

              </div>
            </div>
          );
        })}

      </div>

      {/* ORDER TABLE */}

     <section className="w-full min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        {/* TABLE HEADER */}

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-white via-blue-50/40 to-indigo-50/40 px-4 py-4 sm:px-5">

          <div>
            <h3 className="text-base font-bold text-gray-800">
              All Order Records
            </h3>

            <p className="mt-1 text-xs text-gray-400">
              Latest 30 orders from your store
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2">
            <FiUser className="text-blue-500" size={15} />

            <span className="text-xs font-semibold text-gray-600">
              {totalOrders} Orders
            </span>
          </div>

        </div>

        {/* LOADING */}

        {loading ? (

          <div className="flex flex-col items-center justify-center py-20">

            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-gray-500">
              Loading orders...
            </p>

          </div>

        ) : !orders.length ? (

          <div className="p-8">
            <NotFound text="order" />
          </div>

        ) : (

          <div className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-visible overscroll-x-contain">

            <table className="w-full min-w-[1550px] border-collapse text-left">

              {/* TABLE HEAD */}

              <thead className="sticky top-0 z-10 bg-gray-50">

                <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500">

                  <th className="px-4 py-4">Order ID</th>

                  <th className="px-4 py-4">Courier</th>

                  <th className="px-4 py-4">Consignment</th>

                  <th className="px-4 py-4">Customer</th>

                  <th className="px-4 py-4">Phone</th>

                  <th className="px-4 py-4 text-right">Discount</th>

                  <th className="px-4 py-4 text-right">Paid</th>

                  <th className="px-4 py-4 text-right">COD</th>

                  <th className="px-4 py-4">Status</th>

                  {canChangeStatus && (
                    <th className="px-4 py-4">Update Status</th>
                  )}

                  <th className="px-4 py-4">Source</th>

                  <th className="px-4 py-4">Category</th>

                  <th className="px-4 py-4">Created At</th>

                  <th className="px-4 py-4">Created By</th>

                  <th className="px-4 py-4 text-center">Invoice</th>

                  <th className="px-4 py-4 text-center">Actions</th>

                </tr>

              </thead>

              {/* TABLE BODY */}

              <tbody className="divide-y divide-gray-100">

                {paginatedOrders.map((item) => {

                  const isDelivered =
                    item.status?.toLowerCase() === "delivered";

                  const isUrgent =
                    item.customer_details?.markAs === "Argent";

                  return (

                    <tr
                      key={item.id}
                      className={`group transition-all duration-200 hover:bg-blue-50/60 ${
                        item.isFilter
                          ? "bg-sky-50"
                          : isDelivered || isUrgent
                          ? "bg-green-50/40"
                          : "bg-white"
                      }`}
                    >

                      {/* ORDER ID */}

                      <td className="px-4 py-4">

                        <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                          #{item.orderID || item.id}
                        </span>

                      </td>

                      {/* COURIER */}

                      <td className="px-4 py-4">

                        <span className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <MdOutlineLocalShipping
                            className="text-blue-500"
                            size={17}
                          />

                          {item?.fulfillment?.courier || "Not Assigned"}
                        </span>

                      </td>

                      {/* CONSIGNMENT */}

                      <td className="px-4 py-4">

                        {(item?.fulfillment?.courier === "Pathao" &&
                          item?.fulfillment?.consignment_id) ||
                        item?.fulfillment?.courier !== "Pathao" ? (

                          <Link
                            href={
                              item?.fulfillment?.courier === "Pathao"
                                ? `https://merchant.pathao.com/courier/orders/${item?.fulfillment?.consignment_id}`
                                : `https://steadfast.com.bd/user/consignment/${item?.fulfillment?.consignment_id}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >

                            <span className="cursor-pointer text-xs font-semibold text-blue-600 hover:underline">
                              {item?.fulfillment?.consignment_id || "—"}
                            </span>

                          </Link>

                        ) : (

                          <button
                            type="button"
                            onClick={() => retryCourier(item)}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-600 hover:text-white"
                          >
                            <IoIosSend size={15} />
                            Resend
                          </button>

                        )}

                      </td>

                      {/* CUSTOMER */}

                      <td className="px-4 py-4">

                        <div className="flex items-center gap-2.5">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                            <FiUser size={16} />
                          </div>

                          <div className="min-w-0">

                            <p className="max-w-[170px] truncate text-xs font-bold text-gray-800">
                              {item.customer?.name || "Unknown Customer"}
                            </p>

                            {item?.shipping_address?.city && (
                              <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                                <FiMapPin size={10} />
                                {item.shipping_address.city}
                              </p>
                            )}

                          </div>

                        </div>

                      </td>

                      {/* PHONE */}

                      <td className="px-4 py-4">

                        <a
                          href={`tel:${item.customer?.phone || ""}`}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 transition hover:text-blue-600"
                        >
                          <FiPhone size={13} className="text-blue-500" />
                          {item.customer?.phone || "—"}
                        </a>

                      </td>

                      {/* DISCOUNT */}

                      <td className="px-4 py-4 text-right">

                        <span className="text-xs font-semibold text-red-500">
                          -৳{formatMoney(item?.totals?.discount)}
                        </span>

                      </td>

                      {/* PAID */}

                      <td className="px-4 py-4 text-right">

                        <span className="text-xs font-semibold text-green-600">
                          ৳{formatMoney(item?.totals?.payment)}
                        </span>

                      </td>

                      {/* COD */}

                      <td className="px-4 py-4 text-right">

                        <span className="text-sm font-bold text-gray-800">
                          ৳{formatMoney(item?.totals?.cod)}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">

                        <StatusBadge status={item.status} />

                      </td>

                      {/* UPDATE STATUS */}

                      {canChangeStatus && (

                        <td className="px-4 py-4">

                          <select
                            value={item.status || "pending"}
                            onChange={(e) =>
                              onStatusChanged(e, item.id)
                            }
                            className="h-9 w-32 cursor-pointer rounded-xl border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >

                            <option value="pending">Pending</option>

                            {role !== "Sales Manager" && (
                              <option value="processing">Processing</option>
                            )}

                            {role !== "Sales Manager" && (
                              <option value="shipped">Shipped</option>
                            )}

                            {role !== "Sales Manager" && (
                              <option value="delivered">Delivered</option>
                            )}

                            <option value="hold">Hold</option>

                            {role !== "Sales Manager" && (
                              <option value="returned">Returned</option>
                            )}

                            <option value="cancelled">Cancelled</option>

                          </select>

                        </td>

                      )}

                      {/* SOURCE */}

                      <td className="px-4 py-4">

                        <span className="inline-flex rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold capitalize text-indigo-600">
                          {item?.meta?.source || "Other"}
                        </span>

                      </td>

                      {/* CATEGORY */}

                      <td className="px-4 py-4">

                        <span className="inline-flex rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold uppercase text-gray-600">
                          {item?.categories || "—"}
                        </span>

                      </td>

                      {/* CREATED AT */}

                      <td className="px-4 py-4">

                        <span className="whitespace-nowrap text-xs font-medium text-gray-600">
                          {item?.created_at
                            ? formatDates(item.created_at)
                            : "—"}
                        </span>

                      </td>

                      {/* CREATED BY */}

                      <td className="px-4 py-4">

                        <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-gray-600">

                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <FiUser size={13} />
                          </span>

                          {item?.created_user || "Unknown"}

                        </span>

                      </td>

                      {/* INVOICE */}

                      <td className="px-4 py-4 text-center">

                        <Link href={`/orders-gur/invoice/id=${item.id}`}>

                          <Tooltip label="View Invoice" withArrow>

                            <span className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition hover:bg-blue-600 hover:text-white">
                              <HiOutlineDocumentDownload size={18} />
                            </span>

                          </Tooltip>

                        </Link>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4">

                        <div className="flex items-center justify-center gap-2">

                          {(item.status === "pending" &&
                            role === "Sales Executive") ||
                          isSalesManager ? (

                            <Link
                              href={`/place-order/edit-order/id=${item.id}`}
                            >

                              <ActionButton
                                title="Edit Order"
                                color="blue"
                              >
                                <FiEdit size={16} />
                              </ActionButton>

                            </Link>

                          ) : canManageOrders ? null : (

                            <ActionButton
                              title="Not Available"
                              color="gray"
                            >
                              <FiEdit size={16} />
                            </ActionButton>

                          )}

                          {canManageOrders && (

                            <>

                              {isHR && (

                                <ActionButton
                                  title="Delete Order"
                                  color="red"
                                  onClick={() => deleteItem(item)}
                                >
                                  <RiDeleteBinLine size={17} />
                                </ActionButton>

                              )}

                              {isHR && (

                                <ActionButton
                                  title="Print Sticker"
                                  color="blue"
                                  onClick={() => stickerStatus(item)}
                                >
                                  <FaPrint size={15} />
                                </ActionButton>

                              )}

                              <Link
                                href={`/place-gur/edit-order/id=${item.id}`}
                              >

                                <ActionButton
                                  title="Edit Order"
                                  color="blue"
                                >
                                  <FiEdit size={16} />
                                </ActionButton>

                              </Link>

                              <ActionButton
                                title="Print Invoice"
                                color="green"
                                onClick={() => statusUpdate(item)}
                              >
                                <AiOutlinePrinter size={18} />
                              </ActionButton>

                            </>

                          )}

                        </div>

                      </td>

                    </tr>

                  );
                })}

              </tbody>

            </table>

          </div>

        )}

        {/* TABLE FOOTER */}

        {!loading && orders.length > 0 && (

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-4 sm:px-5">

            <p className="text-xs text-gray-500">
              Showing{" "}
              <strong className="text-gray-700">
                {(page - 1) * pageSize + 1}
              </strong>
              {" - "}
              <strong className="text-gray-700">
                {Math.min(page * pageSize, totalOrders)}
              </strong>
              {" of "}
              <strong className="text-gray-700">
                {totalOrders}
              </strong>
              {" orders"}
            </p>

            {totalPages > 1 && (

              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                boundaries={1}
                siblings={1}
                color="blue"
                radius="md"
                size="sm"
              />

            )}

          </div>

        )}

      </section>

      {/* DELETE CONFIRMATION MODAL */}

      <Modal
        opened={opened}
        onClose={closeModal}
        centered
        withCloseButton={false}
        radius="xl"
        size="md"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >

        <div className="overflow-hidden rounded-2xl">

          <div className="flex flex-col items-center px-5 py-7 text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <RiDeleteBinLine size={30} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-800">
              Delete Order?
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to delete this order?
              This action cannot be undone.
            </p>

            {filterOrder && (

              <div className="mt-5 w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 text-left">

                <div className="flex items-center justify-between gap-2">

                  <span className="text-xs font-medium text-gray-400">
                    Order ID
                  </span>

                  <span className="text-sm font-bold text-blue-600">
                    #{filterOrder.orderID || filterOrder.id}
                  </span>

                </div>

                <div className="my-3 h-px bg-gray-200" />

                <div className="flex items-center justify-between gap-2">

                  <span className="text-xs font-medium text-gray-400">
                    Customer
                  </span>

                  <span className="text-sm font-semibold text-gray-700">
                    {filterOrder?.customer?.name ||
                      filterOrder?.customer_details?.customer_name ||
                      "Unknown"}
                  </span>

                </div>

                <div className="mt-3 flex items-center justify-between gap-2">

                  <span className="text-xs font-medium text-gray-400">
                    COD Amount
                  </span>

                  <span className="text-sm font-bold text-gray-800">
                    ৳{formatMoney(filterOrder?.totals?.cod)}
                  </span>

                </div>

                <div className="mt-3 flex items-center justify-between gap-2">

                  <span className="text-xs font-medium text-gray-400">
                    Status
                  </span>

                  <StatusBadge status={filterOrder.status} />

                </div>

              </div>

            )}

            <div className="mt-6 grid w-full grid-cols-2 gap-3">

              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => DeleteOrder(filterOrder)}
                disabled={!filterOrder}
                className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
              >
                Yes, Delete
              </button>

            </div>

          </div>

        </div>

      </Modal>

    </main>
  );
};

export default AllOrder;
