
import { db, timestamp } from "@/app/utils/firebase";

const getDhakaDate = (value) => {
  const date = value ? new Date(value) : new Date();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

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

export async function updateOrderSummary(order) {
  if (!order?.orderID) {
    throw new Error("Order ID is required");
  }

  const orderID = String(order.orderID);
  const date = getDhakaDate(order.created_at);
  const source = normalizeSource(order?.meta?.source);

  const kg = Number(order?.totals?.qtySum || 0);

  const orderItems = (order.items || []).map((item) => {
    const quantity = Number(item.quantity || 0);
    const unitWeight = Number(item.unitWgt || 0);

    return {
      title: item.title || "Unknown Item",
      kg: Number(
        (unitWeight ? unitWeight * quantity : quantity).toFixed(2)
      ),
    };
  });

  // Daily and Overall documents
  const dailyRef = db.collection("orderSummary").doc(date);
  const overallRef = db.collection("orderSummary").doc("overall");

  // Duplicate prevention
  const eventRef = db.collection("orderSummaryEvents").doc(orderID);

  await db.runTransaction(async (transaction) => {

    // Read all documents before writing
    const eventSnap = await transaction.get(eventRef);

    if (eventSnap.exists) return;

    const dailySnap = await transaction.get(dailyRef);
    const overallSnap = await transaction.get(overallRef);

    const dailyData = dailySnap.exists
      ? dailySnap.data()
      : {};

    const overallData = overallSnap.exists
      ? overallSnap.data()
      : {};

    // Update source and item summaries
    const updateSummary = (data) => {
      const oldSource = data.sources?.[source] || {
        orders: 0,
        kg: 0,
        items: [],
      };

      const itemMap = {};

      (oldSource.items || []).forEach((item) => {
        itemMap[item.title] = Number(item.kg || 0);
      });

      orderItems.forEach((item) => {
        itemMap[item.title] =
          Number(itemMap[item.title] || 0) + item.kg;
      });

      const updatedItems = Object.entries(itemMap).map(
        ([title, itemKg]) => ({
          title,
          kg: Number(itemKg.toFixed(2)),
        })
      );

      return {
        totalOrders: Number(data.totalOrders || 0) + 1,

        totalKg: Number(
          (Number(data.totalKg || 0) + kg).toFixed(2)
        ),

        sources: {
          ...(data.sources || {}),

          [source]: {
            orders: Number(oldSource.orders || 0) + 1,

            kg: Number(
              (Number(oldSource.kg || 0) + kg).toFixed(2)
            ),

            items: updatedItems,
          },
        },

        updatedAt: timestamp,
      };
    };

    // Prepare both summaries
    const newDailyData = {
      date,
      ...updateSummary(dailyData),
    };

    const newOverallData = {
      date: "overall",
      ...updateSummary(overallData),
    };

    // Write both in the same transaction
    transaction.set(dailyRef, newDailyData, { merge: true });

    transaction.set(overallRef, newOverallData, { merge: true });

    // Save event for duplicate prevention
    transaction.set(eventRef, {
      orderID,
      date,
      source,
      kg,
      createdAt: timestamp,
    });
  });

  return true;
}