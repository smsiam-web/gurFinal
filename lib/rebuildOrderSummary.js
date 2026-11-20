
import { db } from "@/app/utils/firebase";
import firebase from "firebase";

// ==========================================
// CONFIGURATION
// ==========================================

// তোমার মূল অর্ডার কালেকশন
const ORDER_COLLECTION = "ordersGur";

// Bangladesh date
const getDhakaDate = (value) => {
  let date;

  if (value?.toDate) {
    date = value.toDate();
  } else {
    date = value ? new Date(value) : new Date();
  }

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getToday = () => getDhakaDate(new Date());

const round = (value) =>
  Number(Number(value || 0).toFixed(2));

const getStaffKey = (name) =>
  encodeURIComponent(
    String(name || "admin").trim().toLowerCase()
  );

// ==========================================
// SOURCE NORMALIZATION
// ==========================================

const normalizeSource = (source) => {
  const value = String(source || "").toLowerCase().trim();

  const aliases = {
    web: "web",
    website: "web",
    message: "message",
    whatsapp: "whatsapp",
    phone: "phone",
    telesales: "telesales",
    "tele sales": "telesales",
    incomplete: "incomplete",
    exchange: "exchange",
  };

  return aliases[value] || "other";
};

// ==========================================
// ITEM DETAILS
// ==========================================

const getOrderItems = (items = []) => {
  const itemMap = {};

  items.forEach((item) => {
    const title = item.title || item.name || "Unknown Item";

    const quantity = Number(item.quantity || 0);
    const unitWeight = Number(item.unitWgt || 0);

    const kg = unitWeight
      ? unitWeight * quantity
      : quantity;

    itemMap[title] = round(
      Number(itemMap[title] || 0) + kg
    );
  });

  return Object.entries(itemMap).map(([title, kg]) => ({
    title,
    kg,
  }));
};

// ==========================================
// BUILD FRESH SUMMARY
// ==========================================

const buildSummary = (orders, date) => {

  const summary = {
    date,
    totalOrders: 0,
    totalKg: 0,
    totalAmount: 0,
    sources: {},
    staff: {},
  };

  orders.forEach((order) => {

    const source = normalizeSource(order.meta?.source);

    const staffName = String(
      order.created_user || "admin"
    ).trim();

    const staffKey = getStaffKey(staffName);

    const kg = round(order.totals?.qtySum || 0);

    const amount = round(order.totals?.grand || 0);

    const items = getOrderItems(order.items || []);

    // TOTAL
    summary.totalOrders += 1;
    summary.totalKg = round(summary.totalKg + kg);
    summary.totalAmount = round(
      summary.totalAmount + amount
    );

    // SOURCE
    if (!summary.sources[source]) {
      summary.sources[source] = {
        orders: 0,
        kg: 0,
        amount: 0,
        items: [],
      };
    }

    const sourceData = summary.sources[source];

    sourceData.orders += 1;
    sourceData.kg = round(sourceData.kg + kg);
    sourceData.amount = round(sourceData.amount + amount);

    const itemMap = {};

    sourceData.items.forEach((item) => {
      itemMap[item.title] = Number(item.kg || 0);
    });

    items.forEach((item) => {
      itemMap[item.title] = round(
        Number(itemMap[item.title] || 0) + item.kg
      );
    });

    sourceData.items = Object.entries(itemMap).map(
      ([title, itemKg]) => ({
        title,
        kg: round(itemKg),
      })
    );

    // STAFF
    if (!summary.staff[staffKey]) {
      summary.staff[staffKey] = {
        name: staffName,
        orders: 0,
        kg: 0,
        amount: 0,
        sources: {},
      };
    }

    const staffData = summary.staff[staffKey];

    staffData.orders += 1;
    staffData.kg = round(staffData.kg + kg);
    staffData.amount = round(staffData.amount + amount);

    // STAFF SOURCE
    if (!staffData.sources[source]) {
      staffData.sources[source] = {
        orders: 0,
        kg: 0,
        amount: 0,
      };
    }

    staffData.sources[source].orders += 1;

    staffData.sources[source].kg = round(
      staffData.sources[source].kg + kg
    );

    staffData.sources[source].amount = round(
      staffData.sources[source].amount + amount
    );
  });

  return summary;
};

// ==========================================
// OVERALL DELTA HELPERS
// ==========================================

const addDelta = (current, oldValue, newValue) =>
  round(
    Number(current || 0) +
    Number(newValue || 0) -
    Number(oldValue || 0)
  );

const updateItemsWithDelta = (current = [], oldItems = [], newItems = []) => {

  const map = {};

  current.forEach((item) => {
    map[item.title] = Number(item.kg || 0);
  });

  oldItems.forEach((item) => {
    map[item.title] = round(
      Number(map[item.title] || 0) - Number(item.kg || 0)
    );
  });

  newItems.forEach((item) => {
    map[item.title] = round(
      Number(map[item.title] || 0) + Number(item.kg || 0)
    );
  });

  return Object.entries(map)
    .filter(([, kg]) => kg > 0.001)
    .map(([title, kg]) => ({
      title,
      kg: round(kg),
    }));
};

// ==========================================
// UPDATE OVERALL WITHOUT LOSING OLD DATA
// ==========================================

const updateOverallWithDelta = (
  overall = {},
  oldDaily = {},
  newDaily = {}
) => {

  const result = {
    ...overall,

    totalOrders: addDelta(
      overall.totalOrders,
      oldDaily.totalOrders,
      newDaily.totalOrders
    ),

    totalKg: addDelta(
      overall.totalKg,
      oldDaily.totalKg,
      newDaily.totalKg
    ),

    totalAmount: addDelta(
      overall.totalAmount,
      oldDaily.totalAmount,
      newDaily.totalAmount
    ),
  };

  // SOURCE DELTA
  const sources = { ...(overall.sources || {}) };

  const sourceKeys = new Set([
    ...Object.keys(oldDaily.sources || {}),
    ...Object.keys(newDaily.sources || {}),
  ]);

  sourceKeys.forEach((key) => {

    const current = sources[key] || {};
    const old = oldDaily.sources?.[key] || {};
    const fresh = newDaily.sources?.[key] || {};

    sources[key] = {
      orders: addDelta(current.orders, old.orders, fresh.orders),
      kg: addDelta(current.kg, old.kg, fresh.kg),
      amount: addDelta(current.amount, old.amount, fresh.amount),
      items: updateItemsWithDelta(
        current.items,
        old.items,
        fresh.items
      ),
    };
  });

  result.sources = sources;

  // STAFF DELTA
  const staff = { ...(overall.staff || {}) };

  const staffKeys = new Set([
    ...Object.keys(oldDaily.staff || {}),
    ...Object.keys(newDaily.staff || {}),
  ]);

  staffKeys.forEach((key) => {

    const current = staff[key] || {};
    const old = oldDaily.staff?.[key] || {};
    const fresh = newDaily.staff?.[key] || {};

    const staffSources = {
      ...(current.sources || {}),
    };

    const sourceKeys = new Set([
      ...Object.keys(old.sources || {}),
      ...Object.keys(fresh.sources || {}),
    ]);

    sourceKeys.forEach((source) => {

      const currentSource = staffSources[source] || {};
      const oldSource = old.sources?.[source] || {};
      const freshSource = fresh.sources?.[source] || {};

      staffSources[source] = {
        orders: addDelta(
          currentSource.orders,
          oldSource.orders,
          freshSource.orders
        ),

        kg: addDelta(
          currentSource.kg,
          oldSource.kg,
          freshSource.kg
        ),

        amount: addDelta(
          currentSource.amount,
          oldSource.amount,
          freshSource.amount
        ),
      };
    });

    staff[key] = {
      name: fresh.name || old.name || current.name || "Unknown Staff",

      orders: addDelta(
        current.orders,
        old.orders,
        fresh.orders
      ),

      kg: addDelta(current.kg, old.kg, fresh.kg),

      amount: addDelta(
        current.amount,
        old.amount,
        fresh.amount
      ),

      sources: staffSources,
    };
  });

  result.staff = staff;

  return result;
};

// ==========================================
// MAIN ONE-TIME REBUILD FUNCTION
// ==========================================

export async function rebuildTodayOrderSummary() {

  const date = getToday();

  console.log("Starting order summary rebuild:", date);

  // 1. GET ALL ORDERS
  const ordersSnapshot = await db
    .collection(ORDER_COLLECTION)
    .get();

  // 2. FILTER TODAY'S ORDERS
  const todayOrders = [];

  ordersSnapshot.forEach((doc) => {

    const order = doc.data();

    const orderDate = getDhakaDate(order.created_at);

    if (orderDate !== date) return;

    todayOrders.push({
      ...order,
      orderID: order.orderID || doc.id,
    });
  });

  if (!todayOrders.length) {
    throw new Error(
      `No orders found for ${date}. Nothing was changed.`
    );
  }

  console.log("Today's orders found:", todayOrders.length);

  // 3. BUILD FRESH DAILY SUMMARY
  const freshSummary = buildSummary(todayOrders, date);

  // 4. REFERENCES
  const dailyRef = db
    .collection("orderSummary")
    .doc(date);

  const overallRef = db
    .collection("orderSummary")
    .doc("overall");

  // 5. READ EXISTING SUMMARIES
  const dailySnap = await dailyRef.get();
  const overallSnap = await overallRef.get();

  const oldDaily = dailySnap.exists
    ? dailySnap.data()
    : {};

  const oldOverall = overallSnap.exists
    ? overallSnap.data()
    : {};

  // 6. CALCULATE OVERALL DELTA
  const freshOverall = updateOverallWithDelta(
    oldOverall,
    oldDaily,
    freshSummary
  );

  const serverTimestamp =
    firebase.firestore.FieldValue.serverTimestamp();

  // 7. WRITE DAILY SUMMARY
  await dailyRef.set(
    {
      ...freshSummary,
      updatedAt: serverTimestamp,
      rebuiltAt: serverTimestamp,
      rebuildVersion: 1,
    }
  );

  // 8. WRITE OVERALL SUMMARY
  await overallRef.set(
    {
      ...freshOverall,
      date: "overall",
      updatedAt: serverTimestamp,
    }
  );

  // 9. REBUILD EVENT DOCUMENTS
  // 400 documents per batch to stay below Firestore limit.

  const eventDocs = todayOrders.map((order) => {

    const source = normalizeSource(order.meta?.source);

    const staffName = String(
      order.created_user || "admin"
    ).trim();

    const staffKey = getStaffKey(staffName);

    return {
      orderID: order.orderID,
      date,
      source,
      staffName,
      staffKey,
      kg: round(order.totals?.qtySum || 0),
      amount: round(order.totals?.grand || 0),
    };
  });

  for (let i = 0; i < eventDocs.length; i += 400) {

    const batch = db.batch();

    const chunk = eventDocs.slice(i, i + 400);

    chunk.forEach((event) => {

      const eventRef = db
        .collection("orderSummaryEvents")
        .doc(event.orderID);

      batch.set(
        eventRef,
        {
          ...event,

          sourceCounted: true,
          staffCounted: true,
          staffSourceCounted: true,
          amountCounted: true,

          createdAt: serverTimestamp,
          updatedAt: serverTimestamp,
          rebuiltAt: serverTimestamp,
        },
        { merge: true }
      );
    });

    await batch.commit();

    console.log(
      `Event documents processed: ${Math.min(i + 400, eventDocs.length)} / ${eventDocs.length}`
    );
  }

  // 10. FINAL REPORT
  const report = {
    date,
    totalOrders: freshSummary.totalOrders,
    totalKg: freshSummary.totalKg,
    totalAmount: freshSummary.totalAmount,
    staffCount: Object.keys(freshSummary.staff).length,
    sourceCount: Object.keys(freshSummary.sources).length,
    eventCount: eventDocs.length,
    success: true,
  };

  console.log("ORDER SUMMARY REBUILD COMPLETE:", report);

  return report;
}
