import React, { useEffect, useState } from "react";

import PriceOverview from "./PriceOverview";
import OrderOverview from "./OrderOverview";
import Percentage from "./Percentage";
import LineChart from "./LineChart";

import OrderSourceCounter from "./OrderSourceCounter";
import Last7DaysOrderChart from "./Last7DaysOrderChart";

import OrderTable from "../placeGur/OrderTable";

import { db } from "@/app/utils/firebase";

import { useSelector } from "react-redux";
import { selectUser } from "@/app/redux/slices/authSlice";
import StaffOrderCounter from "./StaffOrderCounter";
import { rebuildTodayOrderSummary } from "@/lib/rebuildOrderSummary";

const DashBoard = () => {
  const [counter, setCounter] = useState(null);

  const [last7DaysAmountReport, setLast7DaysAmountReport] = useState([]);

  const [last7DaysOrderReport, setLast7DaysOrderReport] = useState([]);

  const user = useSelector(selectUser);

  // const handleRebuild = async () => {
  //   try {
  //     const result = await rebuildTodayOrderSummary();

  //     console.log("Rebuild successful:", result);

  //     alert(
  //       `Success!\nOrders: ${result.totalOrders}\nWeight: ${result.totalKg} KG`
  //     );

  //   } catch (error) {
  //     console.error("Rebuild failed:", error);
  //     alert(error.message);
  //   }
  // };

  // ==========================================
  // ORDER AMOUNT COUNTER
  // ==========================================

  useEffect(() => {
    const unsubscribe = db
      .collection("counters")
      .doc("orderAmmountSummery")
      .onSnapshot(
        (snapshot) => {
          setCounter(snapshot.exists ? snapshot.data() : null);
        },
        (error) => {
          console.error("Counter Error:", error);
        },
      );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // DASHBOARD UI
  // ==========================================

  return (
    <main className="h-full overflow-y-auto">
      {/* <button
        type="button"
        onClick={handleRebuild}
        className="rounded-lg bg-indigo-600 px-5 py-3 text-white font-semibold"
      >
        Rebuild Today's Order Summary
      </button> */}
      <div>
        <h1 className="mb-3 text-lg font-bold text-gray-700">
          Dashboard Overview
        </h1>
        <div className="w-full">
          <PriceOverview counter={counter} />
        </div>

        {user?.staff_role === "HR" && (
          <div className="mt-4 w-full">
            <OrderSourceCounter />
          </div>
        )}
        {user?.staff_role === "HR" && (
          <div className="my-5 w-full">
            <Last7DaysOrderChart />
          </div>
        )}
      </div>
    </main>
  );
};

export default DashBoard;
