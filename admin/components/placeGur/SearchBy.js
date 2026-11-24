import React, { useEffect, useState, useRef } from "react";
import Button from "@/app/components/shared/Button";
import { AiOutlineAppstoreAdd, AiOutlinePrinter } from "react-icons/ai";
import { db } from "@/app/utils/firebase";
import { useDispatch, useSelector } from "react-redux";
import {
  formatDates,
  generateStick,
  invoiceGenerate,
  updateOrderStatus,
  updateOrderStatusGur,
} from "@/admin/utils/helpers";
import singleOrderSlice, {
  updateSingleOrder,
} from "@/app/redux/slices/singleOrderSlice";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Tooltip } from "@mantine/core";
import { FaPrint } from "react-icons/fa";
import { useBarcode } from "next-barcode";
import { notifications } from "@mantine/notifications";
import { selectUser } from "@/app/redux/slices/authSlice";
import Link from "next/link";
import { HiOutlineDocumentDownload } from "react-icons/hi";
import { FiEdit } from "react-icons/fi";
import { selectOrder, updateOrder } from "@/app/redux/slices/orderSlice";
import { IoCall } from "react-icons/io5";
import BarcodeComponent from "@/admin/utils/BarcodeImage";
import { IoIosSend } from "react-icons/io";
import { IoSearchSharp } from "react-icons/io5";
import generateBulkPrintStickers from "../orderGur/generateBulkSticker";


// Keep the same status options used in the order-entry form.
const ORDER_STATUS = [
  { name: "Pending", id: "pending" },
  { name: "Processing", id: "processing" },
  { name: "Shipped", id: "shipped" },
  { name: "Delivered", id: "delivered" },
  { name: "Paid", id: "paid" },
  { name: "Fulfilled", id: "fulfilled" },
  { name: "Cancelled", id: "cancelled" },
  { name: "Refunded", id: "refunded" },
  { name: "Partially Refunded", id: "partially_refunded" },
];


// Convert Bengali/Arabic numerals and normalize Bangladesh mobile numbers.
const normalizeBangladeshPhone = (value = "") => {
  const digitMap = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  };

  let digits = String(value)
    .replace(/[০-৯٠-٩]/g, (digit) => digitMap[digit])
    .replace(/\D/g, "");

  if (digits.startsWith("00880")) digits = digits.slice(5);
  else if (digits.startsWith("880")) digits = digits.slice(3);
  else if (digits.startsWith("0") && digits.length === 12) digits = digits.slice(1);

  return digits;
};

const formatOrderDate = (value) => {
  if (!value) return "—";
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(date);
};

const getOrderStatusClass = (status = "") => {
  const key = String(status).toLowerCase();
  if (["delivered", "fulfilled", "paid"].includes(key)) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (["cancelled", "returned", "refunded"].includes(key)) return "bg-rose-50 text-rose-700 ring-rose-200";
  if (["shipped"].includes(key)) return "bg-sky-50 text-sky-700 ring-sky-200";
  if (["processing"].includes(key)) return "bg-indigo-50 text-indigo-700 ring-indigo-200";
  return "bg-amber-50 text-amber-700 ring-amber-200";
};

const SearchBy = ({ onClick }) => {
  const searchPrefix = process.env.SEARCH_PREFIX || "";
  const [currentValue, setCurrentValue] = useState("RA0101");
  const [filterOrder, setFilterOrder] = useState(null);
  const [orders, setOrders] = useState(useSelector(selectOrder));
  const [barcodeImage, setBarcodeImage] = useState("");
  const [order, setOrder] = useState([]);
  const [fillByStatus, setFillByStatus] = useState(null);
  const [openedd, setOpened] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  // Customer order history search
  const [customerPhoneInput, setCustomerPhoneInput] = useState("");
  const [customerSearchMode, setCustomerSearchMode] = useState("phone");
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState("");
  const [customerRecord, setCustomerRecord] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [customerSearchDone, setCustomerSearchDone] = useState(false);
  const [updatingCustomerOrderIds, setUpdatingCustomerOrderIds] = useState([]);
  const [courierSendingIds, setCourierSendingIds] = useState([]);

  const handleCustomerPhoneChange = (value) => {
    setCustomerPhoneInput(normalizeBangladeshPhone(value));
    setCustomerSearchError("");
  };

  const searchCustomerOrders = async () => {
    setCustomerSearchError("");
    setCustomerSearchDone(false);
    setCustomerRecord(null);
    setCustomerOrders([]);

    setCustomerSearchLoading(true);
    try {
      // Invoice / Order ID search: use the exact order document first,
      // then fall back to the orderID field in case document ID differs.
      if (customerSearchMode === "invoice") {
        const invoiceId = String(customerPhoneInput || "").trim().toUpperCase();

        if (!invoiceId) {
          setCustomerSearchError("অর্ডার / ইনভয়েস নম্বর লিখুন।");
          return;
        }

        let orderSnap = await db.collection("ordersGur").doc(invoiceId).get();

        if (!orderSnap.exists) {
          const invoiceQuery = await db.collection("ordersGur")
            .where("orderID", "==", invoiceId)
            .limit(1)
            .get();

          if (!invoiceQuery.empty) orderSnap = invoiceQuery.docs[0];
        }

        if (!orderSnap || !orderSnap.exists) {
          setCustomerSearchDone(true);
          setCustomerSearchError("এই ইনভয়েস নম্বরে কোনো অর্ডার পাওয়া যায়নি।");
          return;
        }

        const orderData = orderSnap.data() || {};
        const orderRow = {
          id: orderSnap.id,
          ...orderData,
          orderID: orderData.orderID || orderSnap.id,
          created_at: orderData.created_at || orderData.createdAt || null,
          items: Array.isArray(orderData.items) ? orderData.items : [],
          status: orderData.status ?? orderData.orderStatus ?? orderData.order_status ?? "unknown",
        };

        const customer = orderData.customer || {};
        const shipping = orderData.shipping_address || {};
        setCustomerPhoneInput(invoiceId);
        setCustomerRecord({
          name: customer.name || customer.full_name || "",
          phone: customer.phone || customer.contact || "",
          address: [
            shipping.street,
            shipping.city,
            shipping.state,
            shipping.country,
          ].filter(Boolean).join(", "),
        });
        setCustomerOrders([orderRow]);
        setCustomerSearchDone(true);
        return;
      }

      // Phone search: normalize Bengali/English digits to Bangladesh format.
      const phone = normalizeBangladeshPhone(customerPhoneInput);
      setCustomerPhoneInput(phone);

      if (!/^01\d{9}$/.test(phone)) {
        setCustomerSearchError("সঠিক বাংলাদেশি ১১ ডিজিটের মোবাইল নম্বর দিন (01XXXXXXXXX)।");
        return;
      }

      // customers/{phone} -> items[] -> ordersGur/{orderId}
      const customerSnap = await db.collection("customers").doc(phone).get();

      if (!customerSnap.exists) {
        let fallbackCustomer = null;
        const createCustomerDoc = await db.collection("createCustomer").doc(phone).get();

        if (createCustomerDoc.exists) {
          const data = createCustomerDoc.data() || {};
          fallbackCustomer = {
            name: data.cus_name || "",
            phone: data.cus_contact || phone,
            address: data.cus_address || "",
          };
        } else {
          const customerQuery = await db.collection("createCustomer")
            .where("cus_contact", "==", phone)
            .limit(1)
            .get();

          if (!customerQuery.empty) {
            const data = customerQuery.docs[0].data() || {};
            fallbackCustomer = {
              name: data.cus_name || "",
              phone: data.cus_contact || phone,
              address: data.cus_address || "",
            };
          }
        }

        setCustomerRecord(fallbackCustomer);
        setCustomerOrders([]);
        setCustomerSearchDone(true);
        if (!fallbackCustomer) {
          setCustomerSearchError("এই নম্বরে কোনো কাস্টমার রেকর্ড পাওয়া যায়নি।");
        }
        return;
      }

      const customerData = customerSnap.data() || {};
      const orderIds = Array.isArray(customerData.items) ? customerData.items : [];

      setCustomerRecord({
        name: customerData?.customer?.name || "",
        phone: customerData?.customer?.phone || phone,
        address: [
          customerData?.shipping_address?.street,
          customerData?.shipping_address?.city,
          customerData?.shipping_address?.state,
        ].filter(Boolean).join(", "),
        status: customerData.status || "",
        createdAt: customerData.created_at || null,
      });

      const orderResults = await Promise.all(
        orderIds.map(async (orderId) => {
          try {
            const orderSnap = await db.collection("ordersGur").doc(String(orderId)).get();
            if (!orderSnap.exists) {
              return {
                id: String(orderId),
                orderID: String(orderId),
                created_at: null,
                items: [],
                status: "unknown",
                missing: true,
              };
            }

            const orderData = orderSnap.data() || {};
            return {
              id: orderSnap.id,
              ...orderData,
              orderID: orderData.orderID || orderSnap.id,
              created_at: orderData.created_at || orderData.createdAt || null,
              items: Array.isArray(orderData.items) ? orderData.items : [],
              status: orderData.status ?? orderData.orderStatus ?? orderData.order_status ?? "unknown",
            };
          } catch (error) {
            console.error("Failed to load customer order:", orderId, error);
            return {
              id: String(orderId),
              orderID: String(orderId),
              created_at: null,
              items: [],
              status: "unknown",
              missing: true,
            };
          }
        })
      );

      orderResults.sort((a, b) => {
        const dateA = a.created_at?.toDate
          ? a.created_at.toDate().getTime()
          : new Date(a.created_at || 0).getTime();
        const dateB = b.created_at?.toDate
          ? b.created_at.toDate().getTime()
          : new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      setCustomerOrders(orderResults);
      setCustomerSearchDone(true);
    } catch (error) {
      console.error("Customer/order search failed:", error);
      setCustomerSearchError(
        customerSearchMode === "invoice"
          ? "ইনভয়েস / অর্ডার সার্চ করা যায়নি। আবার চেষ্টা করুন।"
          : "কাস্টমারের অর্ডার হিস্ট্রি লোড করা যায়নি। আবার চেষ্টা করুন।"
      );
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!!opened) return;
    resetFilter();
  }, [opened]);

  const resetFilter = () => {
    setCurrentValue("RA0101");
    setFilterOrder(null);
    setBarcodeImage("");
  };

  useEffect(() => {
    setOrder(orders);
  }, [orders]);

  const handleChange = (e) => {
    setCurrentValue(e.currentTarget.value);
    // resetFilter();
  };
  const toggleOpen = () => {
    opened ? setOpened(false) : setOpened(true);
    resetFilter();
  };

  const handleImageReady = (image) => {
    setBarcodeImage(image);
  };

  const { inputRef } = useBarcode({
    value: `${filterOrder?.fulfillment?.consignment_id}`,
    options: {
      background: "#FFFFFF",
      displayValue: false,
      width: 3,
      height: 80,
    },
  });

  // Change Status from print Action and check print Status
  const stickerStatus = async (item) => {
    generateBulkPrintStickers([item]);
    await updateStatus(item, "shipped");
    toggleOpen;
    resetFilter();
  };

  // Change Status from print Action and check print Status
  const getInvoice = async (item) => {
    item.status === "pending" && invoiceGenerate(item);

    item.status === "pending"
      ? updateStatus(item, "processing", item?.id)
      : toggleOpen;
    close();
    resetFilter();
    //   console.log(item);
  };

  // Change Status from status Action
  const onStatusChanged = async (e, id) => {
    e.preventDefault();
    const newStatus = e.target.value;
    updateStatus(filterOrder, newStatus);
  };

  // Update order status through the existing updateOrderStatusGur helper.
  // keepHistoryOpen=true is used by the customer-history table so it stays visible.
  const updateStatus = async (order, newStatus, keepHistoryOpen = false) => {
    if (!order?.id || !newStatus) return false;

    if (keepHistoryOpen) {
      setUpdatingCustomerOrderIds((prev) => [...prev, String(order.id)]);
    }

    try {
      const success = await updateOrderStatusGur(db, order.id, order, newStatus);
      if (success) {
        if (keepHistoryOpen) {
          setCustomerOrders((prev) =>
            prev.map((item) =>
              String(item.id) === String(order.id)
                ? { ...item, status: newStatus, orderStatus: newStatus, order_status: newStatus }
                : item
            )
          );
        }

        notifications.show({
          title: "Status Updated Successfully",
          message: `Order #${order.orderID || order.id} status changed to ${newStatus}.`,
          color: "blue",
          autoClose: 4000,
        });

        if (!keepHistoryOpen) {
          resetFilter();
          close();
        }
        return true;
      }

      notifications.show({
        title: "Status Update Failed",
        message: "An error occurred while updating the status.",
        color: "red",
        autoClose: 4000,
      });
      if (!keepHistoryOpen) resetFilter();
      return false;
    } catch (error) {
      console.error("Order status update failed:", error);
      notifications.show({
        title: "Status Update Failed",
        message: error?.message || "An error occurred while updating the status.",
        color: "red",
        autoClose: 4000,
      });
      if (!keepHistoryOpen) resetFilter();
      return false;
    } finally {
      if (keepHistoryOpen) {
        setUpdatingCustomerOrderIds((prev) => prev.filter((id) => id !== String(order.id)));
      }
    }
  };
  // useEffect(() => {
  //   const value = currentValue?.toUpperCase();
  //   if (value?.split("0")[0] === "RA" && value.length === 9) {
  //     filter(value);
  //   }
  // }, [currentValue]);

  // onStatus config
  const statusChange = (e) => {
    e.preventDefault();
    const selectedStatus = e.target.value.toLowerCase();

    const filteredOrders = orders.filter(
      (order) =>
        selectedStatus === "status" ||
        order.status.toLowerCase() === selectedStatus,
    );

    dispatch(updateOrder(filteredOrders));
  };

  const filter = async (id) => {
    await db
      .collection("ordersGur")
      .doc(id)
      .get()
      .then((doc) => {
        if (!!doc.data()) {
          const singleOrder = { id: doc.id, ...doc.data() };
          dispatch(updateSingleOrder([singleOrder]));
          setFilterOrder(singleOrder);
          open();
        }
      });
  };

  const retryCourier = async (item) => {
    const orderID = item.orderID || item.id;
    if (!orderID || courierSendingIds.includes(String(item.id))) return;
    setCourierSendingIds((prev) => [...prev, String(item.id)]);
    const list = item?.items
      .map(
        (item, index) =>
          `${index + 1}. ${item.title} (Qty: ${item.quantity}, Price: ${item.line_total})`,
      )
      .join("\n");
    try {
      //Pathao
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const result = await resp.json();

      if (!resp.ok || result?.type === "error") {
        throw new Error(result?.message || "Pathao order failed");
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

      notifications.show({
        title: "Success (Pathao)",
        message: `Order sent to Pathao${
          fulfillmentPatch.consignment_id
            ? ` · CN: ${fulfillmentPatch.consignment_id}`
            : ""
        }`,
        color: "blue",
        autoClose: 6000,
      });

      const normalized = {
        ...item,
        fulfillment: { ...fulfillmentPatch },
      };

      await db.collection("ordersGur").doc(orderID).update(normalized);
      setCustomerOrders((prev) =>
        prev.map((order) =>
          String(order.id) === String(item.id)
            ? { ...order, fulfillment: { ...(order.fulfillment || {}), ...fulfillmentPatch } }
            : order
        )
      );

      notifications.show({
        title: "Updated",
        message: `Order ${orderID} updated successfully.`,
        color: "green",
      });
    } catch (err) {
      console.error("Courier create failed:", err);
      notifications.show({
        title: "Courier create failed",
        message: err?.message || "Please try again later.",
        color: "orange",
        autoClose: 6000,
      });
    } finally {
      setCourierSendingIds((prev) => prev.filter((id) => id !== String(item.id)));
    }
  };

  const search = async () => {
    const value = currentValue?.toUpperCase();
    filter(value);
  };

  return (
    <>
      <Modal opened={opened} onClose={close} size="xl" title="Found Data...">
        {filterOrder && (
          <div className="p-3">
            <div className="flex justify-end gap-2">
              {!filterOrder?.fulfillment?.consignment_id && (
                <button
                  onClick={() => retryCourier(filterOrder)}
                  className="px-3 py-2 rounded bg-emerald-600 text-white flex gap-2  hover:bg-emerald-700"
                >
                  {" "}
                  <IoIosSend />
                  <span>resend</span>
                </button>
              )}
              <div
                className={`inline-block px-4 text-center ${
                  user.staff_role === "HR" ||
                  user.staff_role == "Admin" ||
                  user.staff_role === "Sales Manager"
                    ? ""
                    : "hidden"
                }`}
              >
                <select
                  className="bg-black flex items-center gap-1 px-3 py-2 rounded-md cursor-pointer text-xs text-white font-medium hover:shadow-lg transition-all duration-300"
                  onChange={(e) => onStatusChanged(e, filterOrder.id)}
                >
                  <option
                    value={filterOrder.status}
                    className="capitalize"
                    hidden
                  >
                    {filterOrder.status}
                  </option>

                  <option value="pending">Pending</option>
                  {user.staff_role !== "Sales Manager" && (
                    <option value="processing">Processing</option>
                  )}
                  {user.staff_role !== "Sales Manager" && (
                    <option value="shipped">Shipped</option>
                  )}
                  {user.staff_role !== "Sales Manager" && (
                    <option value="delivered">Delivered</option>
                  )}

                  <option value="hold">Hold</option>
                  {user.staff_role !== "Sales Manager" && (
                    <option value="returned">Returned</option>
                  )}

                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {((filterOrder.status === "pending" &&
                user.staff_role === "Sales Executive") ||
                user.staff_role === "HR" ||
                user?.staff_role === "Sales Manager" ||
                user?.staff_role === "Admin") && (
                <Link href={`/place-gur/edit-order/id=${filterOrder.id}`}>
                  <span className="bg-black flex items-center gap-1 px-3 py-2 rounded-md cursor-pointer  text-xs text-white font-medium hover:shadow-lg transition-all duration-300">
                    <FiEdit size={14} /> Edit
                  </span>
                </Link>
              )}
              <Link href={`/place-gur/id=${filterOrder.id}`}>
                <span className="bg-black flex items-center gap-1 px-3 py-2 rounded-md cursor-pointer  text-xs text-white font-medium hover:shadow-lg transition-all duration-300">
                  <HiOutlineDocumentDownload size={18} /> Invoice
                </span>
              </Link>
            </div>
            <div>
              <h1 className="text-center text-2xl font-semibold pb-1">
                ID #{filterOrder.orderID} ({filterOrder.status})
              </h1>
              <div className="hidden">
                <BarcodeComponent
                  value={filterOrder?.fulfillment?.consignment_id}
                  onImageReady={handleImageReady}
                />
              </div>
              <h1 className="text-center text-2xl font-semibold border-b pb-3">
                {filterOrder?.fulfillment?.courier} #
                <Link
                  href={`${
                    filterOrder?.fulfillment?.courier === "Pathao"
                      ? `https://merchant.pathao.com/courier/orders/${filterOrder?.fulfillment?.consignment_id}`
                      : `https://steadfast.com.bd/user/consignment/${filterOrder?.fulfillment?.consignment_id}`
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>
                    {filterOrder?.fulfillment?.consignment_id || "null"}
                  </span>
                </Link>
              </h1>
            </div>

            <div className="pt-3 flex justify-between w-full">
              <div className="w-7/12">
                <h2 className="text-lg font-semibold">
                  {filterOrder?.customer.name}
                </h2>
                <h2>Address: {filterOrder?.shipping_address.street}</h2>
                <div className="flex text-center items-center gap-2">
                  <h2>Contact: {filterOrder?.customer.phone}</h2>
                  <Link
                    className="bg-blue-400 inline-block  items-center px-2 py-1 rounded-md cursor-pointer hover:bg-blue-500 text-sm text-white font-medium hover:shadow-lg transition-all duration-300"
                    href={`tel:${filterOrder?.customer?.phone}`}
                  >
                    <IoCall size={14} />
                  </Link>
                </div>
                <h2 className="text-slate-600">
                  {`[Note: ${filterOrder?.meta?.notes || "N/A"}]`}
                </h2>
              </div>
              <div className="w-4/12 text-end">
                <h3>{formatDates(filterOrder?.created_at)}</h3>
                <h3>Order type: {filterOrder?.meta?.source || "N/A"}</h3>
                <h3>Received by: {filterOrder?.created_user || "N/A"}</h3>
                <h3>Entry by: {filterOrder?.created_user || "N/A"}</h3>
                {filterOrder?.updated_user && (
                  <h3>Updated by: {filterOrder?.updated_user || "N/A"}</h3>
                )}

                <h3>Qty: {filterOrder.quantity || 0}</h3>
              </div>
            </div>
            <h1 className="text-2xl">Order:</h1>
            <div className="border-t my-2">
              {filterOrder &&
                filterOrder.items.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between py-1 md:py-1 border-b">
                      <div>
                        <h2
                          className="text-sm sm:text-xl text-title font-mono"
                          id={`item_0${++i}`}
                        >
                          {item?.title}
                        </h2>
                      </div>
                      <div className="flex justify-between w-7/12">
                        <span
                          className="text-sm sm:text-xl text-title font-mono"
                          id={`item_0${i}_quantity`}
                        >
                          {item?.quantity}
                          {item?.unit}
                        </span>
                        <span
                          className="text-sm sm:text-xl text-title font-mono"
                          id={`item_0${i}_price`}
                        >
                          {item?.price}
                        </span>
                        <span
                          className="text-sm sm:text-xl text-title font-mono"
                          id={`item_0${i}_total_price`}
                        >
                          {item?.line_total}/-
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
            <div className="flex justify-between mb-10 gap-5">
              <div className=" ">
                <h2 className="text-slate-600 ">
                  [Note: {filterOrder?.notes || "N/A"}]
                </h2>
                <div className="text-sm">
                  <h2 className="text-slate-600 ">
                    Pay Status: {filterOrder?.payment?.status || "N/A"}
                  </h2>
                  <h2 className="text-slate-600 ">
                    Pay Method: {filterOrder?.payment?.method || "N/A"}
                  </h2>
                  <h2 className="text-slate-600 ">
                    Pay Status: {filterOrder?.payment?.transaction_id || "N/A"}
                  </h2>
                </div>
              </div>
              <div className="text-sm flex ">
                <div className="text-sm sm:text-xl text-title font-semibold">
                  <h2>Sub-Total</h2>
                  <h2>Delivery</h2>
                  <h2>Discount</h2>
                  <h2>Total</h2>
                  <h2>Payment</h2>
                  <h2>COD</h2>
                </div>
                <div className="text-sm sm:text-xl text-title font-semibold px-4">
                  <h2>:</h2>
                  <h2>:</h2>
                  <h2>:</h2>
                  <h2>:</h2>
                  <h2>:</h2>
                  <h2>:</h2>
                </div>
                <div className="text-sm sm:text-xl text-title font-semibold text-right">
                  <h2>{filterOrder?.totals?.items}/-</h2>
                  <h2>{filterOrder?.totals?.shipping}/-</h2>
                  <h2>-{filterOrder?.totals?.discount}/-</h2>
                  <h2>{filterOrder?.totals?.grand}/-</h2>
                  <h2>{filterOrder?.totals?.payment}/-</h2>
                  <h2>{filterOrder?.totals?.cod}/-</h2>
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              {user.staff_role === "HR" && (
                <Tooltip label="Sticker" color="green" withArrow>
                  <button
                    title="Sticker"
                    className="bg-green-400 flex items-center gap-1 px-3 py-2 rounded-md cursor-pointer hover:bg-green-500 text-sm text-white font-medium hover:shadow-lg transition-all duration-300"
                    onClick={() => stickerStatus(filterOrder)}
                  >
                    <FaPrint size={14} /> Sticker
                  </button>
                </Tooltip>
              )}
              {(user.staff_role === "HR" || user.staff_role === "Admin") &&
                filterOrder.status === "pending" && (
                  <Tooltip label="Invoice" color="blue" withArrow>
                    <button
                      title="Invoice"
                      className="bg-blue-400 flex items-center gap-1 px-3 py-2 rounded-md cursor-pointer hover:bg-blue-500 text-sm text-white font-medium hover:shadow-lg transition-all duration-300"
                      onClick={() => getInvoice(filterOrder)}
                    >
                      <AiOutlinePrinter size={18} /> Invoice
                    </button>
                  </Tooltip>
                )}
            </div>
          </div>
        )}
      </Modal>
      <div className="hidden">
        <img ref={inputRef} alt="ok" />
      </div>
      {/* Customer phone number / order history search */}
      <section className="mb-5 min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-bold text-slate-800">Order & Customer Search</h3>
            <p className="text-xs text-slate-500">ফোন নম্বর অথবা ইনভয়েস / অর্ডার আইডি দিয়ে খুঁজুন</p>
          </div>
          <div className="mt-4 inline-flex w-full rounded-xl border border-slate-200 bg-slate-100 p-1 sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setCustomerSearchMode("phone");
                setCustomerPhoneInput("");
                setCustomerSearchError("");
                setCustomerRecord(null);
                setCustomerOrders([]);
                setCustomerSearchDone(false);
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition sm:flex-none ${
                customerSearchMode === "phone"
                  ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="inline-flex items-center gap-2"><IoCall size={15} /> Phone Number</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomerSearchMode("invoice");
                setCustomerPhoneInput("");
                setCustomerSearchError("");
                setCustomerRecord(null);
                setCustomerOrders([]);
                setCustomerSearchDone(false);
              }}
              className={`flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition sm:flex-none ${
                customerSearchMode === "invoice"
                  ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="inline-flex items-center gap-2"><HiOutlineDocumentDownload size={15} /> Invoice / Order ID</span>
            </button>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              {customerSearchMode === "phone" ? (
                <IoCall className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              ) : (
                <HiOutlineDocumentDownload className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              )}
              <input
                type={customerSearchMode === "phone" ? "tel" : "text"}
                inputMode={customerSearchMode === "phone" ? "numeric" : "text"}
                value={customerPhoneInput}
                onChange={(e) => customerSearchMode === "phone"
                  ? handleCustomerPhoneChange(e.target.value)
                  : setCustomerPhoneInput(e.target.value.toUpperCase())}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text");
                  if (customerSearchMode === "phone") handleCustomerPhoneChange(pasted);
                  else setCustomerPhoneInput(pasted.trim().toUpperCase());
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") searchCustomerOrders();
                }}
                placeholder={customerSearchMode === "phone"
                  ? "01XXXXXXXXX / বাংলা নম্বরও পেস্ট করতে পারবেন"
                  : "ইনভয়েস / Order ID লিখুন (যেমন RA0101...)"}
                maxLength={customerSearchMode === "phone" ? 14 : 40}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <button
              type="button"
              onClick={searchCustomerOrders}
              disabled={customerSearchLoading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[140px]"
            >
              {customerSearchLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <IoSearchSharp size={18} />
              )}
              {customerSearchLoading ? "Searching..." : "Search"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {customerSearchMode === "phone"
              ? "১১ ডিজিট এর মোবাইল নাম্বার দিয়ে সার্চ করুন।"
              : "সম্পূর্ণ ইনভয়েস নম্বর বা Order ID দিয়ে সার্চ করুন।"}
          </p>
        </div>

        {customerSearchError && (
          <div className="mx-4 mt-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:mx-5">
            {customerSearchError}
          </div>
        )}

        {customerRecord && (
          <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-3 sm:px-5">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Customer</p>
              <p className="mt-1 truncate text-sm font-bold text-slate-800">{customerRecord.name || "Name not available"}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Phone</p>
              <p className="mt-1 text-sm font-bold text-slate-800">{customerRecord.phone || customerPhoneInput}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Address</p>
              <p className="mt-1 line-clamp-2 text-sm font-semibold text-slate-700">{customerRecord.address || "—"}</p>
            </div>
          </div>
        )}

        {customerSearchDone && customerRecord && (
          <div className="border-t border-slate-100 px-4 py-4 sm:px-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Order Details</h4>
                <p className="text-xs text-slate-500">সর্বশেষ অর্ডার আগে দেখানো হচ্ছে</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{customerOrders.length} Orders</span>
            </div>

            {customerOrders.length > 0 ? (
              <div className="w-full max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200">
                <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold">Order ID</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold">Date</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold">Products</th>
                      <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">Qty</th>
                      <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Total</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold">Source</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                      <th className="whitespace-nowrap px-4 py-3 font-semibold">Courier / CN</th>
                      <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customerOrders.map((row) => {
                      const items = Array.isArray(row.items) ? row.items : [];
                      const qty = items.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
                      const productNames = items.map((item) => item?.title || item?.name).filter(Boolean);
                      return (
                        <tr key={row.id} className="transition hover:bg-blue-50/50">
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-blue-700">#{row.orderID || row.id}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatOrderDate(row.created_at)}</td>
                          <td className="max-w-[260px] px-4 py-3 text-slate-700">
                            <div className="line-clamp-2">{productNames.length ? productNames.join(", ") : "—"}</div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-center font-medium text-slate-700">{qty || "—"}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-800">৳ {Number(row?.totals?.grand || 0).toLocaleString("en-BD")}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">{row?.meta?.source || "—"}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="relative inline-flex items-center">
                              <span className={`pointer-events-none absolute left-2 h-1.5 w-1.5 rounded-full ${
                                ["delivered", "fulfilled", "paid"].includes(String(row.status || "").toLowerCase())
                                  ? "bg-emerald-500"
                                  : ["cancelled", "returned", "refunded"].includes(String(row.status || "").toLowerCase())
                                    ? "bg-rose-500"
                                    : String(row.status || "").toLowerCase() === "shipped"
                                      ? "bg-sky-500"
                                      : String(row.status || "").toLowerCase() === "processing"
                                        ? "bg-indigo-500"
                                        : "bg-amber-500"
                              }`} />
                              <select
                                value={ORDER_STATUS.some((option) => option.id === String(row.status || "").toLowerCase()) ? String(row.status).toLowerCase() : ""}
                                disabled={updatingCustomerOrderIds.includes(String(row.id))}
                                onChange={(event) => updateStatus(row, event.target.value, true)}
                                aria-label={`Update status for order ${row.orderID || row.id}`}
                                className={`min-w-[145px] appearance-none rounded-full border py-1.5 pl-6 pr-7 text-[11px] font-semibold capitalize outline-none transition focus:ring-2 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-60 ${getOrderStatusClass(row.status)}`}
                              >
                                {!ORDER_STATUS.some((option) => option.id === String(row.status || "").toLowerCase()) && (
                                  <option value="">{row.status || "Unknown"}</option>
                                )}
                                {ORDER_STATUS.map((option) => (
                                  <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                              </select>
                              <span className="pointer-events-none absolute right-2 text-[9px] opacity-60">▼</span>
                            </div>
                            {updatingCustomerOrderIds.includes(String(row.id)) && (
                              <span className="ml-2 text-[10px] text-blue-600">Saving…</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                            <div>{row?.fulfillment?.courier || "—"}</div>
                            <div className="text-xs text-slate-400">{row?.fulfillment?.consignment_id || ""}</div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              {!row?.fulfillment?.consignment_id && (
                                <button
                                  type="button"
                                  onClick={() => retryCourier(row)}
                                  disabled={courierSendingIds.includes(String(row.id))}
                                  title="Retry Courier"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] font-semibold text-emerald-700 transition hover:border-emerald-500 hover:bg-emerald-600 hover:text-white disabled:cursor-wait disabled:opacity-60"
                                >
                                  <IoIosSend size={14} />
                                  {courierSendingIds.includes(String(row.id)) ? "Sending…" : "Retry Courier"}
                                </button>
                              )}
                              {((row.status === "pending" && user?.staff_role === "Sales Executive") ||
                                user?.staff_role === "HR" ||
                                user?.staff_role === "Sales Manager" ||
                                user?.staff_role === "Admin") && (
                                <Link href={`/place-gur/edit-order/id=${row.id}`}>
                                  <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-2 text-[11px] font-semibold text-indigo-700 transition hover:border-indigo-500 hover:bg-indigo-600 hover:text-white">
                                    <FiEdit size={13} /> Edit
                                  </span>
                                </Link>
                              )}
                              <Link href={`/place-gur/id=${row.id}`}>
                                <span className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-[11px] font-semibold text-blue-700 transition hover:border-blue-500 hover:bg-blue-600 hover:text-white">
                                  <HiOutlineDocumentDownload size={14} /> Invoice
                                </span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-slate-700">কোনো অর্ডার হিস্ট্রি পাওয়া যায়নি</p>
                <p className="mt-1 text-xs text-slate-400">এই কাস্টমারের রেকর্ডে সংরক্ষিত অর্ডার নেই।</p>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
};

export default SearchBy;
