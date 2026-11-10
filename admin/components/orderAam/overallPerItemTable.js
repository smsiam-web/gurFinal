import React from "react";
import { computePerItemQtyDateAndSourceAndOverall } from "./seperator";

export default function OverallPerItemTable({ orders }) {
  const { overallRows } = computePerItemQtyDateAndSourceAndOverall(orders, {
    itemKey: "product_id",
  });

  // group rows by date for a neat table
  const byDate = overallRows.reduce((acc, r) => {
    (acc[r.date] ||= []).push(r);
    return acc;
  }, /** @type{Record<string, typeof overallRows>} */ ({}));

  const dates = Object.keys(byDate).sort().reverse(); // latest first

  return (
    <div className="space-y-6">
      {dates.map((date) => (
        <div key={date}>
          <h3 className="font-semibold mb-2">{date}</h3>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full whitespace-nowrap table-auto">
              <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200  bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Item</th>
                  <th className="px-3 py-2 text-left">Product ID</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-left">Unit</th>
                </tr>
              </thead>
              <tbody>
                {byDate[date].map((row) => (
                  <tr key={row.item_key} className="border-t">
                    <td className="px-3 py-2">{row.title || row.item_key}</td>
                    <td className="px-3 py-2">{row.product_id}</td>
                    <td className="px-3 py-2 text-right">{row.qty}</td>
                    <td className="px-3 py-2">{row.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
