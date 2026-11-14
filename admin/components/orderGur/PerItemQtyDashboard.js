// admin/components/orderGur/PerItemQtyDashboard.js
import React, { useMemo, useState, useRef } from "react";
import {
  computePerItemQtyDateAndSourceAndOverall,
  rowsDateAndSource,
  SOURCE_KEYS,
} from "./seperator"; // <-- আপনার path অনুযায়ী ঠিক করুন
import Button from "../shared/Button";
import { IoPrintOutline } from "react-icons/io5";
import { downloadSummaryExcel } from "@/admin/utils/downloadExcel";
import {
  downloadNodeAsPng,
  downloadChildrenAsPngs,
} from "@/admin/utils/download-png";
import { IoIosCloudDownload } from "react-icons/io";

/* -----------------------
   Helpers (pure JS)
------------------------*/

// YYYY-MM-DD (Asia/Dhaka)
const formatDateKey = (isoLike, tz = "Asia/Dhaka") => {
  if (!isoLike) return "InvalidDate";
  const d = new Date(isoLike);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(d)
    .reduce((a, p) => ((a[p.type] = p.value), a), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
};

// created_user normalize
const normalizeCreatedUser = (raw) => {
  const s = String(raw ?? "").trim();
  return s || "Unknown";
};

// sum of qty for a set of rows (supports unitWgt)
const totalQty = (rows = []) =>
  rows.reduce(
    (acc, r) => acc + Number((r.unitWgt ? r?.unitWgt * r?.qty : r?.qty) || 0),
    0,
  );

// average kg per order
const kgPerOrder = (totalKg, n) => (n ? totalKg / n : 0);

// number to 1 decimal
const fmt1 = (n) => Number(n || 0).toFixed(1);

// if all units same, show that; else blank
const commonUnit = (rows = []) => {
  const s = new Set(rows.map((r) => r.unit).filter(Boolean));
  return s.size === 1 ? Array.from(s)[0] : "";
};

/* -----------------------
   Component
------------------------*/

export default function PerItemQtyDashboard({ orders = [] }) {
  const [view, setView] = useState("overall"); // "overall" | "dateSource"

  // (1) Normalize created_at if your data uses createdAt
  const normalized = useMemo(
    () =>
      (Array.isArray(orders) ? orders : [orders]).map((o) => ({
        ...o,
        created_at: o?.created_at ?? o?.createdAt,
        created_user: o?.created_user ?? o?.createdUser,
      })),
    [orders],
  );

  // 🔢 Overall: created_user → order count
  const userCountsOverall = useMemo(() => {
    const m = {};
    for (const o of normalized) {
      const u = normalizeCreatedUser(o?.created_user);
      m[u] = (m[u] || 0) + 1;
    }
    return m; // { "Raihan Robbani": 12, "Shila Akter": 7, ... }
  }, [normalized]);

  // Sorted list for UI
  const userCountList = useMemo(
    () =>
      Object.entries(userCountsOverall)
        .map(([created_user, count]) => ({ created_user, count }))
        .sort(
          (a, b) =>
            b.count - a.count || a.created_user.localeCompare(b.created_user),
        ),
    [userCountsOverall],
  );

  // (2) Compute item quantities (overall/date & date+source)
  // NOTE: itemKey: "product_id" | "title" (আপনার ডেটা অনুযায়ী বদলান)
  const ITEM_KEY = "product_id";
  const { overallRows, sourceMap } = useMemo(() => {
    return computePerItemQtyDateAndSourceAndOverall(normalized, {
      itemKey: ITEM_KEY,
    });
  }, [normalized]);

  // ✅ sourceRows তৈরি (যদি compute ইতিমধ্যে না দিয়ে থাকে)
  const sourceRows = useMemo(() => {
    if (Array.isArray(sourceMap)) return sourceMap; // in case your util already returns rows array
    // rowsDateAndSource(map) থাকলে ব্যবহার করুন; না থাকলে নিজেই বানাতে পারেন
    return rowsDateAndSource ? rowsDateAndSource(sourceMap) : [];
  }, [sourceMap]);

  const handleDownload = () => {
    downloadSummaryExcel({
      overallRows,
      sourceRows,
      fileName: `order-summary-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
  };

  // (3) Date-wise order count
  const ordersByDateCount = useMemo(() => {
    const m = {};
    for (const o of normalized) {
      const dKey = formatDateKey(o?.created_at);
      m[dKey] = (m[dKey] || 0) + 1;
    }
    return m; // { "2025-11-19": 7, ... }
  }, [normalized]);

  // (4) Date + Source wise order count
  const ordersByDateSourceCount = useMemo(() => {
    const m = {};
    for (const o of normalized) {
      const dKey = formatDateKey(o?.created_at);
      const raw = String(o?.meta?.source ?? "").toLowerCase();
      const fixed = SOURCE_KEYS.find((k) => k.toLowerCase() === raw) || null;
      if (!fixed) continue;
      m[dKey] ||= {};
      m[dKey][fixed] = (m[dKey][fixed] || 0) + 1;
    }
    return m; // { "2025-11-19": { Web: 3, Whatsapp: 2, ... } }
  }, [normalized]);

  // date-wise created_user counts
  const countsByDateUser = useMemo(() => {
    const m = {};
    for (const o of normalized) {
      const date = formatDateKey(o?.created_at);
      const user = normalizeCreatedUser(o?.created_user);
      m[date] ||= {};
      m[date][user] = (m[date][user] || 0) + 1;
    }
    return m; // { "2025-11-19": { "Mahim Ali": 19, "Mehedi Hasan": 11, ... }, ... }
  }, [normalized]);

  // (5) Group overall rows by date for the overall view
  const overallByDate = useMemo(() => {
    const map = {};
    for (const r of overallRows || []) {
      (map[r.date] ||= []).push(r);
    }
    return map;
  }, [overallRows]);

  // (6) All dates (union) sorted desc
  const dates = useMemo(() => {
    const set = new Set([
      ...Object.keys(overallByDate || {}),
      ...Object.keys(sourceMap || {}),
    ]);
    return Array.from(set).sort().reverse();
  }, [overallByDate, sourceMap]);

  // 🔗 refs for PNG capture
  const overallRef = useRef(null);
  const dateSourceRef = useRef(null);
  const dateSourceUserRef = useRef(null);

  // ✅ Download handlers (PNG)
  const handleDownloadOverallPNG = async () => {
    await downloadNodeAsPng(
      overallRef.current,
      `overall-${new Date().toISOString().slice(0, 10)}`,
    );
  };

  const handleDownloadOverallPerDatePNGs = async () => {
    await downloadChildrenAsPngs(overallRef.current, "overall-date");
  };

  const handleDownloadDateSourcePNG = async () => {
    await downloadNodeAsPng(
      dateSourceRef.current,
      `date-source-${new Date().toISOString().slice(0, 10)}`,
    );
  };
  // প্রতিটি date ব্লকের DOM নোড রাখার জন্য map-ref
  const dateUserSectionRefs = useRef({});
  const setDateUserSectionRef = (date) => (el) => {
    if (el) dateUserSectionRefs.current[date] = el;
  };

  const handleDownloadDateSourcePerDatePNGs = async () => {
    await downloadChildrenAsPngs(dateSourceRef.current, "date-source-date");
  };

  return (
    <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50 shadow-xs mb-5">
      <div className="p-4 space-y-4">
        {/* ✅ NEW: Overall Created User summary */}
        {/* ✅ Date-wise: Orders by Created User */}
        {/* ✅ Date-wise: Orders by Created User (with per-date PNG) */}
        <div className="border rounded-lg overflow-hidden bg-white">
          <div className="px-3 py-2 bg-gray-100 font-semibold">
            Orders by Created User (Date-wise)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Object.keys(countsByDateUser)
              .sort()
              .reverse()
              .map((dateKey) => {
                const entries = Object.entries(countsByDateUser[dateKey])
                  .map(([created_user, count]) => ({ created_user, count }))
                  .sort(
                    (a, b) =>
                      b.count - a.count ||
                      a.created_user.localeCompare(b.created_user),
                  );

                const totalForDate = entries.reduce(
                  (acc, r) => acc + r.count,
                  0,
                );

                const handleDownloadThisDate = async () => {
                  const node = dateUserSectionRefs.current[dateKey];
                  if (!node) return;
                  await downloadNodeAsPng(
                    node,
                    `AamWala_Order_Place_${dateKey}`, // ফাইল নাম
                  );
                };

                return (
                  // ⬇️ এই wrapper-এ ref সেট করুন (এই অংশটাই PNG হবে)
                  <div
                    key={`byuser-${dateKey}`}
                    ref={setDateUserSectionRef(dateKey)}
                    className="p-3 border-t first:border-t-0 rounded col-span-1"
                    style={{ background: "#ffffff" }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h4 className="font-semibold">
                        {dateKey}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          (Total Orders: {totalForDate})
                        </span>
                      </h4>

                      {/* 👉 আলাদা আলাদা PNG ডাউনলোড */}
                      <button
                        onClick={handleDownloadThisDate}
                        className="px-3 py-2 rounded bg-emerald-600 text-white flex gap-2  hover:bg-emerald-700"
                      >
                        {" "}
                        <IoIosCloudDownload />
                        <span>PNG</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full whitespace-nowrap table-auto">
                        <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200 bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">User</th>
                            <th className="px-3 py-2 text-right">Orders</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.length === 0 ? (
                            <tr>
                              <td
                                className="px-3 py-2 text-gray-400"
                                colSpan={2}
                              >
                                No data
                              </td>
                            </tr>
                          ) : (
                            entries.map(({ created_user, count }) => (
                              <tr
                                key={`${dateKey}-${created_user}`}
                                className="border-t"
                              >
                                <td className="px-3 py-2">{created_user}</td>
                                <td className="px-3 py-2 text-right">
                                  {count}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>

                        {/* ⬇️ Footer total */}
                        <tfoot className="bg-gray-100 font-semibold">
                          <tr>
                            <td className="px-3 py-2 text-right">Total</td>
                            <td className="px-3 py-2 text-right">
                              {totalForDate}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-2">
          <div className="md:col-span-1 col-span-2">
            <Button
              onClick={() => setView("overall")}
              title="Date (Overall)"
              className={`${
                view === "overall" ? "bg-green-500" : "bg-gray-400"
              } hover:bg-green-600 hover:shadow-lg transition-all duration-300 text-white w-full h-14`}
            />
          </div>
          <div className="md:col-span-1 col-span-2">
            <Button
              onClick={() => setView("dateSource")}
              title="Date + Source"
              className={`${
                view === "dateSource" ? "bg-green-500" : "bg-gray-400"
              } hover:bg-green-600 hover:shadow-lg transition-all duration-300 text-white w-full h-14`}
            />
          </div>

          {view === "overall" ? (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadOverallPNG}
                className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                PNG (All)
              </button>
              <button
                onClick={handleDownloadOverallPerDatePNGs}
                className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              >
                PNG (Per Date)
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleDownloadDateSourcePNG}
                className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700"
              >
                PNG (All)
              </button>
              <button
                onClick={handleDownloadDateSourcePerDatePNGs}
                className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700"
              >
                PNG (Per Date)
              </button>
            </div>
          )}
        </div>

        {/* ===================== Overall View ===================== */}
        {view === "overall" && (
          <div ref={overallRef} className="space-y-6">
            {dates.map((date) => {
              const rows = overallByDate[date] || [];
              if (!rows.length) return null;

              const totalKg = totalQty(rows);
              const orderCount = ordersByDateCount[date] || 0;
              const avgKg = kgPerOrder(totalKg, orderCount);

              return (
                <div key={`overall-${date}`} className="p-4">
                  <h3 className="font-semibold mb-2">
                    {date}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Orders: {orderCount} • {fmt1(totalKg)} kg • {fmt1(avgKg)}{" "}
                      kg/order)
                    </span>
                  </h3>

                  <div className="overflow-x-auto border rounded-lg bg-white">
                    <table className="w-full whitespace-nowrap table-auto">
                      <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200 bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left">Item</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-left">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr
                            key={`${date}-${row.item_key}-${i}`}
                            className="border-t"
                          >
                            <td className="px-3 py-2">
                              {row.title || row.item_key}
                              <span className="font-bold">
                                {(row.item_key === "1107" ||
                                  row.item_key === "1108" ||
                                  row.item_key === "1109" ||
                                  row.item_key === "1110" ||
                                  row.item_key === "1111" ||
                                  row.item_key === "1113" ||
                                  row.item_key === "50004") &&
                                  ` (${row.qty}p)`}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              {row.unitWgt ? row.unitWgt * row.qty : row.qty}
                            </td>
                            <td className="px-3 py-2">kg</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-200 font-semibold">
                        <tr>
                          <td className="px-3 py-2 text-right">Total</td>
                          <td className="px-3 py-2 text-right">
                            {fmt1(totalKg)}
                          </td>
                          <td className="px-3 py-2">kg</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 text-right">Per Order</td>
                          <td className="px-3 py-2 text-right">
                            {fmt1(avgKg)}
                          </td>
                          <td className="px-3 py-2">kg/order</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===================== Date + Source View ===================== */}
        {view === "dateSource" && (
          <div ref={dateSourceRef} className="space-y-6">
            {dates.map((date) => {
              // sourceMap[date] না থাকলে ফাঁকা স্ট্রাকচার দিন
              const day = sourceMap?.[date] || {
                Web: {},
                Message: {},
                Whatsapp: {},
                Phone: {},
              };

              return (
                <div key={`src-${date}`} className="p-4">
                  <h3 className="font-semibold mb-3">
                    {date}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      (Orders: {ordersByDateCount[date] || 0})
                    </span>
                  </h3>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {SOURCE_KEYS.map((src) => {
                      const items = day[src] || {};
                      const rows = Object.entries(items).map(
                        ([itemKey, info]) => ({
                          itemKey,
                          title: info.title || itemKey,
                          qty: Number(info.qty || 0),
                          unit: info.unit || "",
                          unitWgt:
                            info.unitWgt ||
                            (itemKey === "1107" && 2.5) ||
                            (itemKey === "1108" && 3.5) ||
                            (itemKey === "1109" && 2) ||
                            (itemKey === "1110" && 2) ||
                            1,
                        }),
                      );
                      const totalKg = totalQty(rows);
                      const orderCount =
                        ordersByDateSourceCount?.[date]?.[src] || 0;
                      const avgKg = kgPerOrder(totalKg, orderCount);

                      return (
                        <div
                          key={`${date}-${src}`}
                          className="border rounded-lg overflow-hidden bg-white"
                        >
                          <div className="px-3 py-2 bg-gray-50 font-medium">
                            {src}
                            <span className="ml-2 text-xs text-gray-500">
                              ({orderCount} orders • {fmt1(totalKg)} kg •{" "}
                              {fmt1(avgKg)} kg/order)
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full whitespace-nowrap table-auto">
                              <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200 bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left">Item</th>
                                  <th className="px-3 py-2 text-right">Qty</th>
                                  <th className="px-3 py-2 text-left">Unit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rows.length === 0 ? (
                                  <tr>
                                    <td
                                      className="px-3 py-2 text-gray-400"
                                      colSpan={3}
                                    >
                                      No items
                                    </td>
                                  </tr>
                                ) : (
                                  rows.map((r, i) => (
                                    <tr
                                      key={`${date}-${src}-${r.itemKey}-${i}`}
                                      className="border-t"
                                    >
                                      <td className="px-3 py-2">
                                        {r.title}
                                        <span className="font-bold">
                                          {(r.itemKey === "1107" ||
                                            r.itemKey === "1108" ||
                                            r.itemKey === "1109" ||
                                            r.itemKey === "1110" ||
                                            r.itemKey === "1111" ||
                                            r.itemKey === "1113" ||
                                            r.itemKey === "50004") &&
                                            ` (${r.qty}p)`}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {r.unitWgt ? r.unitWgt * r.qty : r.qty}
                                      </td>
                                      <td className="px-3 py-2">kg</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>

                              {rows.length > 0 && (
                                <tfoot className="bg-gray-200 font-semibold">
                                  <tr>
                                    <td className="px-3 py-2 text-right">
                                      Total
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {fmt1(totalKg)}
                                    </td>
                                    <td className="px-3 py-2">kg</td>
                                  </tr>
                                  <tr>
                                    <td className="px-3 py-2 text-right">
                                      Per Order
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {fmt1(avgKg)}
                                    </td>
                                    <td className="px-3 py-2">kg/order</td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
