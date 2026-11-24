import React, { useEffect, useState } from "react";
import { Tooltip, Modal, Pagination, Select } from "@mantine/core";
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
import { MdOutlineLocalShipping, MdOutlineShoppingBag } from "react-icons/md";
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

  return (
    STATUS_CONFIG[key] || {
      label: status || "Unknown",
      color: "bg-gray-100 text-gray-600 border-gray-200",
      dot: "bg-gray-400",
    }
  );
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

const ActionButton = ({ title, onClick, children, color = "gray" }) => {
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const AllOrder = () => {
  const dispatch = useDispatch();

  const order = useSelector(selectOrder);
  const user = useSelector(selectUser);

  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [loading, setLoading] = useState(true);
  const [cloading, setCloading] = useState(false);
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);

  // Bulk Pathao state
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({
    completed: 0,
    total: 0,
    batch: 0,
    countdown: 0,
    currentOrderId: "",
  });
  const [bulkResults, setBulkResults] = useState({});

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

  const updateStatus = async (item, newStatus, options = {}) => {
    const { silent = false } = options;

    try {
      const success = await updateOrderStatusGur(db, item.id, item, newStatus);

      if (success) {
        if (!silent) {
          notifications.show({
            title: "Status Updated Successfully",
            message: `Order #${item.orderID || item.id} status changed to ${newStatus}.`,
            color: "blue",
            autoClose: 4000,
          });
        }
        setOpened(false);
        return true;
      }

      if (!silent) {
        notifications.show({
          title: "Status Update Failed",
          message: "An error occurred while updating the status.",
          color: "red",
          autoClose: 5000,
        });
      }
      return false;
    } catch (error) {
      console.error("Status update error:", error);
      if (!silent) {
        notifications.show({
          title: "Status Update Failed",
          message: error.message || "Please try again.",
          color: "red",
        });
      }
      return false;
    }
  };

  // With an id: update one row. Without an id: update selected rows only.
  const onStatusChanged = async (e, id) => {
    const newStatus = e.target.value;
    if (!newStatus) return;

    if (id) {
      const selectedOrder = orders.find((item) => item.id === id);
      if (selectedOrder) await updateStatus(selectedOrder, newStatus);
      return;
    }

    const selectedOrdersForStatus = orders.filter((item) =>
      selectedOrderIds.includes(item.id)
    );

    if (!selectedOrdersForStatus.length) return;

    setBulkStatusLoading(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      // Sequential writes keep the bulk operation controlled and reportable.
      for (const selectedOrder of selectedOrdersForStatus) {
        const success = await updateStatus(selectedOrder, newStatus, { silent: true });
        if (success) successCount += 1;
        else failedCount += 1;
      }

      notifications.show({
        title: "Bulk Status Update Completed",
        message: `${successCount} order(s) updated to ${newStatus}${failedCount ? ` · ${failedCount} failed` : ""}.`,
        color: failedCount ? "orange" : "green",
        autoClose: 6000,
      });
    } finally {
      setBulkStatusLoading(false);
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
      await db.collection("ordersGur").doc(item.id).delete();

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
      .limit(500)
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
        },
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
      },
    );

    return () => unSub();
  }, [dispatch]);

  // --------------------------------------------------
  // PATHAO COURIER RESEND
  // --------------------------------------------------

  const retryCourier = async (item) => {
    setCloading(true);
    const orderID = item.orderID || item.id;
    const list = item?.items
      .map(
        (item, index) =>
          `${index + 1}. ${item.title} (Qty: ${item.quantity}, Price: ${item.line_total})`,
      )
      .join("\n");

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
        item_description: list,
        amount_to_collect: `${item?.totals?.cod || 0}`,
      };

      const resp = await fetch("/api/pathaoAamWala/place-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await resp.json();

      if (!resp.ok || result?.type === "error") {
        throw new Error(result?.message || "Pathao order failed");
      }

      const fulfillmentPatch = {
        ...item.fulfillment,
        status: "fulfilled",
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

      await db.collection("ordersGur").doc(item.id).update({
        fulfillment: fulfillmentPatch,
      });

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
    setCloading(false)
  };

  // --------------------------------------------------
  // BULK PATHAO COURIER
  // --------------------------------------------------

  const selectedOrders = orders.filter((item) =>
    selectedOrderIds.includes(item.id)
  );

  const eligibleBulkOrders = selectedOrders.filter(
    (item) =>
      String(item?.fulfillment?.status || "").toLowerCase() === "unfulfilled" &&
      bulkResults[item.id]?.status !== "success"
  );

  // Result priority in the courier modal:
  // 1) Failed / error orders at the very top
  // 2) Sending, waiting and successful orders (success stays visible for 3s)
  // 3) Completed successes below active orders
  // 4) Skipped / already fulfilled orders at the very bottom
  const sortedBulkOrders = [...selectedOrders].sort((a, b) => {
    const getPriority = (item) => {
      const result = bulkResults[item.id];
      const resultStatus = result?.status;
      const fulfillmentStatus = String(
        item?.fulfillment?.status || ""
      ).toLowerCase();

      if (resultStatus === "error") return 0;
      if (resultStatus === "sending") return 1;
      if (resultStatus === "success" && !result?.moveToBottom) return 1;
      if (resultStatus === "success" && result?.moveToBottom) return 2;
      if (resultStatus === "skipped") return 3;

      // Orders already fulfilled before this bulk attempt are treated as skipped.
      if (fulfillmentStatus !== "unfulfilled") return 3;
      // Eligible orders not yet processed remain above the completed/skipped group.
      return 1;
    };

    return getPriority(a) - getPriority(b);
  });

  const bulkSuccessCount = Object.values(bulkResults).filter(
    (result) => result?.status === "success"
  ).length;
  const bulkFailedCount = Object.values(bulkResults).filter(
    (result) => result?.status === "error"
  ).length;
  const bulkSkippedCount = selectedOrders.filter((item) => {
    const resultStatus = bulkResults[item.id]?.status;
    const fulfillmentStatus = String(
      item?.fulfillment?.status || ""
    ).toLowerCase();

    return (
      resultStatus === "skipped" ||
      (fulfillmentStatus !== "unfulfilled" &&
        resultStatus !== "success" &&
        resultStatus !== "error")
    );
  }).length;

  const toggleOrderSelection = (orderId) => {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((id) => id !== orderId)
        : [...current, orderId]
    );
  };

  const toggleAllOrdersSelection = () => {
    // Select/deselect only the rows visible on the current page.
    // Selections from other pages remain selected.
    const currentPageIds = paginatedOrders.map((item) => item.id);
    const allCurrentPageSelected =
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => selectedOrderIds.includes(id));

    setSelectedOrderIds((current) =>
      allCurrentPageSelected
        ? current.filter((id) => !currentPageIds.includes(id))
        : [...new Set([...current, ...currentPageIds])]
    );
  };

  const openBulkCourierModal = () => {
    if (!selectedOrderIds.length) {
      notifications.show({
        title: "No orders selected",
        message: "Please select at least one order.",
        color: "orange",
      });
      return;
    }

    setBulkResults({});
    setBulkProgress({
      completed: 0,
      total: eligibleBulkOrders.length,
      batch: 0,
      countdown: 0,
      currentOrderId: "",
    });
    setBulkModalOpen(true);
  };

  const sendOneOrderToPathao = async (item) => {
    const orderID = item.orderID || item.id;
    const itemDescription = (item?.items || [])
      .map(
        (product, index) =>
          `${index + 1}. ${product.title} (Qty: ${product.quantity}, Price: ${product.line_total})`
      )
      .join("\\n");

    const orderPayload = {
      store_id: 344188,
      merchant_order_id: String(orderID),
      recipient_name: String(item?.customer?.name || ""),
      recipient_phone: String(item?.customer?.phone || ""),
      recipient_address: String(item?.shipping_address?.street || ""),
      delivery_type: 48,
      item_type: 2,
      special_instruction: String(item?.notes || ""),
      item_quantity: 1,
      item_weight: String(item?.totals?.qtySum || 1),
      item_description: itemDescription,
      amount_to_collect: String(item?.totals?.cod || 0),
    };

    const resp = await fetch("/api/pathaoAamWala/place-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    let result;
    try {
      result = await resp.json();
    } catch {
      throw new Error("Pathao returned an invalid response.");
    }

    if (!resp.ok || result?.type === "error") {
      throw new Error(result?.message || "Pathao order failed.");
    }

    const responseData = result?.data || {};
    const nestedData = responseData?.data || {};
    const fulfillmentPatch = {
      ...item.fulfillment,
      status: "fulfilled",
      courier: "Pathao",
      consignment_id:
        responseData?.consignment_id ??
        nestedData?.consignment_id ??
        null,
      tracking_code:
        responseData?.tracking_code ??
        nestedData?.tracking_code ??
        null,
      pathao_raw: responseData,
    };

    // Update only fulfillment; preserve all other order fields.
    await db.collection("ordersGur").doc(item.id).update({
      fulfillment: fulfillmentPatch,
    });

    return fulfillmentPatch;
  };

  const startBulkPathao = async () => {
    // Re-check status at start so stale table data cannot send an ineligible order.
    const currentSelected = orders.filter((item) =>
      selectedOrderIds.includes(item.id)
    );
    const eligible = currentSelected.filter(
      (item) =>
        String(item?.fulfillment?.status || "").toLowerCase() === "unfulfilled" &&
        bulkResults[item.id]?.status !== "success"
    );

    if (!eligible.length) {
      notifications.show({
        title: "No eligible orders",
        message: "Only orders with fulfillment status 'unfulfilled' can be sent.",
        color: "orange",
      });
      return;
    }

    setBulkLoading(true);
    setBulkResults({});
    setBulkProgress({
      completed: 0,
      total: eligible.length,
      batch: 1,
      countdown: 0,
      currentOrderId: "",
    });

    let completed = 0;

    try {
      for (let index = 0; index < eligible.length; index += 20) {
        const batch = eligible.slice(index, index + 20);
        const batchNumber = Math.floor(index / 20) + 1;

        setBulkProgress((prev) => ({
          ...prev,
          batch: batchNumber,
          countdown: 0,
        }));

        for (const item of batch) {
          const orderID = item.orderID || item.id;

          setBulkProgress((prev) => ({
            ...prev,
            currentOrderId: String(orderID),
          }));

          try {
            // Show an immediate per-order loading state while this order is
            // being checked and submitted to Pathao.
            setBulkResults((prev) => ({
              ...prev,
              [item.id]: {
                status: "sending",
                consignmentId: "",
                message: "Sending to Pathao...",
              },
            }));

            // Check the latest fulfillment status before sending.
            const latestSnap = await db
              .collection("ordersGur")
              .doc(item.id)
              .get();

            if (!latestSnap.exists) {
              throw new Error("Order no longer exists in Firestore.");
            }

            const latestOrder = {
              id: latestSnap.id,
              ...latestSnap.data(),
            };

            if (
              String(latestOrder?.fulfillment?.status || "").toLowerCase() !==
              "unfulfilled"
            ) {
              throw new Error("Skipped: order is no longer unfulfilled.");
            }

            const fulfillment = await sendOneOrderToPathao(latestOrder);

            const consignmentId =
              fulfillment?.consignment_id ||
              fulfillment?.pathao_raw?.consignment_id ||
              fulfillment?.pathao_raw?.data?.consignment_id ||
              "";

            // First stop the spinner and show the courier ID + Success result.
            // Keep the row in the active/top section momentarily so the result
            // is visible, then move it to the fulfilled section below.
            setBulkResults((prev) => ({
              ...prev,
              [item.id]: {
                status: "success",
                moveToBottom: false,
                consignmentId,
                message: "Successfully submitted to Pathao",
              },
            }));

            // Keep Consignment ID + Success visible before reordering the row.
            await sleep(300);

            setBulkResults((prev) => ({
              ...prev,
              [item.id]: {
                ...prev[item.id],
                status: "success",
                moveToBottom: true,
              },
            }));
          } catch (error) {
            const errorMessage = error?.message || "Courier submission failed";
            const wasSkipped = errorMessage.toLowerCase().startsWith("skipped:");

            setBulkResults((prev) => ({
              ...prev,
              [item.id]: {
                status: wasSkipped ? "skipped" : "error",
                consignmentId: "",
                message: errorMessage,
              },
            }));
          }

          completed += 1;
          setBulkProgress((prev) => ({
            ...prev,
            completed,
          }));
        }

        // Wait 30 seconds after each full batch, only if another batch remains.
        if (index + 20 < eligible.length) {
          for (let seconds = 30; seconds > 0; seconds -= 1) {
            setBulkProgress((prev) => ({ ...prev, countdown: seconds }));
            await sleep(1000);
          }
        }
      }

      notifications.show({
        title: "Bulk Pathao process completed",
        message: `${eligible.length} eligible order(s) processed. Check each order's result below.`,
        color: "green",
        autoClose: 7000,
      });
    } finally {
      setBulkLoading(false);
      setBulkProgress((prev) => ({
        ...prev,
        countdown: 0,
        currentOrderId: "",
      }));
    }
  };

  // --------------------------------------------------
  // PAGINATION
  // --------------------------------------------------

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));

  const paginatedOrders = orders.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const currentPageOrderIds = paginatedOrders.map((item) => item.id);
  const allCurrentPageSelected =
    currentPageOrderIds.length > 0 &&
    currentPageOrderIds.every((id) => selectedOrderIds.includes(id));
  const someCurrentPageSelected = currentPageOrderIds.some((id) =>
    selectedOrderIds.includes(id)
  );

  const handlePageSizeChange = (event) => {
    const nextSize = Number(event.target.value);
    setPageSize(nextSize);
    setPage(1);
  };

  useEffect(() => {
    const nextTotalPages = Math.max(1, Math.ceil(orders.length / pageSize));
    if (page > nextTotalPages) setPage(nextTotalPages);
  }, [orders.length, page, pageSize]);

  // --------------------------------------------------
  // ORDER SUMMARY
  // --------------------------------------------------

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (item) => item.status?.toLowerCase() === "pending",
  ).length;

  const processingOrders = orders.filter(
    (item) => item.status?.toLowerCase() === "processing",
  ).length;

  const shippedOrders = orders.filter(
    (item) => item.status?.toLowerCase() === "shipped",
  ).length;

  const deliveredOrders = orders.filter(
    (item) => item.status?.toLowerCase() === "delivered",
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
              Latest {totalOrders} orders from your store
            </p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {/* Total order counter */}
            <div className="inline-flex min-h-[46px] w-full items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white px-3.5 py-2.5 shadow-sm sm:w-auto sm:justify-start">
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <MdOutlineShoppingBag size={17} />
                </span>
                <span className="text-xs font-semibold text-slate-600">
                  Total Orders
                </span>
              </span>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-extrabold tabular-nums text-blue-700">
                {totalOrders}
              </span>
            </div>

            {selectedOrderIds.length > 0 && canChangeStatus && (
              <label className="flex min-h-[46px] w-full min-w-0 items-center gap-3 rounded-2xl border border-indigo-100 bg-white px-3.5 py-2 shadow-sm transition-colors focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 sm:w-auto sm:min-w-[245px]">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FiEdit size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-500">
                    Bulk Status
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">
                      {selectedOrderIds.length} selected
                    </span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <Select
                      key={`bulk-status-${selectedOrderIds.length}`}
                      placeholder={bulkStatusLoading ? "Updating..." : "Choose status"}
                      defaultValue={null}
                      onChange={(value) => {
                        if (value) onStatusChanged({ target: { value } });
                      }}
                      disabled={bulkStatusLoading}
                      data={[
                        { value: "pending", label: "Pending" },
                        ...(role !== "Sales Manager"
                          ? [
                              { value: "processing", label: "Processing" },
                              { value: "shipped", label: "Shipped" },
                              { value: "delivered", label: "Delivered" },
                            ]
                          : []),
                      ]}
                      allowDeselect={false}
                      searchable={false}
                      checkIconPosition="right"
                      comboboxProps={{
                        withinPortal: true,
                        position: "bottom-start",
                        shadow: "md",
                        offset: 8,
                      }}
                      aria-label="Change status for selected orders"
                      className="min-w-0 flex-1"
                      styles={{
                        input: {
                          minHeight: 32,
                          height: 32,
                          paddingLeft: 11,
                          paddingRight: 30,
                          border: "1px solid #e0e7ff",
                          borderRadius: 10,
                          backgroundColor: "#f8faff",
                          color: "#334155",
                          fontSize: 12,
                          fontWeight: 700,
                          transition: "all 160ms ease",
                        },
                        dropdown: {
                          padding: 6,
                          border: "1px solid #e0e7ff",
                          borderRadius: 14,
                          backgroundColor: "#ffffff",
                          boxShadow: "0 14px 35px rgba(30, 41, 59, 0.14)",
                        },
                        option: {
                          minHeight: 36,
                          borderRadius: 9,
                          padding: "8px 10px",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#334155",
                        },
                      }}
                    />
                  </span>
                </span>
                {bulkStatusLoading && (
                  <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                )}
              </label>
            )}

            {selectedOrderIds.length > 0 && (
              <button
                type="button"
                onClick={openBulkCourierModal}
                disabled={bulkLoading || bulkStatusLoading}
                className="group inline-flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_5px_14px_rgba(5,150,105,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:from-emerald-700 hover:to-green-700 hover:shadow-[0_8px_18px_rgba(5,150,105,0.24)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
              >
                {bulkLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <IoIosSend size={17} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                )}
                <span>
                  {bulkLoading ? "Preparing orders..." : "Send to Pathao"}
                </span>
                <span className="rounded-lg bg-white/20 px-2 py-1 text-[11px] font-extrabold tabular-nums">
                  {selectedOrderIds.length}
                </span>
              </button>
            )}
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
                  <th className="px-4 py-4">
                    <input
                      type="checkbox"
                      aria-label="Select all orders on current page"
                      checked={allCurrentPageSelected}
                      ref={(element) => {
                        if (element) {
                          element.indeterminate =
                            someCurrentPageSelected && !allCurrentPageSelected;
                        }
                      }}
                      onChange={toggleAllOrdersSelection}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
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

                  const isUrgent = item.customer_details?.markAs === "Argent";

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
                      {/* SELECT ORDER */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Select order ${item.orderID || item.id}`}
                          checked={selectedOrderIds.includes(item.id)}
                          onChange={() => toggleOrderSelection(item.id)}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

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
                            disabled={cloading}
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
                            onChange={(e) => onStatusChanged(e, item.id)}
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
                              <ActionButton title="Edit Order" color="blue">
                                <FiEdit size={16} />
                              </ActionButton>
                            </Link>
                          ) : canManageOrders ? null : (
                            <ActionButton title="Not Available" color="gray">
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
                                <ActionButton title="Edit Order" color="blue">
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                Rows per page
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  aria-label="Rows per page"
                >
                  {[15, 50, 100, 200, 500].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-xs text-gray-500">
                Showing{" "}
                <strong className="text-gray-700">
                  {totalOrders === 0 ? 0 : (page - 1) * pageSize + 1}
                </strong>
                {" - "}
                <strong className="text-gray-700">
                  {Math.min(page * pageSize, totalOrders)}
                </strong>
                {" of "}
                <strong className="text-gray-700">{totalOrders}</strong>
                {" orders"}
              </p>
              {selectedOrderIds.length > 0 && (
                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  {selectedOrderIds.length} selected across pages
                </span>
              )}
            </div>
          </div>
        )}
        {!loading && orders.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-4 sm:px-5">
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

      {/* BULK PATHAO CONFIRMATION MODAL */}
      <Modal
        opened={bulkModalOpen}
        onClose={() => {
          if (!bulkLoading) setBulkModalOpen(false);
        }}
        centered
        size="xl"
        radius="xl"
        title={
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Bulk Pathao Courier Entry
            </h2>
            <p className="text-xs font-normal text-gray-500">
              Review selected orders before submitting
            </p>
          </div>
        }
        closeOnClickOutside={!bulkLoading}
        closeOnEscape={!bulkLoading}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs text-blue-600">Selected</p>
              <p className="mt-1 text-2xl font-bold text-blue-800">
                {selectedOrders.length}
              </p>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
              <p className="text-xs text-indigo-600">Ready to send</p>
              <p className="mt-1 text-2xl font-bold text-indigo-800">
                {eligibleBulkOrders.length}
              </p>
            </div>
            <div className="rounded-xl border border-green-100 bg-green-50 p-3">
              <p className="text-xs text-green-600">Successful</p>
              <p className="mt-1 text-2xl font-bold text-green-800">
                {bulkSuccessCount}
              </p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs text-amber-600">Skipped</p>
              <p className="mt-1 text-2xl font-bold text-amber-800">
                {bulkSkippedCount}
              </p>
            </div>
            <div className="rounded-xl border border-red-100 bg-red-50 p-3">
              <p className="text-xs text-red-600">Failed</p>
              <p className="mt-1 text-2xl font-bold text-red-800">
                {bulkFailedCount}
              </p>
            </div>
          </div>

          <div className="max-h-[45vh] overflow-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="sticky top-0 bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-3 py-3">Order ID</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Fulfillment</th>
                  <th className="px-3 py-3">Pathao Consignment ID</th>
                  <th className="px-3 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedBulkOrders.map((item) => {
                  const result = bulkResults[item.id];
                  const isEligible =
                    String(item?.fulfillment?.status || "").toLowerCase() ===
                    "unfulfilled" && result?.status !== "success";
                  const displayFulfillmentStatus =
                    result?.status === "sending"
                      ? "Sending to Pathao..."
                      : result?.status === "success"
                      ? "fulfilled"
                      : item?.fulfillment?.status || "Missing";

                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-3 font-bold text-blue-700">
                        #{item.orderID || item.id}
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-700">
                        {item?.customer?.name ||
                          item?.customer_details?.customer_name ||
                          "Unknown"}
                      </td>
                      <td className="px-3 py-3">
                        {result?.status === "sending" ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-700">
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                            Sending...
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-2 py-1 font-semibold ${
                              isEligible
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {displayFulfillmentStatus}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-semibold text-indigo-700">
                        {result?.consignmentId ||
                          item?.fulfillment?.consignment_id ||
                          item?.fulfillment?.consignmentId ||
                          "—"}
                      </td>
                      <td className="px-3 py-3">
                        {result?.status === "success" ? (
                          <span className="font-semibold text-green-700">
                            Success
                          </span>
                        ) : result?.status === "error" ? (
                          <span
                            className="font-semibold text-red-600"
                            title={result.message}
                          >
                            Failed: {result.message}
                          </span>
                        ) : result?.status === "skipped" ? (
                          <span
                            className="font-semibold text-amber-700"
                            title={result.message}
                          >
                            Skipped: {result.message}
                          </span>
                        ) : result?.status === "sending" ? (
                          <span className="inline-flex items-center gap-2 font-semibold text-blue-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
                            Sending to courier
                          </span>
                        ) : !isEligible ? (
                          <span className="font-semibold text-amber-700">
                            Skipped
                          </span>
                        ) : (
                          <span className="text-gray-400">Waiting</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {bulkLoading && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-blue-800">
                  Processing batch {bulkProgress.batch}
                </p>
                <p className="text-xs font-semibold text-blue-700">
                  {bulkProgress.completed} / {bulkProgress.total} completed
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${
                      bulkProgress.total
                        ? (bulkProgress.completed / bulkProgress.total) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              {bulkProgress.countdown > 0 ? (
                <p className="mt-3 text-sm font-semibold text-amber-700">
                  Next batch starts in {bulkProgress.countdown} seconds...
                </p>
              ) : (
                <p className="mt-3 text-xs text-blue-700">
                  {bulkProgress.currentOrderId
                    ? `Sending order #${bulkProgress.currentOrderId}...`
                    : "Preparing next order..."}
                </p>
              )}
              <p className="mt-1 text-[11px] text-blue-600">
                20 orders per batch · 30-second pause between batches
              </p>
            </div>
          )}

          {!bulkLoading && bulkProgress.completed > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-bold text-gray-800">
                Courier request summary
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
                <span className="text-green-700">Successful: {bulkSuccessCount}</span>
                <span className="text-amber-700">Skipped: {bulkSkippedCount}</span>
                <span className="text-red-600">Failed: {bulkFailedCount}</span>
                <span className="text-gray-600">Attempted: {bulkProgress.completed}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              disabled={bulkLoading}
              onClick={() => setBulkModalOpen(false)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {bulkLoading ? "Processing..." : "Close"}
            </button>
            <button
              type="button"
              disabled={bulkLoading || eligibleBulkOrders.length === 0}
              onClick={startBulkPathao}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IoIosSend size={17} />
              {bulkLoading
                ? "Sending orders..."
                : `Confirm & Send ${eligibleBulkOrders.length} Orders`}
            </button>
          </div>
        </div>
      </Modal>

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
              Are you sure you want to delete this order? This action cannot be
              undone.
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
