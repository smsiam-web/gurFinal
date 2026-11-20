
import { db } from "@/app/utils/firebase";
import firebase from "firebase";

const getDhakaDateKey = (value) => {
  const date = value?.toDate
    ? value.toDate()
    : new Date(value || Date.now());

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getStaffKey = (name) =>
  encodeURIComponent(String(name || "admin").trim().toLowerCase());

export async function updateStaffOrderSummary(order) {
  const orderID = String(order?.orderID || order?.id || "").trim();

  if (!orderID) {
    throw new Error("Order ID missing");
  }

  const staffName = String(order?.created_user || "admin").trim();
  const staffKey = getStaffKey(staffName);
  const date = getDhakaDateKey(order?.created_at);

  const kg = Number(order?.totals?.qtySum || 0);

  const eventRef = db
    .collection("orderStaffSummaryEvents")
    .doc(orderID);

  const dailyRef = db
    .collection("orderSummary")
    .doc(date);

  const overallRef = db
    .collection("orderSummary")
    .doc("overall");

  const serverTimestamp =
    firebase.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (transaction) => {
    // Duplicate prevention
    const eventSnap = await transaction.get(eventRef);

    if (eventSnap.exists) {
      return;
    }

    // Read both summary documents
    const dailySnap = await transaction.get(dailyRef);
    const overallSnap = await transaction.get(overallRef);

    const dailyData = dailySnap.exists ? dailySnap.data() : {};
    const overallData = overallSnap.exists ? overallSnap.data() : {};

    const dailyStaff = dailyData.staff || {};
    const overallStaff = overallData.staff || {};

    const oldDaily = dailyStaff[staffKey] || {};
    const oldOverall = overallStaff[staffKey] || {};

    const updatedDailyStaff = {
      ...dailyStaff,
      [staffKey]: {
        name: staffName,
        orders: Number(oldDaily.orders || 0) + 1,
        kg: Number(oldDaily.kg || 0) + kg,
      },
    };

    const updatedOverallStaff = {
      ...overallStaff,
      [staffKey]: {
        name: staffName,
        orders: Number(oldOverall.orders || 0) + 1,
        kg: Number(oldOverall.kg || 0) + kg,
      },
    };

    // Update daily summary without replacing source data
    transaction.set(
      dailyRef,
      {
        date,
        staff: updatedDailyStaff,
        updatedAt: serverTimestamp,
      },
      { merge: true }
    );

    // Update lifetime summary without replacing source data
    transaction.set(
      overallRef,
      {
        staff: updatedOverallStaff,
        updatedAt: serverTimestamp,
      },
      { merge: true }
    );

    // Save event to prevent counting the same order twice
    transaction.set(eventRef, {
      orderID,
      staffName,
      staffKey,
      date,
      kg,
      countedAt: serverTimestamp,
    });
  });

  return true;
}
