import React from "react";
import { computePerItemQtyDateAndSourceAndOverall } from "./seperator";


export function DateSourcePerItemTable({ orders }) {
  const { sourceMap } = computePerItemQtyDateAndSourceAndOverall(orders, { itemKey: "product_id" });

  const dates = Object.keys(sourceMap).sort().reverse();

  return (
    <div className="space-y-6">
      {dates.map(date => (
        <div key={date}>
          <h3 className="font-semibold mb-3">{date}</h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SOURCE_KEYS.map(src => {
              const items = sourceMap[date][src]; // { itemKey: { qty, title, ... } }
              const rows = Object.entries(items).map(([itemKey, info]) => ({
                itemKey,
                title: info.title || itemKey,
                product_id: info.product_id || "",
                qty: info.qty || 0,
                unit: info.unit || "",
              }));

              return (
                <div key={src} className="border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 font-medium">{src}</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left">Item</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-left">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 ? (
                          <tr>
                            <td className="px-3 py-2 text-gray-400" colSpan={3}>No items</td>
                          </tr>
                        ) : (
                          rows.map(r => (
                            <tr key={r.itemKey} className="border-t">
                              <td className="px-3 py-2">{r.title}</td>
                              <td className="px-3 py-2 text-right">{r.qty}</td>
                              <td className="px-3 py-2">{r.unit}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
