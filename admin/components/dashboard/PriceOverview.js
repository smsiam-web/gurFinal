
import React from "react";

import { TbCurrencyTaka } from "react-icons/tb";
import { FiLayers, FiShoppingCart } from "react-icons/fi";
import { ImCreditCard } from "react-icons/im";

import { numberWithCommas } from "@/app/utils/helpers";
import { doubleDigit } from "@/admin/utils/helpers";

import { useSelector } from "react-redux";
import { selectUser } from "@/app/redux/slices/authSlice";

const PriceOverview = ({ counter }) => {
  const user = useSelector(selectUser);

  const ConfigPriceOverview = [
    {
      title: "Today Orders",
      icon: FiLayers,
      price: counter?.todayTotalOrderAmount || 0,
      order: counter?.todayTotalOrder || 0,

      style: "from-teal-500 via-teal-500 to-cyan-600",
      iconBg: "bg-white/20",
      accent: "bg-teal-200",
    },

    {
      title: "Yesterday Orders",
      icon: FiLayers,
      price: counter?.yesterdayTotalOrderAmount || 0,
      order: counter?.yesterdayTotalOrder || 0,

      style: "from-orange-400 via-orange-500 to-amber-500",
      iconBg: "bg-white/20",
      accent: "bg-orange-200",
    },

    {
      title: "This Month",
      icon: FiShoppingCart,
      price:
        (user?.staff_role === "HR"
          ? counter?.thisMonthTotalOrderAmount
          : 0) || 0,

      order: counter?.thisMonthTotalOrder || 0,

      style: "from-blue-500 via-blue-600 to-indigo-600",
      iconBg: "bg-white/20",
      accent: "bg-blue-200",
    },

    {
      title: "All-Time Sales",
      icon: ImCreditCard,

      price:
        (user?.staff_role === "HR"
          ? counter?.totalOrderAmount
          : 0) || 0,

      order: counter?.totalOrder || 0,

      style: "from-green-500 via-emerald-500 to-green-600",
      iconBg: "bg-white/20",
      accent: "bg-green-200",
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

      {ConfigPriceOverview.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="group relative min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >

            {/* GRADIENT CARD */}

            <div
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${item.style} p-5 text-white`}
            >

              {/* BACKGROUND DECORATION */}

              <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border-[20px] border-white/10 transition-transform duration-500 group-hover:scale-125" />

              <div className="pointer-events-none absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-white/5" />

              {/* TOP SECTION */}

              <div className="relative z-10 flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-white">
                    Sales Overview
                  </p>

                  <h3 className="mt-1 text-lg font-bold tracking-wide text-white">
                    {item.title}
                  </h3>
                </div>

                {/* ICON */}

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconBg} shadow-inner backdrop-blur-sm transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>

              </div>

              {/* PRICE */}

              <div className="relative z-10 mt-6">

                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/70">
                  Total Amount
                </p>

                <div className="flex min-w-0 items-center gap-1">

                  <TbCurrencyTaka className="h-7 w-7 shrink-0" />

                  <h2 className="min-w-0 break-all text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {numberWithCommas(item.price)}
                  </h2>

                </div>

              </div>

              {/* DIVIDER */}

              <div className="relative z-10 my-5 h-px bg-white/20" />

              {/* BOTTOM DETAILS */}

              <div className="relative z-10 grid grid-cols-3 gap-2">

                {/* ORDERS */}

                <div className="min-w-0">

                  <p className="text-[10px] font-medium uppercase tracking-wide text-white/70 sm:text-xs">
                    Orders
                  </p>

                  <p className="mt-1 truncate text-sm font-bold text-white sm:text-base">
                    {doubleDigit(item.order)}
                  </p>

                </div>

                {/* PAID */}

                <div className="min-w-0 border-l border-white/20 pl-2">

                  <p className="text-[10px] font-medium uppercase tracking-wide text-white/70 sm:text-xs">
                    Paid
                  </p>

                  <div className="mt-1 flex items-center gap-0.5">

                    <TbCurrencyTaka className="h-3.5 w-3.5 shrink-0" />

                    <p className="truncate text-sm font-bold text-white sm:text-base">
                      00.0
                    </p>

                  </div>

                </div>

                {/* COD */}

                <div className="min-w-0 border-l border-white/20 pl-2">

                  <p className="text-[10px] font-medium uppercase tracking-wide text-white/70 sm:text-xs">
                    COD
                  </p>

                  <div className="mt-1 flex items-center gap-0.5">

                    <TbCurrencyTaka className="h-3.5 w-3.5 shrink-0" />

                    <p className="truncate text-sm font-bold text-white sm:text-base">
                      {numberWithCommas(item.price)}
                    </p>

                  </div>

                </div>

              </div>

              {/* BOTTOM ACCENT */}

              <div
                className={`absolute bottom-0 left-0 h-1 w-0 ${item.accent} transition-all duration-500 group-hover:w-full`}
              />

            </div>

          </div>
        );
      })}

    </div>
  );
};

export default PriceOverview;
