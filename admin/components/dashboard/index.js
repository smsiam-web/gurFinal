import React, { useEffect, useState } from "react";
import PriceOverview from "./PriceOverview";
import OrderOverview from "./OrderOverview";
import Percentage from "./Percentage";
import OrderTable from "../placeOrder/OrderTable";
import LineChart from "./LineChart";
import SalesAmountCounter from "../SalesAmountCounter";
import { db } from "@/app/utils/firebase";

const DashBoard = () => {
  const [counter, setCounter] = useState();
  const [last7DaysAmountReport, setLast7DaysAmountReport] = useState();
  const [last7DaysOrderReport, setLast7DaysOrderReport] = useState();

  // Get counter from firebase database
  useEffect(() => {
    const unSub = db
      .collection("counters")
      .doc("orderAmmountSummery")
      .onSnapshot((snap) => {
        setCounter(snap.data());
      });
    return () => {
      unSub();
    };
  }, []);

  // Get last7DaysAmountReport from firebase database
  useEffect(() => {
    const unSub = db
      .collection("counters")
      .doc("last7DaysAmountReport")
      .onSnapshot((snap) => {
        const data = (snap.data());
        const dataArr = [
          data?.sevenAmount || 0,
          data?.sixAmount || 0,
          data?.fiveAmount || 0,
          data?.fourAmount || 0,
          data?.threeAmount || 0,
          data?.twoAmount || 0,
          data?.oneAmount || 0,
        ];
        setLast7DaysAmountReport(dataArr)
      });
    return () => {
      unSub();
    };
  }, []);

  // Get last7DaysOrderReport from firebase database
  useEffect(() => {
    const unSub = db
      .collection("counters")
      .doc("last7DaysOrderReport")
      .onSnapshot((snap) => {
        const data = (snap.data());
        const dataArr = [
          data?.sevenOrder || 0,
          data?.sixOrder || 0,
          data?.fiveOrder || 0,
          data?.fourOrder || 0,
          data?.threeOrder || 0,
          data?.twoOrder || 0,
          data?.oneOrder || 0,
        ];
        setLast7DaysOrderReport(dataArr)
      });
    return () => {
      unSub();
    };
  }, []);

  return (
    <main className="h-full overflow-y-auto">
      <div className=" grid mx-auto">
        <h1 className="mb-3 text-lg font-bold text-gray-700 ">
          Dashboard Overview
        </h1>

        <div className="w-full">
          <PriceOverview counter={counter && counter} />
        </div>
        <div className="w-full">
          <OrderOverview />
        </div>
        <div className="grid gap-4 xl:grid-cols-2 my-4">
          <LineChart
            amount={last7DaysAmountReport}
            order={last7DaysOrderReport}
          />
          <Percentage />
        </div>
        <div className="py-6 w-full ">
          <h2 className="text-title pb-3 font-medium text-lg md:text-xl">
            Recent Order
          </h2>
          <OrderTable />
        </div>
      </div>
    </main>
  );
};

export default DashBoard;
