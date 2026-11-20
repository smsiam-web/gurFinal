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

const DashBoard = () => {
  const [counter, setCounter] = useState(null);

  const [last7DaysAmountReport, setLast7DaysAmountReport] = useState([]);

  const [last7DaysOrderReport, setLast7DaysOrderReport] = useState([]);

  const user = useSelector(selectUser);

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
  // LAST 7 DAYS SALES AMOUNT REPORT
  // ==========================================

  useEffect(() => {
    const unsubscribe = db
      .collection("counters")
      .doc("last7DaysAmountReport")
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.exists ? snapshot.data() : {};

          const dataArr = [
            data?.sevenAmount || 0,
            data?.sixAmount || 0,
            data?.fiveAmount || 0,
            data?.fourAmount || 0,
            data?.threeAmount || 0,
            data?.twoAmount || 0,
            data?.oneAmount || 0,
          ];

          setLast7DaysAmountReport(dataArr);
        },
        (error) => {
          console.error("Amount Report Error:", error);
        },
      );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // LAST 7 DAYS ORDER REPORT
  // ==========================================

  useEffect(() => {
    const unsubscribe = db
      .collection("counters")
      .doc("last7DaysOrderReport")
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.exists ? snapshot.data() : {};

          const dataArr = [
            data?.sevenOrder || 0,
            data?.sixOrder || 0,
            data?.fiveOrder || 0,
            data?.fourOrder || 0,
            data?.threeOrder || 0,
            data?.twoOrder || 0,
            data?.oneOrder || 0,
          ];

          setLast7DaysOrderReport(dataArr);
        },
        (error) => {
          console.error("Order Report Error:", error);
        },
      );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // DASHBOARD UI
  // ==========================================

  return (
    <main className="h-full w-full min-w-0 max-w-full overflow-x-hidden ">
      <div className="mx-auto grid w-full min-w-0 max-w-full">
        {/* DASHBOARD TITLE */}

        <h1 className="mb-3 text-lg font-bold text-gray-700">
          Dashboard Overview
        </h1>

        {/* PRICE OVERVIEW */}

        <div className="w-full">
          <PriceOverview counter={counter} />
        </div>

        {/* ORDER OVERVIEW */}

        <div className="w-full">
          <OrderOverview />
        </div>

        {/* ORDER SOURCE COUNTER */}

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
        {user?.staff_role === "HR" && (
          <div className="my-4 grid gap-4">
          <LineChart
            amount={last7DaysAmountReport}
            order={last7DaysOrderReport}
          />
        </div>
        )}
        {/* {user?.staff_role === "HR" && (
          <div className="mt-4 w-full">
            <StaffOrderCounter />
          </div>
        )} */}

        {/* NEW LAST 7 DAYS CHART */}

        

        {/* EXISTING CHARTS */}

        
        {/* RECENT ORDERS */}

        <div className="w-full min-w-0 max-w-full py-6 overflow-hidden">
          <h2 className="text-title pb-3 font-medium text-lg md:text-xl">
            Recent Order
          </h2>

          <div className="w-full min-w-0 max-w-full overflow-hidden">
            <OrderTable />
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashBoard;
