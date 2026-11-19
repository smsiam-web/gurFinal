import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { FieldArray, useFormikContext, getIn } from "formik";
import { AppTextArea, FormDropdown, FormInput } from "../../shared/Form";
import { db } from "@/app/utils/firebase";
import Donut from "./Donut";
import Link from "next/link";
import { IoCall } from "react-icons/io5";
import { BiCopy } from "react-icons/bi";
import { notifications } from "@mantine/notifications";

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

const CURRENCY = [{ name: "BDT", id: "BDT" }];

const COURIER = [
  { name: "SteadFast", id: "SteadFast" },
  { name: "Pathao", id: "Pathao" },
];

const SOURCE = [
  { name: "Web", id: "Web" },
  { name: "Message", id: "Message" },
  { name: "Whatsapp", id: "Whatsapp" },
  { name: "Phone", id: "Phone" },
  { name: "Tele Sales", id: "Tele Sales" },
  { name: "Incomplete", id: "Incomplete" },
  { name: "Exchange", id: "Exchange" },
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
    const payment = toNumber(getIn(values, "totals.payment"), 0);

    const grand = +(itemsSum - discount + shipping).toFixed(2);
    const cod = +(grand - payment).toFixed(2);

    setFieldValue("totals.items", +itemsSum.toFixed(2), false);
    setFieldValue("totals.grand", grand, false);
    setFieldValue("totals.cod", cod, false);
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

function computeBadge({ success = 0, cancel = 0, total = 0 }) {
  const delivered = Number(success) || 0;
  const cancelled = Number(cancel) || 0;
  const t = Number(total) || 0;
  const cancelPct = t > 0 ? Math.round((cancelled / t) * 100) : 0;

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
      cls: "bg-green-100 text-blue-700",
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

const CANCEL_BLOCK_PCT = 60;
const CANCEL_WARN_PCT = 30;

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

/* ----------------------- Fraud Panel ------------------------ */
function FraudPanel({ data, loading, onOverallChange }) {
  const colorSuccess = "#22c55e";
  const colorCancel = "#ef4444";
  const colorOther = "#94a3b8";

  const overall = useMemo(() => {
    if (!data) return null;

    const entries = Object.values(data || {});

    if (!entries.length) {
      return {
        success: 0,
        cancel: 0,
        total: 0,
        rate: 0,
        cancelPct: 0,
      };
    }

    const agg = entries.reduce(
      (acc, c) => {
        acc.success += Number(c?.success || 0);
        acc.cancel += Number(c?.cancel || 0);
        acc.total += Number(c?.total || 0);
        return acc;
      },
      { success: 0, cancel: 0, total: 0 }
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
        <div className="text-sm text-gray-600">
          Checking customer history…
        </div>
      </div>
    );
  }

  if (!data) return null;

  const entries = Object.values(data || {});
  if (!entries.length) return null;

  return (
    <div className="p-3 border rounded bg-white space-y-3">
      <div className="mb-1 font-medium">Fraud / Delivery History</div>

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
                  overall.total - overall.success - overall.cancel
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map((c, i) => {
          const success = Number(c?.success || 0);
          const cancel = Number(c?.cancel || 0);
          const total = Number(c?.total || 0);
          const other = Math.max(0, total - success - cancel);
          const rate = total > 0 ? Math.round((success / total) * 100) : 0;

          const badge = computeBadge({ success, cancel, total });

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
  const [customerHistory, setCustomerHistory] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [fraudData, setFraudData] = useState(null);
  const [isCheckingFraud, setIsCheckingFraud] = useState(false);

  const phoneDigits = digitsOnly(getIn(values, "customer.phone"));

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

  useEffect(() => {
    if (phoneDigits.length !== 11 || !/^01/.test(phoneDigits)) {
      setCustomerHistory(null);
      setIsLoadingHistory(false);
      return;
    }

    if (lastFetchedRef.current === phoneDigits) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const requested = phoneDigits;

      setIsLoadingCustomer(true);
      setIsLoadingHistory(true);
      setCustomerHistory(null);

      try {
        const snap = await db.collection("customers").doc(requested).get();
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

          const orderIds = Array.isArray(d?.items) ? d.items : [];

          const orderResults = await Promise.all(
            orderIds.map(async (id) => {
              try {
                const orderSnap = await db
                  .collection("ordersGur")
                  .doc(String(id))
                  .get();

                if (!orderSnap.exists) {
                  return {
                    id: String(id),
                    created_at: null,
                    items: [],
                  };
                }

                const orderData = orderSnap.data() || {};

                return {
                  id: orderSnap.id,
                  created_at:
                    orderData.created_at || orderData.createdAt || null,
                  items: Array.isArray(orderData.items)
                    ? orderData.items
                    : [],
                };
              } catch (orderError) {
                console.error(
                  "Failed to load previous order:",
                  id,
                  orderError
                );

                return {
                  id: String(id),
                  created_at: null,
                  items: [],
                };
              }
            })
          );

          orderResults.sort((a, b) => {
            const dateA = a.created_at?.toDate
              ? a.created_at.toDate().getTime()
              : new Date(a.created_at || 0).getTime();

            const dateB = b.created_at?.toDate
              ? b.created_at.toDate().getTime()
              : new Date(b.created_at || 0).getTime();

            return dateB - dateA;
          });

          if (
            aliveRef.current &&
            currentPhoneRef.current === requested
          ) {
            setCustomerHistory({
              createdAt: d.created_at || null,
              updatedAt: d.updated_at || null,
              orderIds,
              orders: orderResults,
            });
          }
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

        if (
          !aliveRef.current ||
          currentPhoneRef.current !== requested
        ) {
          return;
        }

        if (!snap.exists) setCustomerHistory(null);

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
        if (aliveRef.current) {
          setIsLoadingCustomer(false);
          setIsLoadingHistory(false);
        }
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phoneDigits, setFieldValue, values]);

  return {
    isLoadingCustomer,
    fraudData,
    isCheckingFraud,
    customerHistory,
    isLoadingHistory,
  };
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
    </div>
  );
};



/* ---------------------------- Product Card for Items ---------------------------- */
const ItemCard = ({ index, onRemove }) => {
  useLineTotalsAutoCompute(index);

  return (
    <div className="p-4 rounded-2xl border shadow-sm grid gap-3 bg-white">
      <div className="flex items-start justify-between">
        <div className="w-full">
          <span className="block text-sm font-medium">Title</span>
          <FormInput name={`items[${index}].title`} placeholder="Basic Tee" />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="ml-3 text-sm text-red-500 hover:underline shrink-0"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <span className="block text-sm">Quantity</span>
          <FormInput name={`items[${index}].quantity`} type="number" placeholder="1" />
        </div>
        <div className="col-span-1">
          <span className="block text-sm">Unit</span>
          <FormInput name={`items[${index}]?.attributes?.Unit`} placeholder="pc" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <span className="block text-sm">Price</span>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <FormDropdown name={`items[${index}].currency`} items={CURRENCY} placeholder="BDT" />
            </div>
            <div className="col-span-2">
              <FormInput name={`items[${index}].price`} type="number" placeholder="0.00" />
            </div>
          </div>
        </div>
        <div>
          <span className="block text-sm">Total</span>
          <FormInput name={`items[${index}].line_total`} type="number" readOnly />
          <Subtle>auto price × qty</Subtle>
        </div>
      </div>

      <div className="hidden">
        <FormInput name={`items[${index}].product_id`} />
      </div>
    </div>
  );
};

/* ---------------------------- All products ---------------------------- */
const AllProductsGrid = () => {
  const { values, setFieldValue } = useFormikContext();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  const items = getIn(values, "items") || [];

  const idxByPid = useMemo(() => {
    const map = new Map();
    items.forEach((it, idx) => {
      if (it?.product_id) map.set(String(it.product_id), idx);
    });
    return map;
  }, [items]);

  useEffect(() => {
    let unsubscribe;

    const fallbackToClientFilter = () => {
      unsubscribe = db
        .collection("products")
        .orderBy("created_at", "desc")
        .onSnapshot(
          (snap) => {
            const rows = snap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter(
                (p) =>
                  p?.categories?.[0]?.id === "OrganicFood" &&
                  p?.isPublished === true
              );

            setProducts(rows);
            setLoading(false);
          },
          (err) => {
            console.error("Fallback snapshot error:", err);
            setError(err);
            setLoading(false);
          }
        );
    };

    const fetchProducts = async () => {
      try {
        unsubscribe = db
          .collection("products")
          .where("categories.0.id", "==", "OrganicFood")
          .orderBy("title")
          .onSnapshot(
            (snap) => {
              const rows = snap.docs.map((d) => ({
                id: d.id,
                ...d.data(),
              }));

              setProducts(rows);
              setLoading(false);
            },
            (err) => {
              console.error(
                "Server-side filter failed, switching to fallback:",
                err
              );
              fallbackToClientFilter();
            }
          );
      } catch (err) {
        console.error("Query failed, using fallback:", err);
        fallbackToClientFilter();
      }
    };

    fetchProducts();
    return () => unsubscribe && unsubscribe();
  }, []);

  const upsertItem = useCallback(
    (p, qty) => {
      const pid = String(p.id || p.sku || "");
      const price = Number(p?.variants?.[0]?.price || p.price || 0);
      const currency = p?.variants?.[0]?.currency || p.currency || "BDT";
      const unit = p?.attributes?.Unit || p.unit || "kg";
      const unitWgt = p?.attributes?.unitWgt || 1;

      const next = [...items];
      const existingIdx = idxByPid.get(pid);

      if (!qty || qty <= 0) {
        if (existingIdx !== undefined) {
          next.splice(existingIdx, 1);
          setFieldValue("items", next, false);
        }
        return;
      }

      const payload = {
        categories: p?.categories?.[0]?.id || null,
        store_id: p.store_id || null,
        product_id: pid,
        title: p.title || p.name || "",
        unit,
        unitWgt,
        currency,
        price,
        quantity: qty,
        line_total: +(price * qty).toFixed(2),
        options: [],
        inventory_allocation: [],
      };

      if (existingIdx !== undefined) {
        next[existingIdx] = payload;
      } else {
        next.push(payload);
      }

      setFieldValue("items", next, false);
    },
    [items, idxByPid, setFieldValue]
  );

  const handleQtyChange = useCallback(
    (p) => (e) => {
      const raw = e?.target?.value;

      if (raw === "" || raw === null || raw === undefined) {
        upsertItem(p, 0);
        return;
      }

      const qty = Number(raw);

      if (Number.isFinite(qty)) {
        upsertItem(p, qty);
      }
    },
    [upsertItem]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-4 border rounded-2xl animate-pulse space-y-3 bg-white"
          >
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center border rounded-2xl bg-red-50 text-red-600 text-sm">
        Failed to load products.
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="p-4 text-center border rounded-2xl bg-gray-50 text-gray-500 text-sm">
        No products found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {products.map((p) => {
        const pid = String(p.id || p.sku || "");
        const idx = idxByPid.get(pid);
        const currentQty = idx !== undefined ? items[idx]?.quantity ?? 0 : 0;
        const displayQty =
          Number.isFinite(currentQty) && currentQty > 0 ? currentQty : "";

        const unit = p?.attributes?.Unit || p.unit || "kg";
        const currency = p?.variants?.[0]?.currency || p.currency || "BDT";
        const price = Number(p?.variants?.[0]?.price || p.price || 0);

        const totalPreview =
          Number.isFinite(currentQty) && currentQty > 0
            ? +(price * currentQty).toFixed(2)
            : 0;

        return (
          <div
            key={pid}
            className="p-4 rounded-2xl shadow-sm space-y-2 border bg-blue-600 text-white"
          >
            <div className="text-xl font-semibold line-clamp-1">
              #{p.title || p.name || "Untitled"}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-0.5 bg-blue-500 rounded">{unit}</span>
              <span className="px-2 py-0.5 bg-blue-500 rounded">
                {currency}
              </span>
              <span className="font-medium">
                {price.toFixed(2)}/{unit}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1 items-center">
              <label className="text-sm">Qty</label>
              <input
                type="number"
                min="0"
                value={displayQty}
                onChange={handleQtyChange(p)}
                className="border rounded-lg px-3 col-span-3 py-2 text-sm text-black"
                placeholder="0"
              />
              <label className="text-sm">{unit}</label>
            </div>

            {totalPreview > 0 && (
              <div className="text-sm font-semibold">
                Total: {totalPreview.toFixed(2)} {currency}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ---------------------------- Items block ---------------------------- */
const ItemsBlock = () => {
  const { values } = useFormikContext();
  const items = getIn(values, "items") || [];

  return (
    <div className="space-y-4 p-3 border rounded">
      <div className="font-medium text-base">Items</div>
      <AllProductsGrid />

      {false && (
        <FieldArray
          name="items"
          render={({ remove }) => (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((_, idx) => (
                <ItemCard
                  key={idx}
                  index={idx}
                  onRemove={() => remove(idx)}
                />
              ))}
            </div>
          )}
        />
      )}
    </div>
  );
};

/* ---------------- Customer Order History ------------------- */
function formatOrderDate(value) {
  if (!value) return "Date unavailable";

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getOrderWeight(items = []) {
  return items.reduce((sum, item) => {
    const quantity = toNumber(item?.quantity, 0);
    const unitWeight = toNumber(item?.unitWgt, 0);

    const kg =
      unitWeight > 0
        ? quantity * unitWeight
        : String(item?.unit || item?.attributes?.Unit || "").toLowerCase() === "kg"
        ? quantity
        : 0;

    return sum + kg;
  }, 0);
}

function CustomerOrderHistoryCard({ history, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
          Loading customer order history...
        </div>

        <div className="mt-3 space-y-2">
          <Line h="h-4" w="w-1/2" />
          <Line h="h-3" w="w-3/4" />
        </div>
      </div>
    );
  }

  if (!history) return null;

  const orders = history.orders || [];
  const latestOrder = orders[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-indigo-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
              />
            </svg>
          </span>

          <div>
            <h3 className="font-semibold text-gray-800">
              Customer Order History
            </h3>
            <p className="text-xs text-gray-500">
              Previous purchase summary
            </p>
          </div>
        </div>

        <span className="rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
          {orders.length} {orders.length === 1 ? "Order" : "Orders"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white bg-white/90 p-3">
          <p className="text-xs text-gray-500">Customer Since</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {formatOrderDate(history.createdAt)}
          </p>
        </div>

        <div className="rounded-xl border border-white bg-white/90 p-3">
          <p className="text-xs text-gray-500">Last Order</p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {latestOrder
              ? formatOrderDate(latestOrder.created_at)
              : "No previous order found"}
          </p>
        </div>
      </div>

      <div className="px-3 pb-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Previous Orders
          </h4>

          {history.updatedAt && (
            <span className="text-[10px] text-gray-400">
              Customer updated: {formatOrderDate(history.updatedAt)}
            </span>
          )}
        </div>

        {orders.length > 0 ? (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {orders.map((order) => {
              const orderItems = Array.isArray(order.items) ? order.items : [];
              const weight = getOrderWeight(orderItems);

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-gray-100 bg-white p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      {order.id}
                    </span>

                    <span className="text-xs text-gray-500">
                      {formatOrderDate(order.created_at)}
                    </span>
                  </div>

                  {orderItems.length > 0 ? (
                    <div className="mt-2 space-y-1.5">
                      {orderItems.map((item, index) => (
                        <div
                          key={`${order.id}-${index}`}
                          className="flex items-start justify-between gap-3 text-xs"
                        >
                          <span className="min-w-0 flex-1 text-gray-600">
                            {item.title || item.name || "Product"}
                            <span className="ml-1 text-gray-400">
                              × {toNumber(item.quantity, 0)}
                            </span>
                          </span>

                          <span className="shrink-0 font-medium text-gray-700">
                            {toNumber(item.unitWgt, 0) > 0
                              ? `${(
                                  toNumber(item.unitWgt, 0) *
                                  toNumber(item.quantity, 0)
                                ).toFixed(2)} kg`
                              : item.unit || item?.attributes?.Unit || ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">
                      Item details unavailable for this order.
                    </p>
                  )}

                  {weight > 0 && (
                    <div className="mt-2 flex justify-end border-t border-gray-100 pt-2 text-xs font-semibold text-indigo-700">
                      Total weight: {weight.toFixed(2)} kg
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-indigo-200 bg-white/70 p-4 text-center">
            <p className="text-sm font-medium text-gray-600">
              No previous order details found
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Customer record exists, but saved order documents could not be loaded.
            </p>

            {history.orderIds?.length > 0 && (
              <p className="mt-2 break-words text-[11px] text-gray-500">
                Saved Order IDs: {history.orderIds.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



const OrderDetailsFormUp = () => {
  const { values, setFieldValue } = useFormikContext();

  useTotalsAutoCompute();

  const {
    isLoadingCustomer,
    fraudData,
    isCheckingFraud,
    customerHistory,
    isLoadingHistory,
  } = useCustomerAutofill();

  // Keep overall decision mirrored into form meta
  const handleOverallChange = useCallback(
    (overall) => {
      setFieldValue(
        "meta.ship_recommendation",
        overall?.decision || null,
        false
      );

      setFieldValue(
        "meta.cancel_ratio_overall",
        overall?.cancel_rate_pct ?? null,
        false
      );

      setFieldValue(
        "meta.success_ratio_overall",
        overall?.success_rate_pct ?? null,
        false
      );
    },
    [setFieldValue]
  );

  const shipRecommendation = getIn(values, "meta.ship_recommendation");
  const overallCancelPct = getIn(values, "meta.cancel_ratio_overall");
  const phoneDigits = digitsOnly(getIn(values, "customer.phone"));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phoneDigits);

      notifications.show({
        title: "Success",
        message: `Phone number: ${phoneDigits} copied.`,
        color: "green",
      });
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

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

      {/* CUSTOMER */}
      <div className="relative p-3 border rounded space-y-3">
        <SectionTitle>Customer</SectionTitle>

        {isLoadingCustomer && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="w-full px-2">
              <SectionSkeleton />
            </div>
          </div>
        )}

        {/* CUSTOMER ORDER HISTORY CARD */}
        {/* Card appears above the phone number field */}
        {phoneDigits.length === 11 && (
          <CustomerOrderHistoryCard
            history={customerHistory}
            loading={isLoadingHistory}
          />
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
              <FormInput
                name="customer.phone"
                placeholder="01XXXXXXXXX"
              />

              {phoneDigits.length === 11 ? (
                <Link
                  className="bg-blue-400 inline-block mb-4 items-center px-5 py-3 rounded-md cursor-pointer hover:bg-blue-500 text-sm text-white font-medium hover:shadow-lg transition-all duration-300"
                  href={`tel:${phoneDigits}`}
                >
                  <IoCall size={20} />
                </Link>
              ) : (
                <span className="bg-blue-300 inline-block mb-4 items-center px-5 py-3 rounded-md text-sm text-white font-medium">
                  <IoCall size={20} />
                </span>
              )}

              {phoneDigits.length === 11 ? (
                <button
                  type="button"
                  className="bg-green-400 inline-block mb-4 items-center px-5 py-3 rounded-md cursor-pointer hover:bg-green-500 text-sm text-white font-medium hover:shadow-lg transition-all duration-300"
                  onClick={handleCopy}
                >
                  <BiCopy size={20} />
                </button>
              ) : (
                <span className="bg-green-300 inline-block mb-4 items-center px-5 py-3 rounded-md text-sm text-white font-medium">
                  <BiCopy size={20} />
                </span>
              )}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span>Name</span>
            <FormInput
              name="customer.name"
              placeholder="Mr. Customer"
            />
          </div>
        </div>

        {/* Read-only Ship Recommendation */}
        {shipRecommendation && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
            <div className="col-span-1">
              <span>Ship Recommendation</span>

              <input
                value={shipRecommendation}
                readOnly
                className={`w-full px-3 py-2 rounded border ${
                  shipRecommendation.includes("NOT")
                    ? "bg-red-50 border-red-300 text-red-700"
                    : shipRecommendation.includes("caution")
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "bg-green-50 border-green-300 text-green-800"
                }`}
              />
            </div>

            <div className="col-span-1">
              <span>Overall Cancel Ratio (%)</span>

              <input
                value={overallCancelPct ?? ""}
                readOnly
                className="w-full px-3 py-2 rounded border bg-gray-50"
              />
            </div>
          </div>
        )}
      </div>

      {/* ADDRESS */}
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
      <ItemsBlock />

      {/* DISCOUNTS & TOTALS */}
      <div className="grid grid-cols-2 gap-3 p-3 border rounded">
        <div className="space-y-2">
          <SectionTitle>Discounts</SectionTitle>

          <FieldArray
            name="discounts"
            render={({ push, remove }) => (
              <div className="space-y-2">
                {(getIn(values, "discounts") || []).map((_, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-5 gap-2 items-end"
                  >
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

          <div>
            <span>Grand Total</span>
            <FormInput name="totals.grand" type="number" readOnly />
            <Subtle>items - discount + shipping</Subtle>
          </div>

          <div>
            <span>Payment</span>
            <FormInput
              name="totals.payment"
              type="number"
              placeholder="0.00"
            />
          </div>

          <div>
            <span>COD Total</span>
            <FormInput
              name="totals.cod"
              type="number"
              placeholder="0.00"
            />
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

          <div>
            <span>Courier</span>
            <FormDropdown
              name="fulfillment.courier"
              placeholder="Select"
              items={COURIER}
              defaultValue={"SteadFast"}
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
                    )
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
            <span>Source*</span>
            <FormDropdown
              name="meta.source"
              placeholder="Select"
              items={SOURCE}
              defaultValue={"Pathao"}
            />
          </div>

          <div>
            <span>Notes</span>
            <AppTextArea
              name="notes"
              placeholder="Internal notes"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsFormUp;