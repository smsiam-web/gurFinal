import {
  ActionIcon,
  Center,
  Checkbox,
  CheckIcon,
  LoadingOverlay,
  RingProgress,
} from "@mantine/core";
import React, { useEffect, useState } from "react";
import { Modal } from "@mantine/core";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiList,
  FiPauseCircle,
  FiPhone,
  FiPhoneCall,
  FiPhoneMissed,
  FiPhoneOff,
  FiXCircle,
} from "react-icons/fi";
import { Pagination } from "@mantine/core";
import { db } from "@/app/utils/firebase";
import { notifications } from "@mantine/notifications";
import { useDispatch, useSelector } from "react-redux";
import {
  selectWebOrderList,
  updateWebOrderList,
} from "@/app/redux/slices/webOrderList";
import NotFound from "../shared/NotFound";
import { selectUser } from "@/app/redux/slices/authSlice";
import { invoiceGenerate } from "@/admin/utils/helpers";
import { FaWhatsapp } from "react-icons/fa";
import { updateConfig } from "@/app/redux/slices/configSlice";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineLocationOn } from "react-icons/md";
import { IoOpenOutline } from "react-icons/io5";
import { useRouter } from "next/router";
import AddNewOrder from "@/admin/components/placeWebGur/add_new_order";

const AllOrder = () => {
  const [loading, setLoading] = useState(false);
  const [locking, setLocking] = useState(false);
  const [filterOrder, setFilterOrder] = useState(null);
  const [activeKey, setActiveKey] = useState("processing");
  const [counter, setCounter] = useState(null);
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
      .collection(activeKey)
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
  }, [activeKey]);

  // Get order from firebase database
  useEffect(() => {
    const unSub = db
      .collection("counters")
      .doc("orderStatusSummary")
      .onSnapshot((snap) => {
        setCounter(snap.data());
      });
    return () => {
      unSub();
    };
  }, [activeKey]);

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

  console.log(order);

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
    setLocking(true);
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
        notifications.show({
          title: "Already Assign",
          message: `এই order বর্তমানে ${data.lockedByName} ব্যবহার করছেন।`,
          color: "orange",
        });

        return;
      }
      if (response.status === 200) {
        toggleOpen();
        setLocking(false);
      }

      if (!response.ok) {
        notifications.show({
          title: "Already Assign",
          message: Error(data.message || "Order open failed"),
          color: "orange",
        });
        // throw new Error(data.message || "Order open failed");
      }

      // router.push(`/place-gur/add-new`);
    } catch (error) {
      console.error(error);

      alert(error?.message || "Order open করা যায়নি");
    } finally {
      setLocking(false);
    }
  };
  const unlockOrder = async (orderID) => {
    setLocking(true);
    const userUID = user?.uid;
    try {
      const response = await fetch("/api/orders/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderID,
          userUID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Unlock failed:", data);
        throw new Error(data?.message || "Failed to unlock order");
      }

      console.log("Unlock success:", data);

      return data;
    } catch (error) {
      console.error("UNLOCK ERROR:", error);
      throw error;
    } finally {
      setLocking(false);
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

  const tabs = [
    {
      key: "processing",
      label: "Processing",
      count: 0,
      icon: <FiClock className="text-[15px]" />,
    },
    {
      key: "incomplete",
      label: "Incomplete",
      count: 0,
      icon: <FiAlertCircle className="text-[15px]" />,
    },
    {
      key: "goodButNoResponse",
      label: "Good But No Response",
      count: 0,
      icon: <FiPhoneMissed className="text-[15px]" />,
    },
    {
      key: "noResponse",
      label: "No Response",
      count: 0,
      icon: <FiPhoneOff className="text-[15px]" />,
    },
    {
      key: "advancePayment",
      label: "Advance Payment",
      count: 0,
      icon: <FiCreditCard className="text-[15px]" />,
    },
    {
      key: "onHold",
      label: "On Hold",
      count: 0,
      icon: <FiPauseCircle className="text-[15px]" />,
    },
    {
      key: "approved",
      label: "Approved",
      count: 0,
      icon: <FiCheckCircle className="text-[15px]" />,
    },
    {
      key: "cancel",
      label: "Cancel",
      count: 0,
      icon: <FiXCircle className="text-[15px]" />,
    },
    {
      key: "webOrderList",
      label: "All",
      count: 0,
      icon: <FiList className="text-[15px]" />,
    },
  ];

  const toogleActive = async (key) => {
    key && setActiveKey(key);
  };

  const getTabCount = (key) => {
    const value = counter?.[key];

    return typeof value === "number" ? value : 0;
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
        transitionProps={{
          transition: "fade",
          duration: 300,
          timingFunction: "linear",
        }}
      >
        <div className="p-2 rounded-lg">
          <AddNewOrder />
        </div>
      </Modal>
      <div className="grid gap-4 w-full overflow-hidden ">
        <div className="w-full overflow-x-scroll rounded-md relative">
          <div className="flex w-full whitespace-nowrap table-auto gap-2 overflow-x-auto pb-2 bg-white pt-2">
            {tabs.map((tab) => {
              // const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => toogleActive(tab.key)}
                  className={`group relative inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                    activeKey === tab.key
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={
                      activeKey === tab.key
                        ? "text-purple-700"
                        : "text-gray-500"
                    }
                  >
                    {tab.icon}
                  </span>

                  <span>{tab.label}</span>

                  <span
                    className={`rounded-full px-2 py-[2px] text-xs font-semibold ${
                      activeKey === tab.key
                        ? "bg-purple-200 text-purple-700"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {getTabCount(tab.key)}
                  </span>

                  {/* underline */}
                  {activeKey === tab.key && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-purple-600" />
                  )}
                </button>
              );
            })}
          </div>
          {!orders.length ? (
            <NotFound text={"order"} />
          ) : (
            <table className="w-full whitespace-nowrap table-auto ">
              <LoadingOverlay
                visible={loading}
                zIndex={1000}
                overlayProps={{ radius: "sm", blur: 2 }}
                loaderProps={{ color: "blue", type: "bars" }}
              />
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

                            <td className="px-4 py-3">
                              <div className="flex justify-start items-center text-sm">
                                <RingProgress
                                  size={50}
                                  thickness={5}
                                  roundCaps
                                  sections={[
                                    {
                                      value:
                                        (item?.ratio?.overall?.rate == 0 &&
                                          100) ||
                                        item?.ratio?.overall?.rate ||
                                        0,
                                      color:
                                        (item?.ratio?.overall?.rate >= 80 &&
                                          "green") ||
                                        (item?.ratio?.overall?.rate >= 60 &&
                                          item?.ratio?.overall?.rate < 80 &&
                                          "orange") ||
                                        (item?.ratio?.overall?.rate >= 1 &&
                                          item?.ratio?.overall?.rate < 60 &&
                                          "red") ||
                                        (item?.ratio?.overall?.rate == 0 &&
                                          "green"),
                                    },
                                  ]}
                                  rootColor="#B2BEB5"
                                />
                                <div className="flex-col flex justify-center text-sm">
                                  <span>
                                    Success:{" "}
                                    <span
                                      className={`font-medium ${(item?.ratio?.overall?.rate >= 80 && "text-green-500") || (item?.ratio?.overall?.rate >= 60 && item?.ratio?.overall?.rate < 80 && "text-orange-500") || (item?.ratio?.overall?.rate >= 1 && item?.ratio?.overall?.rate < 60 && "text-red-500") || (item?.ratio?.overall?.rate >= 0 && "text-green-500")}`}
                                    >
                                      {item?.ratio?.overall?.rate}%
                                    </span>
                                  </span>
                                  <span>
                                    Order:{" "}
                                    <span
                                      className={`font-medium ${(item?.ratio?.overall?.rate >= 80 && "text-green-500") || (item?.ratio?.overall?.rate >= 60 && item?.ratio?.overall?.rate < 80 && "text-orange-500") || (item?.ratio?.overall?.rate >= 1 && item?.ratio?.overall?.rate < 60 && "text-red-500") || (item?.ratio?.overall?.rate >= 0 && "text-green-500")}`}
                                    >
                                      {item?.ratio?.overall?.success}/
                                      {item?.ratio?.overall?.total}
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
                            <td className="px-4 py-3 relative">
                              {item?.lock?.isLocked && <button onClick={() => unlockOrder(String(item.id))} >Unlock</button>}
                              <button
                                disabled={item?.lock?.isLocked || locking}
                                onClick={() => openOrder(String(item.id))}
                                className={` inline-flex items-center gap-2 rounded-full  px-3 py-1.5 text-sm font-medium  shadow  ${item?.lock?.isLocked ? " text-red-600 bg-red-100" : "text-purple-700 bg-white hover:bg-purple-50"} `}
                              >
                                {locking && (
                                  <LoadingOverlay
                                    visible={locking}
                                    zIndex={1000}
                                    overlayProps={{ radius: "sm", blur: 2 }}
                                    loaderProps={{
                                      color: "blue",
                                      type: "bars",
                                    }}
                                  />
                                )}
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
