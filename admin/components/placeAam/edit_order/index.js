// pages/admin/orders/EditOrder.js (or your desired path)
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { notifications } from "@mantine/notifications";

import { AppForm, FormBtn } from "../../shared/Form";
import Button from "../../shared/Button";

import { db } from "@/app/utils/firebase"; // Firebase v8 instance
import { selectUser } from "@/app/redux/slices/authSlice";
import { orderValidationSchemaCOD } from "@/lib/validationSchema";
import OrderDetailsFormAam from "../add_order/OrderDetails";

// ---------------- helpers ----------------
const toNumber = (n, fb = 0) => (Number.isFinite(+n) ? +n : fb);

// Keep structure consistent and totals sane
const normalizeOrder = (values, prev = {}) => {
  const now = new Date().toISOString();
  const v = { ...values };

  v.created_at = prev?.created_at || v.created_at || now;
  v.updated_at = now;

  v.currency = (v.currency || "BDT").toUpperCase();
  v.items = (v.items || []).map((it) => {
    const price = toNumber(it?.price, 0);
    const qty = toNumber(it?.quantity, 0);
    return {
      ...it,
      currency: (it.currency || v.currency || "BDT").toUpperCase(),
      line_total:
        typeof it.line_total === "number"
          ? it.line_total
          : +(price * qty).toFixed(2),
    };
  });

  v.payment = {
    method: (v.payment?.method || "cod").toLowerCase(),
    status: v.payment?.status || "unpaid",
    transaction_id: v.payment?.transaction_id || "",
  };

  v.fulfillment = {
    status: v.fulfillment?.status || "unfulfilled",
    courier: v.fulfillment?.courier || "Pathao",
    tracking_numbers: v.fulfillment?.tracking_numbers || [],
    ...v.fulfillment,
  };

  const itemsSum = v.items.reduce((s, it) => s + Number(it.line_total || 0), 0);
  const qtySum = v.items.reduce(
    (s, it) =>
      s + Number((it.unitWgt ? it.unitWgt * it?.quantity : it?.quantity) || 0),
    0
  );

  const discount = Number(v?.totals?.discount || 0);
  const shipping = Number(v?.totals?.shipping || 0);
  const payment = Number(v?.totals?.payment || 0);
  const cod = Number(v?.totals?.cod || 0);

  const grand = +(itemsSum - discount + shipping).toFixed(2);

  v.totals = {
    qtySum: +qtySum.toFixed(2),
    items: +itemsSum.toFixed(2),
    payment: +payment.toFixed(2),
    discount: +discount.toFixed(2),
    shipping: +shipping.toFixed(2),
    cod: +cod.toFixed(2),
    grand,
  };

  v.meta = { source: v?.meta?.source || "web", ...v.meta };

  return v;
};

// Deep-merge to ensure defaults exist for missing fields
const mergeDeep = (base, patch) => {
  if (Array.isArray(patch)) return patch.slice();
  if (patch && typeof patch === "object") {
    const out = { ...base };
    for (const k of Object.keys(patch)) {
      out[k] = mergeDeep(base?.[k], patch[k]);
    }
    return out;
  }
  return patch !== undefined ? patch : base;
};

const DEFAULTS = {
  // --- Basics ---
  status: "pending",
  currency: "BDT",
  store_id: "",

  // --- Customer ---
  customer: {
    name: "",
    phone: "",
    marketing_opt_in: false,
  },

  // --- Addresses ---
  shipping_address: {
    street: "",
    city: "",
    state: "",
    country: "BD",
  },

  // --- Payment & Fulfillment ---
  payment: {
    method: "cod",
    status: "unpaid",
    transaction_id: "",
  },
  fulfillment: {
    status: "unfulfilled",
    courier: "Pathao",
    tracking_numbers: [],
  },

  // --- Items & Totals ---
  items: [],
  totals: {
    items: 0,
    cod: 0,
    payment: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    grand: 0,
  },

  // --- Meta & notes ---
  meta: { source: "web" },
  notes: "",
};

// Try to read order id from both `?id=` and `/.../id=XYZ`
const getOrderIdFromRoute = (router) => {
  const q = router.query?.id;
  if (q) return Array.isArray(q) ? q[0] : q;
  const asPath = router.asPath || "";
  const m = asPath.match(/(?:^|[/?#])id=([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

// ---------------- component ----------------
const EditAamOrder = ({ onClick }) => {
  const user = useSelector(selectUser);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [initial, setInitial] = useState(DEFAULTS);
  const [formKey, setFormKey] = useState("edit-order");

  // Load order
  useEffect(() => {
    const id = getOrderIdFromRoute(router);
    setOrderId(id);

    if (!id) {
      setLoading(false);
      notifications.show({
        title: "Order ID missing",
        message: "No order id provided in URL.",
        color: "red",
      });
      return;
    }

    let unsubscribed = false;
    (async () => {
      try {
        const doc = await db.collection("ordersAam").doc(id).get();
        if (!doc.exists) {
          notifications.show({
            title: "Not found",
            message: `Order ${id} not found.`,
            color: "orange",
          });
          setLoading(false);
          return;
        }
        const data = doc.data() || {};
        const merged = mergeDeep(DEFAULTS, data);
        if (!unsubscribed) {
          setInitial(merged);
          setFormKey(`edit-${id}-${Date.now()}`); // force re-mount Formik with loaded data
        }
      } catch (err) {
        console.error("Load order error:", err);
        notifications.show({
          title: "Failed to load",
          message: "Could not load order. Try again.",
          color: "red",
        });
      } finally {
        if (!unsubscribed) setLoading(false);
      }
    })();

    return () => {
      unsubscribed = true;
    };
  }, [router.asPath]);

  // Save
  const updateOrder = async (values) => {
    try {
      setSaving(true);
      const normalized = normalizeOrder(
        values,
        {
          created_at: initial?.created_at,
          updated_user: user?.name || "null",
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
      await orderValidationSchemaCOD.validate(normalized, {
        abortEarly: false,
      });

      if (!orderId) throw new Error("Missing order id");

      await db.collection("ordersAam").doc(orderId).update(normalized);

      notifications.show({
        title: "Updated",
        message: `Order ${orderId} saved successfully.`,
        color: "green",
      });

      // stay on page; or navigate back:
      router.push(`/place-aam/id=${orderId}`);
    } catch (err) {
      if (err?.name === "ValidationError") {
        notifications.show({
          title: "Validation error",
          message: "Please review the highlighted fields.",
          color: "orange",
        });
        console.error(
          "ValidationError:",
          err.inner?.map((e) => ({ path: e.path, message: e.message }))
        );
      } else {
        notifications.show({
          title: "Save failed",
          message: err?.message || "Something went wrong.",
          color: "red",
        });
        console.error("Update error:", err);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main>
        <div className="max-w-2xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-1/3 bg-gray-200 rounded" />
            <div className="h-24 w-full bg-gray-200 rounded" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div>
        <AppForm
          key={formKey}
          initialValues={initial}
          validationSchema={orderValidationSchemaCOD}
          onSubmit={updateOrder}
        >
          <div className="bg-white max-w-2xl mx-auto rounded-xl relative">
            <div className="w-full">
              <div className="flex gap-2 items-center justify-between py-3 px-6 md:px-4">
                <div className="grid gap-1">
                  <h1 className="text-tile text-xl font-medium md:text-2xl">
                    Edit order {orderId ? `#${orderId}` : ""}
                  </h1>
                  <p className="text-sm md:text-lg text-sub-title">
                    Update products, customer, payment, and fulfillment.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full py-3 px-6 md:px-4 mb-4">
              <OrderDetailsFormAam />
            </div>

            <div className="w-full">
              <div className="py-5 px-6 md:px-4 max-h-full grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Button
                    onClick={() => router.back()}
                    title="Cancel"
                    className="bg-red-100 hover:bg-red-200 hover:shadow-lg text-red-600 transition-all duration-300 w-full"
                  />
                </div>
                <div className="col-span-2">
                  <FormBtn
                    disabled={saving}
                    loading={saving}
                    type="submit"
                    title="Save changes"
                    className="bg-blue-500 hover:bg-blue-600 hover:shadow-lg text-white transition-all duration-300 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </AppForm>
      </div>
    </main>
  );
};

export default EditAamOrder;
