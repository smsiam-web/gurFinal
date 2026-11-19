
import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/app/utils/firebase";

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

const EXCLUDED = ["telesales", "exchange"];

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

export default function OrderSourceCounter() {
  const [date, setDate] = useState(getToday);
  const [viewMode, setViewMode] = useState("daily");
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    const documentId = viewMode === "overall" ? "overall" : date;

    const unsubscribe = db
      .collection("orderSummary")
      .doc(documentId)
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
  }, [date, viewMode]);

  const rows = useMemo(() => {
    const sources = summary?.sources || {};

    return SOURCES.map((source) => ({
      ...source,
      orders: Number(sources[source.key]?.orders || 0),
      kg: Number(sources[source.key]?.kg || 0),
      items: sources[source.key]?.items || [],
    }));
  }, [summary]);

  // Exclude Tele Sales and Exchange from main totals
  const includedRows = rows.filter(
    (row) => !EXCLUDED.includes(row.key)
  );

  const totalOrders = includedRows.reduce(
    (sum, row) => sum + row.orders,
    0
  );

  const totalKg = includedRows.reduce(
    (sum, row) => sum + row.kg,
    0
  );

  // All-source denominator for individual channel bars
  const allTotalOrders = rows.reduce(
    (sum, row) => sum + row.orders,
    0
  );

  const allTotalKg = rows.reduce(
    (sum, row) => sum + row.kg,
    0
  );

  const averageKg = totalOrders ? totalKg / totalOrders : 0;
  const totalAverageKg = totalOrders
    ? allTotalKg / allTotalOrders
    : 0;

  return (
    <section className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-wide text-black">
              {viewMode === "overall"
                ? "All-time order performance"
                : "Daily order performance"}
            </h1>

            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
              ● LIVE
            </span>
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Real-time source-wise order report
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {viewMode === "daily" && (
            <input
              type="date"
              value={date}
              max={getToday()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          )}

          <button
            onClick={() => setViewMode("daily")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              viewMode === "daily"
                ? "bg-blue-600 text-white shadow"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            DAILY
          </button>

          <button
            onClick={() => setViewMode("overall")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              viewMode === "overall"
                ? "bg-purple-600 text-white shadow"
                : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            All-Time
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">

        {/* TOTAL SUMMARY CARD */}
        <div className="mt-5 relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5 shadow-sm">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-extrabold tracking-wide text-blue-800">
                TOTAL
              </h3>

              <p className="mt-1 text-xs text-blue-500">
                Order Performance Summary
              </p>
            </div>

            <div className="rounded-xl bg-blue-100 p-4">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l2.5 12h11L21 7H6M10 20h.01M18 20h.01"
                />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            {/* ORDERS */}
            <div className="rounded-xl border border-purple-100 bg-white p-4">
              <p className="text-xs font-semibold tracking-wide text-blue-600">
                TOTAL ORDERS
              </p>

              <h4 className="mt-2 text-3xl font-extrabold text-blue-800">
                {formatNumber(allTotalOrders, 0)}
              </h4>

              <p className="mt-1 text-xs text-gray-400">Orders</p>
            </div>

            {/* TOTAL KG */}
            <div className="rounded-xl border border-green-100 bg-white p-4">
              <p className="text-xs font-semibold tracking-wide text-green-600">
                TOTAL WEIGHT
              </p>

              <h4 className="mt-2 text-3xl font-extrabold text-green-700">
                {formatNumber(allTotalKg)}
                <span className="ml-1 text-base">KG</span>
              </h4>

              <p className="mt-1 text-xs text-gray-400">
                Total Order Weight
              </p>
            </div>

            {/* AVERAGE */}
            <div className="rounded-xl border border-purple-100 bg-white p-4">
              <p className="text-xs font-semibold tracking-wide text-purple-600">
                AVERAGE WEIGHT
              </p>

              <h4 className="mt-2 text-3xl font-extrabold text-purple-700">
                {formatNumber(totalAverageKg)}
                <span className="ml-1 text-base">KG</span>
              </h4>

              <p className="mt-1 text-xs text-gray-400">
                Average Per Order
              </p>
            </div>
          </div>
        </div>

        {/* AD SUMMARY CARD */}
        <div className="mt-5 relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-5 shadow-sm">

          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xl font-extrabold tracking-wide text-purple-800">
                AD
              </h3>

              <p className="mt-1 text-xs text-purple-500">
                Order Performance Summary
              </p>
            </div>

            <div className="rounded-xl bg-purple-100 p-3">
              <svg
                className="h-7 w-7 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3v18h18M7 14l4-4 4 3 6-7"
                />
                <path
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 6h4v4"
                />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            {/* ORDERS */}
            <div className="rounded-xl border border-purple-100 bg-white p-4">
              <p className="text-xs font-semibold tracking-wide text-purple-600">
                TOTAL ORDERS
              </p>

              <h4 className="mt-2 text-3xl font-extrabold text-purple-800">
                {formatNumber(totalOrders, 0)}
              </h4>

              <p className="mt-1 text-xs text-gray-400">Orders</p>
            </div>

            {/* TOTAL KG */}
            <div className="rounded-xl border border-green-100 bg-white p-4">
              <p className="text-xs font-semibold tracking-wide text-green-600">
                TOTAL WEIGHT
              </p>

              <h4 className="mt-2 text-3xl font-extrabold text-green-700">
                {formatNumber(totalKg)}
                <span className="ml-1 text-base">KG</span>
              </h4>

              <p className="mt-1 text-xs text-gray-400">
                Total Order Weight
              </p>
            </div>

            {/* AVERAGE */}
            <div className="rounded-xl border border-blue-100 bg-white p-4">
              <p className="text-xs font-semibold tracking-wide text-blue-600">
                AVERAGE WEIGHT
              </p>

              <h4 className="mt-2 text-3xl font-extrabold text-blue-700">
                {formatNumber(averageKg)}
                <span className="ml-1 text-base">KG</span>
              </h4>

              <p className="mt-1 text-xs text-gray-400">
                Average Per Order
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <p className="py-10 text-center text-gray-500">
          Loading counter...
        </p>
      ) : error ? (
        <p className="rounded-lg bg-red-50 p-4 text-red-600">
          {error}
        </p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Source-wise Performance
            </h3>

            <span className="text-xs text-gray-400">
              Hover to view item details
            </span>
          </div>

          {/* Source Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

            {rows.map((row) => {
              const percentage = allTotalOrders
                ? (row.orders / allTotalOrders) * 100
                : 0;

              const avg = row.orders ? row.kg / row.orders : 0;

              return (
                <div
                  key={row.key}
                  className="group relative rounded-xl border border-gray-200 bg-white p-4 transition hover:z-50 hover:border-gray-300 hover:shadow-lg"
                >

                  {/* Source Header */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />

                        <span className="font-semibold text-gray-800">
                          {row.label}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {formatNumber(row.orders, 0)} orders
                      </p>
                    </div>

                    <span className="text-xl font-bold text-gray-800">
                      {formatNumber(row.kg)} kg
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, percentage)}%`,
                        backgroundColor: row.color,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>{formatNumber(percentage)}%</span>

                    <span>{formatNumber(avg)} kg/order</span>
                  </div>

                  {/* MODERN HOVER ITEM DETAILS */}
                  <div
                    className="
                      invisible pointer-events-none
                      absolute left-0 top-full z-[100]
                      mt-3 w-[370px] max-w-[85vw]
                      overflow-hidden rounded-2xl
                      border border-gray-200 bg-white
                      opacity-0 translate-y-2
                      shadow-[0_18px_50px_rgba(15,23,42,0.20)]
                      transition-all duration-200 ease-out
                      group-hover:visible group-hover:pointer-events-auto
                      group-hover:opacity-100 group-hover:translate-y-0
                    "
                  >

                    {/* Source Color Accent */}
                    <div
                      className="h-1.5 w-full"
                      style={{ backgroundColor: row.color }}
                    />

                    {/* Tooltip Header */}
                    <div className="border-b border-gray-100 bg-gray-50/90 px-4 py-3">

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: row.color }}
                          />

                          <h4 className="truncate text-sm font-bold text-gray-800">
                            {row.label} - Item Details
                          </h4>
                        </div>

                        <span
                          className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
                          style={{
                            backgroundColor: `${row.color}15`,
                            color: row.color,
                          }}
                        >
                          {formatNumber(row.orders, 0)} Orders
                        </span>
                      </div>

                      <p className="mt-1 pl-5 text-[11px] text-gray-500">
                        Product-wise order breakdown
                      </p>

                      {/* Quick Stats */}
                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Total Products
                          </p>

                          <p className="mt-1 text-lg font-bold text-gray-800">
                            {row.items.length}
                          </p>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Total Weight
                          </p>

                          <p className="mt-1 text-lg font-bold text-gray-800">
                            {formatNumber(row.kg)}{" "}
                            <span className="text-xs">KG</span>
                          </p>
                        </div>

                      </div>
                    </div>

                    {/* Product Table */}
                    <div className="p-3">

                      <div className="mb-2 flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                          Product Breakdown
                        </span>

                        <span className="text-[10px] text-gray-400">
                          {row.items.length} items
                        </span>
                      </div>

                      <div className="max-h-60 overflow-auto rounded-xl border border-gray-100">

                        <table className="w-full border-collapse text-xs">

                          <thead className="sticky top-0 z-10 bg-gray-100">
                            <tr className="text-left text-gray-500">
                              <th className="px-3 py-3 font-bold">
                                ITEM
                              </th>

                              <th className="px-3 py-3 text-right font-bold">
                                QTY
                              </th>

                              <th className="px-3 py-3 text-center font-bold">
                                UNIT
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {row.items.map((item, index) => (
                              <tr
                                key={index}
                                className="border-t border-gray-100 transition-colors hover:bg-blue-50/60"
                              >
                                <td className="px-3 py-3 font-medium text-gray-700">
                                  {item.title}
                                </td>

                                <td className="px-3 py-3 text-right font-semibold text-gray-800">
                                  {formatNumber(item.kg)}
                                </td>

                                <td className="px-3 py-3 text-center text-gray-500">
                                  kg
                                </td>
                              </tr>
                            ))}

                            {row.items.length === 0 && (
                              <tr>
                                <td
                                  colSpan="3"
                                  className="px-3 py-8 text-center text-gray-400"
                                >
                                  No item details available
                                </td>
                              </tr>
                            )}
                          </tbody>

                        </table>
                      </div>

                      {/* Total and Average */}
                      <div className="mt-3 grid grid-cols-2 gap-2">

                        <div
                          className="rounded-xl p-3"
                          style={{
                            backgroundColor: `${row.color}12`,
                          }}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Total Weight
                          </p>

                          <p
                            className="mt-1 text-lg font-extrabold"
                            style={{ color: row.color }}
                          >
                            {formatNumber(row.kg)} KG
                          </p>
                        </div>

                        <div className="rounded-xl bg-gray-100 p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Average / Order
                          </p>

                          <p className="mt-1 text-lg font-extrabold text-gray-800">
                            {formatNumber(avg)} KG
                          </p>
                        </div>

                      </div>
                    </div>

                    {/* Tooltip Footer */}
                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">

                      <span className="text-[10px] text-gray-400">
                        {date}
                      </span>

                      <span className="text-[10px] font-semibold text-green-600">
                        ● LIVE DATA
                      </span>

                    </div>

                  </div>
                  {/* END MODERN TOOLTIP */}

                </div>
              );
            })}

          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-5 flex flex-wrap justify-between gap-2 border-t pt-3 text-xs text-gray-400">

        <span>Firestore: orderSummary</span>

        <span>
          {viewMode === "overall"
            ? "Overall Lifetime Summary"
            : `Daily Report: ${date}`}
        </span>

      </div>
    </section>
  );
}
