// Cloud Functions for Firebase (Node 18+ recommended)
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

/** ------------------ কনফিগ ------------------ */
// কোন স্ট্যাটাসগুলোকে "সেলস" হিসেবে গণনা করবেন?
// কেবল কনফার্মড সেলস চাইলে: ["Confirmed"]
const COUNT_STATUSES = ["Pending", "Confirmed"];

// অর্ডারের অ্যামাউন্ট কোন ফিল্ডে আছে?
const AMOUNT_FIELD = "totalPrice"; // আপনার স্ক্রিনশটে totalPrice ছিল

/** ---------------- হেলপার ------------------- */
function dayKey(d) {
  // YYYY-MM-DD (UTC ভিত্তিক)
  const x = new Date(d);
  const yyyy = x.getUTCFullYear();
  const mm = String(x.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(x.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function yesterdayKey(now = new Date()) {
  const x = new Date(now);
  x.setUTCDate(x.getUTCDate() - 1);
  return dayKey(x);
}

function monthKey(d) {
  // YYYY-MM
  const x = new Date(d);
  const yyyy = x.getUTCFullYear();
  const mm = String(x.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}
function isoWeekKey(d) {
  // YYYY-Www (ISO week: Monday first)
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Thursday in current week decides the year.
  x.setUTCDate(x.getUTCDate() + 4 - (x.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((x - yearStart) / 86400000) + 1) / 7);
  const yyyy = x.getUTCFullYear();
  const ww = String(weekNo).padStart(2, "0");
  return `${yyyy}-W${ww}`;
}

function qualifies(order) {
  const st = (order.status || "").toString();
  return COUNT_STATUSES.includes(st);
}
function amountOf(order) {
  return Number(order?.[AMOUNT_FIELD] || 0);
}

/** before -> after থেকে নেট ডেল্টা বের করুন */
function deltaAmount(before, after) {
  const beforeQ = before && qualifies(before);
  const afterQ  = after && qualifies(after);
  const bAmt = amountOf(before);
  const aAmt = amountOf(after);

  if (!before && afterQ) return +aAmt;               // create (+)
  if (beforeQ && !after) return -bAmt;               // delete (-)
  if (beforeQ && afterQ) return aAmt - bAmt;         // both qualified → diff
  if (!beforeQ && afterQ) return +aAmt;              // became qualified
  if (beforeQ && !afterQ) return -bAmt;              // lost qualification
  return 0;
}

/** ---------------- মেইন ট্রিগার ---------------- */
exports.onPlaceOrderWrite = functions.firestore
  .document("placeOrder/{orderId}")
  .onWrite(async (change, context) => {
    const before = change.before.exists ? change.before.data() : null;
    const after  = change.after.exists  ? change.after.data()  : null;

    // timestamp ধরে নিচ্ছি creation time (Firestore Timestamp)
    const beforeTs = before?.timestamp?.toDate?.() ? before.timestamp.toDate() : null;
    const afterTs  = after?.timestamp?.toDate?.()  ? after.timestamp.toDate()  : null;

    // নেট ডেল্টা (total এর জন্য)
    const totalDelta = deltaAmount(before, after);
    if (totalDelta === 0) return null; // কিছু পরিবর্তন নেই

    // "current" কীগুলো এখনকার তারিখ/সপ্তাহ/মাস ভিত্তিক
    const now = new Date();
    const todayK = dayKey(now);
    const yestK  = yesterdayKey(now);
    const weekK  = isoWeekKey(now);
    const monthK = monthKey(now);

    // কোন কোন বাকেটে এডজাস্ট হবে তা নির্ধারণ করুন
    const buckets = [];

    // all-time সবসময় আপডেট হবে
    buckets.push({ field: "totalOrderAmount", delta: totalDelta });

    // আজকের বাকেটে আপডেট হবে যদি order.timestamp আজকের হয়
    if (afterTs && dayKey(afterTs) === todayK) {
      buckets.push({ field: "todayTotalOrderAmount", delta: totalDelta });
    }
    // যদি আপডেটে আগের ডক আজ থেকে বাদ পড়ে যায়/আজে এসে পড়ে—strict handling:
    // (সিম্পল ভ্যারিয়েন্ট: creation timestamp অপরিবর্তিত ধরা হচ্ছে)

    // গতকাল
    if (afterTs && dayKey(afterTs) === yestK) {
      buckets.push({ field: "yesterdayTotalOrderAmount", delta: totalDelta });
    }
    // এই সপ্তাহ (order যেদিনের, সেটি যদি current week এর মধ্যে হয়)
    if (afterTs && isoWeekKey(afterTs) === weekK) {
      buckets.push({ field: "thisWeekTotalOrderAmount", delta: totalDelta });
    }
    // এই মাস
    if (afterTs && monthKey(afterTs) === monthK) {
      buckets.push({ field: "thisMonthTotalOrderAmount", delta: totalDelta });
    }

    const summaryRef = db.doc("counters/summary");

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(summaryRef);
      const data = snap.exists ? snap.data() : {
        todayTotalOrderAmount: 0,
        yesterdayTotalOrderAmount: 0,
        thisWeekTotalOrderAmount: 0,
        thisMonthTotalOrderAmount: 0,
        totalOrderAmount: 0,
        // ট্র্যাকিং (optional): কোন day/week/month চলছে
        _todayKey: todayK, _weekKey: weekK, _monthKey: monthK, _updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // যদি দিন/সপ্তাহ/মাস বদলে যায় (ফাংশন কিছুক্ষণ ঘুমিয়ে থাকার পর ট্রিগার হলে), রিসেট করুন
      if (data._todayKey !== todayK) {
        data._todayKey = todayK;
        data.todayTotalOrderAmount = 0;
      }
      if (data._weekKey !== weekK) {
        data._weekKey = weekK;
        data.thisWeekTotalOrderAmount = 0;
      }
      if (data._monthKey !== monthK) {
        data._monthKey = monthK;
        data.thisMonthTotalOrderAmount = 0;
      }

      // ডেল্টা অ্যাপ্লাই করুন
      for (const b of buckets) {
        data[b.field] = Math.max(0, Number(data[b.field] || 0) + Number(b.delta || 0));
      }
      data._updatedAt = admin.firestore.FieldValue.serverTimestamp();

      tx.set(summaryRef, data, { merge: true });
    });

    return null;
  });
