import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FieldArray, useFormikContext, getIn } from "formik";
import { AppTextArea, FormDropdown, FormInput } from "../../shared/Form";
import ProductSearchAddWithCreate from "./ProductSearchAdd";
import { db } from "@/app/utils/firebase";
import Donut from "../../placeGur/add_order/Donut";
import { BiCopy } from "react-icons/bi";
import { IoCall } from "react-icons/io5";
import Link from "next/link";
import { notifications } from "@mantine/notifications";

/**
 * Order Details Form (Formik child component)
 * JavaScript version (.js)
 */

/* ---------------------- Select options ---------------------- */
const ORDER_STATUS = [
  { name: "Pending", id: "pending" },
  { name: "Processing", id: "processing" },
  { name: "Shipped", id: "shipped" },
  { name: "Delivered", id: "delivered" },
  { name: "Paid", id: "paid" },
  { name: "Fulfilled", id: "fulfilled" },
  { name: "Cancelled", id: "cancelled" },
  { name: "Refunded", id: "refunded" },
  { name: "Partially Refunded", id: "partially_refunded" },
];

const PAYMENT_METHODS = [
  { name: "Cash on Delivery (COD)", id: "cod" },
  { name: "Bkash", id: "bkash" },
  { name: "Nagad", id: "nagad" },
  { name: "Rocket", id: "rocket" },
];

const PAYMENT_STATUS = [
  { name: "Unpaid", id: "unpaid" },
  { name: "Authorized", id: "authorized" },
  { name: "Paid", id: "paid" },
  { name: "Refunded", id: "refunded" },
  { name: "Partial", id: "partial" },
];

const FULFILLMENT_STATUS = [
  { name: "Unfulfilled", id: "unfulfilled" },
  { name: "Partial", id: "partial" },
  { name: "Fulfilled", id: "fulfilled" },
];

const CURRENCY = [{ name: "BDT", id: "BDT" }];

const COURIER = [
  { name: "Pathao", id: "Pathao" },
  { name: "SteadFast", id: "SteadFast" },
];

/* ------------------------- Helpers -------------------------- */
function toNumber(n, fallback = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function digitsOnly(v) {
  return String(v ?? "").replace(/\D/g, "");
}

const Line = ({ h = "h-4", w = "w-full" }) => (
  <div className={`rounded bg-gray-200 ${h} ${w}`}></div>
);

const SectionSkeleton = () => (
  <div className="animate-pulse space-y-3">
    <Line h="h-4" w="w-32" />
    <div className="grid grid-cols-2 gap-3">
      <Line />
      <Line />
      <Line />
      <Line />
    </div>
  </div>
);

function SectionTitle({ children }) {
  return <div className="font-medium text-base">{children}</div>;
}

function Subtle({ children }) {
  return <span className="text-xs text-gray-500">{children}</span>;
}

/* ----------------- Totals auto-computation ------------------ */
function useTotalsAutoCompute() {
  const { values, setFieldValue } = useFormikContext();

  const itemsSum = useMemo(() => {
    const items = getIn(values, "items") || [];
    return items.reduce((sum, it) => {
      const price = toNumber(it?.price, 0);
      const qty = toNumber(it?.quantity, 0);
      const line = toNumber(it?.line_total, price * qty);
      return sum + line;
    }, 0);
  }, [values]);

  useEffect(() => {
    const discount = toNumber(getIn(values, "totals.discount"), 0);
    const shipping = toNumber(getIn(values, "totals.shipping"), 0);
    const tax = toNumber(getIn(values, "totals.tax"), 0);

    const grand = +(itemsSum - discount + shipping + tax).toFixed(2);

    setFieldValue("totals.items", +itemsSum.toFixed(2), false);
    setFieldValue("totals.grand", grand, false);
  }, [itemsSum, values, setFieldValue]);
}

/* ----------------- Line total auto-compute ------------------ */
function useLineTotalsAutoCompute(index) {
  const { values, setFieldValue } = useFormikContext();
  const price = toNumber(getIn(values, `items[${index}].price`), 0);
  const qty = toNumber(getIn(values, `items[${index}].quantity`), 0);

  useEffect(() => {
    const lt = +(price * qty).toFixed(2);
    setFieldValue(`items[${index}].line_total`, lt, false);
  }, [price, qty, index, setFieldValue]);
}

/* -------- createCustomer → unified mapping (fallback) ------- */
function mapCreateCustomer(src = {}) {
  return {
    name: src.cus_name || "",
    phone: src.cus_contact || "",
    street: src.cus_address || "",
    city: src.city || "",
    state: src.state || "",
    country: src.country || "",
  };
}

function computeBadge({ success = 0, cancel = 0, total = 0, rawLabel = "" }) {
  const delivered = Number(success) || 0;
  const cancelled = Number(cancel) || 0;
  const t = Number(total) || 0;
  const cancelPct = t > 0 ? Math.round((cancelled / t) * 100) : 0;

  // Rules:
  // total === 0 ⇒ No History
  // success+cancel < 3 ⇒ New Customer
  // cancelPct ≥ 60 ⇒ Risky
  // 30–59 ⇒ Average
  // < 30 ⇒ Normal
  if (t === 0)
    return {
      level: "neutral",
      text: "No History",
      cls: "bg-gray-100 text-gray-700",
      cancelPct,
    };
  if (delivered + cancelled < 3)
    return {
      level: "info",
      text: "New Customer",
      cls: "bg-blue-100 text-blue-700",
      cancelPct,
    };
  if (cancelPct >= 60)
    return {
      level: "block",
      text: "Risky",
      cls: "bg-red-100 text-red-700",
      cancelPct,
    };
  if (cancelPct >= 30)
    return {
      level: "warn",
      text: "Average",
      cls: "bg-amber-100 text-amber-700",
      cancelPct,
    };
  return {
    level: "ok",
    text: "Normal",
    cls: "bg-green-100 text-green-700",
    cancelPct,
  };
}

const CANCEL_BLOCK_PCT = 60; // >= 60% cancel => Do NOT ship
const CANCEL_WARN_PCT = 30; // 30–59% => caution

function decideByCancelRatio(cancelPct) {
  if (cancelPct >= CANCEL_BLOCK_PCT) {
    return { level: "block", text: "Do NOT ship" };
  }
  if (cancelPct >= CANCEL_WARN_PCT) {
    return { level: "warn", text: "Ship with caution" };
  }
  return { level: "ok", text: "OK to ship" };
}

function OverallBadge({ level, text }) {
  const cls =
    level === "block"
      ? "bg-red-100 text-red-700"
      : level === "warn"
        ? "bg-amber-100 text-amber-700"
        : "bg-green-100 text-green-700";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {text}
    </span>
  );
}

function FraudPanel({ data, loading, onOverallChange }) {
  const colorSuccess = "#22c55e";
  const colorCancel = "#ef4444";
  const colorOther = "#94a3b8";

  // Aggregate overall
  const overall = useMemo(() => {
    if (!data) return null;
    const entries = Object.values(data || {});
    if (!entries.length)
      return { success: 0, cancel: 0, total: 0, rate: 0, cancelPct: 0 };

    const agg = entries.reduce(
      (acc, c) => {
        acc.success += Number(c?.success || 0);
        acc.cancel += Number(c?.cancel || 0);
        acc.total += Number(c?.total || 0);
        return acc;
      },
      { success: 0, cancel: 0, total: 0 },
    );
    const rate =
      agg.total > 0 ? Math.round((agg.success / agg.total) * 100) : 0;
    const cancelPct =
      agg.total > 0 ? Math.round((agg.cancel / agg.total) * 100) : 0;
    return { ...agg, rate, cancelPct };
  }, [data]);

  useEffect(() => {
    if (!overall || !onOverallChange) return;
    const decision = decideByCancelRatio(overall.cancelPct);
    onOverallChange({
      success: overall.success,
      cancel: overall.cancel,
      total: overall.total,
      success_rate_pct: overall.rate,
      cancel_rate_pct: overall.cancelPct,
      decision: decision.text,
      decision_level: decision.level,
    });
  }, [overall, onOverallChange]);

  if (loading) {
    return (
      <div className="p-3 border rounded bg-white">
        <div className="text-sm text-gray-600">Checking customer history…</div>
      </div>
    );
  }
  if (!data) return null;

  const entries = Object.values(data || {});
  if (!entries.length) return null;

  return (
    <div className="p-3 border rounded bg-white space-y-3">
      <div className="mb-1 font-medium">Fraud / Delivery History</div>
      {/* Overall summary */}
      {overall && (
        <div className="p-3 rounded-xl border bg-indigo-50 flex items-center gap-3">
          <Donut
            size={96}
            stroke={12}
            showCenterRate
            segments={[
              { label: "Success", value: overall.success, color: colorSuccess },
              { label: "Cancel", value: overall.cancel, color: colorCancel },
              {
                label: "Other",
                value: Math.max(
                  0,
                  overall.total - overall.success - overall.cancel,
                ),
                color: colorOther,
              },
            ]}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Overall Summary</div>
              <OverallBadge
                level={decideByCancelRatio(overall.cancelPct).level}
                text={decideByCancelRatio(overall.cancelPct).text}
              />
            </div>
            <div className="mt-1 text-sm">
              Success: <b>{overall.success}</b> · Cancel:{" "}
              <b>{overall.cancel}</b> · Total: <b>{overall.total}</b>
            </div>
            <div className="text-xs text-gray-700">
              Success Rate: <b>{overall.rate}%</b> · Cancel Ratio:{" "}
              <b>{overall.cancelPct}%</b>
            </div>
            <div className="mt-1 text-[11px] text-gray-600">
              Rules: Cancel ≥ {CANCEL_BLOCK_PCT}% ⇒ Do NOT ship ·{" "}
              {CANCEL_WARN_PCT}–{CANCEL_BLOCK_PCT - 1}% ⇒ Caution
            </div>
          </div>
        </div>
      )}

      {/* Per-courier cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map((c, i) => {
          const success = Number(c?.success || 0);
          const cancel = Number(c?.cancel || 0);
          const total = Number(c?.total || 0);
          const other = Math.max(0, total - success - cancel);
          const rate = total > 0 ? Math.round((success / total) * 100) : 0;

          // NEW: derive badge from numbers (not raw string)
          const badge = computeBadge({
            success,
            cancel,
            total,
            rawLabel: c?.customer_rating,
          });

          return (
            <div
              key={i}
              className="p-3 rounded-xl border bg-gray-50 flex items-center gap-3"
            >
              <Donut
                size={84}
                stroke={12}
                showCenterRate
                segments={[
                  { label: "Success", value: success, color: "#22c55e" },
                  { label: "Cancel", value: cancel, color: "#ef4444" },
                  { label: "Other", value: other, color: "#94a3b8" },
                ]}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{c?.name || "Courier"}</div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${badge.cls}`}
                  >
                    {badge.text}
                  </span>
                </div>

                <div className="mt-1 text-xs text-gray-600">
                  Success: <b>{success}</b> · Cancel: <b>{cancel}</b> · Total:{" "}
                  <b>{total}</b> · Rate: <b>{rate}%</b> · Cancel:{" "}
                  <b>{badge.cancelPct}%</b>
                </div>

                <div className="mt-2 flex gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded"
                      style={{ background: "#22c55e" }}
                    />
                    Success
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded"
                      style={{ background: "#ef4444" }}
                    />
                    Cancel
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span
                      className="inline-block w-2 h-2 rounded"
                      style={{ background: "#94a3b8" }}
                    />
                    Others
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------- Autofill hook + fraud ------------------------ */
function useCustomerAutofill() {
  const { values, setFieldValue } = useFormikContext();
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  // fraud states
  const [fraudData, setFraudData] = useState(null);
  const [isCheckingFraud, setIsCheckingFraud] = useState(false);

  const phoneDigits = digitsOnly(getIn(values, "customer.phone"));
  const handleCopy = async () => {
    await navigator.clipboard.writeText(phoneDigits);
    notifications.show({
      title: "Success",
      message: `Phone number: ${phoneDigits} copied.`,
      color: "green",
    });
  };

  // Only-once fraud-check (debounced)
  const lastFraudCheckedRef = useRef(null);
  const fraudTimerRef = useRef(null);

  const doFraudCheck = useCallback(async (msisdn) => {
    try {
      setIsCheckingFraud(true);
      const r = await fetch("/api/fraud-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: msisdn }),
      });
      const data = await r.json();
      setFraudData(data?.data || null);
    } catch (err) {
      console.error("fraud-check failed:", err);
      setFraudData(null);
    } finally {
      setIsCheckingFraud(false);
    }
  }, []);

  useEffect(() => {
    if (phoneDigits.length !== 11 || !/^01/.test(phoneDigits)) return;
    if (lastFraudCheckedRef.current === phoneDigits) return;

    if (fraudTimerRef.current) clearTimeout(fraudTimerRef.current);
    fraudTimerRef.current = setTimeout(() => {
      lastFraudCheckedRef.current = phoneDigits;
      doFraudCheck(phoneDigits);
    }, 300);

    return () => {
      if (fraudTimerRef.current) clearTimeout(fraudTimerRef.current);
    };
  }, [phoneDigits, doFraudCheck]);

  // Customer autofill
  const timerRef = useRef(null);
  const lastFetchedRef = useRef(null);
  const aliveRef = useRef(true);
  const currentPhoneRef = useRef(phoneDigits);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (fraudTimerRef.current) clearTimeout(fraudTimerRef.current);
    };
  }, []);

  useEffect(() => {
    currentPhoneRef.current = phoneDigits;
  }, [phoneDigits]);

// 🔹 BD Phone Normalize Function
const normalizeBDPhone = (input) => {
  if (!input) return null;

  let number = input.replace(/\D/g, "");

  if (number.startsWith("880")) {
    number = "0" + number.slice(3);
  } else if (number.startsWith("80") && number.length === 12) {
    number = "0" + number.slice(2);
  } else if (number.length === 10) {
    number = "0" + number;
  }

  if (!/^01\d{9}$/.test(number)) return null;

  return number; // always return local format (01XXXXXXXXX)
};

useEffect(() => {
  const normalizedPhone = normalizeBDPhone(phoneDigits);

  if (!normalizedPhone) return;
  if (lastFetchedRef.current === normalizedPhone) return;

  if (timerRef.current) clearTimeout(timerRef.current);

  timerRef.current = setTimeout(async () => {
    const requested = normalizedPhone;
    currentPhoneRef.current = requested;
    setIsLoadingCustomer(true);

    try {
      let snap = await db.collection("customers").doc(requested).get();
      let payload = null;

      if (snap.exists) {
        const d = snap.data() || {};
        payload = {
          name: d?.customer?.name || "",
          phone: d?.customer?.phone || requested,
          street: d?.shipping_address?.street || "",
          city: d?.shipping_address?.city || "",
          state: d?.shipping_address?.state || "",
          country: d?.shipping_address?.country || "",
        };
      } else {
        const cDoc = await db
          .collection("createCustomer")
          .doc(requested)
          .get();

        if (cDoc.exists) {
          payload = mapCreateCustomer(cDoc.data());
        } else {
          const q = await db
            .collection("createCustomer")
            .where("cus_contact", "==", requested)
            .limit(1)
            .get();

          if (!q.empty) {
            payload = mapCreateCustomer(q.docs[0].data());
          }
        }
      }

      if (!aliveRef.current || currentPhoneRef.current !== requested) return;

      lastFetchedRef.current = requested;

      const nextCust = {
        ...(getIn(values, "customer") || {}),
        phone: payload?.phone || requested,
        name: payload?.name || "",
      };

      const nextAddr = {
        ...(getIn(values, "shipping_address") || {}),
        street: payload?.street || "",
        city: payload?.city || "",
        state: payload?.state || "",
        country: payload?.country || "",
      };

      setFieldValue("customer", nextCust, false);
      setFieldValue("shipping_address", nextAddr, false);
    } catch (err) {
      console.error("Failed to load customer:", err);
    } finally {
      if (aliveRef.current) setIsLoadingCustomer(false);
    }
  }, 300);

  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, [phoneDigits, setFieldValue, values]);

  return { isLoadingCustomer, fraudData, isCheckingFraud };
}

/* ----------------------- Subcomponents ---------------------- */
const AddressFields = ({ prefix }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="col-span-2">
        <span>Street</span>
        <FormInput name={`${prefix}.street`} placeholder="Street, house" />
      </div>
      <div className="col-span-1">
        <span>City</span>
        <FormInput name={`${prefix}.city`} placeholder="City" />
      </div>
      <div className="col-span-1">
        <span>State / District</span>
        <FormInput name={`${prefix}.state`} placeholder="Dhaka" />
      </div>
      {/* Country চাইলে আনলক করুন */}
      {/* <div className="col-span-1">
        <span>Country</span>
        <FormInput name={`${prefix}.country`} placeholder="BD" />
      </div> */}
    </div>
  );
};

const ItemRow = ({ index, onRemove }) => {
  useLineTotalsAutoCompute(index);
  const { values } = useFormikContext();

  return (
    <div className="grid grid-cols-6 gap-3 p-3 border rounded">
      <div className="col-span-6 flex items-center justify-between">
        <div className="font-medium">Item {index + 1}</div>
        <button
          type="button"
          className="text-sm text-red-500"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      <div className="col-span-3 sm:col-span-2 gap-2">
        <span>Product ID</span>
        <FormInput name={`items[${index}].product_id`} placeholder="1001" />
      </div>
      <div className="col-span-3 sm:col-span-2 gap-2">
        <span>Title</span>
        <FormInput name={`items[${index}].title`} placeholder="Basic Tee" />
      </div>
      <div className="col-span-3 sm:col-span-2 gap-2">
        <span>Unit</span>
        <FormInput name={`items[${index}].unit`} placeholder="pc" />
      </div>

      <div className="col-span-3 sm:col-span-2 gap-2">
        <span>Currency</span>
        <FormDropdown
          name={`items[${index}].currency`}
          placeholder="BDT"
          items={CURRENCY}
        />
      </div>
      <div className="col-span-3 sm:col-span-2 gap-2">
        <span>Price</span>
        <FormInput
          name={`items[${index}].price`}
          type="number"
          placeholder="0.00"
        />
      </div>
      <div className="col-span-3 sm:col-span-2 gap-2">
        <span>Quantity</span>
        <FormInput
          name={`items[${index}].quantity`}
          type="number"
          placeholder="1"
        />
      </div>
      <div className="col-span-3 sm:col-span-2 gap-2">
        <span>Line Total</span>
        <FormInput name={`items[${index}].line_total`} type="number" readOnly />
        <Subtle>auto price × qty</Subtle>
      </div>

      {/* Options: name/value pairs */}
      <div className="col-span-6">
        <span className="block font-semibold">Options</span>
        <FieldArray
          name={`items[${index}].options`}
          render={({ push, remove }) => (
            <div className="space-y-2">
              {(getIn(values, `items[${index}].options`) || []).map(
                (opt, oi) => (
                  <div
                    key={oi}
                    className="grid gird-cols-2 sm:grid-cols-3 gap-2 items-end"
                  >
                    <div className="col-span-1">
                      <span>Name</span>
                      <FormInput
                        name={`items[${index}].options[${oi}].name`}
                        placeholder="Color"
                      />
                    </div>
                    <div className="col-span-1">
                      <span>Value</span>
                      <FormDropdown
                        name={`items[${index}].options[${oi}].values`}
                        items={opt?.value || []}
                        placeholder="Select"
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => remove(oi)}
                        className="text-sm text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ),
              )}
              <button
                type="button"
                className="text-sm underline"
                onClick={() => push({ name: "", value: "" })}
              >
                + Add option
              </button>
            </div>
          )}
        />
      </div>

      {/* Inventory Allocation (optional, simple row) */}
      <div className="col-span-6">
        <span className="block">Inventory Allocation</span>
        <FieldArray
          name={`items[${index}].inventory_allocation`}
          render={({ push, remove }) => (
            <div className="space-y-2">
              {(
                getIn(values, `items[${index}].inventory_allocation`) || []
              ).map((_, ai) => (
                <div key={ai} className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <span>Location</span>
                    <FormInput
                      name={`items[${index}].inventory_allocation[${ai}].location_code`}
                      placeholder="MAIN"
                    />
                  </div>
                  <div>
                    <span>Qty</span>
                    <FormInput
                      name={`items[${index}].inventory_allocation[${ai}].qty`}
                      type="number"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => remove(ai)}
                      className="text-sm text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-sm underline"
                onClick={() => push({ location_code: "MAIN", qty: 0 })}
              >
                + Add allocation
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
};

/* ------------------------- Main ----------------------------- */
const OrderDetailsFormUp = () => {
  const { values, setFieldValue } = useFormikContext();
  const phoneDigits = digitsOnly(getIn(values, "customer.phone"));
  const handleCopy = async () => {
    await navigator.clipboard.writeText(phoneDigits);
    notifications.show({
      title: "Success",
      message: `Phone number: ${phoneDigits} copied.`,
      color: "green",
    });
  };

  useTotalsAutoCompute();
  const { isLoadingCustomer, fraudData, isCheckingFraud } =
    useCustomerAutofill();

  // keep overall decision mirrored into form meta*
  const handleOverallChange = useCallback(
    (overall) => {
      // write into form meta for later usage
      setFieldValue(
        "meta.ship_recommendation",
        overall?.decision || null,
        false,
      );
      setFieldValue(
        "meta.cancel_ratio_overall",
        overall?.cancel_rate_pct ?? null,
        false,
      );
      setFieldValue(
        "meta.success_ratio_overall",
        overall?.success_rate_pct ?? null,
        false,
      );
    },
    [setFieldValue],
  );

  // derived read-only view from form meta (so it survives re-render)
  const shipRecommendation = getIn(values, "meta.ship_recommendation");
  const overallCancelPct = getIn(values, "meta.cancel_ratio_overall");

  return (
    <div className="max-h-full space-y-4">
      {/* BASICS */}
      <div className="grid grid-cols-2 gap-3 p-3 border rounded">
        <SectionTitle>Order Basics</SectionTitle>
        <div className="col-span-2 grid grid-cols-2 gap-3">
          <div>
            <span>Status</span>
            <FormDropdown
              name="status"
              placeholder="Select"
              items={ORDER_STATUS}
            />
          </div>
          <div>
            <span>Currency</span>
            <FormDropdown
              name="currency"
              placeholder="Currency"
              items={CURRENCY}
            />
          </div>
        </div>
      </div>

      {/* CUSTOMER (with overlay) */}
      <div className="relative p-3 border rounded space-y-3">
        <SectionTitle>Customer</SectionTitle>

        {isLoadingCustomer && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="w-full px-2">
              <SectionSkeleton />
            </div>
          </div>
        )}

        <div
          className={`grid grid-cols-2 gap-3 ${
            isLoadingCustomer
              ? "pointer-events-none select-none opacity-60"
              : ""
          }`}
        >
          <div className="col-span-2 sm:col-span-1">
            <span>Phone</span>
            <div className="flex gap-2">
              <FormInput name="customer.phone" placeholder="01XXXXXXXXX" />
              {phoneDigits.length === 11 ? (
                <Link
                  className="bg-blue-400 inline-block mb-4 items-center px-5 py-3 rounded-md cursor-pointer hover:bg-blue-500 text-sm text-white font-medium hover:shadow-lg transition-all duration-300"
                  href={`tel:${phoneDigits}`}
                >
                  <IoCall size={20} />
                </Link>
              ) : (
                <span className="bg-blue-300 inline-block mb-4 items-center px-5 py-3 rounded-md  text-sm text-white font-medium">
                  <IoCall size={20} />
                </span>
              )}
              {phoneDigits.length === 11 ? (
                <span
                  className="bg-green-400 inline-block mb-4 items-center px-5 py-3 rounded-md cursor-pointer hover:bg-green-500 text-sm text-white font-medium hover:shadow-lg transition-all duration-300"
                  onClick={handleCopy}
                >
                  <BiCopy size={20} />
                </span>
              ) : (
                <span className="bg-green-300 inline-block mb-4 items-center px-5 py-3 rounded-md  text-sm text-white font-medium">
                  <BiCopy size={20} />
                </span>
              )}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span>Name</span>
            <FormInput name="customer.name" placeholder="Mr. Customer" />
          </div>
        </div>
        {/* Fraud panel + overall summary */}
        {/* {digitsOnly(getIn(values, "customer.phone")).length === 11 && (
          <FraudPanel
            data={fraudData}
            loading={isCheckingFraud}
            onOverallChange={handleOverallChange}
          />
        )} */}
      </div>

      {/* ADDRESSES (with overlay) */}
      <div className="relative p-3 border rounded space-y-3">
        <SectionTitle>Shipping Address</SectionTitle>

        {isLoadingCustomer && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="w-full px-2">
              <SectionSkeleton />
            </div>
          </div>
        )}

        <div
          className={`${
            isLoadingCustomer
              ? "pointer-events-none select-none opacity-60"
              : ""
          }`}
        >
          <AddressFields prefix="shipping_address" />
        </div>
      </div>

      {/* ITEMS */}
      <div className="space-y-3 p-3 border rounded">
        <SectionTitle>Items</SectionTitle>
        <div className="col-span-6">
          <ProductSearchAddWithCreate />
        </div>

        <FieldArray
          name="items"
          render={({ remove }) => {
            const items = getIn(values, "items") || [];
            const idxs = items.map((_, i) => i).reverse(); // latest first
            return (
              <div className="space-y-3">
                {idxs.map((idx) => (
                  <ItemRow key={idx} index={idx} onRemove={() => remove(idx)} />
                ))}
              </div>
            );
          }}
        />
      </div>

      {/* DISCOUNTS & TOTALS */}
      <div className="grid grid-cols-2 gap-3 p-3 border rounded">
        <div className="space-y-2">
          <SectionTitle>Discounts</SectionTitle>
          <FieldArray
            name="discounts"
            render={({ push, remove }) => (
              <div className="space-y-2">
                {(getIn(values, "discounts") || []).map((_, idx) => (
                  <div key={idx} className="grid grid-cols-5 gap-2 items-end">
                    <div className="col-span-3">
                      <span>Code</span>
                      <FormInput
                        name={`discounts[${idx}].code`}
                        placeholder="WELCOME10"
                      />
                    </div>
                    <div className="col-span-2">
                      <span>Amount</span>
                      <FormInput
                        type="number"
                        name={`discounts[${idx}].amount`}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-span-5">
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-sm text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() => push({ code: "", amount: 0 })}
                >
                  + Add discount
                </button>
              </div>
            )}
          />
        </div>

        <div className="space-y-2">
          <SectionTitle>Totals</SectionTitle>
          <div>
            <span>Items Subtotal</span>
            <FormInput name="totals.items" type="number" readOnly />
            <Subtle>Auto-calculated from line totals</Subtle>
          </div>
          <div>
            <span>Discount</span>
            <FormInput
              name="totals.discount"
              type="number"
              placeholder="0.00"
            />
          </div>
          <div>
            <span>Shipping</span>
            <FormInput
              name="totals.shipping"
              type="number"
              placeholder="0.00"
            />
          </div>
          {/* <div>
            <span>Tax</span>
            <FormInput name="totals.tax" type="number" placeholder="0.00" />
          </div> */}
          <div>
            <span>Grand Total</span>
            <FormInput name="totals.grand" type="number" readOnly />
            <Subtle>items - discount + shipping + tax</Subtle>
          </div>
        </div>
      </div>

      {/* PAYMENT & FULFILLMENT */}
      <div className="grid grid-cols-2 gap-3 p-3 border rounded">
        <div className="space-y-3">
          <SectionTitle>Payment</SectionTitle>
          <div>
            <span>Method</span>
            <FormDropdown
              name="payment.method"
              placeholder="Select"
              items={PAYMENT_METHODS}
            />
          </div>
          <div>
            <span>Status</span>
            <FormDropdown
              name="payment.status"
              placeholder="Select"
              items={PAYMENT_STATUS}
            />
          </div>
          <div>
            <span>Transaction ID</span>
            <FormInput
              name="payment.transaction_id"
              placeholder="(if available)"
            />
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle>Fulfillment</SectionTitle>
          {/* <div>
            <span>Status</span>
            <FormDropdown
              name="fulfillment.status"
              placeholder="Select"
              items={FULFILLMENT_STATUS}
            />
          </div> */}
          <div>
            <span>Courier</span>
            <FormDropdown
              name="fulfillment.courier"
              placeholder="Select"
              items={COURIER}
              defaultValue={"Pathao"}
            />
          </div>
          <div>
            <span>Tracking Numbers</span>
            <FieldArray
              name="fulfillment.tracking_numbers"
              render={({ push, remove }) => (
                <div className="space-y-2">
                  {(getIn(values, "fulfillment.tracking_numbers") || []).map(
                    (_, idx) => (
                      <div key={idx} className="flex gap-2">
                        <FormInput
                          name={`fulfillment.tracking_numbers[${idx}]`}
                          placeholder="TRK..."
                        />
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="text-sm text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ),
                  )}
                  <button
                    type="button"
                    className="text-sm text-green-600"
                    onClick={() => push("")}
                  >
                    + Add tracking
                  </button>
                </div>
              )}
            />
          </div>
        </div>
      </div>

      {/* META & NOTES */}
      <div className="p-3 border rounded space-y-3">
        <SectionTitle>Meta & Notes</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span>Source</span>
            <FormInput name="meta.source" placeholder="web / app / pos" />
          </div>
          <div>
            <span>Notes</span>
            <AppTextArea name="notes" placeholder="Internal notes" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsFormUp;
