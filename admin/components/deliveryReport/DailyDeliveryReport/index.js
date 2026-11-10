import React, { useEffect, useRef, useState } from "react";
import Button from "../../shared/Button";
import { AiOutlineAppstoreAdd } from "react-icons/ai";
import { db, timestamp } from "@/app/utils/firebase";
import { useDispatch } from "react-redux";
import { notifications } from "@mantine/notifications";
import firebase from "firebase";
import "firebase/storage";
import { MdAddToPhotos } from "react-icons/md";
import { useRouter } from "next/router";
import { Modal, NumberInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { FaPrint } from "react-icons/fa";
import generateBulkSticker from "../generateBulkSticker";
import { RxCross2 } from "react-icons/rx";

const DailyDeliveryReport = () => {
  const inputRef = useRef(null);
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState(false);
  const [isToggled, setIsToggled] = useState(false);
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentValue, setCurrentValue] = useState("RA014");
  const [dispatchId, setDispatchId] = useState(router.asPath?.split("=")[1]);
  const [opened, { open, close }] = useDisclosure(false);
  const [filterOrder, setFilterOrder] = useState(null);
  const [dispatchData, setDispatchData] = useState([]);
  const [bulkOrder, setBulkOrder] = useState([]);
  const [highlightedRow, setHighlightedRow] = useState(null);
  const [status, setStatus] = useState(null);

  const toggle = () => setIsToggled((prev) => !prev);

  const handleChange = (e) => {
    setCurrentValue(e.currentTarget.value);
  };

  // console.log(filterOrder, dispatchData);
  const playNotificationSound = () => {
    const audio = new Audio("/sucess.wav");
    audio
      .play()
      .catch((error) => console.error("Failed to play sound:", error));
  };

  const addDispatch = async () => {
    const value = currentValue?.toUpperCase();
    if (value?.startsWith("RA") && value.length === 9) {
      setLoadingAction(true);
      const duplicate =
        dispatchData?.dispatches?.length &&
        dispatchData?.dispatches?.find((i) => i.id === value);

      if (duplicate) {
        notifications.show({
          title: `Duplicate Entry`,
          message: `The ID "${value}" already exists as Sl No:${duplicate?.sl}.`,
          color: "yellow",
          autoClose: 6000,
        });

        // Highlight the duplicate entry
        setHighlightedRow(duplicate.id); // New state to track highlighted row
        setTimeout(() => setHighlightedRow(null), 3000); // Remove highlight after 3s
        if (inputRef.current) inputRef.current.focus();
        setLoadingAction(false);
        setTimeout(() => {
          setCurrentValue("RA014");
        }, 3000); // Set timeout for 3 seconds
      } else {
        await filter(value);
        setLoadingAction(false);
      }
    } else {
      notifications.show({
        title: `Invalid ID`,
        message: `The entered ID "${value}" is invalid. Please ensure it starts with "RA" and is 9 characters long.`,
        color: "red",
        autoClose: 4000,
      });
      if (inputRef.current) inputRef.current.focus();
      setLoadingAction(false);
      setTimeout(() => {
        setCurrentValue("RA014");
      }, 3000); // Set timeout for 3 seconds
    }
  };

  const filter = async (id) => {
    // console.log("filter", id);
    await db
      .collection("placeOrder")
      .doc(id)
      .get()
      .then((doc) => {
        if (!!doc.data()) {
          console.log(doc.data());
          if (doc.data()?.status !== "Processing") {
            setFilterOrder(doc.data());
            open();
          } else {
            const singleOrder = {
              sl: dispatchData?.dispatches?.length + 1 || 1,
              id: doc.id,
              sfc: doc.data()?.sfc.consignment_id,
              customerName: doc.data()?.customer_details?.customer_name,
              contact: doc.data()?.customer_details?.phone_number,
              wgt: doc.data()?.weight,
              cod: doc.data()?.customer_details?.salePrice,
              status: doc.data()?.status,
              timestamp: new Date().toISOString(),
            };

            createDispatch(dispatchId, singleOrder);
            setFilterOrder(singleOrder);
            setCurrentValue("RA014");
            // open();
          }
        } else {
          notifications.show({
            title: "Order not found",
            message: `There was no order.`,
            color: "red",
          });
          if (inputRef.current) inputRef.current.focus();
          setCurrentValue("RA014");
          setFilterOrder(null);
        }
      });
  };

  const createDispatch = async (dispatchId, singleOrder) => {
    try {
      // Step 1: Validate inputs
      if (!dispatchId || !singleOrder) {
        throw new Error("dispatchId and singleOrder are required!");
      }

      // Step 2: Perform preparatory actions
      console.log("Preparing to add data...");
      console.log("Dispatch ID:", dispatchId);
      console.log("Single Order:", singleOrder);

      // Step 3: Perform the Firebase operation
      await db
        .collection("dispatch")
        .doc(dispatchId)
        .set(
          {
            dispatches: firebase.firestore.FieldValue.arrayUnion(singleOrder),
          },
          { merge: true } // Ensures only the "dispatches" field is updated
        );

      // Step 4: Call filters and log success
      filters();
      playNotificationSound();
      setFilterOrder(null);

      if (inputRef.current) inputRef.current.focus();
      notifications.show({
        title: `Order #${singleOrder?.id} "${singleOrder?.wgt}Kg" Added Successfully!`,
        message: `The order details have been successfully updated.`,
        color: "blue",
        autoClose: 4000,
      });
      console.log("Data merged successfully!");
    } catch (err) {
      // Handle errors
      console.error("Error merging data:", err);
    }
  };

  // Get order from firebase database
  const filters = () => {
    const unsubscribe = db
      .collection("dispatch")
      .doc(dispatchId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            setDispatchData(doc.data());
          }
        },
        (error) => {
          console.error("Error fetching real-time updates:", error);
        }
      );

    // Return the unsubscribe function to stop listening when needed
    return unsubscribe;
  };

  // Example usage:
  useEffect(() => {
    if (opened === true) return;
    setFilterOrder(null);
    setCurrentValue("RA014");
    inputRef.current.focus();
  }, [opened]);

  const bulkPrintPermission = async () => {
    const bulkData = dispatchData?.dispatches?.length || 0;
    setValue(bulkData);
    toggle();
  };
  const limitPrintPermission = async () => {
    const bulkData = dispatchData?.dispatches.slice(-value);
    bulkSticker(bulkData);
    toggle();
  };

  const bulkSticker = async (bulkData) => {
    setLoading(true);
    try {
      const bulkSticker = await Promise.all(
        bulkData.map(async (item) => {
          const doc = await db.collection("placeOrder").doc(item.id).get();
          if (doc.exists) {
            return { id: doc.id, ...doc.data() };
          }
          return null; // Return null if no document is found
        })
      );

      // Filter out null values (in case some documents do not exist)
      const filteredBulkSticker = bulkSticker.filter(Boolean);
      setBulkOrder(filteredBulkSticker);
      generateBulkSticker(filteredBulkSticker);
      return filteredBulkSticker; // Optionally return the result
    } catch (err) {
      console.error("Error fetching bulk stickers:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id) => {
    try {
      setLoadingAction(true); // Show skeleton row
      const updatedDispatchData = dispatchData?.dispatches?.filter(
        (item) => item.id !== id
      );
      setDispatchData(updatedDispatchData);

      await db
        .collection("dispatch")
        .doc(dispatchId)
        .update({
          dispatches: firebase.firestore.FieldValue.arrayRemove(
            dispatchData?.dispatches?.find((item) => item.id === id)
          ),
        });

      notifications.show({
        title: `Order #${id} Removed Successfully!`,
        message:
          "The order has been successfully removed from the dispatch list.",
        color: "green",
        autoClose: 4000,
      });
      setLoadingAction(false); // Hide skeleton row
    } catch (error) {
      console.error("Error removing item:", error);
      notifications.show({
        title: `Error Removing Order`,
        message: `There was an error removing order #${id}. Please try again.`,
        color: "red",
        autoClose: 4000,
      });
      setLoadingAction(false); // Hide skeleton row
    }
  };

  useEffect(() => {
    filters();
  }, [dispatchId]);

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="hidden md:table-cell px-4 py-3">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="hidden md:table-cell px-4 py-3">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="hidden md:table-cell px-4 py-3">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="hidden md:table-cell px-4 py-3">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
      <td className="hidden md:table-cell px-4 py-3">
        <div className="h-4 bg-gray-200 rounded"></div>
      </td>
    </tr>
  );
  const selectStatus = async (e) => {
    e.preventDefault();
    const statusFilter = e.target.value;
    setStatus(statusFilter);
  };
  const ChangeToStatus = async () => {
    if (!Array.isArray(bulkOrder) || bulkOrder.length === 0) {
      notifications.show({
        title: "No Orders Selected",
        message: "Please select at least one valid order to update the status.",
        color: "orange",
        autoClose: 3000,
      });
      return;
    }
    setLoading(true);

    // Firestore batch instance
    const batch = db.batch();

    try {
      // Iterate through bulkOrder and prepare batch updates
      bulkOrder.forEach((item) => {
        const orderRef = db.collection("placeOrder").doc(item.id);

        batch.set(
          orderRef,
          {
            ...item,
            status,
            timestamp: item.timestamp || new Date(), // Use item timestamp or set new one
          },
          { merge: true }
        );
      });

      // Commit batch operations
      await batch.commit();

      // Show success notification
      notifications.show({
        title: "Status Update Successful",
        message: "All statuses have been updated successfully.",
        color: "green",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error updating status:", error);

      // Show error notification
      notifications.show({
        title: "Status Update Failed",
        message:
          "An error occurred while updating the status. Please try again.",
        color: "red",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
      setStatus(null);
    }
  };

  const printOrderIds = () => {
    router.push(`/delivery-report/dispatch-list?date=${dispatchId}`);
  };

  return (
    <main className="h-full overflow-y-auto">
      <Modal opened={opened} onClose={close} title="Duplicate Entry">
        <div className="flex items-center justify-center flex-col">
          <div>
            <p>This order cannot be dispatched.</p>
            <h1 className="text-center text-2xl font-semibold pb-1">
              ID #{filterOrder?.id} ({filterOrder?.status})
            </h1>
            <h1 className="text-center text-2xl font-semibold border-b pb-3">
              {/* {filterOrder?.sfc || null} */}
            </h1>
          </div>
          <Button
            onClick={() => close()}
            title={"Close"}
            className="bg-orange-400 hover:bg-orange-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
            icon=<AiOutlineAppstoreAdd size={24} />
          />
        </div>
      </Modal>
      <Modal opened={isToggled} title="Bulk print">
        <div className="flex items-center justify-center flex-col">
          <div className="pb-5 w-full">
            {/* <p>This order cannot be dispatched.</p> */}
            <NumberInput
              withAsterisk
              data-autofocus
              // label="From last"
              placeholder="Number of order"
              value={value}
              onChange={setValue}
            />
          </div>
          <div className="flex w-full flex-col sm:flex-row justify-between gap-3">
            <div className="w-full">
              <Button
                onClick={() => toggle()}
                title={"Cancel"}
                className="bg-orange-400 hover:bg-orange-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                icon=<AiOutlineAppstoreAdd size={24} />
              />
            </div>
            <div className="w-full">
              <Button
                onClick={() => limitPrintPermission()}
                title={"Print"}
                className="bg-green-400 hover:bg-green-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                icon=<AiOutlineAppstoreAdd size={24} />
              />
            </div>
          </div>
        </div>
      </Modal>
      <h1 className="text-4xl font-bold text-center">DISPATCH</h1>
      <h1 className="text-7xl sm:text-9xl font-semibold text-center">
        {dispatchData?.dispatches?.length || 0}
      </h1>
      <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50  shadow-xs  mb-5">
        <div className="p-4">
          <div className="py-3 grid gap-4 lg:gap-6 xl:gap-6 md:flex xl:flex">
            <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
              <div className="flex-grow-0  md:flex-grow lg:flex-grow xl:flex-grow">
                <input
                  ref={inputRef}
                  className="block w-full px-3 py-1 text-sm focus:outline-neutral-200 leading-5 rounded-md  border-gray-200 h-14 bg-gray-100 border-transparent focus:bg-white"
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleChange(e)}
                  placeholder="Search by #ID"
                />
              </div>
            </div>

            <div className="w-full md:w-56 lg:w-56 xl:w-56">
              <Button
                onClick={() => addDispatch()}
                title="Add"
                className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                icon=<MdAddToPhotos size={24} />
              />
            </div>

            <div className="w-full hidden md:block md:w-56 lg:w-56 xl:w-56">
              <Button
                onClick={() => printOrderIds()}
                title={"Dispatch List"}
                className="bg-orange-400   hover:bg-orange-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                icon=<AiOutlineAppstoreAdd size={24} />
              />
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0 hidden md:block rounded-lg overflow-hidden bg-gray-50  shadow-xs  mb-5">
        <div className="p-4">
          <div className="flex gap-3 flex-col md:flex-row">
            <select
              className="block w-full px-2 py-1 text-sm  focus:outline-none rounded-md form-select focus:border-gray-200 border-gray-200  focus:shadow-none leading-5 border h-14 bg-gray-100 border-transparent focus:bg-gray-50"
              id="roleItem"
              name="roleItem"
              // defaultValue={selectedSubNav}
              onChange={(e) => selectStatus(e)}
            >
              <option>Status Change to</option>
              <option value="Pending">Change status to Pending</option>
              <option value="Processing">Change status to Processing</option>
              <option value="Shipped">Change status to Shipped</option>
              <option value="Delivered">Change status to Delivered</option>
              <option value="Hold">Change status to Hold</option>
              <option value="Cancelled">Change status to Cancelled</option>
            </select>
            <Button
              onClick={() => ChangeToStatus()}
              disabled={loading}
              title="Apply"
              className="bg-green-400 hover:bg-green-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
              // icon=<IoPrintOutline size={24} />
            />
            <Button
              onClick={() => bulkPrintPermission()}
              disabled={loading}
              title="Bulk Print"
              className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
              icon=<FaPrint size={18} />
            />
          </div>
          {/* <div className="w-full md:w-56 lg:w-56 xl:w-56"></div> */}
        </div>
      </div>
      <div>
        <div className="w-full overflow-x-scroll rounded-md relative">
          <table className="w-full whitespace-nowrap table-auto">
            <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200 bg-gray-100">
              <tr>
                <th className="px-4 py-3">SL</th>
                <th className="px-4 py-3">Invoice No</th>
                <th className="hidden md:table-cell px-4 py-3">SFC ID</th>
                <th className="px-4 py-3">WGT</th>
                {/* Other columns hidden on mobile */}
                <th className="hidden md:table-cell px-4 py-3">Name</th>
                <th className="hidden md:table-cell px-4 py-3">Phone No.</th>
                <th className="hidden md:table-cell px-4 py-3">COD</th>
                <th className="hidden md:table-cell px-4 py-3">Status</th>
                <th className=" px-4 py-3 md:flex justify-center">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loadingAction && <SkeletonRow />}
              {!!dispatchData &&
                Array.isArray(dispatchData?.dispatches) &&
                [...dispatchData?.dispatches]?.reverse().map((item, index) => (
                  <tr
                    className={`${
                      highlightedRow === item.id
                        ? "bg-yellow-300 animate-pulse"
                        : ""
                    } ${item?.isFilter && "bg-sky-200"} ${
                      item.status.toLowerCase() === "delivered" &&
                      "bg-green-200"
                    } ${
                      item.customer_details?.markAs === "Argent" &&
                      "bg-green-100"
                    }`}
                    key={index}
                  >
                    <td className="px-4 py-3 font-bold">
                      {item.sl < 9 && 0}
                      {item.sl}
                    </td>
                    <td className="px-4 py-3 font-bold">#{item.id}</td>
                    <td className="hidden md:table-cell px-4 py-3 font-bold">
                      {item?.sfc}
                    </td>
                    <td className="px-4 py-3 font-bold">{item?.wgt}Kg</td>
                    {/* Hidden columns in mobile */}
                    <td className="hidden md:table-cell px-4 py-3 font-bold">
                      {item?.customerName}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 font-bold">
                      {item?.contact}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 font-bold">
                      {item?.cod}tk
                    </td>
                    <td className="hidden md:table-cell px-4 py-3">
                      <span
                        className={`status-class-${item.status.toLowerCase()}`}
                      >
                        {item?.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold">
                      <span
                        className="text-sm hover:text-red-600 cursor-pointer flex justify-center"
                        onClick={() => removeItem(item.id)}
                      >
                        <RxCross2 size={18} />
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default DailyDeliveryReport;
