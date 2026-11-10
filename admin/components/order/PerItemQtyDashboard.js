// admin/components/orderGur/PerItemQtyDashboard.js
import React, { useMemo, useState, useRef } from "react";
import {
  computePerItemQtyDateAndSourceAndOverall,
  rowsDateAndSource,
  SOURCE_KEYS,
} from "../orderGur/seperator"; // <-- আপনার path অনুযায়ী ঠিক করুন
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
const normalizeStatus = (raw) => {
  const s = String(raw ?? "").trim();
  return s || "Unknown";
};

/* -----------------------
   Component
------------------------*/

export default function PerItemQtyDashboardJF({ orders = [] }) {
  // (1) Normalize created_at if your data uses createdAt
  const normalized = useMemo(
    () =>
      (Array.isArray(orders) ? orders : [orders]).map((o) => ({
        ...o,
        created_at: o?.created_at ?? o?.createdAt,
        created_user: o?.created_user ?? o?.createdUser,
      })),
    [orders]
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
  // 🔢 Overall: created_user → order count
  const statusCountsOverall = useMemo(() => {
    const m = {};
    for (const o of normalized) {
      const u = normalizeCreatedUser(o?.status);
      m[u] = (m[u] || 0) + 1;
    }
    return m;
  }, [normalized]);



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
  // date-wise created_user counts
  const countsByDateStatus = useMemo(() => {
    const m = {};
    for (const o of normalized) {
      const date = formatDateKey(o?.created_at);
      const user = normalizeCreatedUser(o?.status);
      m[date] ||= {};
      m[date][user] = (m[date][user] || 0) + 1;
    }
    return m; // { "2025-11-19": { "Mahim Ali": 19, "Mehedi Hasan": 11, ... }, ... }
  }, [normalized]);

  // প্রতিটি date ব্লকের DOM নোড রাখার জন্য map-ref
  const dateUserSectionRefs = useRef({});
  const setDateUserSectionRef = (date) => (el) => {
    if (el) dateUserSectionRefs.current[date] = el;
  };

  return (
    <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50 shadow-xs mb-5">
      <div className="p-4 space-y-4">
        {/* ✅ NEW: Overall Created User summary */}
        {/* ✅ Date-wise: Orders by Created User */}
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
                      a.created_user.localeCompare(b.created_user)
                  );

                const totalForDate = entries.reduce(
                  (acc, r) => acc + r.count,
                  0
                );

                const handleDownloadThisDate = async () => {
                  const node = dateUserSectionRefs.current[dateKey];
                  if (!node) return;
                  await downloadNodeAsPng(
                    node,
                    `JF_Order_Place_${dateKey}` // ফাইল নাম
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

      
      </div>
    </div>
  );
}
