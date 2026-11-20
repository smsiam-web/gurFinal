
import React from "react";

import { FiShoppingCart, FiTruck } from "react-icons/fi";
import { TfiReload } from "react-icons/tfi";

import {
  MdFileDownloadDone,
  MdOutlinePendingActions,
} from "react-icons/md";

import { RxCross2 } from "react-icons/rx";

import { useSelector } from "react-redux";

import {
  selectCancelledOrders,
  selectDeliveredOrders,
  selectPendingOrders,
  selectProcessingOrders,
  selectShippedOrders,
  selectTotalOrders,
} from "@/app/redux/slices/orderSlice";

import { doubleDigit } from "@/admin/utils/helpers";

const OrderOverview = () => {

  // ==========================================
  // REDUX SELECTORS - ORIGINAL FUNCTIONALITY
  // ==========================================

  const totalOrder = useSelector(selectTotalOrders);

  const totalPendingOrder = useSelector(selectPendingOrders);

  const totalProcessingOrder = useSelector(selectProcessingOrders);

  const totalShippedOrder = useSelector(selectShippedOrders);

  const totalDeliveredOrder = useSelector(selectDeliveredOrders);

  const totalCancelledOrder = useSelector(selectCancelledOrders);


  // ==========================================
  // ORDER STATUS CONFIGURATION
  // ==========================================

  const ConfigOrderOverview = [
    {
      title: "Total Order",
      subtitle: "All orders",
      icon: FiShoppingCart,
      value: totalOrder,

      gradient: "from-blue-500 to-indigo-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      border: "hover:border-blue-200",
      glow: "bg-blue-500",
    },

    {
      title: "Orders Pending",
      subtitle: "Waiting for processing",
      icon: MdOutlinePendingActions,
      value: totalPendingOrder,

      gradient: "from-orange-400 to-amber-500",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      border: "hover:border-orange-200",
      glow: "bg-orange-500",
    },

    {
      title: "Orders Processing",
      subtitle: "Currently processing",
      icon: TfiReload,
      value: totalProcessingOrder,

      gradient: "from-indigo-500 to-violet-600",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      border: "hover:border-indigo-200",
      glow: "bg-indigo-500",
    },

    {
      title: "Orders Shipped",
      subtitle: "On the way",
      icon: FiTruck,
      value: totalShippedOrder,

      gradient: "from-teal-400 to-cyan-600",
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      border: "hover:border-teal-200",
      glow: "bg-teal-500",
    },

    {
      title: "Orders Cancelled",
      subtitle: "Cancelled orders",
      icon: RxCross2,
      value: totalCancelledOrder,

      gradient: "from-rose-400 to-red-600",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      border: "hover:border-red-200",
      glow: "bg-red-500",
    },

    {
      title: "Orders Delivered",
      subtitle: "Successfully delivered",
      icon: MdFileDownloadDone,
      value: totalDeliveredOrder,

      gradient: "from-green-400 to-emerald-600",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      border: "hover:border-green-200",
      glow: "bg-green-500",
    },
  ];


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">

      {ConfigOrderOverview.map((item) => {

        const Icon = item.icon;

        return (

          <div
            key={item.title}
            className={`group relative min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${item.border}`}
          >

            {/* TOP DECORATION */}

            <div
              className={`absolute -right-8 -top-8 h-24 w-24 rounded-full ${item.glow} opacity-[0.04] transition-transform duration-500 group-hover:scale-150`}
            />

            {/* CARD HEADER */}

            <div className="relative z-10 flex items-center justify-between gap-2">

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-gray-700">
                  {item.title}
                </p>

                <p className="mt-1 truncate text-[11px] text-gray-400">
                  {item.subtitle}
                </p>

              </div>

              {/* ICON */}

              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${item.iconBg} ${item.iconColor} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
              >

                <Icon size={23} />

              </div>

            </div>


            {/* ORDER COUNT */}

            <div className="relative z-10 mt-5 flex items-end justify-between">

              <div>

                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Total Orders
                </p>

                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-800">
                  {doubleDigit(item.value)}
                </h2>

              </div>

              {/* SMALL STATUS ICON */}

              <div
                className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full ${item.iconBg} ${item.iconColor} opacity-80`}
              >

                <Icon size={15} />

              </div>

            </div>


            {/* BOTTOM ACCENT */}

            <div
              className={`absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r ${item.gradient} transition-all duration-500 group-hover:w-full`}
            />

          </div>

        );

      })}

    </div>
  );
};

export default OrderOverview;
