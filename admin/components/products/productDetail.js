"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { db } from "@/app/utils/firebase";
import { useRouter } from "next/router";

/* ---------- small helpers ---------- */
const toNum = (v, d = 0) => {
  if (v === "" || v === null || v === undefined) return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const fmtMoney = (amt, cur = "USD") =>
  typeof amt === "number"
    ? `${cur} ${amt.toFixed(2)}`
    : `${cur} ${toNum(amt, 0).toFixed(2)}`;
const cls = (...a) => a.filter(Boolean).join(" ");
const StatusBadge = ({ status }) => {
  const map = {
    active: "bg-emerald-100 text-emerald-700",
    draft: "bg-gray-100 text-gray-700",
    archived: "bg-amber-100 text-amber-700",
    inactive: "bg-gray-100 text-gray-700",
    hidden: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={cls(
        "px-2 py-0.5 rounded text-xs font-medium",
        map[status] || "bg-gray-100 text-gray-700"
      )}
    >
      {String(status || "").toUpperCase()}
    </span>
  );
};

const Chip = ({ children }) => (
  <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs mr-2 mb-2">
    {children}
  </span>
);

const ColorDot = ({ hex }) => (
  <span
    className="inline-block w-3 h-3 rounded-full border border-gray-300 mr-1"
    style={{ backgroundColor: hex }}
  />
);

/* ---------- main component ---------- */
const EditProduts = () => {
  const [product, setProduct] = useState(null);
  const [docId, setDocId] = useState(usePathname()?.split("=")[1] || "");
  const router = useRouter();

  useEffect(() => {
    if (!docId) return;
    db.collection("products")
      .doc(docId)
      .get()
      .then((snap) => {
        const data = snap.data() || {};
        // keep firestore doc id as field too (useful)
        setProduct({ id: snap.id, ...data });
      });
  }, [docId]);
  


  const currency = product?.variants?.[0]?.currency || "USD";

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-40 bg-gray-200 rounded" />
            <div className="h-40 bg-gray-200 rounded" />
            <div className="h-40 bg-gray-200 rounded" />
          </div>
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-5xl rounded-xl  mx-auto p-4 bg-white sm:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            {product.title || "Untitled Product"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <StatusBadge status={product.status} />
            {product.brand && (
              <span>
                Brand:{" "}
                <strong className="text-gray-800">{product.brand}</strong>
              </span>
            )}
            {product.slug && (
              <span>
                Slug:{" "}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                  {product.slug}
                </code>
              </span>
            )}
            {product.id && (
              <span>
                ID:{" "}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded">
                  {String(product.id)}
                </code>
              </span>
            )}
          </div>
          {product.description && (
            <p className="mt-3 text-gray-700">{product.description}</p>
          )}
        </div>

        <div className="flex text-sm items-center gap-2">
          <Link
            href="/products/add-product"
            className="px-3 py-2 rounded-md border border-gray-200 text-gray-50 bg-slate-800 hover:bg-slate-700"
          >
            +Add
          </Link>
          <Link
            href={`/products/edit-product/id=${product.id || docId}`}
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Categories */}
      {Array.isArray(product.categories) && product.categories.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Categories
          </h2>
          <div className="flex flex-wrap">
            {product.categories.map((c, i) => (
              <Chip key={`${c?.id}-${i}`}>{c?.name || c?.id}</Chip>
            ))}
          </div>
        </section>
      )}

      {/* Images Gallery
      {images.length > 0 && (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Images</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div
                key={img.id || img.url}
                className="relative w-full aspect-[4/3] rounded overflow-hidden border"
              >
                <Image
                  src={img.url}
                  alt={img.alt_text || "Product image"}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-xs px-2 py-1">
                  #{toNum(img.position, 0)} {img.alt_text || ""}
                </div>
              </div>
            ))}
          </div>
        </section>
      )} */}

      {/* Options */}
      {Array.isArray(product.options) && product.options.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Options
          </h2>
          <div className="space-y-3">
            {product.options.map((opt) => (
              <div key={opt.id || opt.name}>
                <div className="text-sm text-gray-700 font-medium mb-1">
                  {opt.id} {opt.name}
                </div>
                <div className="flex flex-wrap">
                  {(opt.values || []).map((v) => (
                    <Chip key={v.id || v.value}>
                      {v.swatch_hex && <ColorDot hex={v.swatch_hex} />}
                      {v.value}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Variants */}
      {Array.isArray(product.variants) && product.variants.length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Variants
          </h2>

          <div className="grid gap-4 w-full overflow-hidden ">
            <div className="w-full overflow-x-scroll rounded-md relative">
              <table className="w-full whitespace-nowrap table-auto">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">SKU</th>
                    <th className="px-3 py-2 text-left font-medium">Options</th>
                    <th className="px-3 py-2 text-left font-medium">Price</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Compare at
                    </th>
                    <th className="px-3 py-2 text-left font-medium">Active</th>
                    <th className="px-3 py-2 text-left font-medium">
                      Inventory (section)
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Weight (g)
                    </th>
                    <th className="px-3 py-2 text-left font-medium">
                      Dimensions (cm)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v) => {
                    const inv = Array.isArray(v.inventory)
                      ? v.inventory.find(
                          (x) => (x.location_code || "MAIN") === "MAIN"
                        )
                      : null;
                    const opts = (v.option_values || [])
                      .map((ov) => `${ov.option_name || ""}: ${ov.value || ""}`)
                      .join(", ");
                    return (
                      <tr key={v.id || v.sku} className="border-t">
                        <td className="px-3 py-2 font-mono">{v.sku}</td>
                        <td className="px-3 py-2">{opts || "-"}</td>
                        <td className="px-3 py-2">
                          {fmtMoney(v.price, v.currency || currency)}
                        </td>
                        <td className="px-3 py-2">
                          {v.compare_at_price
                            ? fmtMoney(
                                v.compare_at_price,
                                v.currency || currency
                              )
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={cls(
                              "px-2 py-0.5 rounded text-xs",
                              v.is_active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 text-gray-700"
                            )}
                          >
                            {v.is_active ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          {inv ? (
                            <div className="space-y-0.5">
                              <div>
                                <span className="text-gray-600">On hand:</span>{" "}
                                <strong>{toNum(inv.stock_on_hand)}</strong>
                              </div>
                              <div>
                                <span className="text-gray-600">Reserved:</span>{" "}
                                {toNum(inv.stock_reserved)}
                              </div>
                              <div>
                                <span className="text-gray-600">Reorder:</span>{" "}
                                {toNum(inv.reorder_point)}
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Backorder:
                                </span>{" "}
                                {inv.allow_backorder ? "Allowed" : "No"}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">{v.weight_grams ?? "—"}</td>
                        <td className="px-3 py-2">
                          {v?.dimensions_cm
                            ? `${v.dimensions_cm.length ?? "–"} × ${
                                v.dimensions_cm.width ?? "–"
                              } × ${v.dimensions_cm.height ?? "–"}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Attributes */}
      {product.attributes && Object.keys(product.attributes).length > 0 && (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Attributes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(product.attributes).map(([k, v]) => (
              <div key={k} className="border rounded p-3 text-sm">
                <div className="text-gray-500">{k}</div>
                <div className="text-gray-900 font-medium">{String(v)}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SEO */}
      {(product.seo?.title || product.seo?.description) && (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-gray-900 mb-2">SEO</h2>
          <div className="border rounded p-3 text-sm">
            {product.seo?.title && (
              <div className="mb-2">
                <div className="text-gray-500">Title</div>
                <div className="text-gray-900 font-medium">
                  {product.seo.title}
                </div>
              </div>
            )}
            {product.seo?.description && (
              <div>
                <div className="text-gray-500">Description</div>
                <div className="text-gray-900">{product.seo.description}</div>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
};

export default EditProduts;
