import React from "react";
import { FiShoppingCart, FiTruck } from "react-icons/fi";
import { TfiReload } from "react-icons/tfi";
import { MdFileDownloadDone, MdOutlinePendingActions } from "react-icons/md";
import { useSelector } from "react-redux";
import {
  selectCancelledOrders,
  selectDeliveredOrders,
  selectPendingOrders,
  selectProcessingOrders,
  selectShippedOrders,
  selectTotalOrders,
} from "@/app/redux/slices/orderSlice";
import { RxCross2 } from "react-icons/rx";
import { doubleDigit } from "@/admin/utils/helpers";

const OrderOverview = () => {
  const totalOrder = useSelector(selectTotalOrders);
  const totalPendingOrder = useSelector(selectPendingOrders);
  const totalProcessingOrder = useSelector(selectProcessingOrders);
  const totalShippedOrder = useSelector(selectShippedOrders);
  const totalDeliveredOrder = useSelector(selectDeliveredOrders);
  const totalCancelledOrder = useSelector(selectCancelledOrders);

const ConfigOrderOverview = [
  {
      title: "Total Order",
      icon: FiShoppingCart,
      value: totalOrder,
      style: "text-blue-600 bg-blue-100",
  },
  {
      title: "Orders Pending",
      icon: MdOutlinePendingActions,
      value: totalPendingOrder,
      style: "text-orange-600 bg-orange-100",
  },
  {
      title: "Orders Processing",
      icon:  TfiReload,
      value: totalProcessingOrder,
      style: "text-indigo-600 bg-indigo-100",
  },
  {
      title: "Orders Shipped",
      icon:  FiTruck,
      value: totalShippedOrder,
       style: "text-teal-600 bg-teal-100",
  },
  {
      title: "Orders Cancelled",
      icon: RxCross2,
      value: totalCancelledOrder,
       style: "text-red-600 bg-red-100",
  },
  {
      title: "Orders Delivered",
      icon: MdFileDownloadDone,
      value: totalDeliveredOrder,
       style: "text-green-600 bg-green-100",
  }
];

  return (
    <div className="grid grid-cols-6 2xl:grid-cols-12 gap-4 w-full">
      {ConfigOrderOverview &&
        ConfigOrderOverview.map((item) => (
          <div key={item.title} className="col-span-6 sm:col-span-3 lg:col-span-2 bg-gray-50 p-4 rounded-md border border-gray-200 shadow">
            <div className="flex items-center gap-3">
              <span className={`${item.style} p-4  rounded-full text-center`}>
                <item.icon size={20}/>
              </span>
              <h1 className="text-base flex flex-col text-title">
                {item.title}
                <span className="text-2xl font-medium text-title">
                  {doubleDigit(item.value)}
                </span>
              </h1>
            </div>
          </div>
        ))}
    </div>
  );
};

export default OrderOverview;
