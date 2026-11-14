import React, { useState } from "react";
import SearchOrder from "./SearchOrder";
import OrderDropDownload from "./OrderDropDownload";
import AllOrder from "./OrderList";
import { selectUser } from "@/app/redux/slices/authSlice";
import { useSelector } from "react-redux";
import OrderSummery from "./OrderSummery";
import { selectOrder } from "@/app/redux/slices/orderSlice";
import PerItemQtyDashboard from "./PerItemQtyDashboard";

const OrdersGur = () => {
  const orders = useSelector(selectOrder);
  const [isHide, setIsHide] = useState(false);

  const toggle = () => {
    setIsHide((prev) => !prev);
  };

  const user = useSelector(selectUser);

  return (
    <main>
      <div className="grid mx-auto">
        <h1 className="mb-3 text-lg font-bold text-gray-700">
          Orders{" "}
          {["Admin", "HR"].includes(user?.staff_role) && (
            <span
              className="bg-blue-600 text-white px-3 py-2 text-sm rounded-lg cursor-pointer"
              onClick={toggle}
            >
              {isHide ? "Show" : "Hide"}
            </span>
          )}
        </h1>

        {!isHide && user.email === "smsiam696@gmail.com" && (
          <PerItemQtyDashboard orders={orders} />
        )}

        {!isHide && user.email === "admin@gmail.com" && (
          <PerItemQtyDashboard orders={orders} />
        )}

        <SearchOrder />

        {["Admin", "HR"].includes(user?.staff_role) && <OrderDropDownload />}

        <AllOrder />
      </div>
    </main>
  );
};

export default OrdersGur;
