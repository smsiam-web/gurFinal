"use client";

import { useEffect, useState } from "react";
 // v8: export const db = firebase.firestore()
import firebase from "firebase/app";
import "firebase/firestore";
import {
  startOfDay, endOfDay,
  startOfYesterday, endOfYesterday,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth
} from "@/lib/dateRanges";
import { db } from "@/app/utils/firebase";

// ✔ কোন স্ট্যাটাস কাউন্ট করবেন তা নির্ধারণ করুন
const COUNT_STATUSES: Array<string> = ["Pending", "Confirmed"]; 
// কেবল Confirmed চাইলে: ["Confirmed"]

type Amounts = {
  todayTotalOrderAmount: number;
  yesterdayTotalOrderAmount: number;
  thisWeekTotalOrderAmount: number;
  thisMonthTotalOrderAmount: number;
  totalOrderAmount: number;
};

export default function SalesAmountCounter() {
  const [vals, setVals] = useState<Amounts>({
    todayTotalOrderAmount: 0,
    yesterdayTotalOrderAmount: 0,
    thisWeekTotalOrderAmount: 0,
    thisMonthTotalOrderAmount: 0,
    totalOrderAmount: 0,
  });

  useEffect(() => {
    const col = db.collection("placeOrder");

    const toTs = (d: Date) => firebase.firestore.Timestamp.fromDate(d);

    // ---- Today
    const qToday = col
      .where("timestamp", ">=", toTs(startOfDay()))
      .where("timestamp", "<=", toTs(endOfDay()))
      .where("status", "in", COUNT_STATUSES); // ইন কুয়েরির জন্য ইনডেক্স লাগতে পারে
    const unsubToday = qToday.onSnapshot(snap => {
      let sum = 0;
      snap.forEach(doc => sum += Number((doc.data() as any).totalPrice || 0));
      setVals(v => ({ ...v, todayTotalOrderAmount: sum }));
    });

    // ---- Yesterday
    const qY = col
      .where("timestamp", ">=", toTs(startOfYesterday()))
      .where("timestamp", "<=", toTs(endOfYesterday()))
      .where("status", "in", COUNT_STATUSES);
    const unsubY = qY.onSnapshot(snap => {
      let sum = 0;
      snap.forEach(doc => sum += Number((doc.data() as any).totalPrice || 0));
      setVals(v => ({ ...v, yesterdayTotalOrderAmount: sum }));
    });

    // ---- This Week (Mon–Sun)
    const qW = col
      .where("timestamp", ">=", toTs(startOfWeek()))
      .where("timestamp", "<=", toTs(endOfWeek()))
      .where("status", "in", COUNT_STATUSES);
    const unsubW = qW.onSnapshot(snap => {
      let sum = 0;
      snap.forEach(doc => sum += Number((doc.data() as any).totalPrice || 0));
      setVals(v => ({ ...v, thisWeekTotalOrderAmount: sum }));
    });

    // ---- This Month
    const qM = col
      .where("timestamp", ">=", toTs(startOfMonth()))
      .where("timestamp", "<=", toTs(endOfMonth()))
      .where("status", "in", COUNT_STATUSES);
    const unsubM = qM.onSnapshot(snap => {
      let sum = 0;
      snap.forEach(doc => sum += Number((doc.data() as any).totalPrice || 0));
      setVals(v => ({ ...v, thisMonthTotalOrderAmount: sum }));
    });

    // ---- Total (all time) — বড় কালেকশন হলে server-side aggregate ভালো
    const qAll = col.where("status", "in", COUNT_STATUSES);
    const unsubAll = qAll.onSnapshot(snap => {
      let sum = 0;
      snap.forEach(doc => sum += Number((doc.data() as any).totalPrice || 0));
      setVals(v => ({ ...v, totalOrderAmount: sum }));
    });

    return () => { unsubToday(); unsubY(); unsubW(); unsubM(); unsubAll(); };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card title="Today Total Amount" value={fmt(vals.todayTotalOrderAmount)} />
      <Card title="Yesterday Total Amount" value={fmt(vals.yesterdayTotalOrderAmount)} />
      <Card title="This Week Total Amount" value={fmt(vals.thisWeekTotalOrderAmount)} />
      <Card title="This Month Total Amount" value={fmt(vals.thisMonthTotalOrderAmount)} />
      <Card title="All-time Total Amount" value={fmt(vals.totalOrderAmount)} />
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  );
}
