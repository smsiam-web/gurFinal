// lib/counters.js

import { db, timestamp } from "@/app/utils/firebase";
import { differenceInDays } from "date-fns";
// ── ADD: safe date normalize
function toJsDate(x) {
  try {
    if (!x) return null;
    // Firestore Timestamp
    if (typeof x.toDate === "function") return x.toDate();
    // seconds/nanoseconds obj
    if (x.seconds != null && x.nanoseconds != null) {
      return new Date(x.seconds * 1000 + Math.floor(x.nanoseconds / 1e6));
    }
    // number ms
    if (typeof x === "number") return new Date(x);
    // ISO/date string
    if (typeof x === "string") {
      const d = new Date(x);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  } catch (_) {
    return null;
  }
}

// ------- helpers (Dhaka local) -------

// YYYY-MM-DD (Dhaka)
const dayKeyBD = (d) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

// yesterday (Dhaka)
const yesterdayKeyBD = () => {
  const now = new Date();
  // subtract 1 day in ms
  const y = new Date(now.getTime() - 86400000);
  return dayKeyBD(y);
};

// YYYY-MM (Dhaka)
const monthKeyBD = (d) => {
  const x = new Date(d);
  return x.toLocaleDateString("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
  });
};

// ISO week key (Dhaka)
const isoWeekKeyBD = (d) => {
  // force to Dhaka local date parts
  const parts = new Date(d)
    .toLocaleDateString("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .split("-");
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const x = new Date(Date.UTC(y, m, day));
  x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7));
  const yStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((x - yStart) / 86400000 + 1) / 7);
  return `${x.getUTCFullYear()}-W${String(w).padStart(2, "0")}`;
};

// শুধুই Confirmed গুনবো (চাইলে "Pending" যোগ করুন)
const QUAL = (status) => String(status || "") === "pending";

export async function updateCounters(after, before = null) {
  // logs
  // console.log("[COUNTERS] before:", before, "after:", after);

  const amtAfter = Number(after?.totals?.grand || 0);
  const amtBefore = Number(before?.totals?.grand || 0);
  const sAfter = after?.status;
  const sBefore = before?.status;

  // create/update/delete অনুযায়ী delta
  let delta = 0;
  if (!before && QUAL(sAfter)) delta = amtAfter; // create
  else if (before && !after && QUAL(sBefore)) delta = -amtBefore; // delete
  else if (QUAL(sBefore) && QUAL(sAfter))
    delta = amtAfter - amtBefore; // edit within confirmed
  else if (!QUAL(sBefore) && QUAL(sAfter)) delta = amtAfter; // became confirmed
  else if (QUAL(sBefore) && !QUAL(sAfter)) delta = -amtBefore; // lost confirmed
  if (delta === 0) {
    console.log("[COUNTERS] delta=0 (no change)");
    return;
  }

  const now = new Date();
  const todayK = dayKeyBD(now);
  const yestK = yesterdayKeyBD();
  const weekK = isoWeekKeyBD(now);
  const monthK = monthKeyBD(now);

  console.log(todayK);

  // অর্ডারের date কোন bucket-এ পড়বে? creation timestamp ধরছি:
  const at = toJsDate(after?.timestamp) || now;

  const summaryRef = db.doc("counters/orderAmmountSummery");

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(summaryRef);
    const data = snap.exists
      ? snap.data()
      : {
          todayTotalOrderAmount: 0,
          todayTotalOrder: 0,

          yesterdayTotalOrderAmount: 0,
          yesterdayTotalOrder: 0,

          thisWeekTotalOrderAmount: 0,
          thisWeekTotalOrder: 0,

          thisMonthTotalOrderAmount: 0,
          thisMonthTotalOrder: 0,

          totalOrderAmount: 0,
          totalOrder: 0,

          _todayKey: todayK,
          _weekKey: weekK,
          _monthKey: monthK,

          createdAt: timestamp,
          updatedAt: timestamp,
        };

    const diff = differenceInDays(todayK, data._todayKey);
    console.log(diff);

    // সবসময় total
    data.updatedAt = timestamp;
    data.totalOrderAmount = Math.max(
      0,
      Number(data.totalOrderAmount || 0) + delta
    );
    data.totalOrder = Math.max(0, Number(data.totalOrder || 0) + 1);

    console.log("[COUNTERS] applying delta:", delta, "buckets updated.");
    tx.set(summaryRef, data, { merge: true });
  });

  const summaryRefAmount = db.doc("counters/last7DaysAmountReport");
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(summaryRefAmount);
    const data = snap.exists
      ? snap.data()
      : {
          oneAmount: 0,
          twoAmount: 0,
          threeAmount: 0,
          fourAmount: 0,
          fiveAmount: 0,
          sixAmount: 0,
          sevenAmount: 0,

          _todayKey: todayK,

          createdAt: timestamp,
          updatedAt: timestamp,
        };

    const diff = differenceInDays(todayK, data._todayKey);

    // change day 1
    if (data._todayKey !== todayK && diff === 1) {
      data.sevenAmount = data.sixAmount;
      data.sixAmount = data.fiveAmount;
      data.fiveAmount = data.fourAmount;
      data.fourAmount = data.threeAmount;
      data.threeAmount = data.twoAmount;
      data.twoAmount = data.oneAmount;
      data.oneAmount = 0;

      data._todayKey = todayK;
    }

    // সবসময় total
    data.updatedAt = timestamp;
    data.oneAmount = Math.max(0, Number(data.oneAmount || 0) + delta);

    console.log("[COUNTERS] applying delta:", delta, "buckets updated.");
    tx.set(summaryRefAmount, data, { merge: true });
  });

  const summaryRefOrder = db.doc("counters/last7DaysOrderReport");
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(summaryRefOrder);
    const data = snap.exists
      ? snap.data()
      : {
          oneOrder: 0,
          twoOrder: 0,
          threeOrder: 0,
          fourOrder: 0,
          fiveOrder: 0,
          sixOrder: 0,
          sevenOrder: 0,

          _todayKey: todayK,

          createdAt: timestamp,
          updatedAt: timestamp,
        };

    data.updatedAt = timestamp;
    data.oneOrder = Math.max(0, Number(data.oneOrder || 0) + 1);

    console.log("[COUNTERS] applying delta:", delta, "buckets updated.");
    tx.set(summaryRefOrder, data, { merge: true });
  });
}
