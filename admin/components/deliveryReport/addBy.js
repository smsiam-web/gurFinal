import React, { useEffect, useState } from "react";
import Button from "@/app/components/shared/Button";
import { AiOutlineAppstoreAdd } from "react-icons/ai";
import { db } from "@/app/utils/firebase";
import { useDispatch, useSelector } from "react-redux";
import {
  generateStick,
  invoiceGenerate,
  updateOrderStatus,
} from "@/admin/utils/helpers";
import {
  updateSingleOrder,
} from "@/app/redux/slices/singleOrderSlice";
import { useDisclosure } from "@mantine/hooks";
import { Modal } from "@mantine/core";
import { useBarcode } from "next-barcode";
import { notifications } from "@mantine/notifications";
import { selectUser } from "@/app/redux/slices/authSlice";
import { selectOrder, updateOrder } from "@/app/redux/slices/orderSlice";

const AddBy = ({ onClick }) => {
  const [currentValue, setCurrentValue] = useState("RA013");
  const [filterOrder, setFilterOrder] = useState(null);
  const [orders, setOrders] = useState(useSelector(selectOrder));
  const [order, setOrder] = useState([]);
  const [openedd, setOpened] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const dates = new Date();

  const formattedDate = dates.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const cg = formattedDate.replace(/ /g, "-").replace(",", "");

  useEffect(() => {
    if (!!opened) return;
    setCurrentValue("RA013");
    setFilterOrder(null);
  }, [opened]);

  useEffect(() => {
    setOrder(orders);
  }, [orders]);

  const handleChange = (e) => {
    setCurrentValue(e.currentTarget.value);
  };
  const toggleOpen = () => {
    opened ? setOpened(false) : setOpened(true);
  };

  const { inputRef } = useBarcode({
    value: `${filterOrder?.sfc?.consignment_id}`,
    options: {
      background: "#FFFFFF",
      displayValue: false,
      width: 3,
      height: 80,
    },
  });

  // Change Status from print Action and check print Status
  const stickerStatus = async (item) => {
    item.status === "Processing" ? updateStatus(item, "Shipped") : toggleOpen;
    item.status === "Processing" && generateStick(item, inputRef?.current.src);
  };

  // Change Status from print Action and check print Status
  const getInvoice = async (item) => {
    item.status === "Pending" && invoiceGenerate(item);

    item.status === "Pending"
      ? updateStatus(item, "Processing", item?.id)
      : toggleOpen;
    close();
    //   console.log(item);
  };

  // Change Status from status Action
  const onStatusChanged = async (e, id) => {
    e.preventDefault();
    const newStatus = e.target.value;

    updateStatus(filterOrder, newStatus);
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
        autoClose: 4000,
      });
    }
  };

  useEffect(() => {
    const value = currentValue?.toUpperCase();
    if (value?.split("0")[0] === "RA" && value.length === 9) {
      filter(value);
    }
  }, [currentValue]);

  // onStatus config
  const statusChange = (e) => {
    e.preventDefault();
    const selectedStatus = e.target.value.toLowerCase();

    const filteredOrders = orders.filter(
      (order) =>
        selectedStatus === "status" ||
        order.status.toLowerCase() === selectedStatus
    );

    dispatch(updateOrder(filteredOrders));
  };

  const filter = async (id) => {
    await db
      .collection("placeOrder")
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

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        size="xl"
        title="Found Data..."
      ></Modal>
      <div className="hidden">
        <img ref={inputRef} alt="ok" />
      </div>
      <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50  shadow-xs  mb-5">
        <div className="p-4">
          <div className="py-3 grid gap-4 lg:gap-6 xl:gap-6 md:flex xl:flex">
            <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
              <div className="flex-grow-0  md:flex-grow lg:flex-grow xl:flex-grow">
                <input
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
                onClick={onClick}
                title="Create Dispatch"
                className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                icon=<AiOutlineAppstoreAdd size={24} />
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddBy;
