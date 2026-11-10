// utils/orders-item-qty-date-source.js

// ----- Fixed source keys (preserve exact case & order)
export const SOURCE_KEYS = ["Web", "Message", "Whatsapp", "Phone"];

/** Format ISO-like date to YYYY-MM-DD in a specific IANA timezone (default: Asia/Dhaka). */
export const formatDateKey = (isoLike, tz = "Asia/Dhaka") => {
  if (!isoLike) return "InvalidDate";
  const d = new Date(isoLike);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(d)
    .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});
  return `${parts.year}-${parts.month}-${parts.day}`; // e.g. 2025-11-19
};

/** Map any raw source to one of the fixed keys (case-insensitive). Returns null if not matched. */
export const toFixedSource = (raw) => {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  for (const key of SOURCE_KEYS) {
    if (key.toLowerCase() === s) return key;
  }
  return null;
};

/** Internal: ensure an item bucket exists & return it. */
const ensureItemBucket = (container, itemKey, it) => {
  if (!container[itemKey]) {
    container[itemKey] = {
      qty: 0,
      title: String(it?.title ?? ""),
      product_id: it?.product_id,
      unit: it?.unit,
    };
  }
  return container[itemKey];
};

/** Internal: add numeric quantity safely. */
const addQty = (bucket, q) => {
  const add = Number(q ?? 0);
  if (!Number.isNaN(add)) bucket.qty += add;
};

/**
 * A) Per-Item Quantity: Date & Overall (across all sources)
 *
 * @param {Array} orders - Each order: { created_at, items: [{ product_id, title, quantity, unit? }], meta?:{source?} }
 * @param {Object} opts
 * @param {"product_id"|"title"} [opts.itemKey="product_id"] - how to identify unique items
 * @param {string} [opts.tz="Asia/Dhaka"] - timezone for date bucketing
 * @returns {Record<string, Record<string, { qty:number, title:string, product_id?:string, unit?:string }>>}
 *
 * Example:
 * {
 *   "2025-11-19": {
 *     "1103": { qty: 5, title: "Gol Patali", product_id: "1103", unit: "kg" },
 *     "1100": { qty: 0.5, title: "Liquid Gur", product_id: "1100", unit: "kg" }
 *   },
 *   ...
 * }
 */
export const perItemQtyByDateOverall = (orders = [], opts = {}) => {
  const { itemKey = "product_id", tz = "Asia/Dhaka" } = opts;
  const out = {};

  for (const order of orders) {
    const dKey = formatDateKey(order?.created_at, tz);
    const items = Array.isArray(order?.items) ? order.items : [];
    out[dKey] ||= {};

    for (const it of items) {
      const key = String(it?.[itemKey] ?? it?.title ?? "unknown");
      const bucket = ensureItemBucket(out[dKey], key, it);
      addQty(bucket, it?.quantity);
      if (!bucket.unit && it?.unit) bucket.unit = it.unit;
      if (!bucket.unitWgt && it?.unitWgt) bucket.unitWgt = it.unitWgt;
    }
  }
  return out;
};

/**
 * B) Per-Item Quantity: Date & Source (split into fixed sources)
 *
 * Only orders whose source matches the fixed keys will be included.
 *
 * @param {Array} orders
 * @param {Object} opts
 * @param {"product_id"|"title"} [opts.itemKey="product_id"]
 * @param {string} [opts.tz="Asia/Dhaka"]
 * @returns {Record<string, Record<"Web"|"Message"|"Whatsapp"|"Phone", Record<string, { qty:number, title:string, product_id?:string, unit?:string }>>>}
 *
 * Example:
 * {
 *   "2025-11-19": {
 *     Web: { "1103": {...}, ... },
 *     Message: { ... },
 *     Whatsapp: { ... },
 *     Phone: { ... }
 *   },
 *   ...
 * }
 */
export const perItemQtyByDateAndSource = (orders = [], opts = {}) => {
  const { itemKey = "product_id", tz = "Asia/Dhaka" } = opts;
  const out = {};

  for (const order of orders) {
    const dKey = formatDateKey(order?.created_at, tz);
    const sKey = toFixedSource(order?.meta?.source);
    if (!sKey) continue; // filter to fixed sources only

    out[dKey] ||= Object.fromEntries(SOURCE_KEYS.map((k) => [k, {}]));
    const items = Array.isArray(order?.items) ? order.items : [];

    for (const it of items) {
      const key = String(it?.[itemKey] ?? it?.title ?? "unknown");
      const bucket = ensureItemBucket(out[dKey][sKey], key, it);
      addQty(bucket, it?.quantity);
      if (!bucket.unit && it?.unit) bucket.unit = it.unit;
      if (!bucket.unitWgt && it?.unitWgt) bucket.unitWgt = it.unitWgt;
    }
  }

  // Ensure every date has all sources present (even if empty)
  for (const dKey of Object.keys(out)) {
    for (const k of SOURCE_KEYS) out[dKey][k] ||= {};
  }
  return out;
};

/* ---------- Optional helpers to flatten into rows (good for tables/CSV) ---------- */

/** Rows for Date & Overall */
export const rowsDateOverall = (map) => {
  const rows = [];
  for (const [date, items] of Object.entries(map || {})) {
    for (const [itemKey, info] of Object.entries(items || {})) {
      rows.push({
        date,
        item_key: itemKey,
        title: info.title || "",
        product_id: info.product_id || "",
        qty: Number(info.qty || 0),
        unit: info.unit || "",
        unitWgt:
          info.unitWgt ||
          (itemKey === "1107" && 2.5) ||
          (itemKey === "1108" && 3.5) ||
          (itemKey === "1109" && 2) ||
          (itemKey === "1110" && 4) ||
          1,
      });
    }
  }
  rows.sort((a, b) =>
    a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title)
  );
  return rows;
};

/** Rows for Date & Source */
export const rowsDateAndSource = (map) => {
  const rows = [];
  for (const [date, sources] of Object.entries(map || {})) {
    for (const src of SOURCE_KEYS) {
      const items = sources?.[src] || {};
      for (const [itemKey, info] of Object.entries(items)) {
        rows.push({
          date,
          source: src,
          item_key: itemKey,
          title: info.title || "",
          product_id: info.product_id || "",
          qty: Number(info.qty || 0),
          unit: info.unit || "",
          unitWgt:
            info.unitWgt ||
            (itemKey === "1107" && 2.5) ||
            (itemKey === "1108" && 3.5) ||
            (itemKey === "1109" && 2) ||
            (itemKey === "1110" && 4) ||
            1,
        });
      }
    }
  }
  rows.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1; // newest first
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.title.localeCompare(b.title);
  });
  return rows;
};

/** Convenience: compute both in one call. */
export const computePerItemQtyDateAndSourceAndOverall = (orders, opts) => {
  const overallMap = perItemQtyByDateOverall(orders, opts);
  const sourceMap = perItemQtyByDateAndSource(orders, opts);
  return {
    overallMap,
    sourceMap,
    overallRows: rowsDateOverall(overallMap),
    sourceRows: rowsDateAndSource(sourceMap),
  };
};


// utils/orders-created-user-count.js

/** Safe normalize (empty হলে "Unknown") */
export const normalizeCreatedUser = (raw) => {
  const s = String(raw ?? "").trim();
  return s || "Unknown";
};

/**
 * Overall count: created_user → number of orders
 * @param {Array} orders - [{ created_user, createdUser, ... }]
 * @returns {Record<string, number>}
 */
export const countOrdersByCreatedUser = (orders = []) => {
  const out = {};
  for (const o of orders) {
    const user = normalizeCreatedUser(o?.created_user ?? o?.createdUser);
    out[user] = (out[user] || 0) + 1;
  }
  return out;
};

/**
 * Sorted list (desc) for easy rendering.
 * @param {Record<string, number>} map
 * @returns {Array<{ created_user: string, count: number }>}
 */
export const toSortedList = (map = {}) =>
  Object.entries(map)
    .map(([created_user, count]) => ({ created_user, count }))
    .sort((a, b) => b.count - a.count || a.created_user.localeCompare(b.created_user));
