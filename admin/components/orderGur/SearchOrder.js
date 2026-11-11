import React, { useEffect, useState, useRef } from "react";
import Button from "@/app/components/shared/Button";
import { AiOutlineAppstoreAdd, AiOutlinePrinter } from "react-icons/ai";
import { db } from "@/app/utils/firebase";
import { useDispatch, useSelector } from "react-redux";
import {
  ToDateAndTime,
  daysInMonth,
  formatDates,
  generateStick,
  invoiceGenerate,
  updateOrderStatusGur,
} from "@/admin/utils/helpers";
import { updateSingleOrder } from "@/app/redux/slices/singleOrderSlice";
import { useDisclosure } from "@mantine/hooks";
import { Modal, Tooltip } from "@mantine/core";
import { FaPrint } from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import { selectUser } from "@/app/redux/slices/authSlice";
import Link from "next/link";
import { HiOutlineDocumentDownload } from "react-icons/hi";
import { FiEdit } from "react-icons/fi";
import { selectOrder, updateOrder } from "@/app/redux/slices/orderSlice";
import { updateBulkOrder } from "@/app/redux/slices/bulkSlice";
import { selectAllOrder, updateAllOrder } from "@/app/redux/slices/allOrder";
import { CATEGORY } from "@/admin/configs";
import { IoIosSend } from "react-icons/io";
import { IoCall, IoSearchSharp } from "react-icons/io5";
import generateBulkPrintStickers from "./generateBulkSticker";

const SearchGurOrder = ({ onClick }) => {
  const [currentValue, setCurrentValue] = useState("RA0101");
  const [filterOrder, setFilterOrder] = useState(null);
  const [orders, setOrders] = useState(useSelector(selectAllOrder));
  const [order, setOrder] = useState(useSelector(selectOrder));
  const [bulkOrder, setBulkOrder] = useState([]);
  const allOrders = useSelector(selectAllOrder);
  const [opened, { open, close }] = useDisclosure(false);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const buttonRef = useRef(null); // ✅ Fixed useRef syntax
  const [limits, setLimits] = useState(false);
  const [limit, setLimit] = useState(30);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [courierFilter, setCourierFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [comboFilter, setComboFilter] = useState("all");

  const canFilter = ["Admin", "HR", "Sales Manager"].includes(user?.staff_role);

  const norm = (s) =>
    String(s ?? "")
      .trim()
      .toLowerCase();

  // ✅ Filter logic
  const applyFilters = () => {
    let list = orders || [];

    if (statusFilter !== "all") {
      list = list.filter((o) => norm(o?.status) === statusFilter);
    }
    if (courierFilter !== "all") {
      list = list.filter(
        (o) => norm(o?.fulfillment?.courier) === courierFilter,
      );
    }
    if (categoryFilter !== "all") {
      list = list.filter((o) => norm(o?.categories) === norm(categoryFilter));
    }
    if (comboFilter !== "all") {
      if (comboFilter === "9999") {
        list = list.filter(
          (o) =>
            !(
              norm(o?.items[0]?.product_id) === norm("1113") &&
              o?.items.length === 1
            ) &&
            !(
              norm(o?.items[0]?.product_id) === norm("1112") &&
              o?.items.length === 1
            ) &&
            !(
              norm(o?.items[0]?.product_id) === norm("1111") &&
              o?.items.length === 1
            ) &&
            !(
              norm(o?.items[0]?.product_id) === norm("1108") &&
              o?.items.length === 1
            ) &&
            !(
              norm(o?.items[0]?.product_id) === norm("1107") &&
              o?.items.length === 1
            ) &&
            !(
              norm(o?.items[0]?.product_id) === norm("1109") &&
              o?.items.length === 1
            ) &&
            !(
              norm(o?.items[0]?.product_id) === norm("1110") &&
              o?.items.length === 1
            ) &&
            !o?.items?.some((item) => norm(item.product_id) === norm("2001")),
        );
      } else if (comboFilter === "0000") {
        list = list.filter(
          (o) =>
            (norm(o?.items[0]?.product_id) === norm("1109") &&
              o?.items.length === 1 &&
              o?.items[0].quantity > 1) ||
            (norm(o?.items[0]?.product_id) === norm("1110") &&
              o?.items.length === 1 &&
              o?.items[0].quantity > 1) ||
            (norm(o?.items[0]?.product_id) === norm("1113") &&
              o?.items.length === 1 &&
              o?.items[0].quantity > 1) ||
            (norm(o?.items[0]?.product_id) === norm("1112") &&
              o?.items.length === 1 &&
              o?.items[0].quantity > 1) ||
            (norm(o?.items[0]?.product_id) === norm("1107") &&
              o?.items.length === 1 &&
              o?.items[0].quantity > 1) ||
            (norm(o?.items[0]?.product_id) === norm("1108") &&
              o?.items.length === 1 &&
              o?.items[0].quantity > 1) ||
            (norm(o?.items[0]?.product_id) === norm("1111") &&
              o?.items.length === 1 &&
              o?.items[0].quantity > 1),
        );
      } else if (comboFilter === "2001") {
        list = list.filter((o) =>
          o?.items?.some((item) => norm(item.product_id) === norm("2001")),
        );
      } else {
        list = list.filter(
          (o) =>
            o?.items.length === 1 &&
            o?.items[0].quantity === 1 &&
            norm(o?.items[0]?.product_id) === norm(comboFilter),
        );
      }
    }
    setBulkOrder(list);
    dispatch(updateOrder(list));
    dispatch(updateBulkOrder(list));
  };

  // 🔄 Reset Filters
  const resetFilters = () => {
    setCategoryFilter("all");
    setStatusFilter("all");
    setCourierFilter("all");
    setComboFilter("all");
    setCurrentValue("RA0101");
    applyFilters();
  };

  // ✅ Change handlers
  const statusChange = (e) => {
    if (!canFilter) return;
    const v = norm(e.target.value);
    setStatusFilter(v === "status" ? "all" : v);
  };

  const courierChange = (e) => {
    if (!canFilter) return;
    const v = norm(e.target.value);
    setCourierFilter(v === "courier" ? "all" : v);
  };

  const categoryChange = (e) => {
    if (!canFilter) return;
    const v = e.target.value;
    setCategoryFilter(v === "category" ? "all" : v);
  };
  const comboChange = (e) => {
    if (!canFilter) return;
    const v = e.target.value;
    setComboFilter(v === "combo" ? "all" : v);
  };

  // ✅ Re-filter when filters or orders change
  useEffect(() => {
    const timeout = setTimeout(() => {
      applyFilters();
    }, 200);
    return () => clearTimeout(timeout);
  }, [orders, statusFilter, courierFilter, categoryFilter, comboFilter]);

  useEffect(() => setOrders(allOrders), [allOrders]);
  useEffect(() => setOrder(orders), [orders]);

  // ✅ Auto reset search modal
  useEffect(() => {
    if (!opened) {
      setCurrentValue("RA0101");
      setFilterOrder(null);
    }
  }, [opened]);

  const handleChange = (e) => setCurrentValue(e.currentTarget.value);
  const toggleOpen = () => (opened ? close() : open());

  useEffect(() => {
    if (buttonRef.current) buttonRef.current.focus();
  }, [filterOrder]);

  const stickerStatus = async (item) => {
    generateBulkPrintStickers([item]);
    await updateStatus(item, "shipped");
    toggleOpen;
  };

  // ✅ Invoice generator
  const getInvoice = async (item) => {
    if (item.status === "pending") {
      invoiceGenerate(item);
      await updateStatus(item, "processing", item?.id);
    } else {
      toggleOpen();
    }
    close();
  };

  // ✅ Status change
  const onStatusChanged = async (e) => {
    e.preventDefault();
    const newStatus = e.target.value;
    await updateStatus(filterOrder, newStatus);
    setFilterOrder(null);
  };

  const updateStatus = async (order, newStatus) => {
    const success = await updateOrderStatusGur(db, order.id, order, newStatus);
    notifications.show({
      title: success ? "Status Updated Successfully" : "Status Update Failed",
      message: success
        ? `Order #${order.id} status changed to ${newStatus}.`
        : "An error occurred while updating the status.",
      color: success ? "blue" : "red",
    });
    if (success) close();
  };

  // // ✅ Search by ID
  // useEffect(() => {
  //   const value = currentValue?.toUpperCase();
  //   if (value?.startsWith("RA") && value.length === 10) filter(value);
  // }, [currentValue]);

  const filter = async (id) => {
    const doc = await db.collection("ordersGur").doc(id).get();
    if (doc.exists) {
      const singleOrder = { id: doc.id, ...doc.data() };
      dispatch(updateSingleOrder([singleOrder]));
      setFilterOrder(singleOrder);
      open();
    }
  };

  // ✅ Role-based order limit
  useEffect(() => {
    const privileged = ["Admin", "HR", "CEO"].includes(user?.staff_role);
    setLimits(privileged);
    setLimit(privileged ? 400 : 30);
  }, [user]);

  // ✅ Firebase real-time listener
  useEffect(() => {
    const unSub = db
      .collection("ordersGur")
      .orderBy("created_at", "desc")
      .limit(limit)
      .onSnapshot((snap) => {
        const order = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        dispatch(updateAllOrder(order));
        dispatch(updateOrder(order));
      });
    return () => unSub();
  }, [limit]);

  const retryCourier = async (item) => {
    const orderID = item.orderID;
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
        item_description: `${item?.notes || ""}`,
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

      notifications.show({
        title: "Updated",
        message: `Order ${orderID} updated successfully.`,
        color: "green",
      });

      // const sfPayload = {
      //   cod_amount: `${item?.totals?.cod || 0}`,
      //   invoice: `${orderID || "N/A"}`,
      //   note: `${item?.notes || ""}`,
      //   recipient_name: `${item?.customer?.name || ""}`,
      //   recipient_phone: `${item?.customer?.phone || ""}`,
      //   recipient_address: `${item?.shipping_address?.street || ""}`,
      // };

      // const resp = await fetch("/api/steadfast/create-order", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(sfPayload),
      // });
      // const result = await resp.json();

      // if (!resp.ok || result?.type !== "success") {
      //   throw new Error(result?.message || "Steadfast order failed");
      // }

      // const cons = result?.data?.consignment || {};
      // const fulfillmentPatch = {
      //   courier: "SteadFast",
      //   consignment_id: cons?.consignment_id ?? null,
      //   tracking_code: cons?.tracking_code ?? null,
      //   steadfast_raw: result?.data,
      // };

      // notifications.show({
      //   title: "Success (Steadfast)",
      //   message: `Order sent to Steadfast${
      //     fulfillmentPatch.consignment_id
      //       ? ` · CN: ${fulfillmentPatch.consignment_id}`
      //       : ""
      //   }`,
      //   color: "blue",
      //   autoClose: 6000,
      // });

      // const normalized = {
      //   ...item,
      //   fulfillment: { ...fulfillmentPatch },
      // };

      // await db.collection("ordersGur").doc(orderID).update(normalized);

      // notifications.show({
      //   title: "Updated",
      //   message: `Order ${orderID} updated successfully.`,
      //   color: "green",
      // });
    } catch (err) {
      console.error("Courier create failed:", err);
      notifications.show({
        title: "Courier create failed",
        message: err?.message || "Please try again later.",
        color: "orange",
        autoClose: 6000,
      });
    }
  };

  const search = async () => {
    const value = currentValue?.toUpperCase();
    filter(value);
  };

  return (
    <>
      {/* ===================== MODAL ===================== */}
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
                <Link href={`/place-aam/edit-order/id=${filterOrder.id}`}>
                  <span className="bg-black flex items-center gap-1 px-3 py-2 rounded-md cursor-pointer  text-xs text-white font-medium hover:shadow-lg transition-all duration-300">
                    <FiEdit size={14} /> Edit
                  </span>
                </Link>
              )}
              <Link href={`/place-aam/id=${filterOrder.id}`}>
                <span className="bg-black flex items-center gap-1 px-3 py-2 rounded-md cursor-pointer  text-xs text-white font-medium hover:shadow-lg transition-all duration-300">
                  <HiOutlineDocumentDownload size={18} /> Invoice
                </span>
              </Link>
            </div>
            <div>
              <h1 className="text-center text-2xl font-semibold pb-1">
                ID #{filterOrder.orderID} ({filterOrder.status})
              </h1>
              {/* <div className="hidden">
                <BarcodeComponent
                  value={filterOrder?.fulfillment?.consignment_id}
                  onImageReady={handleImageReady}
                />
              </div> */}
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

      {/* ===================== FILTER BAR ===================== */}
      <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50 shadow-xs mb-5">
        <div className="p-4">
          <div className="py-3 grid gap-4 lg:gap-6 md:flex xl:flex">
            {/* Search */}
            <div className="flex-grow">
              <div className="flex gap-2">
                <input
                  className="block w-full px-3 py-1 text-sm focus:outline-neutral-200 leading-5 rounded-md  border-gray-200 h-14 bg-gray-100 border-transparent focus:bg-white"
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleChange(e)}
                  placeholder="Search by #ID"
                />
                <Button
                  onClick={() => search()}
                  title="Search"
                  className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                  icon=<IoSearchSharp size={24} />
                />
              </div>
            </div>

            {/* Status */}
            <div className="flex-grow">
              <select
                className="block w-full px-2 py-1 text-sm rounded-md border h-14 bg-gray-100"
                onChange={statusChange}
                value={statusFilter === "all" ? "status" : statusFilter}
                disabled={!canFilter}
              >
                <option value="status">Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="hold">Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Courier */}
            <div className="flex-grow">
              <select
                className="block w-full px-2 py-1 text-sm rounded-md border h-14 bg-gray-100"
                onChange={courierChange}
                value={courierFilter === "all" ? "courier" : courierFilter}
                disabled={!canFilter}
              >
                <option value="courier">Courier</option>
                <option value="pathao">Pathao</option>
                <option value="steadfast">Steadfast</option>
              </select>
            </div>

            {/* ✅ Category — now dynamic */}
            <div className="flex-grow">
              <select
                className="block w-full px-2 py-1 text-sm focus:outline-none rounded-md form-select 
             focus:border-gray-200 border-gray-200 focus:shadow-none leading-5 
             border h-14 bg-gray-100 border-transparent focus:bg-gray-50"
                onChange={categoryChange}
                value={categoryFilter === "all" ? "category" : categoryFilter}
                disabled={!canFilter}
              >
                <option value="category">Category</option>
                {CATEGORY.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name || item.id}
                  </option>
                ))}
              </select>
            </div>

            {/* Courier */}
            <div className="flex-grow">
              <select
                className="block w-full px-2 py-1 text-sm rounded-md border h-14 bg-gray-100"
                onChange={comboChange}
                value={comboFilter === "all" ? "combo" : comboFilter}
                disabled={!canFilter}
              >
                <option value="combo">Combo</option>
                <option value="1113">5items x 3kg</option>
                <option value="1112">5kg Combo</option>
                <option value="1111">5items x 2.5kg</option>
                <option value="1107">2.5 Kg Combo</option>
                <option value="1108">3.5 Kg Combo</option>
                <option value="0000">Combo x 2</option>
                <option value="1109">2 Kg Patali Pata</option>
                <option value="1110">2 Kg Gol Patali</option>
                <option value="2001">Ghee</option>
                <option value="9999">Others</option>
              </select>
            </div>

            <div className="flex-grow">
              <Button
                onClick={() => resetFilters()}
                title="Reset"
                className="bg-gray-400 hover:bg-gray-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                // icon=<IoPrintOutline size={24} />
              />
            </div>
          </div>
          {bulkOrder.length > 0 && (
            <h1 className="text-center">
              Selected Orders:{" "}
              <span className="font-bold">{bulkOrder.length}</span>
            </h1>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchGurOrder;
