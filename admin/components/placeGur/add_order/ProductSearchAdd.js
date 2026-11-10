import React, { useEffect, useState } from "react";
import { useFormikContext, getIn } from "formik";
import { db } from "@/app/utils/firebase"; // Firestore v8 instance

const MAX_RESULTS = 8;
const DEBOUNCE_MS = 350;

export default function ProductSearchAddWithCreate() {
  const { values, setFieldValue } = useFormikContext();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [saveToProducts, setSaveToProducts] = useState(false);

  const dq = useDebounce(q.trim().toLowerCase(), DEBOUNCE_MS);

  useEffect(() => {
  let alive = true;

  async function run() {
    setError("");
    setResults([]);
    if (!dq || dq.length < 2) return;

    setLoading(true);
    try {
      // 1) title prefix
      const titleQ = db
        .collection("products")
        .orderBy("title_lower")
        .startAt(dq)
        .endAt(dq + "\uf8ff")
        .limit(MAX_RESULTS);

      // 2) sku prefix (lower-cased field preferred)
      const skuQ = db
        .collection("products")
        .orderBy("single_sku")
        .startAt(dq)
        .endAt(dq + "\uf8ff")
        .limit(MAX_RESULTS);

      // parallel fetch
      const [titleSnap, skuSnap] = await Promise.all([titleQ.get(), skuQ.get()]);
      if (!alive) return;

      // merge unique by id
      const m = new Map();
      titleSnap.docs.forEach(d => m.set(d.id, { id: d.id, ...d.data() }));
      skuSnap.docs.forEach(d => m.set(d.id, { id: d.id, ...d.data() }));

      // sort (title_lower -> single_sku)
      const rows = Array.from(m.values()).sort((a, b) => {
        const tA = (a.title_lower || "").localeCompare(b.title_lower || "");
        if (tA !== 0) return tA;
        return (a.single_sku || "").localeCompare(b.single_sku || "");
      });

      setResults(rows.slice(0, MAX_RESULTS));
    } catch (e) {
      if (!alive) return;
      console.error("Product search error:", e);
      setError("Failed to search. Ensure indexes for title_lower & single_sku_lower.");
    } finally {
      if (alive) setLoading(false);
    }
  }

  run();
  return () => { alive = false; };
}, [dq]);


  function addItemFromProduct(p) {
    let variant = null;
    if (Array.isArray(p.variants) && p.variants.length) {
      variant = p.variants.find((v) => v && v.is_active) || p.variants[0];
    }

    const currency = (p.currency || getIn(values, "currency") || "BDT").toUpperCase();
    const price = numberish((variant && variant.price) ?? p.sale_price ?? p.price ?? 0);
    const sku = String((variant && variant.sku) || p.single_sku || "");

    const toIdArray = (vals) =>
      Array.isArray(vals)
        ? vals
            .flat()
            .filter((v) => v && (v.value ?? v) !== "")
            .map((v) => ({ id: typeof v === "object" ? v.value : v, name: typeof v === "object" ? v.value : v }))
        : [];

    const options = Array.isArray(p.options)
      ? p.options.map((ov) => ({
          name: (ov && ov.name) || "",
          value: toIdArray(ov && ov.values), // -> [{id:'Red'},{id:'Black'},{id:'Blue'}]
        }))
      : [];

    const newItem = {
      categories: p?.categories[0]?.id,
      product_id: p.id ?? null,
      variant_id: (variant && variant.id) ?? null,
      store_id: p.store_id || null,
      sku,
      title: p.title || "",
      slug: p.slug || slugify(p.title || sku),
      unit: (p.attributes && p.attributes.Unit) || p.unit || "pc",
      options,
      price,
      compare_at_price: (variant && variant.compare_at_price) ?? p.price ?? null,
      quantity: 1,
      currency,
      tax_rate: 0,
      line_total: +(price * 1).toFixed(2),
      inventory_allocation: [{ location_code: "MAIN", qty: 0 }],
    };

    const items = (getIn(values, "items") || []).concat(newItem);
    setFieldValue("items", items);
    setQ("");
    setResults([]);
  }

  async function createNewItem(e) {
    e && e.preventDefault && e.preventDefault();

    const title = newTitle.trim() || q.trim();
    const price = numberish(newPrice, 0);
    const qty = Math.max(1, parseInt(newQty || 1, 10));
    const sku = newSku.trim();

    if (!title || price <= 0) {
      alert("Please enter a title and a price > 0");
      return;
    }

    const currency = (getIn(values, "currency") || "BDT").toUpperCase();
    const item = {
      product_id: null,
      variant_id: null,
      store_id: null,
      sku,
      title,
      slug: slugify(title),
      unit: "pc",
      options: [],
      image: null,
      price,
      compare_at_price: null,
      quantity: qty,
      currency,
      tax_rate: 0,
      line_total: +(price * qty).toFixed(2),
      inventory_allocation: [{ location_code: "MAIN", qty: 0 }],
    };

    const items = (getIn(values, "items") || []).concat(item);
    setFieldValue("items", items);

    if (saveToProducts) {
      try {
        const ref = db.collection("products").doc();
        await ref.set(
          {
            title,
            categories,
            title_lower: title.toLowerCase(),
            slug: slugify(title),
            single_sku: sku || null,
            price,
            has_variants: false,
            status: "active",
            createdAt: new Date().toISOString(),
            currency,
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Failed to save new product:", err);
      }
    }

    setShowCreate(false);
    setNewTitle("");
    setNewSku("");
    setNewPrice("");
    setNewQty(1);
    setSaveToProducts(false);
    setQ("");
    setResults([]);
  }

  return (
    <div className="p-3 border rounded space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products by title…"
          className="w-full rounded-md border px-3 py-2 text-sm border-gray-300 focus:border-primary outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            className="text-sm text-gray-600"
          >
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setShowCreate((v) => !v);
            if (!showCreate) {
              setNewTitle(q.trim());
            }
          }}
          className="text-sm text-blue-600 underline"
        >
          {showCreate ? "Close" : "Create New"}
        </button>
      </div>

      {loading && <div className="text-xs text-gray-500">Searching…</div>}
      {error && <div className="text-xs text-red-500">{error}</div>}

      {!!results.length && !showCreate && (
        <div className="border rounded divide-y max-h-64 overflow-y-auto">
          {results.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => addItemFromProduct(p)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              <div className="font-medium text-sm">{p.title}</div>
              <div className="text-xs text-gray-500">{p.slug || "(no slug)"}</div>
              <div className="text-xs">SKU: {p.single_sku || (p.variants && p.variants[0] && p.variants[0].sku) || "—"}</div>
            </button>
          ))}
        </div>
      )}

      {!loading && !results.length && dq.length >= 2 && !showCreate && !error && (
        <div className="text-xs text-gray-500">No products found.</div>
      )}

      {showCreate && (
        <form onSubmit={createNewItem} className="p-3 border rounded space-y-2 bg-gray-50">
          <div className="font-medium text-sm">Quick Create Item</div>
          <div className="grid grid-cols-4 gap-2 items-end">
            <div className="col-span-2">
              <label className="block text-xs">Title</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Product title"
                className="w-full rounded-md border px-3 py-2 text-sm border-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs">SKU</label>
              <input
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="SKU (optional)"
                className="w-full rounded-md border px-3 py-2 text-sm border-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs">Price</label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-md border px-3 py-2 text-sm border-gray-300"
              />
            </div>
            <div>
              <label className="block text-xs">Qty</label>
              <input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                min={1}
                className="w-full rounded-md border px-3 py-2 text-sm border-gray-300"
              />
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <input
                id="saveToProducts"
                type="checkbox"
                checked={saveToProducts}
                onChange={(e) => setSaveToProducts(e.target.checked)}
              />
              <label htmlFor="saveToProducts" className="text-xs">
                Also save into products (minimal doc)
              </label>
            </div>
            <div className="col-span-1">
              <button
                type="submit"
                className="w-full rounded-md bg-blue-600 text-white text-sm py-2 hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="text-[11px] text-gray-400">
        Tip: maintain <code>title_lower</code> on products and index it for fast prefix search.
      </div>
    </div>
  );
}

function numberish(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function slugify(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
