import DashboardLayout from "@/app/layout/DashboardLayout";
import React from "react";
import DashboardOrders from "@/app/components/order";

const Orders = () => {
  return (
    <DashboardLayout>
      <DashboardOrders />
    </DashboardLayout>
  );
};

export default Orders;
