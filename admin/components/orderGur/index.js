import React from "react";
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

  const user = useSelector(selectUser);
  return (
    <main>
      <div className="grid mx-auto">
        <h1 className="mb-3 text-lg font-bold text-gray-700 ">Orders</h1>

        {user.email === "smsiam696@gmail.com"  && <PerItemQtyDashboard orders={orders} />}
        {user.email === "admin@gmail.com"  && <PerItemQtyDashboard orders={orders} />}
        <SearchOrder />
        {user.staff_role === "HR" && <OrderDropDownload />}
        <AllOrder />
      </div>
    </main>
  );
};

export default OrdersGur;
