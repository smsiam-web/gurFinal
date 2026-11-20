
import { db } from "@/app/utils/firebase";
import firebase from "firebase";

// ==========================================
// BANGLADESH DATE
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
// STAFF KEY
// ==========================================

const getStaffKey = (name) =>
  encodeURIComponent(
    String(name || "admin").trim().toLowerCase()
  );

// ==========================================
// NUMBER HELPERS
// ==========================================

const roundValue = (value) =>
  Number(Number(value || 0).toFixed(2));

// ==========================================
// MAIN ORDER SUMMARY FUNCTION
// SOURCE + STAFF + STAFF SOURCE
// DAILY + OVERALL + SALES AMOUNT
// ==========================================

export async function updateOrderSummary(order) {

  const orderID = String(
    order?.orderID || order?.id || ""
  ).trim();

  if (!orderID) {
    throw new Error("Order ID is required");
  }

  const date = getDhakaDate(order.created_at);

  const source = normalizeSource(order?.meta?.source);

  const staffName = String(
    order?.created_user || "admin"
  ).trim();

  const staffKey = getStaffKey(staffName);

  // Total product weight
  const kg = roundValue(order?.totals?.qtySum || 0);

  // Sales amount
  const amount = roundValue(
    order?.totals?.grand || 0
  );

  // ==========================================
  // PRODUCT DETAILS
  // ==========================================

  const orderItems = (
    Array.isArray(order.items) ? order.items : []
  ).map((item) => {

    const quantity = Number(item.quantity || 0);
    const unitWeight = Number(item.unitWgt || 0);

    const itemKg = unitWeight
      ? unitWeight * quantity
      : quantity;

    return {
      title: item.title || item.name || "Unknown Item",
      kg: roundValue(itemKg),
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

  const eventRef = db
    .collection("orderSummaryEvents")
    .doc(orderID);

  // Legacy staff event
  const oldStaffEventRef = db
    .collection("orderStaffSummaryEvents")
    .doc(orderID);

  const serverTimestamp =
    firebase.firestore.FieldValue.serverTimestamp();

  // ==========================================
  // SINGLE TRANSACTION
  // ==========================================

  await db.runTransaction(async (transaction) => {

    // ------------------------------------------
    // 1. READ EVENT DOCUMENTS
    // ------------------------------------------

    const eventSnap = await transaction.get(eventRef);

    const oldStaffEventSnap = await transaction.get(
      oldStaffEventRef
    );

    const eventData = eventSnap.exists
      ? eventSnap.data()
      : {};

    // Source duplicate prevention
    const sourceAlreadyCounted =
      eventSnap.exists &&
      eventData.sourceCounted !== false;

    // Staff total duplicate prevention
    const staffAlreadyCounted =
      (
        eventSnap.exists &&
        eventData.staffCounted === true
      ) || oldStaffEventSnap.exists;

    // Staff source duplicate prevention
    const staffSourceAlreadyCounted =
      eventSnap.exists &&
      eventData.staffSourceCounted === true;

    // Amount duplicate prevention
    const amountAlreadyCounted =
      eventSnap.exists &&
      eventData.amountCounted === true;

    const updateSource = !sourceAlreadyCounted;

    const updateStaff = !staffAlreadyCounted;

    const updateStaffSource = !staffSourceAlreadyCounted;

    const updateAmount = !amountAlreadyCounted;

    if (
      !updateSource &&
      !updateStaff &&
      !updateStaffSource &&
      !updateAmount
    ) {
      return;
    }

    // ------------------------------------------
    // 2. READ DAILY + OVERALL
    // ------------------------------------------

    const dailySnap = await transaction.get(dailyRef);

    const overallSnap = await transaction.get(overallRef);

    const dailyData = dailySnap.exists
      ? dailySnap.data()
      : {};

    const overallData = overallSnap.exists
      ? overallSnap.data()
      : {};

    // ==========================================
    // 3. SOURCE SUMMARY
    // ==========================================

    const updateSourceSummary = (data) => {

      const oldSource = data.sources?.[source] || {
        orders: 0,
        kg: 0,
        amount: 0,
        items: [],
      };

      const itemMap = {};

      (oldSource.items || []).forEach((item) => {

        const title = item.title || "Unknown Item";

        itemMap[title] =
          Number(itemMap[title] || 0) +
          Number(item.kg || 0);
      });

      orderItems.forEach((item) => {

        itemMap[item.title] =
          Number(itemMap[item.title] || 0) + item.kg;
      });

      const updatedItems = Object.entries(itemMap).map(
        ([title, itemKg]) => ({
          title,
          kg: roundValue(itemKg),
        })
      );

      return {

        totalOrders:
          Number(data.totalOrders || 0) + 1,

        totalKg: roundValue(
          Number(data.totalKg || 0) + kg
        ),

        sources: {
          ...(data.sources || {}),

          [source]: {

            orders:
              Number(oldSource.orders || 0) + 1,

            kg: roundValue(
              Number(oldSource.kg || 0) + kg
            ),

            amount: roundValue(
              Number(oldSource.amount || 0) + amount
            ),

            items: updatedItems,
          },
        },
      };
    };

    // ==========================================
    // 4. STAFF + SOURCE-WISE SUMMARY
    // ==========================================

    const updateStaffSummary = (data) => {

      const oldStaff = data.staff?.[staffKey] || {
        name: staffName,
        orders: 0,
        kg: 0,
        amount: 0,
        sources: {},
      };

      const oldStaffSource =
        oldStaff.sources?.[source] || {
          orders: 0,
          kg: 0,
          amount: 0,
        };

      // Staff overall totals
      const updatedOrders =
        Number(oldStaff.orders || 0) +
        (updateStaff ? 1 : 0);

      const updatedKg = roundValue(
        Number(oldStaff.kg || 0) +
        (updateStaff ? kg : 0)
      );

      const updatedAmount = roundValue(
        Number(oldStaff.amount || 0) +
        (updateStaff ? amount : 0)
      );

      // Staff source-wise totals
      const updatedStaffSource = {

        orders:
          Number(oldStaffSource.orders || 0) +
          (updateStaffSource ? 1 : 0),

        kg: roundValue(
          Number(oldStaffSource.kg || 0) +
          (updateStaffSource ? kg : 0)
        ),

        amount: roundValue(
          Number(oldStaffSource.amount || 0) +
          (updateStaffSource ? amount : 0)
        ),
      };

      return {

        staff: {

          ...(data.staff || {}),

          [staffKey]: {

            name: staffName,

            orders: updatedOrders,

            kg: updatedKg,

            amount: updatedAmount,

            sources: {

              ...(oldStaff.sources || {}),

              [source]: updatedStaffSource,
            },
          },
        },
      };
    };

    // ==========================================
    // 5. BUILD DAILY DATA
    // ==========================================

    const dailyUpdate = {};

    if (updateSource) {

      Object.assign(
        dailyUpdate,
        updateSourceSummary(dailyData)
      );
    }

    if (updateStaff || updateStaffSource) {

      Object.assign(
        dailyUpdate,
        updateStaffSummary(dailyData)
      );
    }

    if (updateAmount) {

      dailyUpdate.totalAmount = roundValue(
        Number(dailyData.totalAmount || 0) + amount
      );
    }

    dailyUpdate.date = date;

    dailyUpdate.updatedAt = serverTimestamp;

    // ==========================================
    // 6. BUILD OVERALL DATA
    // ==========================================

    const overallUpdate = {};

    if (updateSource) {

      Object.assign(
        overallUpdate,
        updateSourceSummary(overallData)
      );
    }

    if (updateStaff || updateStaffSource) {

      Object.assign(
        overallUpdate,
        updateStaffSummary(overallData)
      );
    }

    if (updateAmount) {

      overallUpdate.totalAmount = roundValue(
        Number(overallData.totalAmount || 0) + amount
      );
    }

    overallUpdate.date = "overall";

    overallUpdate.updatedAt = serverTimestamp;

    // ==========================================
    // 7. WRITE DAILY + OVERALL
    // ==========================================

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

    // ==========================================
    // 8. SINGLE EVENT DOCUMENT
    // ==========================================

    transaction.set(
      eventRef,
      {

        orderID,

        date,

        source,

        staffName,

        staffKey,

        kg,

        amount,

        sourceCounted:
          sourceAlreadyCounted || updateSource,

        staffCounted:
          staffAlreadyCounted || updateStaff,

        staffSourceCounted:
          staffSourceAlreadyCounted || updateStaffSource,

        amountCounted: true,

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
