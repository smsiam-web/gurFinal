
import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/app/utils/firebase";
import {
  FiUsers,
  FiShoppingBag,
  FiTrendingUp,
  FiCalendar,
} from "react-icons/fi";

const SOURCES = [
  { key: "web", label: "Web", color: "#2563eb" },
  { key: "message", label: "Message", color: "#16a34a" },
  { key: "whatsapp", label: "WhatsApp", color: "#0d9488" },
  { key: "phone", label: "Phone", color: "#d97706" },
  { key: "telesales", label: "Tele Sales", color: "#7c3aed" },
  { key: "incomplete", label: "Incomplete", color: "#ea580c" },
  { key: "exchange", label: "Exchange", color: "#64748b" },
  { key: "other", label: "Other", color: "#94a3b8" },
];

const getToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const formatNumber = (value, digits = 1) =>
  Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: digits,
  });

export default function StaffOrderCounter() {
  const [date, setDate] = useState(getToday);
  const [mode, setMode] = useState("daily");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    const docId = mode === "overall" ? "overall" : date;

    const unsubscribe = db
      .collection("orderSummary")
      .doc(docId)
      .onSnapshot(
        (snapshot) => {
          setSummary(snapshot.exists ? snapshot.data() : null);
          setLoading(false);
        },
        (err) => {
          console.error(err);
          setError(err.message || "Data loading failed");
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [date, mode]);

  const staffRows = useMemo(() => {
    const staff = summary?.staff || {};

    return Object.entries(staff)
      .map(([key, value]) => ({
        key,
        name: value.name || "Unknown Staff",
        orders: Number(value.orders || 0),
        kg: Number(value.kg || 0),
        sources: value.sources || {},
      }))
      .sort((a, b) => b.orders - a.orders);
  }, [summary]);

  const totalOrders = staffRows.reduce(
    (sum, staff) => sum + staff.orders,
    0
  );

  const totalKg = staffRows.reduce(
    (sum, staff) => sum + staff.kg,
    0
  );

  return (
    <section className="w-full min-w-0 max-w-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">

      {/* HEADER */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md">
            <FiUsers size={21} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">
                Staff Order Counter
              </h2>

              <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
                LIVE
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Staff-wise source performance
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <button
            onClick={() => setMode("daily")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              mode === "daily"
                ? "bg-indigo-600 text-white"
                : "border bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Daily
          </button>

          <button
            onClick={() => setMode("overall")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
              mode === "overall"
                ? "bg-indigo-600 text-white"
                : "border bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Overall
          </button>

          {mode === "daily" && (
            <input
              type="date"
              value={date}
              max={getToday()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-indigo-400"
            />
          )}

        </div>
      </div>

      {/* SUMMARY */}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">
              Total Staff Orders
            </p>
            <FiShoppingBag className="text-blue-600" size={19} />
          </div>

          <h3 className="mt-2 text-3xl font-bold text-blue-700">
            {formatNumber(totalOrders, 0)}
          </h3>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">
              Total Staff Weight
            </p>
            <FiTrendingUp className="text-green-600" size={19} />
          </div>

          <h3 className="mt-2 text-3xl font-bold text-green-700">
            {formatNumber(totalKg)} KG
          </h3>
        </div>

        <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-gray-500">
              Active Staff
            </p>
            <FiUsers className="text-purple-600" size={19} />
          </div>

          <h3 className="mt-2 text-3xl font-bold text-purple-700">
            {formatNumber(staffRows.length, 0)}
          </h3>
        </div>

      </div>

      {/* CONTENT */}

      {loading ? (
        <div className="py-10 text-center text-sm text-gray-500">
          Loading staff performance...
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      ) : staffRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <FiUsers className="mx-auto text-3xl text-gray-300" />

          <p className="mt-3 text-sm font-semibold text-gray-600">
            No staff order data found
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Staff performance will appear when orders are recorded.
          </p>
        </div>
      ) : (

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {staffRows.map((staff, index) => {

            const percentage = totalOrders
              ? (staff.orders / totalOrders) * 100
              : 0;

            const avgKg = staff.orders
              ? staff.kg / staff.orders
              : 0;

            const sourceRows = SOURCES.map((source) => ({
              ...source,
              orders: Number(
                staff.sources?.[source.key]?.orders || 0
              ),
              kg: Number(
                staff.sources?.[source.key]?.kg || 0
              ),
            })).filter((source) => source.orders > 0 || source.kg > 0);

            return (

              <div
                key={staff.key}
                className="group relative min-w-0 rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >

                {/* STAFF HEADER */}

                <div className="flex items-center justify-between gap-2">

                  <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 font-bold text-indigo-700">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-gray-800">
                        {staff.name}
                      </h3>

                      <p className="text-[11px] text-gray-400">
                        Staff #{index + 1}
                      </p>
                    </div>

                  </div>

                  <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                    {formatNumber(staff.orders, 0)} Orders
                  </span>

                </div>

                {/* STAFF STATS */}

                <div className="mt-4 grid grid-cols-2 gap-2">

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-500">
                      Total Weight
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-800">
                      {formatNumber(staff.kg)} KG
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[11px] text-gray-500">
                      Average / Order
                    </p>

                    <p className="mt-1 text-xl font-bold text-gray-800">
                      {formatNumber(avgKg)} KG
                    </p>
                  </div>

                </div>

                {/* PERFORMANCE BAR */}

                <div className="mt-4">

                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-gray-500">
                      Order Contribution
                    </span>

                    <span className="text-xs font-bold text-indigo-600">
                      {formatNumber(percentage)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                </div>

                {/* HOVER INDICATOR */}

                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                  <span>Source-wise details</span>
                  <span className="font-semibold text-indigo-600">
                    Hover to view ↓
                  </span>
                </div>

                {/* HOVER TOOLTIP */}

                <div
  className="
    pointer-events-none
    absolute
    left-0
    bottom-full
    z-[999]
    mb-2
    w-full
    min-w-[280px]
    rounded-xl
    border border-indigo-100
    bg-white
    p-4
    opacity-0
    shadow-2xl
    transition-all duration-200
    group-hover:pointer-events-auto
    group-hover:opacity-100
  "
>

                  <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">

                    <div>
                      <h4 className="text-sm font-bold text-gray-800">
                        {staff.name}
                      </h4>

                      <p className="mt-1 text-[11px] text-gray-400">
                        Source-wise Order Breakdown
                      </p>
                    </div>

                    <span className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">
                      {staff.orders} Orders
                    </span>

                  </div>

                  <div className="space-y-3">

                    {sourceRows.map((source) => {

                      const sourcePercentage = staff.orders
                        ? (source.orders / staff.orders) * 100
                        : 0;

                      return (

                        <div key={source.key}>

                          <div className="mb-1 flex items-center justify-between gap-2">

                            <span className="text-xs font-semibold text-gray-700">
                              {source.label}
                            </span>

                            <span className="text-[11px] font-medium text-gray-600">
                              {formatNumber(source.orders, 0)} Orders
                              {" · "}
                              {formatNumber(source.kg)} KG
                            </span>

                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">

                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${sourcePercentage}%`,
                                backgroundColor: source.color,
                              }}
                            />

                          </div>

                        </div>

                      );
                    })}

                    {sourceRows.length === 0 && (
                      <p className="py-3 text-center text-xs text-gray-400">
                        No source details available
                      </p>
                    )}

                  </div>

                  <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-xs font-bold text-gray-700">
                    <span>Total</span>
                    <span>
                      {staff.orders} Orders · {formatNumber(staff.kg)} KG
                    </span>
                  </div>

                </div>

              </div>

            );
          })}

        </div>
      )}

      {/* FOOTER */}

      <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-3 text-[11px] text-gray-400">
        <FiCalendar size={13} />
        Firestore: orderSummary / {mode === "overall" ? "overall" : date}
      </div>

    </section>
  );
}
