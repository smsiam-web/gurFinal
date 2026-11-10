// lib/orderStatusCounters.js

import { db, timestamp } from "@/app/utils/firebase";

// =====================================================
// Allowed statuses
// =====================================================

const ALLOWED_STATUS = [
  "processing",
  "incomplete",
  "goodButNoResponse",
  "noResponse",
  "advancePayment",
  "onHold",
  "approved",
  "cancel",
];

// =====================================================
// Firestore counter document
// =====================================================

const counterRef = db.doc(
  "counters/orderStatusSummary"
);

// =====================================================
// Default counter data
// =====================================================

const getDefaultCounters = () => ({
  processing: 0,
  incomplete: 0,
  goodButNoResponse: 0,
  noResponse: 0,
  advancePayment: 0,
  onHold: 0,
  approved: 0,
  cancel: 0,
  all: 0,

  createdAt: timestamp,
  updatedAt: timestamp,
});

// =====================================================
// Safe number helper
// =====================================================

const safeNumber = (value) => {
  const n = Number(value || 0);

  if (Number.isNaN(n)) {
    return 0;
  }

  return n;
};

// =====================================================
// New Processing Order
//
// processing +1
// all +1
// =====================================================

export async function addNewProcessingOrderCounter() {
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);

      const data = snap.exists
        ? {
            ...getDefaultCounters(),
            ...(snap.data() || {}),
          }
        : getDefaultCounters();

      data.processing =
        safeNumber(data.processing) + 1;

      data.all =
        safeNumber(data.all) + 1;

      data.updatedAt = timestamp;

      tx.set(counterRef, data, {
        merge: true,
      });
    });

    console.log(
      "[COUNTER] processing +1, all +1"
    );
  } catch (error) {
    console.error(
      "[COUNTER] addNewProcessingOrderCounter error:",
      error
    );

    throw error;
  }
}

// =====================================================
// Status move
//
// example:
// processing -> onHold
//
// processing -1
// onHold +1
// all unchanged
// =====================================================

export async function updateOrderStatusCounter(
  fromStatus,
  toStatus
) {
  try {
    if (!fromStatus || !toStatus) {
      throw new Error(
        "fromStatus and toStatus are required"
      );
    }

    if (!ALLOWED_STATUS.includes(fromStatus)) {
      throw new Error(
        `Invalid fromStatus: ${fromStatus}`
      );
    }

    if (!ALLOWED_STATUS.includes(toStatus)) {
      throw new Error(
        `Invalid toStatus: ${toStatus}`
      );
    }

    if (fromStatus === toStatus) {
      console.log(
        "[COUNTER] Same status. No change."
      );
      return;
    }

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(counterRef);

      const data = snap.exists
        ? {
            ...getDefaultCounters(),
            ...(snap.data() || {}),
          }
        : getDefaultCounters();

      data[fromStatus] = Math.max(
        0,
        safeNumber(data[fromStatus]) - 1
      );

      data[toStatus] =
        safeNumber(data[toStatus]) + 1;

      // all change হবে না
      data.all =
        safeNumber(data.all);

      data.updatedAt = timestamp;

      tx.set(counterRef, data, {
        merge: true,
      });
    });

    console.log(
      `[COUNTER] ${fromStatus} -> ${toStatus}`
    );
  } catch (error) {
    console.error(
      "[COUNTER] updateOrderStatusCounter error:",
      error
    );

    throw error;
  }
}

// =====================================================
// Get counters
// =====================================================

export async function getOrderStatusCounters() {
  try {
    const snap = await counterRef.get();

    if (!snap.exists) {
      return {
        processing: 0,
        incomplete: 0,
        goodButNoResponse: 0,
        noResponse: 0,
        advancePayment: 0,
        onHold: 0,
        approved: 0,
        cancel: 0,
        all: 0,
      };
    }

    const data =
      snap.data() || {};

    return {
      processing:
        safeNumber(data.processing),

      incomplete:
        safeNumber(data.incomplete),

      goodButNoResponse:
        safeNumber(
          data.goodButNoResponse
        ),

      noResponse:
        safeNumber(data.noResponse),

      advancePayment:
        safeNumber(
          data.advancePayment
        ),

      onHold:
        safeNumber(data.onHold),

      approved:
        safeNumber(data.approved),

      cancel:
        safeNumber(data.cancel),

      all:
        safeNumber(data.all),
    };
  } catch (error) {
    console.error(
      "[COUNTER] getOrderStatusCounters error:",
      error
    );

    throw error;
  }
}