import { Checkbox, RingProgress, Tooltip } from "@mantine/core";
import React, { useEffect, useState, useRef } from "react";
import { HiOutlineDocumentDownload } from "react-icons/hi";
import { Modal } from "@mantine/core";
import { FiEdit, FiPhone, FiPhoneCall } from "react-icons/fi";
import { Pagination } from "@mantine/core";
import Link from "next/link";
import { db } from "@/app/utils/firebase";
import { notifications } from "@mantine/notifications";
import { useDispatch, useSelector } from "react-redux";
import {
  selectWebOrderList,
  updateWebOrderList,
} from "@/app/redux/slices/webOrderList";
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
  updateOrderStatusGur,
} from "@/admin/utils/helpers";
import { FaPhone, FaPrint, FaWhatsapp } from "react-icons/fa";
import { updateConfig } from "@/app/redux/slices/configSlice";
import { RiDeleteBinLine } from "react-icons/ri";
import { IoIosSend } from "react-icons/io";
import generateBulkPrintStickers from "./generateBulkSticker";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineLocationOn } from "react-icons/md";
import { IoOpenOutline } from "react-icons/io5";
import { CiLock } from "react-icons/ci";
import { useRouter } from "next/router";
import AddNewOrder from "@/admin/components/placeWebGur/add_new_order";

const AllOrder = () => {
  const [loading, setLoading] = useState(false);
  const [filterOrder, setFilterOrder] = useState(null);
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [page, setPagee] = useState(1);
  const [opened, setOpened] = useState(false);
  const order = useSelector(selectWebOrderList);
  const user = useSelector(selectUser);

  const toggleOpen = () => {
    opened ? setOpened(false) : setOpened(true);
  };

  useEffect(() => {
    setOrders(order);
  }, [order]);

  console.log(orders);

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
    item.status === "processing" && generateBulkPrintStickers([item]);

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
    const success = await updateWebOrderList(db, order.id, order, newStatus);
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
      .collection("webOrderList")
      .orderBy("dateCreated", "desc")
      .limit(30)
      .onSnapshot((snap) => {
        const order = [];
        snap.docs.map((doc) => {
          order.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        dispatch(updateWebOrderList(order));
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
      .collection("ordersGur")
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
  //after confirmaiton Delete porduct from firebase
  // const retryCourier = async (item) => {
  //   const orderID = item.orderID;
  //   try {
  //     //Pathao
  //     const orderPayload = {
  //       store_id: 344188,
  //       merchant_order_id: `${orderID}`,
  //       recipient_name: `${item?.customer?.name || ""}`,
  //       recipient_phone: `${item?.customer?.phone || ""}`,
  //       recipient_address: `${item?.shipping_address?.street || ""}`,
  //       delivery_type: 48,
  //       item_type: 2,
  //       special_instruction: `${item?.notes || ""}`,
  //       item_quantity: 1,
  //       item_weight: `${item?.totals?.qtySum || 1}`,
  //       item_description: `${item?.notes || ""}`,
  //       amount_to_collect: `${item?.totals?.cod || 0}`,
  //     };

  //     const resp = await fetch("/api/pathaoAamWala/place-order", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(orderPayload),
  //     });
  //     const result = await resp.json();

  //     if (!resp.ok || result?.type === "error") {
  //       throw new Error(result?.message || "Pathao order failed");
  //     }

  //     const fulfillmentPatch = {
  //       courier: "Pathao",
  //       consignment_id:
  //         result?.data?.consignment_id ??
  //         result?.data?.data?.consignment_id ??
  //         null,
  //       tracking_code:
  //         result?.data?.tracking_code ??
  //         result?.data?.data?.tracking_code ??
  //         null,
  //       pathao_raw: result?.data,
  //     };

  //     notifications.show({
  //       title: "Success (Pathao)",
  //       message: `Order sent to Pathao${
  //         fulfillmentPatch.consignment_id
  //           ? ` · CN: ${fulfillmentPatch.consignment_id}`
  //           : ""
  //       }`,
  //       color: "blue",
  //       autoClose: 6000,
  //     });

  //     const normalized = {
  //       ...item,
  //       fulfillment: { ...fulfillmentPatch },
  //     };

  //     await db.collection("ordersGur").doc(orderID).update(normalized);

  //     notifications.show({
  //       title: "Updated",
  //       message: `Order ${orderID} updated successfully.`,
  //       color: "green",
  //     });

  //   } catch (err) {
  //     console.error("Courier create failed:", err);
  //     notifications.show({
  //       title: "Courier create failed",
  //       message: err?.message || "Please try again later.",
  //       color: "orange",
  //       autoClose: 6000,
  //     });
  //   }
  // };
  const timeAgo = (dateString) => {
    // WooCommerce date যদি timezone ছাড়া আসে,
    // এটাকে UTC ধরে Bangladesh time-এর সাথে calculate করছি
    const date = new Date(
      dateString.endsWith("Z") ? dateString : `${dateString}Z`,
    );

    const now = new Date();

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) {
      return "Just now";
    }

    if (diffInSeconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(diffInSeconds / 60);

    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString("en-GB", {
      timeZone: "Asia/Dhaka",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const router = useRouter();
  const openOrder = async (orderID) => {
    toggleOpen();
    try {
      const response = await fetch("/api/orders/lock", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          orderID,
          userUID: user.uid,
          userName: user.name || user.email || "User",
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        alert(`এই order বর্তমানে ${data.lockedByName} ব্যবহার করছেন।`);

        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Order open failed");
      }

      // router.push(`/place-gur/add-new`);
    } catch (error) {
      console.error(error);

      alert(error?.message || "Order open করা যায়নি");
    }
  };
  const requestPermission = async (orderID) => {
    await fetch("/api/orders/request-permission", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        orderID,
        requestedByUid: user.uid,
        requestedByName: user.displayName || user.email,
      }),
    });

    alert("Permission request sent");
  };



  return (
    <main>
      {/* confirmaiton pop-up */}
      <Modal
        opened={opened}
        onClose={() => toggleOpen()}
        title="Web Order"
        size="70%"
        radius={0}
    
        transitionProps={{ transition: 'fade', duration: 300, timingFunction: 'linear' }}
      >
        <div className="p-2 rounded-lg">
          <AddNewOrder />
        </div>
      </Modal>
      <div className="grid gap-4 w-full overflow-hidden ">
        <div className="w-full overflow-x-scroll rounded-md relative">
          {!orders.length ? (
            <NotFound text={"order"} />
          ) : (
            <table className="w-full whitespace-nowrap table-auto ">
              <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200  bg-blue-100">
                <tr>
                  <th className="px-4 py-3 ">Created At</th>
                  <th className="px-4 py-3 ">Customer</th>
                  <th className="px-4 py-3 ">Note</th>
                  <th className="px-4 py-3 ">Order Items</th>
                  <th className="px-4 py-3 ">Success Rate</th>
                  <th className="px-4 py-3 ">Site</th>
                  <th className="px-4 py-3 ">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-200 ">
                <>
                  {!!orders &&
                    orders?.map(
                      (item, index) =>
                        index >= 15 * page - 15 &&
                        index + 1 <= 15 * page && (
                          <tr
                            className={`hover:bg-blue-50 ${
                              item?.isFilter && "bg-sky-100"
                            }`}
                            key={index}
                          >
                            <td className="px-4 py-3">
                              <span className="text-sm">
                                {new Date(
                                  item.dateCreated.endsWith("Z")
                                    ? item.dateCreated
                                    : `${item.dateCreated}Z`,
                                ).toLocaleString("en-GB", {
                                  timeZone: "Asia/Dhaka",
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                              <h1 className="text-sm">ID: {item.id}</h1>
                            </td>
                            <td className="px-4 py-3 font-medium">
                              <h1 className="text-sm">
                                <span className="inline-flex items-center gap-1">
                                  <FiPhone />
                                  {item?.customer?.phone}

                                  <a
                                    href={`tel:${item?.customer?.phone}`}
                                    className="inline-flex items-center pl-2 text-blue-600"
                                  >
                                    <FiPhoneCall size={16} />
                                  </a>
                                  <a
                                    href={`https://wa.me/${item?.customer?.phone?.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center pl-2 text-green-700"
                                  >
                                    <FaWhatsapp size={18} />
                                  </a>
                                </span>
                              </h1>
                              <h1 className="text-sm">
                                <span className="inline-flex items-center gap-1">
                                  <FaRegUser />
                                  {item?.customer?.firstName}
                                </span>
                              </h1>
                              <h1 className="text-sm truncate">
                                <span className="inline-flex items-center gap-1">
                                  <MdOutlineLocationOn />{" "}
                                  {item?.customer?.address1}
                                </span>
                              </h1>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-sm">
                                About {timeAgo(item.dateCreated)}
                              </span>
                              <h1 className="text-xs cursor-pointer">
                                Add Note +
                              </h1>
                            </td>
                            <td className="px-4 py-3">
                              {item.products.map((product) => (
                                <div
                                  key={product.id}
                                  className="flex items-center gap-2 p-2"
                                >
                                  {product.image && (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="h-10 w-10 rounded-lg object-cover"
                                    />
                                  )}

                                  <div className="flex-1">
                                    <p className="font-semibold text-sm text-gray-900">
                                      {product.name}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                      {item.currency}{" "}
                                      {parseFloat(product.total)}
                                    </p>

                                    {product.sku && (
                                      <p className="text-xs text-gray-400">
                                        SKU: {product.sku}
                                      </p>
                                    )}
                                  </div>

                                  <div className="font-semibold">
                                    x{product.quantity}
                                  </div>
                                </div>
                              ))}
                            </td>

                            <td className="px-4 py-3 ">
                              <div className="flex justify-center text-sm">
                                <RingProgress
                                  size={50}
                                  thickness={5}
                                  roundCaps
                                  sections={[{ value: 100, color: "green" }]}
                                />
                                <div className="flex-col flex justify-center text-sm">
                                  <span>
                                    Success:{" "}
                                    <span className="text-green-500">100%</span>
                                  </span>
                                  <span>
                                    Order:{" "}
                                    <span className="text-green-500">
                                      33/33
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm">
                                Gur.Rajshahir AamWala
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                disabled={item?.lock?.isLocked}
                                onClick={() => openOrder(String(item.id))}
                                className={`inline-flex items-center gap-2 rounded-full  px-3 py-1.5 text-sm font-medium  shadow  ${item?.lock?.isLocked ? " text-red-600 bg-red-100" : "text-purple-700 bg-white hover:bg-purple-50"} `}
                              >
                                Open
                                <IoOpenOutline size={18} />
                                {item?.lock?.isLocked && (
                                  <>
                                    <span className="text-black">
                                      ({item.lock.lockedByName})
                                    </span>

                                    <span>🔒</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* <td className="px-4 py-3">
                              <span
                                className="cursor-pointer text-sm font-semibold flex justify-center gap-1 items-center bg-white py-1 rounded-full text-purple-900 shadow-md hover:shadow-lg"
                                onClick={() => statusUpdate(item)}
                              >
                                Open
                                <IoOpenOutline size={18} />
                                (siam)
                                <CiLock size={18} />
                              </span>
                            </td> */}
                          </tr>
                        ),
                    )}
                </>
              </tbody>
            </table>
          )}
        </div>
      </div>
      {
        <div className="bg-white py-3 justify-center flex">
          <Pagination
            total={Math.ceil(orders?.length / 15)}
            boundaries={1}
            defaultValue={page ? page : 1}
            onChange={(i) => setPage(i)}
          />
        </div>
      }
    </main>
  );
};

export default AllOrder;
