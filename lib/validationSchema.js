import * as Yup from "yup";

export const productValidationSchema = Yup.object().shape({
  id: Yup.number().nullable(),
  store_id: Yup.number().optional(),
  single_sku: Yup.string().required("SKU is required"),
  title: Yup.string().required("Product title is required"),
  slug: Yup.string().required("Slug is required"),
  status: Yup.string().oneOf(["draft", "active", "archived"]).required(),
  brand: Yup.string().nullable(),
  description: Yup.string().nullable(),

  categories: Yup.array().of(
    Yup.object().shape({
      id: Yup.string().required(),
    })
  ),

  options: Yup.array().of(
    Yup.object().shape({
      id: Yup.number().optional(),
      name: Yup.string().optional("Option name is required"),
      values: Yup.array()
        .of(
          Yup.object().shape({
            id: Yup.number().optional(),
            value: Yup.string().optional("Option value is required"),
            swatch_hex: Yup.string()
              .matches(/^#([0-9A-F]{3}){1,2}$/i, "Invalid color hex")
              .nullable(),
          })
        )
        .min(1, "Each option must have at least 1 value"),
    })
  ),

  variants: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.number().optional(),
        sku: Yup.string().optional("SKU is required"),
        barcode: Yup.string().nullable(),
        price: Yup.number().required("Price is required").min(0),
        compare_at_price: Yup.number().nullable(),
        compare_at_price: Yup.number().nullable(),
        currency: Yup.string()
          .length(3, "Currency must be ISO code")
          .required(),
        is_active: Yup.boolean().required(),

        option_values: Yup.array()
          .of(
            Yup.object().shape({
              option_id: Yup.number().optional(),
              option_name: Yup.string().optional(),
              value_id: Yup.number().optional(),
              value: Yup.string().optional(),
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

        images: Yup.array()
          .of(
            Yup.object().shape({
              id: Yup.number().optional(),
              url: Yup.string().url().required(),
              alt_text: Yup.string().nullable(),
              position: Yup.number().required(),
            })
          )
          .optional(),

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
    .min(1, "At least one variant is required"),

  attributes: Yup.object().nullable(),

  seo: Yup.object().shape({
    title: Yup.string().max(255).nullable(),
    description: Yup.string().max(300).nullable(),
  }),
});

export const porductInitialValues = (product_details) => {
  const values = {
    // Product basics
    id: product_details?.id || "",
    title: product_details?.title || "",
    slug: product_details?.slug || "",
    status: product_details?.status || "draft",
    brand: product_details?.brand || "",
    description: product_details?.description || "",
    store_id: product_details?.store_id || "",
    single_sku: product_details?.single_sku || "",

    // Categories
    categories: product_details?.categories || [{ id: "1" }],

    // Flags
    has_variants: product_details?.has_variants ?? true,

    // Options (example: Color, Size)
    options: product_details?.options || [
      { name: "Color", values: [] },
      { name: "Size", values: [] },
    ],

    // Variants (at least one required)
    variants: product_details?.variants || [
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

    // Attributes (flexible key-values)
    attributes: product_details?.attributes || {
      Unit: product_details?.unit || "",
      unitWgt: product_details?.unitWgt || "",
      Tags: product_details?.product_tag || "",
      ProductType: product_details?.product_type || "type",
    },

    // SEO
    seo: product_details?.seo || {
      title: "",
      description: "",
    },

    // Extra fields
    available_from: product_details?.available_from || "",
  };

  return values;
};

const OptionKVSchema = Yup.object({
  name: Yup.string().required(),
  value: Yup.string().required(),
});

const OrderItemSchema = Yup.object({
  store_id: Yup.string().optional(),
  product_id: Yup.number().optional(), // আগের মতোই রেখেছি
  sku: Yup.string().optional(),
  title: Yup.string().required().label("Title"),
  unit: Yup.string().nullable(),

  price: Yup.number()
    .transform((v, o) => (o === "" ? undefined : v))
    .min(0)
    .required()
    .label("Price"),

  compare_at_price: Yup.number()
    .transform((v, o) => (o === "" ? null : v))
    .nullable(),

  // ⬇️ ভগ্নাংশ কিউন্টিটি অনুমোদন: integer() সরানো হয়েছে
  quantity: Yup.number()
    .transform((v, o) => (o === "" ? undefined : v))
    .min(0.01, "Quantity must be at least 0.01")
    .required()
    .label("Quantity"),

  currency: Yup.string().length(3).required(),

  line_total: Yup.number()
    .transform((v, o) => (o === "" ? undefined : v))
    .min(0)
    .required(),

  inventory_allocation: Yup.array()
    .of(
      Yup.object({
        location_code: Yup.string().required(),
        qty: Yup.number().integer().min(0).required(), // এখানে integer থাকছে
      })
    )
    .nullable(),
});

const AddressSchema = Yup.object({
  name: Yup.string().optional(),
  street: Yup.string().required().label("Street address"),
  city: Yup.string().optional(),
  state: Yup.string().optional(),
  country: Yup.string().optional(),
});

const CustomerSchemaCOD = Yup.object({
  name: Yup.string().required().label("Customer name"),
  phone: Yup.string()
    .transform((v) => (v ? v.replace(/\D/g, "") : v)) // remove non-digits
    .matches(/^01\d{9}$/, "Must be 11 digits starting with 01")
    .required()
    .label("Phone number"),
});

export const orderValidationSchemaCOD = Yup.object({
  id: Yup.string().optional(),
  created_at: Yup.string().optional(),
  updated_at: Yup.string().optional(),
  status: Yup.string()
    .oneOf([
      "pending",
      "paid",
      "fulfilled",
      "cancelled",
      "refunded",
      "partially_refunded",
    ])
    .optional(),
  currency: Yup.string().length(3).required(),
  totals: Yup.object({
    items: Yup.number().min(0).required(),
    payment: Yup.number().min(0).optional(),
    discount: Yup.number().min(0).optional(),
    shipping: Yup.number().min(0).optional(),
    grand: Yup.number().min(0).required(),
    cod: Yup.number().min(0).optional(),
  }).optional(),
  payment: Yup.object({
    method: Yup.string()
      .transform((v) => (v ? v.toLowerCase() : v))
      .oneOf(["card", "cod", "bkash", "nagad", "stripe", "paypal"])
      .optional(),
    status: Yup.string()
      .oneOf(["unpaid", "authorized", "paid", "refunded", "partial"])
      .optional(),
    // transaction_id: Yup.string().optional(),
  }).optional(),
  fulfillment: Yup.object({
    status: Yup.string()
      .oneOf(["unfulfilled", "partial", "fulfilled"])
      .optional(),
    courier: Yup.string().optional(),
    tracking_numbers: Yup.array().of(Yup.string()).optional().default([]),
  }).optional(),
  customer: CustomerSchemaCOD.required(),
  shipping_address: AddressSchema.nullable(),
  notes: Yup.string().nullable(),
  items: Yup.array().of(OrderItemSchema).min(1).required(),
  meta: Yup.object().nullable(),
}).test("totals-consistency", "Totals do not add up", (order) => {
  if (!order) return false;
  const itemsSum = order.items.reduce((s, it) => s + (it.line_total ?? 0), 0);
  const expectedGrand =
    itemsSum - order.totals.discount + order.totals.shipping;
  return (
    Math.abs(expectedGrand - order.totals.grand) < 0.01 &&
    Math.abs(itemsSum - order.totals.items) < 0.01
  );
});

export const orderGurValidationSchemaCOD = Yup.object({
  id: Yup.string().optional(),
  created_at: Yup.string().optional(),
  updated_at: Yup.string().optional(),
  status: Yup.string()
    .oneOf([
      "pending",
      "paid",
      "fulfilled",
      "cancelled",
      "refunded",
      "partially_refunded",
    ])
    .optional(),
  currency: Yup.string().length(3).required(),
  totals: Yup.object({
    items: Yup.number().min(0).required(),
    payment: Yup.number().min(0).optional(),
    discount: Yup.number().min(0).optional(),
    shipping: Yup.number().min(0).optional(),
    grand: Yup.number().min(0).required(),
    cod: Yup.number().min(0).optional(),
  }).optional(),
  payment: Yup.object({
    method: Yup.string()
      .transform((v) => (v ? v.toLowerCase() : v))
      .oneOf(["card", "cod", "bkash", "nagad", "stripe", "paypal"])
      .optional(),
    status: Yup.string()
      .oneOf(["unpaid", "authorized", "paid", "refunded", "partial"])
      .optional(),
    // transaction_id: Yup.string().optional(),
  }).optional(),
  fulfillment: Yup.object({
    status: Yup.string()
      .oneOf(["unfulfilled", "partial", "fulfilled"])
      .optional(),
    courier: Yup.string().optional(),
    tracking_numbers: Yup.array().of(Yup.string()).optional().default([]),
  }).optional(),
  customer: CustomerSchemaCOD.required(),
  shipping_address: AddressSchema.nullable(),
  notes: Yup.string().nullable(),
  items: Yup.array().of(OrderItemSchema).min(1).required(),
  meta: Yup.object({
    source: Yup.string().required(),
  }).optional(),
}).test("totals-consistency", "Totals do not add up", (order) => {
  if (!order) return false;
  const itemsSum = order.items.reduce((s, it) => s + (it.line_total ?? 0), 0);
  const expectedGrand =
    itemsSum - order.totals.discount + order.totals.shipping;
  return (
    Math.abs(expectedGrand - order.totals.grand) < 0.01 &&
    Math.abs(itemsSum - order.totals.items) < 0.01
  );
});
