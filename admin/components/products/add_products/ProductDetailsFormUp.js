import React, { useState } from "react";
import { FieldArray, useFormikContext, getIn } from "formik";
import { AppTextArea, FormDropdown, FormInput } from "../../shared/Form";
import { CATEGORY } from "@/admin/configs";


const STATUS_ITEMS = [
  { name: "Draft", id: "draft" },
  { name: "Active", id: "active" },
  { name: "Archived", id: "archived" },
];

const UNIT = [
  { name: "kg", id: "kg" },
  { name: "pc", id: "pc" },
  { name: "ml", id: "ml" },
  { name: "combo", id: "combo" },
  { name: "box", id: "box" },
  { name: "Carat", id: "Carat" },
  { name: "Lt", id: "Lt" },
];

const YES_NO = [
  { name: "Yes", id: true },
  { name: "No", id: false },
];

const CURRENCY = [
  { name: "BDT", id: "BDT" },
  { name: "USD", id: "USD" },
];

const ProductDetailsFormUp = (edit) => {
  const { values, setFieldValue } = useFormikContext(); // <-- no <any>

  const hasVariants = !!getIn(values, "has_variants");

  const generateVariantRows = () => {
    const colorVals = (getIn(values, "options[0].values") || [])
      .map((v) => (v ? v.value : ""))
      .filter(Boolean);
    const sizeVals = (getIn(values, "options[1].values") || [])
      .map((v) => (v ? v.value : ""))
      .filter(Boolean);

    const colors = colorVals.length ? colorVals : [""];
    const sizes = sizeVals.length ? sizeVals : [""];

    const rows = colors.flatMap((c) =>
      sizes.map((s) => {
        const option_values = [];
        if (c) option_values.push({ option_name: "Color", id: c });
        if (s) option_values.push({ option_name: "Size", id: s });
        return {
          sku: "",
          currency: getIn(values, "currency") || "BDT",
          price: "",
          compare_at_price: "",
          is_active: true,
          option_values,
          inventory: [
            {
              location_code: "MAIN",
              stock_on_hand: 0,
              stock_reserved: 0,
              reorder_point: 0,
              allow_backorder: false,
            },
          ],
        };
      })
    );

    setFieldValue(
      "variants",
      rows.length
        ? rows
        : [
            {
              sku: "",
              currency: getIn(values, "currency") || "BDT",
              price: "",
              compare_at_price: "",
              is_active: true,
              option_values: [],
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
          ]
    );
  };

  return (
    <div className="max-h-full space-y-4">
      {/* BASICS */}
      <div>
        <span>Product ID (Unique)</span>
        <FormInput name="id" placeholder="ID must be unique" />
      </div>
      <div>
        <span>Product Status</span>
        <FormDropdown
          name="status"
          placeholder="Select status"
          items={STATUS_ITEMS}
        />
      </div>

      <div>
        <span>Product SKU (single-SKU only)</span>
        <FormInput name="single_sku" placeholder="Product SKU" />
      </div>

      <div>
        <span>Pathao Store ID</span>
        <FormInput name="store_id" placeholder="Pathao Store ID" />
      </div>

      <div>
        <span>Product Title/Name</span>
        <FormInput name="title" placeholder="Product title" />
      </div>

      <div>
        <span>Brand</span>
        <FormInput name="brand" placeholder="Brand (optional)" />
      </div>

      <div>
        <span>Product Slug</span>
        <FormInput name="slug" placeholder="mens-classic-tee" />
      </div>

      <div>
        <span>Product Description</span>
        <AppTextArea name="description" placeholder="Product details" />
      </div>

      {/* CATEGORIES */}
      <div>
        <span>Category</span>
        <FormDropdown
          name="categories[0].id"
          placeholder="Select category"
          items={CATEGORY}
        />
      </div>

      <div>
        <span>Available From</span>
        <FormInput
          type="date"
          name="available_from"
          placeholder="Available From"
        />
      </div>

      {/* UNIT */}
      <div>
        <span>Unit (kg/pc/lb/ml/g...etc)</span>
        <FormDropdown name="attributes.Unit" placeholder="Unit" items={UNIT} />
      </div>
      {/* UNIT */}
      <div>
        <span>Unit Weight</span>
        <FormInput name="attributes.unitWgt" placeholder="Unit Weight" />
      </div>

      {/* VARIANT TOGGLE */}
      <div>
        <span>Has Variants? (Size/Color)</span>
        <FormDropdown name="has_variants" placeholder="Select" items={YES_NO} />
      </div>

      {/* SINGLE SKU PRICE/STOCK */}
      {!hasVariants && (
        <div className="grid grid-cols-2 gap-3 p-3 border rounded">
          <div className="col-span-2 font-medium">
            Single SKU Pricing & Stock
          </div>
          <div>
            <span>Product Price</span>
            <FormInput
              name="price"
              placeholder="Original price (Compare at)"
              type="number"
            />
          </div>
          <div>
            <span>Sale Price</span>
            <FormInput
              name="sale_price"
              placeholder="Sale price (current)"
              type="number"
            />
          </div>
          <div>
            <span>Currency</span>
            <FormDropdown
              name="currency"
              placeholder="Currency"
              items={CURRENCY}
            />
          </div>
          <div>
            <span>Stock (MAIN)</span>
            <FormInput name="stock" placeholder="Quantity" type="number" />
          </div>
        </div>
      )}

      {/* OPTIONS (Color / Size) */}
      {hasVariants && (
        <div className="space-y-3 p-3 border rounded">
          <div className="font-medium">Options (builds product.options)</div>

          {/* Option 1: Color */}
          <div className="space-y-2">
            <span className="block font-medium">Option 1: Color</span>
            <FormInput name="options[0].name" defaultValue="Color" />
            <FieldArray
              name="options[0].values"
              render={({ push, remove }) => (
                <div className="space-y-2">
                  {(getIn(values, "options[0].values") || []).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <FormInput
                        name={`options[0].values[${idx}].value`}
                        placeholder="Color value (e.g., Black)"
                      />
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-sm text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <AddOptionValue
                    onAdd={(val) => push({ value: val })}
                    placeholder="Add color (press Enter)"
                  />
                </div>
              )}
            />
          </div>

          {/* Option 2: Size */}
          <div className="space-y-2">
            <span className="block font-medium">Option 2: Size</span>
            <FormInput name="options[1].name" defaultValue="Size" />
            <FieldArray
              name="options[1].values"
              render={({ push, remove }) => (
                <div className="space-y-2">
                  {(getIn(values, "options[1].values") || []).map((_, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <FormInput
                        name={`options[1].values[${idx}].value`}
                        placeholder="Size value (e.g., M)"
                      />
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="text-sm text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <AddOptionValue
                    onAdd={(val) => push({ value: val })}
                    placeholder="Add size (press Enter)"
                  />
                </div>
              )}
            />
          </div>

          <button
            type="button"
            className="text-sm underline"
            onClick={generateVariantRows}
          >
            Generate variants from Color × Size
          </button>
        </div>
      )}

      {/* VARIANTS LIST */}
      {hasVariants && (
        <div className="space-y-3 p-3 border rounded">
          <div className="font-medium">
            Variants (writes to product.variants[])
          </div>

          <FieldArray
            name="variants"
            render={({ push, remove }) => (
              <>
                {(getIn(values, "variants") || []).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-6 gap-3 p-3 border rounded"
                  >
                    <div className="col-span-6 flex items-center justify-between">
                      <div className="font-medium">Variant {i + 1}</div>
                      <button
                        type="button"
                        className="text-sm text-red-500"
                        onClick={() => remove(i)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 col-span-6 gap-2">
                      <div className="col-span-1">
                        <span>SKU</span>
                        <FormInput
                          name={`variants[${i}].sku`}
                          placeholder="SKU"
                        />
                      </div>

                      <div className="col-span-1">
                        <span>Currency</span>
                        <FormDropdown
                          name={`variants[${i}].currency`}
                          placeholder="Currency"
                          items={CURRENCY}
                        />
                      </div>

                      <div className="col-span-1">
                        <span>Price (current)</span>
                        <FormInput
                          name={`variants[${i}].price`}
                          placeholder="0.00"
                          type="number"
                        />
                      </div>

                      <div className="col-span-1">
                        <span>Compare at (original)</span>
                        <FormInput
                          name={`variants[${i}].compare_at_price`}
                          placeholder="0.00"
                          type="number"
                        />
                      </div>

                      <div className="col-span-1">
                        <span>Active?</span>
                        <FormDropdown
                          name={`variants[${i}].is_active`}
                          placeholder="Active"
                          items={YES_NO}
                        />
                      </div>
                    </div>

                    {/* Option Values */}
                    <div className="col-span-3">
                      <span>Color</span>
                      <FormDropdown
                        name={`variants[${i}].option_values[0].value`}
                        placeholder="Select color"
                        items={(getIn(values, "options[0].values") || []).map(
                          (v) => ({ name: v.value, id: v.value })
                        )}
                      />
                      <FormInput
                        name={`variants[${i}].option_values[0].option_name`}
                        defaultValue="Color"
                        hidden
                      />
                    </div>
                    <div className="col-span-3">
                      <span>Size</span>
                      <FormDropdown
                        name={`variants[${i}].option_values[1].value`}
                        placeholder="Select size"
                        items={(getIn(values, "options[1].values") || []).map(
                          (v) => ({ name: v.value, id: v.value })
                        )}
                      />
                      <FormInput
                        name={`variants[${i}].option_values[1].option_name`}
                        defaultValue="Size"
                        hidden
                      />
                    </div>

                    {/* Inventory (single MAIN location) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 col-span-6 gap-2">
                      <div className="col-span-1">
                        <span>Stock on hand</span>
                        <FormInput
                          name={`variants[${i}].inventory[0].stock_on_hand`}
                          placeholder="0"
                          type="number"
                        />
                      </div>
                      <div className="col-span-1">
                        <span>Reserved</span>
                        <FormInput
                          name={`variants[${i}].inventory[0].stock_reserved`}
                          placeholder="0"
                          type="number"
                        />
                      </div>
                      <div className="col-span-1">
                        <span>Reorder point</span>
                        <FormInput
                          name={`variants[${i}].inventory[0].reorder_point`}
                          placeholder="0"
                          type="number"
                        />
                      </div>
                      <div className="col-span-1">
                        <span>Allow backorder?</span>
                        <FormDropdown
                          name={`variants[${i}].inventory[0].allow_backorder`}
                          placeholder="No"
                          items={YES_NO}
                        />
                        <FormInput
                          name={`variants[${i}].inventory[0].location_code`}
                          defaultValue="MAIN"
                          hidden
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="text-sm underline"
                  onClick={() =>
                    push({
                      sku: "",
                      currency: getIn(values, "currency") || "BDT",
                      price: "",
                      compare_at_price: "",
                      is_active: true,
                      option_values: [],
                      inventory: [
                        {
                          location_code: "MAIN",
                          stock_on_hand: 0,
                          stock_reserved: 0,
                          reorder_point: 0,
                          allow_backorder: false,
                        },
                      ],
                    })
                  }
                >
                  + Add variant
                </button>
              </>
            )}
          />
        </div>
      )}

      {/* SEO */}
      <div className="p-3 border rounded space-y-3">
        <div className="font-medium">SEO</div>
        <div>
          <span>SEO Title</span>
          <FormInput name="seo.title" placeholder="SEO title" />
        </div>
        <div>
          <span>SEO Description</span>
          <AppTextArea
            name="seo.description"
            placeholder="SEO description (max 300 chars)"
          />
        </div>
      </div>

      {/* TAGS */}
      <div>
        <span>Product Tags</span>
        <FormInput
          name="attributes.Tags"
          placeholder="Write then press enter…"
        />
      </div>
    </div>
  );
};

function AddOptionValue({ onAdd, placeholder }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) {
            onAdd(val.trim());
            setVal("");
            e.preventDefault();
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 text-sm border-gray-300 focus:border-primary outline-none"
      />
      <button
        type="button"
        onClick={() => {
          if (!val.trim()) return;
          onAdd(val.trim());
          setVal("");
        }}
        className="text-sm text-green-600"
      >
        + Add
      </button>
    </div>
  );
}

export default ProductDetailsFormUp;
