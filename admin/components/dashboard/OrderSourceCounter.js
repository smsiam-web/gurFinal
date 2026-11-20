import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/app/utils/firebase";
import { FiShoppingBag, FiTrendingUp, FiUsers } from "react-icons/fi";

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
        },
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
  const includedRows = rows.filter((row) => !EXCLUDED.includes(row.key));

  const totalOrders = includedRows.reduce((sum, row) => sum + row.orders, 0);

  const totalKg = includedRows.reduce((sum, row) => sum + row.kg, 0);

  // All-source denominator for individual channel bars
  const allTotalOrders = rows.reduce((sum, row) => sum + row.orders, 0);

  const allTotalKg = rows.reduce((sum, row) => sum + row.kg, 0);

  const averageKg = totalOrders ? totalKg / totalOrders : 0;
  const totalAverageKg = totalOrders ? allTotalKg / allTotalOrders : 0;

  // Staff-wise order summary
  const staffRows = useMemo(() => {
    const staff = summary?.staff || {};

    return Object.entries(staff)
      .map(([key, value]) => ({
        key,
        name: value.name || "Unknown Staff",
        orders: Number(value.orders || 0),
        kg: Number(value.kg || 0),
        amount: Number(value.amount || 0),
        sources: value.sources || {},
      }))
      .sort((a, b) => b.orders - a.orders);
  }, [summary]);
  const staffTotalOrders = staffRows.reduce(
    (sum, staff) => sum + staff.orders,
    0,
  );

  const staffTotalKg = staffRows.reduce((sum, staff) => sum + staff.kg, 0);

  const staffMaxOrders = Math.max(1, ...staffRows.map((staff) => staff.orders));

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

              <p className="mt-1 text-xs text-gray-400">Total Order Weight</p>
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

              <p className="mt-1 text-xs text-gray-400">Average Per Order</p>
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

              <p className="mt-1 text-xs text-gray-400">Total Order Weight</p>
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

              <p className="mt-1 text-xs text-gray-400">Average Per Order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading counter...</p>
      ) : error ? (
        <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>
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
                              <th className="px-3 py-3 font-bold">ITEM</th>

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
                      <span className="text-[10px] text-gray-400">{date}</span>

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

      {/* STAFF WISE ORDER COUNTER */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3  px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2m16 0v-2a4 4 0 00-3-3.87M10 11a4 4 0 100-8 4 4 0 000 8zm10-4a4 4 0 01-3 3.87"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-gray-800">
                Staff Order Counter
              </h3>

              <p className="text-xs text-gray-500">
                Staff-wise order creation performance
              </p>
            </div>

            <span className="rounded-full bg-green-100 px-2 py-1 text-[10px] font-bold text-green-700">
              LIVE
            </span>
          </div>

          <span className="rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-indigo-700">
            {viewMode === "overall" ? "ALL TIME" : date}
          </span>
        </div>

        {/* SUMMARY */}

        <div className="mb-5 mx-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">
                Total Staff Orders
              </p>
              <FiShoppingBag className="text-purple-600" size={19} />
            </div>

            <h3 className="mt-2 text-3xl font-bold text-purple-700">
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

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500">Active Staff</p>
              <FiUsers className="text-blue-600" size={19} />
            </div>

            <h3 className="mt-2 text-3xl font-bold text-blue-700">
              {formatNumber(staffRows.length, 0)}
            </h3>
          </div>
        </div>

        {/* Staff List */}
        <div className="px-4 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-700">
              Individual Staff Performance
            </h4>

            <span className="text-xs text-gray-400">
              {staffRows.length} Staff
            </span>
          </div>

          {staffRows.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 overflow-visible md:grid-cols-2">
              {staffRows.map((staff, index) => {
                const percentage = staffTotalOrders
                  ? (staff.orders / staffTotalOrders) * 100
                  : 0;

                const colors = [
                  "#2563eb",
                  "#16a34a",
                  "#7c3aed",
                  "#d97706",
                  "#0d9488",
                  "#ea580c",
                ];

                const color = colors[index % colors.length];

                return (
                  <div
                    key={staff.key}
                    className="group/staff relative min-w-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:z-50 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* ORIGINAL STAFF CARD DESIGN */}

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {staff.name.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <h5 className="truncate text-sm font-bold text-gray-800">
                            {staff.name}
                          </h5>

                          <p className="mt-0.5 text-xs text-gray-400">
                            Staff #{index + 1}
                          </p>
                        </div>
                      </div>

                      {/* HOVER TARGET */}

                      <div className="relative shrink-0">
                        <div className="cursor-pointer text-right">
                          <h4 className="text-xl font-extrabold text-gray-800">
                            {formatNumber(staff.orders, 0)}
                          </h4>

                          <p className="text-[10px] text-gray-400">Orders</p>
                        </div>
                      </div>
                    </div>

                    {/* PROGRESS */}

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, percentage)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">
                        {formatNumber(percentage)}%
                      </span>

                      <span className="text-xs font-bold text-gray-700">
                        {formatNumber(staff.kg)} KG
                      </span>
                    </div>

                    {/* SOURCE-WISE TOOLTIP */}

                    <div className="pointer-events-none invisible absolute right-0 bottom-full mb-2 z-[9999] w-[310px] max-w-[90vw] rounded-xl border border-indigo-100 bg-white p-3 opacity-0 shadow-2xl transition-all duration-200 group-hover/staff:visible group-hover/staff:opacity-100">
                      {/* TOOLTIP HEADER */}

                      <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">
                            {staff.name}
                          </h4>

                          <p className="mt-0.5 text-[10px] text-gray-400">
                            Source-wise Order Details
                          </p>
                        </div>

                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-600">
                          {formatNumber(staff.orders, 0)} Orders
                        </span>
                      </div>

                      {/* SOURCE DETAILS */}

                      <div className="space-y-2">
                        {SOURCES.map((source) => {
                          const data = staff.sources?.[source.key] || {};

                          const orders = Number(data.orders || 0);
                          const kg = Number(data.kg || 0);
                          const amount = Number(data.amount || 0);

                          if (!orders && !kg && !amount) return null;

                          return (
                            <div
                              key={source.key}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 transition hover:bg-indigo-50/50"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: source.color,
                                  }}
                                />

                                <span className="truncate text-xs font-semibold text-gray-700">
                                  {source.label}
                                </span>
                              </div>

                              <div className="shrink-0 text-right">
                                <p className="text-xs font-bold text-gray-800">
                                  {formatNumber(orders, 0)} Orders
                                </p>

                                <p className="text-[10px] text-gray-500">
                                  {formatNumber(kg)} KG
                                </p>

                                <p className="text-[10px] text-gray-400">
                                  ৳ {formatNumber(amount)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* TOOLTIP FOOTER */}

                      <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-gray-500">
                            Total Orders
                          </span>

                          <span className="font-bold text-gray-800">
                            {formatNumber(staff.orders, 0)}
                          </span>
                        </div>

                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-gray-500">
                            Total Weight
                          </span>

                          <span className="font-bold text-emerald-600">
                            {formatNumber(staff.kg)} KG
                          </span>
                        </div>

                        <div className="flex justify-between rounded-lg bg-indigo-50 px-3 py-2 text-xs">
                          <span className="font-semibold text-indigo-700">
                            Total Sales
                          </span>

                          <span className="font-bold text-indigo-700">
                            ৳ {formatNumber(staff.amount)}
                          </span>
                        </div>
                      </div>

                      <p className="mt-2 text-center text-[10px] text-gray-400">
                        Live Staff Source Performance
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-indigo-200 bg-white/70 p-8 text-center">
              <p className="text-sm font-semibold text-gray-600">
                No staff order data available
              </p>

              <p className="mt-1 text-xs text-gray-400">
                New orders will automatically update staff performance.
              </p>
            </div>
          )}
        </div>
      </div>

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
