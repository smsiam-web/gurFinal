
import { db } from "@/app/utils/firebase";
import firebase from "firebase";

// ==========================================
// DATE: Bangladesh Timezone
// ==========================================

const getDhakaDate = (value) => {
  let date;

  if (value?.toDate) {
    date = value.toDate();
  } else {
    date = value ? new Date(value) : new Date();
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid order creation date");
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

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
// STAFF NORMALIZATION
// ==========================================

const getStaffKey = (name) =>
  encodeURIComponent(
    String(name || "admin").trim().toLowerCase()
  );

// ==========================================
// NUMBER HELPER
// ==========================================

const roundKg = (value) =>
  Number(Number(value || 0).toFixed(2));

// ==========================================
// MAIN FUNCTION
// SOURCE + STAFF + DAILY + OVERALL
// ==========================================

export async function updateOrderSummary(order) {
  if (!order?.orderID) {
    throw new Error("Order ID is required");
  }

  const orderID = String(order.orderID);

  const date = getDhakaDate(order.created_at);

  const source = normalizeSource(order?.meta?.source);

  const staffName = String(
    order?.created_user || "admin"
  ).trim();

  const staffKey = getStaffKey(staffName);

  const kg = roundKg(order?.totals?.qtySum || 0);

  // ==========================================
  // PRODUCT DETAILS
  // ==========================================

  const orderItems = (Array.isArray(order.items)
    ? order.items
    : []
  ).map((item) => {
    const quantity = Number(item.quantity || 0);

    const unitWeight = Number(item.unitWgt || 0);

    const itemKg = unitWeight
      ? unitWeight * quantity
      : quantity;

    return {
      title: item.title || item.name || "Unknown Item",
      kg: roundKg(itemKg),
    };
  });

  // ==========================================
  // FIRESTORE REFERENCES
  // ==========================================

  const dailyRef = db
    .collection("orderSummary")
    .doc(date);

  const overallRef = db
    .collection("orderSummary")
    .doc("overall");

  // One canonical event collection
  const eventRef = db
    .collection("orderSummaryEvents")
    .doc(orderID);

  // Legacy staff event: read only for migration protection
  const oldStaffEventRef = db
    .collection("orderStaffSummaryEvents")
    .doc(orderID);

  const serverTimestamp =
    firebase.firestore.FieldValue.serverTimestamp();

  // ==========================================
  // SINGLE FIRESTORE TRANSACTION
  // ==========================================

  await db.runTransaction(async (transaction) => {

    // ------------------------------------------
    // 1. CHECK EXISTING EVENTS
    // ------------------------------------------

    const eventSnap = await transaction.get(eventRef);

    const oldStaffEventSnap = await transaction.get(
      oldStaffEventRef
    );

    const eventData = eventSnap.exists
      ? eventSnap.data()
      : {};

    // Existing old Source Event means source was counted.
    // New events explicitly store sourceCounted.
    const sourceAlreadyCounted =
      eventSnap.exists &&
      eventData.sourceCounted !== false;

    // Staff may already have been counted by the old function.
    const staffAlreadyCounted =
      (eventSnap.exists && eventData.staffCounted === true) ||
      oldStaffEventSnap.exists;

    const updateSource = !sourceAlreadyCounted;

    const updateStaff = !staffAlreadyCounted;

    // Nothing to update
    if (!updateSource && !updateStaff) {
      return;
    }

    // ------------------------------------------
    // 2. READ DAILY AND OVERALL SUMMARY
    // ------------------------------------------

    const dailySnap = await transaction.get(dailyRef);

    const overallSnap = await transaction.get(overallRef);

    const dailyData = dailySnap.exists
      ? dailySnap.data()
      : {};

    const overallData = overallSnap.exists
      ? overallSnap.data()
      : {};

    // ------------------------------------------
    // 3. UPDATE SOURCE SUMMARY
    // ------------------------------------------

    const updateSourceSummary = (data) => {

      const oldSource = data.sources?.[source] || {
        orders: 0,
        kg: 0,
        items: [],
      };

      // Product-wise aggregation
      const itemMap = {};

      (oldSource.items || []).forEach((item) => {
        const title = item.title || "Unknown Item";

        itemMap[title] =
          Number(itemMap[title] || 0) +
          Number(item.kg || 0);
      });

      orderItems.forEach((item) => {
        itemMap[item.title] =
          Number(itemMap[item.title] || 0) +
          item.kg;
      });

      const updatedItems = Object.entries(itemMap).map(
        ([title, itemKg]) => ({
          title,
          kg: roundKg(itemKg),
        })
      );

      return {
        totalOrders:
          Number(data.totalOrders || 0) + 1,

        totalKg: roundKg(
          Number(data.totalKg || 0) + kg
        ),

        sources: {
          ...(data.sources || {}),

          [source]: {
            orders:
              Number(oldSource.orders || 0) + 1,

            kg: roundKg(
              Number(oldSource.kg || 0) + kg
            ),

            items: updatedItems,
          },
        },
      };
    };

    // ------------------------------------------
    // 4. UPDATE STAFF SUMMARY
    // ------------------------------------------

    const updateStaffSummary = (data) => {

      const oldStaff = data.staff?.[staffKey] || {
        name: staffName,
        orders: 0,
        kg: 0,
      };

      return {
        staff: {
          ...(data.staff || {}),

          [staffKey]: {
            name: staffName,

            orders:
              Number(oldStaff.orders || 0) + 1,

            kg: roundKg(
              Number(oldStaff.kg || 0) + kg
            ),
          },
        },
      };
    };

    // ------------------------------------------
    // 5. BUILD DAILY SUMMARY
    // ------------------------------------------

    const dailyUpdate = {};

    if (updateSource) {
      Object.assign(
        dailyUpdate,
        updateSourceSummary(dailyData)
      );
    }

    if (updateStaff) {
      Object.assign(
        dailyUpdate,
        updateStaffSummary(dailyData)
      );
    }

    dailyUpdate.date = date;
    dailyUpdate.updatedAt = serverTimestamp;

    // ------------------------------------------
    // 6. BUILD OVERALL SUMMARY
    // ------------------------------------------

    const overallUpdate = {};

    if (updateSource) {
      Object.assign(
        overallUpdate,
        updateSourceSummary(overallData)
      );
    }

    if (updateStaff) {
      Object.assign(
        overallUpdate,
        updateStaffSummary(overallData)
      );
    }

    overallUpdate.date = "overall";
    overallUpdate.updatedAt = serverTimestamp;

    // ------------------------------------------
    // 7. WRITE DAILY + OVERALL
    // ------------------------------------------

    transaction.set(
      dailyRef,
      dailyUpdate,
      { merge: true }
    );

    transaction.set(
      overallRef,
      overallUpdate,
      { merge: true }
    );

    // ------------------------------------------
    // 8. SINGLE EVENT RECORD
    // ------------------------------------------

    transaction.set(
      eventRef,
      {
        orderID,
        date,
        source,
        staffName,
        staffKey,
        kg,

        sourceCounted: true,
        staffCounted: true,

        updatedAt: serverTimestamp,

        ...(eventSnap.exists
          ? {}
          : { createdAt: serverTimestamp }),
      },
      { merge: true }
    );

  });

  return true;
}
