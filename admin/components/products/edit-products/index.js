"use client";

import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { AppForm, FormBtn } from "../../shared/Form";
import Button from "../../shared/Button";
import { db, timestamp } from "@/app/utils/firebase";
import { useRouter } from "next/router";
import ProductDetailsFormUp from "../add_products/ProductDetailsFormUp";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { notifications } from "@mantine/notifications";

/* -------------------------- helper utilities -------------------------- */
const num = (v, d = 0) => {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const cleanEmpty = (obj) => {
  if (Array.isArray(obj)) {
    return obj
      .map(cleanEmpty)
      .filter(
        (v) =>
          !(
            v === "" ||
            v === null ||
            v === undefined ||
            (typeof v === "object" &&
              !Array.isArray(v) &&
              Object.keys(v).length === 0) ||
            (Array.isArray(v) && v.length === 0)
          )
      );
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const k of Object.keys(obj)) {
      const v = cleanEmpty(obj[k]);
      const isEmptyObj =
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        !Object.keys(v).length;
      const isEmptyArr = Array.isArray(v) && v.length === 0;
      if (
        v !== "" &&
        v !== null &&
        v !== undefined &&
        !isEmptyObj &&
        !isEmptyArr
      ) {
        out[k] = v;
      }
    }
    return out;
  }
  return obj;
};

/* -------------------------- Yup validation --------------------------- */
const validationSchema = Yup.object().shape({
  id: Yup.string().nullable(),
  store_id: Yup.string().nullable(),

  has_variants: Yup.boolean().default(true),

  single_sku: Yup.string().when("has_variants", {
    is: false,
    then: (s) => s.required("SKU is required for single-SKU"),
    otherwise: (s) => s.nullable(),
  }),

  // basic product
  title: Yup.string().required("Product title is required"),
  slug: Yup.string().required("Slug is required"),
  status: Yup.string().oneOf(["draft", "active", "archived"]).required(),
  brand: Yup.string().nullable(),
  description: Yup.string().nullable(),

  // categories (0: parent, 1: child) — keep flexible
  categories: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.string().required("Category id required"),
        name: Yup.string().optional(),
        slug: Yup.string().optional(),
      })
    )
    .min(1),

  // options only required if has_variants = true
  options: Yup.array()
    .of(
      Yup.object().shape({
        name: Yup.string().required("Option name is required"),
        values: Yup.array()
          .of(
            Yup.object().shape({
              value: Yup.string().required("Option value is required"),
              swatch_hex: Yup.string()
                .matches(/^#([0-9A-F]{3}){1,2}$/i, "Invalid color hex")
                .nullable(),
            })
          )
          .min(1, "Each option must have at least 1 value"),
      })
    )
    .when("has_variants", {
      is: true,
      then: (s) => s.min(1, "At least one option required").required(),
      otherwise: (s) => s.optional(),
    }),

  // single-SKU fields (root) only when has_variants = false
  price: Yup.number().when("has_variants", {
    is: false,
    then: (s) => s.required("Price is required").min(0),
    otherwise: (s) => s.optional(),
  }),
  sale_price: Yup.number()
    .nullable()
    .transform((v, o) => (o === "" ? null : v))
    .min(0)
    .when(["has_variants", "price"], {
      is: (hv) => hv === false,
      then: (s) => s.optional(),
    }),
  currency: Yup.string()
    .length(3, "Currency must be ISO code")
    .when("has_variants", {
      is: false,
      then: (s) => s.required("Currency required"),
      otherwise: (s) => s.optional(),
    }),
  stock: Yup.number()
    .min(0)
    .when("has_variants", {
      is: false,
      then: (s) => s.required("Stock required"),
      otherwise: (s) => s.optional(),
    }),

  // variants only when has_variants = true
  variants: Yup.array()
    .of(
      Yup.object().shape({
        sku: Yup.string().required("SKU is required"),
        barcode: Yup.string().nullable(),
        price: Yup.number().required("Price is required").min(0),
        compare_at_price: Yup.number()
          .nullable()
          .transform((v, o) => (o === "" ? null : v)),
        currency: Yup.string()
          .length(3, "Currency must be ISO code")
          .required(),
        is_active: Yup.boolean().required(),
        option_values: Yup.array()
          .of(
            Yup.object().shape({
              option_name: Yup.string().nullable(),
              value: Yup.string().nullable(),
            })
          )
          .min(1, "Variant must have option values"),
        inventory: Yup.array()
          .of(
            Yup.object().shape({
              location_code: Yup.string().required(),
              stock_on_hand: Yup.number().min(0).required(),
              stock_reserved: Yup.number().min(0).default(0),
              reorder_point: Yup.number().min(0).default(0),
              allow_backorder: Yup.boolean().default(false),
            })
          )
          .required("Inventory is required"),
        // images: Yup.array()
        //   .of(
        //     Yup.object().shape({
        //       url: Yup.string().url().required(),
        //       alt_text: Yup.string().nullable(),
        //       position: Yup.number().required(),
        //     })
        //   )
        //   .optional(),
        weight_grams: Yup.number().min(0).nullable(),
        dimensions_cm: Yup.object()
          .shape({
            length: Yup.number().nullable(),
            width: Yup.number().nullable(),
            height: Yup.number().nullable(),
          })
          .nullable(),
      })
    )
    .when("has_variants", {
      is: true,
      then: (s) => s.min(1, "At least one variant is required"),
      otherwise: (s) => s.optional(),
    }),

  attributes: Yup.object().nullable(),

  seo: Yup.object().shape({
    title: Yup.string().max(255).nullable(),
    description: Yup.string().max(300).nullable(),
  }),
});

/* ---------------------------- component -------------------------------- */
const EditProduts = () => {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [docId, setDocId] = useState(usePathname()?.split("=")[1] || "");
  const router = useRouter();

  useEffect(() => {
    // if (!docId) return;
    db.collection("products")
      .doc(docId)
      .get()
      .then((doc) => {
        if (!!doc.data()) {
            const product = { id: doc.id, ...doc.data() };
            setProduct(product);
          }
      });
  }, [docId]);

  /* ---------- build payload (smart mapping single-SKU vs variants) ---------- */
  const buildProductPayload = (values) => {
    const {
      has_variants,
      single_sku,
      price,
      sale_price,
      currency,
      stock,
      options = [],
      variants = [],
      categories = [],
      ...rest
    } = values || {};

    // normalize options -> {name, values:[{value, swatch_hex?}]}
    const normOptions = (options || []).map((o) => ({
      name: o?.name || "",
      values: (o?.values || []).map((v, i) =>
        typeof v === "string"
          ? { value: v }
          : { value: v?.value || "", swatch_hex: v?.swatch_hex || undefined }
      ),
    }));

    let outVariants;
    if (!has_variants) {
      // single-SKU -> synthesize one variant
      outVariants = [
        {
          sku: single_sku || "",
          currency: currency || "BDT",
          price: sale_price ? num(sale_price, 0) : num(price, 0),
          compare_at_price: sale_price ? num(price, 0) : null,
          is_active: true,
          option_values: [],
          inventory: [
            {
              location_code: "MAIN",
              stock_on_hand: num(stock, 0),
              stock_reserved: 0,
              reorder_point: 0,
              allow_backorder: false,
            },
          ],
        },
      ];
    } else {
      // multi-variant -> sanitize numbers
      outVariants = (variants || []).map((v, idx) => ({
        ...v,
        price: num(v.price, 0),
        compare_at_price:
          v.compare_at_price === "" || v.compare_at_price === null
            ? null
            : num(v.compare_at_price, 0),
        is_active: v.is_active !== false,
        currency: v.currency || "BDT",
        inventory: (v.inventory || []).map((inv) => ({
          location_code: inv.location_code || "MAIN",
          stock_on_hand: num(inv.stock_on_hand, 0),
          stock_reserved: num(inv.stock_reserved, 0),
          reorder_point: num(inv.reorder_point, 0),
          allow_backorder: !!inv.allow_backorder,
        })),
      }));
    }

    // normalize categories: allow id-only
    const normCategories = (categories || [])
      .filter(Boolean)
      .map((c) =>
        typeof c === "object"
          ? { id: c.id ?? "", name: c.name ?? "", slug: c.slug ?? "" }
          : { id: c, name: "", slug: "" }
      );

    const payload = cleanEmpty({
      id: values?.id || docId,
      has_variants: !!has_variants,
      options: normOptions,
      variants: outVariants,
      categories: normCategories,
      ...rest, // title, slug, status, brand, description, store_id, attributes, seo, available_from, etc.
      updatedAt: timestamp,
    });

    return payload;
  };

  /* --------------------------- submit handler --------------------------- */
  const editProductHandler = async (values, formikHelpers) => {
    try {
      setLoading(true);
      const payload = buildProductPayload(values);

      // ensure we write to the current doc id
      const writeId = docId || payload.id;
      if (!writeId) throw new Error("Missing product id");

      await db
        .collection("products")
        .doc(writeId)
        .set(payload, { merge: true });

      // optional: if there was no createdAt, set it once
      if (!product?.createdAt) {
        await db
          .collection("products")
          .doc(writeId)
          .set({ updated_at: new Date().toISOString(), isPublished: false, }, { merge: true });
      }

      setLoading(false);
      // success navigate
      notifications.show({
            title: "Success",
            message: `Product updated seccessfully`,
            color: "blue",
            autoClose: 3000,
          });
      router.push("/products");
    } catch (err) {
      console.error("Update failed:", err);
      setLoading(false);
      // you can show a toast here if you have one
    }
  };

  /* ---------------------------- initial values --------------------------- */
  const initialValues = {
    // Product basics
    id: product?.id || docId || "",
    single_sku: product?.single_sku || "",
    title: product?.title || "",
    slug: product?.slug || "",
    status: product?.status || "draft",
    brand: product?.brand || "",
    description: product?.description || "",
    store_id: product?.store_id || "",

    // flags
    has_variants: product?.has_variants ?? true,

    // single-SKU helpers (used when has_variants=false)
    single_sku: product?.single_sku || product?.variants?.[0]?.sku || "",
    price:
      product?.variants && product?.variants[0] && !product?.has_variants
        ? product?.variants[0]?.compare_at_price ||
          product?.variants[0]?.price ||
          ""
        : "",
    sale_price:
      product?.variants && product?.variants[0] && !product?.has_variants
        ? product?.variants[0]?.price || ""
        : "",
    currency: product?.variants?.[0]?.currency || product?.currency || "BDT",
    stock:
      product?.variants?.[0]?.inventory?.[0]?.stock_on_hand ??
      product?.stock ??
      0,

    // Categories
    categories: product?.categories || [{ id: "1" }],

    // Options
    options: product?.options || [
      { name: "Color", values: [] },
      { name: "Size", values: [] },
    ],

    // Variants
    variants: product?.variants || [
      {
        sku: "",
        currency: "BDT",
        price: "",
        compare_at_price: "",
        is_active: true,
        option_values: [
          { option_name: "Color", value: "" },
          { option_name: "Size", value: "" },
        ],
        inventory: [
          {
            location_code: "MAIN",
            stock_on_hand: 0,
            stock_reserved: 0,
            reorder_point: 0,
            allow_backorder: false,
          },
        ],
      },
    ],

    // Attributes
    attributes: product?.attributes || {
      Unit: product?.unit || "",
      Tags: product?.product_tag || "",
      ProductType: product?.product_type || "type",
    },

    // SEO
    seo: product?.seo,

    // Extra
    available_from: product?.available_from || "",
  };

  return (
    <main>
      <div>
        <AppForm
          initialValues={initialValues}
          onSubmit={editProductHandler}
          validationSchema={validationSchema}
        >
          <div className="bg-white max-w-3xl mx-auto rounded-xl relative">
            <div className="w-full">
              <div className="flex gap-2 items-center justify-between py-3 px-6 md:px-4">
                <div className="grid gap-1">
                  <h1 className="text-tile text-xl font-medium md:text-2xl">
                    Edit Product
                  </h1>
                  <p className="text-sm md:text-lg text-sub-title">
                    Edit your product and necessary information from here.
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full h-[75%] md:h-[80%] overflow-y-auto py-3 px-6 md:px-4 mb-4">
              <ProductDetailsFormUp edit={true} />
            </div>

            <div className="w-full">
              <div className="py-5 px-6 md:px-4 max-h-full grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <Link href={`/products`}>
                    <Button
                      title="Cancel"
                      className="bg-red-100 hover:bg-red-200 hover:shadow-lg text-red-600 transition-all duration-300 w-full"
                    />
                  </Link>
                </div>
                <div className="col-span-2">
                  <FormBtn
                    disabled={loading}
                    loading={loading}
                    title="Update Product"
                    className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg text-white transition-all duration-300 w-full"
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

export default EditProduts;
