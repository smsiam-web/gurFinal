import { Tooltip } from "@mantine/core";
import React, { useEffect, useState, useRef } from "react";
import { HiOutlineDocumentDownload } from "react-icons/hi";
import { Modal } from "@mantine/core";
import { FiEdit } from "react-icons/fi";
import { Pagination } from "@mantine/core";
import Link from "next/link";
import { db } from "@/app/utils/firebase";
import { notifications } from "@mantine/notifications";
import { useDispatch, useSelector } from "react-redux";
import { selectOrder, updateOrder } from "@/app/redux/slices/orderSlice";
import FormHeader from "../shared/FormHeader";
import Button from "../shared/Button";
import NotFound from "../shared/NotFound";
import { AiOutlinePrinter } from "react-icons/ai";
import { selectUser } from "@/app/redux/slices/authSlice";
import {
  formatDates,
  generateStick,
  invoiceGenerate,
  updateOrderStatus,
} from "@/admin/utils/helpers";
import { FaPrint } from "react-icons/fa";
import { updateConfig } from "@/app/redux/slices/configSlice";
import { RiDeleteBinLine } from "react-icons/ri";

const AllOrder = () => {
  const [loading, setLoading] = useState(false);
  const [filterOrder, setFilterOrder] = useState(null);
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [page, setPagee] = useState(1);
  const [opened, setOpened] = useState(false);
  const order = useSelector(selectOrder);
  const user = useSelector(selectUser);

  const toggleOpen = () => {
    opened ? setOpened(false) : setOpened(true);
  };

  useEffect(() => {
    setOrders(order);
  }, [order]);

  const setPage = (i) => {
    setPagee(i);
  };

  // Change Status from status Action
  const onStatusChanged = async (e, id) => {
    e.preventDefault();
    const status = e.target.value;
    orders.map((i) => {
      i.id === id && updateStatus(i, status, id);
    });
  };
  // Change Status from print Action and check print Status
  const statusUpdate = async (item) => {
    item.status === "pending" && invoiceGenerate(item);

    item.status === "pending"
      ? updateStatus(item, "processing", item?.id)
      : toggleOpen;
    setFilterOrder(item);
    //   console.log(item);
  };
  const stickerStatus = async (item) => {
    item.status === "processing" && generateStick(item);

    item.status === "processing"
      ? updateStatus(item, "shipped", item?.id)
      : toggleOpen;
    setFilterOrder(item);
    //   console.log(item);
  };

  const deleteItem = async (item) => {
    setFilterOrder(item);
    toggleOpen();
  };

  // update status on firebase
  const updateStatus = async (order, newStatus) => {
    const success = await updateOrderStatus(db, order.id, order, newStatus);
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
  // Dismiss the notification after a specific delay (e.g., 5 seconds)
  setTimeout(() => {
    notifications.hide(); // Assuming `notifications.hide()` is the correct method to dismiss the notification
  }, 5000); // 5000ms = 5 seconds

  // Get order from firebase database
  useEffect(() => {
    setLoading(true);
    const unSub = db
      .collection("orders")
      .orderBy("created_at", "desc")
      .limit(30)
      .onSnapshot((snap) => {
        const order = [];
        snap.docs.map((doc) => {
          order.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        dispatch(updateOrder(order));
        setOrders(order);
        setLoading(false);
      });
    return () => {
      unSub();
    };
  }, []);

  //get config
  useEffect(() => {
    const unSub = db.collection("config").onSnapshot((snap) => {
      const configData = [];
      snap.docs.map((doc) => {
        configData.push(doc.data());
      });
      dispatch(updateConfig(configData));
    });
    return () => {
      unSub();
    };
  }, []);

  //after confirmaiton Delete porduct from firebase
  const DeleteOrder = async (item) => {
    toggleOpen();
    await db
      .collection("orders")
      .doc(item.id)
      .delete()
      .then(() => {
        notifications.show({
          title: "Delete successfully",
          message: `Customer Name ${item.order_details.customer_name}, Order ID: #${item.id}`,
          color: "orange",
        });
      })
      .catch((error) => {
        console.error("Error removing document: (from orderTable)", error);
      });

    setFilterOrder(null);
  };

  return (
    <main>
      {/* confirmaiton pop-up */}
      <Modal
        opened={opened}
        withCloseButton={false}
        onClose={() => toggleOpen()}
        centered
      >
        <div className="p-2 rounded-lg">
          <FormHeader
            onClick={() => toggleOpen()}
            title={"Order Delete Confirmation"}
          />
          {/* confirmaiton pop-up  */}
          {filterOrder && (
            <div className="bg-gray-50 py-10">
              <div className="flex flex-col items-center gap-3">
                <div className="text-center">
                  <h1 className="text-3xl font-semibold text-title">
                    <span className="text-lg font-bold">#</span>
                    {filterOrder?.id} ({filterOrder?.status})
                  </h1>
                  <h1 className="text-2xl font-semibold text-title">
                    {filterOrder?.customer_details?.customer_name}
                  </h1>
                  <h1 className="text-xl text-title">
                    {filterOrder?.customer_details?.phone_number}
                  </h1>
                  <h1 className="text-lg text-title pb-2">
                    {filterOrder?.customer_details?.customer_address}
                  </h1>
                  <h1 className="text-4xl font-semibold text-title">
                    COD: {filterOrder?.customer_details?.salePrice}/-
                  </h1>
                </div>
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <Button
                    onClick={() => toggleOpen()}
                    title="Cancel"
                    className="text-md bg-red-400 hover:bg-red-500 text-white px-8"
                  />
                  <Button
                    onClick={() => DeleteOrder(filterOrder)}
                    title="Yes, I'm Sure"
                    className="text-md bg-green-500 hover:bg-green-600 text-white px-8"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
      <div className="grid gap-4 w-full overflow-hidden ">
        <div className="w-full overflow-x-scroll rounded-md relative">
          {!orders.length ? (
            <NotFound text={"order"} />
          ) : (
            <table className="w-full whitespace-nowrap table-auto">
              <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200  bg-gray-100">
                <tr>
                  <th className="px-4 py-3 ">invoice no</th>
                  <th className="px-4 py-3 ">Courier</th>
                  <th className="px-4 py-3 ">Consignment</th>
                  <th className="px-4 py-3 ">NAME</th>
                  <th className="px-4 py-3 ">Phone no.</th>
                  <th className="px-4 py-3 ">DISCOUNT</th>
                  <th className="px-4 py-3 ">Amount</th>
                  <th className="px-4 py-3 text-center ">status</th>
                  <th
                    className={`px-4 py-3 ${
                      user.staff_role === "HR" ||
                      user.staff_role === "Admin" ||
                      user?.staff_role === "Sales Manager"
                        ? ""
                        : "hidden"
                    }`}
                  >
                    Actions
                  </th>
                  <th className="px-4 py-3 text-center ">type</th>
                  <th className="px-4 py-3 text-center ">category</th>
                  <th className="px-4 py-3 ">Created at</th>
                  <th className="px-4 py-3 ">Created By</th>
                  <th className="px-4 py-3 ">invoice</th>

                  <th className="px-4 py-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 ">
                <>
                  {!!orders &&
                    orders?.map(
                      (item, index) =>
                        index >= 15 * page - 15 &&
                        index + 1 <= 15 * page && (
                          <tr
                            className={`${item?.isFilter && "bg-sky-200"} ${
                              item?.status?.toLowerCase() === "delivered" &&
                              "bg-green-200"
                            } ${
                              item.customer_details?.markAs === "Argent" &&
                              "bg-green-100"
                            }`}
                            key={index}
                          >
                            <td className="px-4 py-3 font-bold">
                              {/* <Link href={`/place-order/id=${item.id}`}> */}
                              <span className="text-sm">#{item.orderID}</span>
                              {/* </Link> */}
                            </td>
                            <td className="px-4 py-3 font-bold">
                              {/* <Link href={`/place-order/id=${item.id}`}> */}
                              <span className="text-sm">
                                {item?.fulfillment?.courier || "null"}
                              </span>
                              {/* </Link> */}
                            </td>
                            <td className="px-4 py-3 font-bold">
                              <Link
                                href={`${item?.fulfillment?.courier === "Pathao" ? `https://merchant.pathao.com/courier/orders/${item?.fulfillment?.consignment_id}` : `https://steadfast.com.bd/user/consignment/${item?.fulfillment?.consignment_id}`}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span className="text-sm">
                                  {item?.fulfillment?.consignment_id || "null"}
                                </span>
                              </Link>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-sm ">
                                {item.customer?.name}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold ">
                                <a href={`tel:${item.customer?.phone}`}>
                                  {item.customer?.phone}
                                </a>
                              </span>
                            </td>            
                            <td className="px-4 py-3">
                              <span className="text-sm font-bold">
                                -{item?.totals?.discount}tk
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-sm  font-bold">
                                {item.totals?.grand}tk
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className="font-serif">
                                <span
                                  className={`${
                                    item?.status?.toLowerCase() === "pending" &&
                                    "text-gray-700 bg-gray-200"
                                  } ${
                                    item?.status?.toLowerCase() === "hold" &&
                                    "text-gray-700 bg-gray-200"
                                  } ${
                                    item?.status?.toLowerCase() ===
                                      "processing" &&
                                    "text-yellow-500 bg-yellow-100"
                                  } ${
                                    item?.status?.toLowerCase() === "shipped" &&
                                    "text-indigo-500 bg-indigo-100"
                                  } ${
                                    item?.status?.toLowerCase() === "delivered" &&
                                    "text-green-500 bg-green-100"
                                  } ${
                                    item?.status?.toLowerCase() === "returned" &&
                                    "bg-teal-100 text-teal-500"
                                  } ${
                                    item?.status?.toLowerCase() === "cancelled" &&
                                    "bg-red-100 text-red-500"
                                  } inline-flex px-2 text-xs capitalize font-medium leading-5 rounded-full`}
                                >
                                  {item?.status}
                                </span>
                              </span>
                            </td>
                            <td
                              className={`px-4 py-3 text-center ${
                                user.staff_role === "HR" ||
                                user.staff_role === "Admin" ||
                                user.staff_role === "Sales Manager"
                                  ? ""
                                  : "hidden"
                              }`}
                            >
                              <select
                                className="block cursor-pointer  px-2 py-1  focus:outline-none  form-select  border-gray-200  focus:shadow-none focus:ring  leading-5 border  bg-gray-50 h-8 rounded-md text-xs w-28"
                                onChange={(e) => onStatusChanged(e, item.id)}
                              >
                                <option
                                  value={item.status}
                                  className="capitalize"
                                  hidden
                                >
                                  {item.status}
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
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-serif">
                                <span
                                  className={`${
                                    item.customer_details?.order_from ===
                                      "Messenger Order" &&
                                    "text-green-500 bg-green-100"
                                  } ${
                                    item.customer_details?.order_from ===
                                      "Phone Call Order" &&
                                    "text-gray-500 bg-gray-100"
                                  } ${
                                    item.customer_details?.order_from ===
                                      "Website Order" &&
                                    "text-indigo-500 bg-indigo-100"
                                  } ${
                                    item.customer_details?.order_from ===
                                      "WhatsApp Order" &&
                                    "text-orange-500 bg-orange-100"
                                  }  inline-flex px-2 text-xs capitalize font-medium leading-5 rounded-full`}
                                >
                                  {item?.meta?.source || "null"}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm  font-semibold rounded-full px-3 py-1 text-indigo-500 bg-indigo-100">
                                {item?.categories}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold">
                                {formatDates(item?.created_at)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-semibold">
                                {item?.created_user || "null"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Link href={`/orders/invoice/id=${item.id}`}>
                                <Tooltip label="Invoice" color="blue" withArrow>
                                  <span className="text-sub-title flex items-center justify-center font-semibold cursor-pointer hover:text-blue-400">
                                    <HiOutlineDocumentDownload size={18} />
                                  </span>
                                </Tooltip>
                              </Link>
                            </td>

                            {(item.status === "pending" &&
                              user.staff_role === "Sales Executive") ||
                            user?.staff_role === "Sales Manager" ? (
                              <td className="px-4 py-3 ">
                                <Link
                                  href={`/place-order/edit-order/id=${item.id}`}
                                >
                                  <Tooltip label="Edit" color="blue" withArrow>
                                    <span className="cursor-pointer hover:text-blue-400 items-center justify-center flex">
                                      <FiEdit size={16} />
                                    </span>
                                  </Tooltip>
                                </Link>
                              </td>
                            ) : (
                              <td
                                className={`${
                                  (user.staff_role === "HR" ||
                                    user?.staff_role === "Admin") &&
                                  "hidden"
                                }`}
                              >
                                <Tooltip
                                  label="Not Available"
                                  color="orange"
                                  withArrow
                                >
                                  <span className="items-center text-slate-400 justify-center flex">
                                    <FiEdit size={16} />
                                  </span>
                                </Tooltip>
                              </td>
                            )}

                            {(user.staff_role === "HR" ||
                              user.staff_role === "Admin") && (
                              <td className="px-4 py-3">
                                <div className="text-sm font-semibold flex justify-start gap-5 text-sub-title items-center">
                                  {user.staff_role === "HR" && (
                                    <Tooltip
                                      label="Delete"
                                      color="red"
                                      withArrow
                                    >
                                      <span
                                        className="cursor-pointer hover:text-blue-400"
                                        onClick={() => deleteItem(item)}
                                      >
                                        <RiDeleteBinLine size={16} />
                                      </span>
                                    </Tooltip>
                                  )}
                                  {user.staff_role === "HR" && (
                                    <Tooltip
                                      label="Sticker"
                                      color="blue"
                                      withArrow
                                    >
                                      <span
                                        className="cursor-pointer hover:text-blue-400"
                                        onClick={() => stickerStatus(item)}
                                      >
                                        <FaPrint size={16} />
                                      </span>
                                    </Tooltip>
                                  )}

                                  <Link
                                    href={`/place-order/edit-order/id=${item.id}`}
                                  >
                                    <Tooltip
                                      label="Edit"
                                      color="blue"
                                      withArrow
                                    >
                                      <span className="cursor-pointer hover:text-blue-400">
                                        <FiEdit size={16} />
                                      </span>
                                    </Tooltip>
                                  </Link>

                                  <Tooltip
                                    label="Print"
                                    color="green"
                                    withArrow
                                  >
                                    <span
                                      className="cursor-pointer hover:text-blue-400"
                                      onClick={() => statusUpdate(item)}
                                    >
                                      <AiOutlinePrinter size={20} />
                                    </span>
                                  </Tooltip>
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                    )}
                </>
              </tbody>
            </table>
          )}
        </div>
      </div>
      {orders?.length >= 15 && (
        <div className="bg-white py-3 justify-center flex">
          <Pagination
            total={Math.ceil(orders?.length / 15)}
            boundaries={1}
            defaultValue={page ? page : 1}
            onChange={(i) => setPage(i)}
          />
        </div>
      )}
    </main>
  );
};

export default AllOrder;
