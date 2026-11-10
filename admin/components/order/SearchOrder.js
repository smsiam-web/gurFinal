// export default SearchOrder;

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
  updateOrderStatus,
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

const SearchOrder = ({ onClick }) => {
  const [currentValue, setCurrentValue] = useState("JF010");
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
        (o) => norm(o?.fulfillment?.courier) === courierFilter
      );
    }
    if (categoryFilter !== "all") {
      list = list.filter((o) => norm(o?.categories) === norm(categoryFilter));
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
    setCurrentValue("JF010");
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

  // ✅ Re-filter when filters or orders change
  useEffect(() => {
    const timeout = setTimeout(() => {
      applyFilters();
    }, 200);
    return () => clearTimeout(timeout);
  }, [orders, statusFilter, courierFilter, categoryFilter]);

  useEffect(() => setOrders(allOrders), [allOrders]);
  useEffect(() => setOrder(orders), [orders]);

  // ✅ Auto reset search modal
  useEffect(() => {
    if (!opened) {
      setCurrentValue("JF010");
      setFilterOrder(null);
    }
  }, [opened]);

  const handleChange = (e) => setCurrentValue(e.currentTarget.value);
  const toggleOpen = () => (opened ? close() : open());

  useEffect(() => {
    if (buttonRef.current) buttonRef.current.focus();
  }, [filterOrder]);

  // ✅ Sticker generator
  const stickerStatus = async (item) => {
    if (item.status === "processing") {
      await updateStatus(item, "shipped");
      generateStick(item);
    } else {
      toggleOpen();
    }
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
    const success = await updateOrderStatus(db, order.id, order, newStatus);
    notifications.show({
      title: success ? "Status Updated Successfully" : "Status Update Failed",
      message: success
        ? `Order #${order.id} status changed to ${newStatus}.`
        : "An error occurred while updating the status.",
      color: success ? "blue" : "red",
    });
    if (success) close();
  };

  // ✅ Search by ID
  useEffect(() => {
    const value = currentValue?.toUpperCase();
    if (value?.startsWith("JF") && value.length === 10) filter(value);
  }, [currentValue]);

  const filter = async (id) => {
    const doc = await db.collection("orders").doc(id).get();
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
    setLimit(privileged ? 1000 : 30);
  }, [user]);

  // ✅ Firebase real-time listener
  useEffect(() => {
    const unSub = db
      .collection("orders")
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

  return (
    <>
      {/* ===================== MODAL ===================== */}
      <Modal opened={opened} onClose={close} size="xl" title="Found Data...">
        {filterOrder && (
          <div className="p-3">
            <div className="flex justify-end gap-2">
              <div
                className={`inline-block px-4 text-center ${
                  canFilter ? "" : "hidden"
                }`}
              >
                <select
                  className="bg-black text-white px-3 py-2 rounded-md text-xs font-medium cursor-pointer"
                  onChange={onStatusChanged}
                >
                  <option value={filterOrder.status} hidden>
                    {filterOrder.status}
                  </option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="hold">Hold</option>
                  <option value="returned">Returned</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {(user.staff_role === "HR" ||
                user.staff_role === "Admin" ||
                user.staff_role === "Sales Manager" ||
                (filterOrder.status === "pending" &&
                  user.staff_role === "Sales Executive")) && (
                <Link href={`/place-order/edit-order/id=${filterOrder.id}`}>
                  <span className="bg-black text-white flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium cursor-pointer">
                    <FiEdit size={14} /> Edit
                  </span>
                </Link>
              )}
              <Link href={`/orders/invoice/id=${filterOrder.id}`}>
                <span className="bg-black text-white flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium cursor-pointer">
                  <HiOutlineDocumentDownload size={18} /> Invoice
                </span>
              </Link>
            </div>

            {/* Order Details */}
            <div>
              <h1 className="text-center text-2xl font-semibold pb-1">
                ID #{filterOrder?.orderID} ({filterOrder?.status})
              </h1>
              <h1 className="text-center text-2xl font-semibold border-b pb-3">
                {filterOrder?.fulfillment?.courier} #{filterOrder?.fulfillment?.consignment_id}
              </h1>
            </div>

            <div className="pt-3 flex justify-between w-full">
              <div className="w-7/12">
                <h2 className="text-lg font-semibold">
                  {filterOrder?.customer.name}
                </h2>
                <h2>Address: {filterOrder?.shipping_address.street}</h2>
                <h2>Phone: {filterOrder?.customer.phone}</h2>
                <h2 className="text-slate-600">
                  Note: {filterOrder?.notes || "N/A"}
                </h2>
              </div>
              <div className="w-4/12 text-end">
                <h3>{formatDates(filterOrder?.created_at)}</h3>
                <h3>Order type: {filterOrder?.meta?.source || "N/A"}</h3>
                <h3>Received by: {filterOrder?.received_user || "N/A"}</h3>
                <h3>Entry by: {filterOrder?.created_user || "N/A"}</h3>
                {filterOrder?.updated_user && (
                  <h3>Updated by: {filterOrder?.updated_user}</h3>
                )}
                <h3>QTY: {filterOrder.quantity}</h3>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t my-2">
              {filterOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1 border-b">
                  <span className="text-sm sm:text-xl font-mono">
                    {item.title}
                  </span>
                  <div className="flex justify-between w-7/12">
                    <span>{item.quantity + item.unit}</span>
                    <span>{item.price}</span>
                    <span>{item.line_total}/-</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end gap-4 mt-4">
              {(user.staff_role === "HR" || user.staff_role === "Admin") &&
                filterOrder.status === "pending" && (
                  <Tooltip label="Invoice" color="blue" withArrow>
                    <button
                      ref={buttonRef}
                      onClick={() => getInvoice(filterOrder)}
                      className="bg-blue-500 text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      <AiOutlinePrinter size={18} /> Invoice
                    </button>
                  </Tooltip>
                )}
              {user.staff_role === "HR" &&
                filterOrder.status === "processing" && (
                  <Tooltip label="Sticker" color="green" withArrow>
                    <button
                      onClick={() => stickerStatus(filterOrder)}
                      className="bg-green-500 text-white flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      <FaPrint size={14} /> Sticker
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
              <input
                className="block w-full px-3 py-1 text-sm focus:outline-neutral-200 leading-5 rounded-md border-gray-200 h-14 bg-gray-100 border-transparent focus:bg-white"
                type="text"
                value={currentValue}
                onChange={handleChange}
                placeholder="Search by #ID"
              />
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

export default SearchOrder;
