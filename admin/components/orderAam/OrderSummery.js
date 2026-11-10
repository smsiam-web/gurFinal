import React, { useState } from "react";
import { TbCurrencyTaka } from "react-icons/tb";
import { numberWithCommas } from "@/app/utils/helpers";
import { FiLayers, FiShoppingCart } from "react-icons/fi";
import { ImCreditCard } from "react-icons/im";
import { doubleDigit } from "@/admin/utils/helpers";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/redux/slices/authSlice";
import { selectOrder } from "@/app/redux/slices/orderSlice";
import { computePerItemQtyDateAndSourceAndOverall } from "./seperator";
// import { filterByFixedSources, separateByFixedSources, sourceStats } from "./seperator";

const OrderSummery = (item) => {
  const user = useSelector(selectUser);
  const orders = useSelector(selectOrder);
// assume you have `orders` array
const {
  overallMap,   // { "YYYY-MM-DD": { itemKey: { qty, title, ... } } }
  sourceMap,    // { "YYYY-MM-DD": { Web:{...}, Message:{...}, Whatsapp:{...}, Phone:{...} } }
  overallRows,  // flat rows for tables
  sourceRows    // flat rows for tables
} = computePerItemQtyDateAndSourceAndOverall(orders, { itemKey: "product_id" });

console.log("Overall (date-wise):", overallMap);
console.table(overallRows);

console.log("Date + Source:", sourceMap);
console.table(sourceRows);

  const counter = item?.counter;

  const ConfigPriceOverview = [
    {
      title: "Today Orders",
      icon: FiLayers,
      price: counter?.todayTotalOrderAmount || 0,
      order: counter?.todayTotalOrder || 0,
      style: "bg-teal-500",
    },
    {
      title: "Yesterday Orders",
      icon: FiLayers,
      price: counter?.yesterdayTotalOrderAmount || 0,
      order: counter?.yesterdayTotalOrder || 0,
      style: "bg-orange-400",
    },
    {
      title: "This Month",
      icon: FiShoppingCart,
      price:
        (user?.staff_role === "HR" ? counter?.thisMonthTotalOrderAmount : 0) ||
        0,
      order: counter?.thisMonthTotalOrder || 0,
      style: "bg-blue-500",
    },
    {
      title: "All-Time Sales",
      icon: ImCreditCard,
      price: (user?.staff_role === "HR" ? counter?.totalOrderAmount : 0) || 0,
      order: counter?.totalOrder || 0,
      style: "bg-green-500",
    },
  ];

  return (
    <div className="grid gap-4 mb-4 md:grid-cols-2 xl:grid-cols-4">
      {ConfigPriceOverview &&
        ConfigPriceOverview?.map((item) => (
          <div
            key={item.title}
            className="min-w-0 rounded-lg overflow-hidden bg-white  flex justify-center h-full"
          >
            <div
              className={`${item.style} p-4 border border-gray-200 justify-between  w-full md:p-6 rounded-lg text-white`}
            >
              <div className="text-center xl:mb-0 mb-3">
                <div className="text-center inline-block text-3xl text-white">
                  <item.icon />
                </div>
                <div>
                  <p className="mb-3 text-base font-medium text-gray-50 dark:text-gray-100">
                    {item.title}
                  </p>
                  <div className="text-2xl flex items-center justify-center font-bold leading-none text-gray-50 dark:text-gray-50">
                    <TbCurrencyTaka size={24} />
                    <span>{numberWithCommas(item.price)}</span>
                  </div>
                </div>
                <div className="flex flex-row md:flex-row text-center text-xs font-normal text-gray-50">
                  <div className="px-1 mt-3 flex items-center">
                    <span>Orders : {doubleDigit(item.order)}</span>
                  </div>
                  <div className="px-1 mt-3 flex items-center">
                    <span>Paid :</span>
                    <span className="font-bold">
                      <TbCurrencyTaka size={16} />
                    </span>
                    <span>00.0</span>
                  </div>
                  <div className="px-1 mt-3 flex items-center">
                    <span>COD :</span>
                    <span className="font-bold">
                      <TbCurrencyTaka size={16} />
                    </span>
                    <span>{numberWithCommas(item.price)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default OrderSummery;
