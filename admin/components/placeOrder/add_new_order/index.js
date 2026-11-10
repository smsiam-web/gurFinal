import React, { useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { notifications } from "@mantine/notifications";

import { AppForm, FormBtn } from "../../shared/Form";
import Button from "../../shared/Button";

import { db, timestamp } from "@/app/utils/firebase"; // timestamp not needed; we’ll use new Date().toISOString()
import { selectUser } from "@/app/redux/slices/authSlice";
import { selectConfig } from "@/app/redux/slices/configSlice";
import {
  selectSingleCustomer,
  updateSingleCustomer,
} from "@/app/redux/slices/singleCustomerSlice";
import firebase from "firebase";
import { orderValidationSchemaCOD } from "@/lib/validationSchema";
import OrderDetailsFormUp from "../add_order/OrderDetails";
import { updateCounters } from "@/lib/counters";
import { ERROR_MEANINGS } from "@/admin/configs";
import axios from "axios";

// Helper to uppercase currency and normalize method casing, etc.
const normalizeOrder = (values) => {
  const now = new Date().toISOString();

  const v = { ...values };
  console.log(values);

  // Ensure required top-level timestamps exist
  v.created_at = v.created_at || now;
  v.updated_at = now;
  v.categories = v.items.length === 1 ? v.items[0]?.categories : "Double";
  // Normalize currency (top-level + items)
  v.currency = (v.currency || "BDT").toUpperCase();
  v.items = (v.items || []).map((it) => ({
    ...it,
    currency: (it.currency || v.currency || "BDT").toUpperCase(),
    // Keep line_total consistent; UI already auto-computes it,
    // but recompute just in case:
    line_total:
      typeof it.line_total === "number"
        ? it.line_total
        : Number(it.price || 0) * Number(it.quantity || 0),
  }));

  // Payment/fulfillment normalizations
  v.payment = {
    method: (v.payment?.method || "cod").toLowerCase(),
    status: v.payment?.status || "unpaid",
    transaction_id: v.payment?.transaction_id || null,
  };

  v.fulfillment = {
    status: v.fulfillment?.status || "unfulfilled",
    courier: v.fulfillment?.courier || "Pathao",
    tracking_numbers: v.fulfillment?.tracking_numbers || [],
  };

  // Totals: keep items sum and grand consistent
  const itemsSum = v.items.reduce((s, it) => s + Number(it.line_total || 0), 0);
  const discount = Number(v?.totals?.discount || 0);
  const shipping = Number(v?.totals?.shipping || 0);
  const grand = +(itemsSum - discount + shipping).toFixed(2);

  v.totals = {
    items: +itemsSum.toFixed(2),
    discount: +discount.toFixed(2),
    shipping: +shipping.toFixed(2),
    grand,
  };
  console.log(v.items);

  // Default meta/source
  v.meta = { source: v?.meta?.source || "web" };

  return v;
};

const AddNewOrder = ({ onClick }) => {
  const [loading, setLoading] = useState(false);
  const [config] = useState(useSelector(selectConfig) || null);

  const user = useSelector(selectUser);
  const router = useRouter();

  // Submit handler
  const placeOrder = async (values) => {
    // 1) normalize + validate
    setLoading(true);
    const normalized = normalizeOrder(values);
    await orderValidationSchemaCOD.validate(normalized, { abortEarly: false });

    const counterRef = db.collection("counters").doc("JFOrderCounter");
    const prefix = process.env.INVOICE_PREFIX || "";

    db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists) {
        transaction.set(counterRef, { value: 1 });
        return 1;
      } else {
        transaction.update(counterRef, {
          value: firebase.firestore.FieldValue.increment(1),
        });
        return (counterDoc.data().value || 0) + 1;
      }
    })
      .then(async (newOrderId) => {
        const orderID = `${prefix}${newOrderId}`;
        const courierSel = String(
          normalized?.fulfillment?.courier || "Pathao"
        ).toLowerCase();

        // 2) courier অনুযায়ী 3rd-party order তৈরি
        let fulfillmentPatch = { courier: normalized?.fulfillment?.courier };

        try {
          switch (courierSel) {
            /** ------------------ PATHAO ------------------ **/
            case "pathao": {
              const orderPayload = {
                store_id: `${normalized?.items?.[0]?.store_id || ""}`,
                merchant_order_id: `${orderID}`,
                recipient_name: `${normalized?.customer?.name || ""}`,
                recipient_phone: `${normalized?.customer?.phone || ""}`,
                recipient_address: `${
                  normalized?.shipping_address?.street || ""
                }`,
                // Pathao specifics (adjust if you map dynamically)
                delivery_type: 48,
                item_type: 2,
                special_instruction: `${normalized?.notes || ""}`,
                item_quantity: 1,
                item_weight: "1",
                item_description: "",
                amount_to_collect: `${normalized?.totals?.grand || 0}`,
              };

              const resp = await fetch("/api/pathao/place-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload),
              });
              const result = await resp.json();

              if (!resp.ok || result?.type === "error") {
                throw new Error(result?.message || "Pathao order failed");
              }

              // result shape আপনার রুটে যেটা রিটার্ন করে সেটা অনুযায়ী pick করুন
              fulfillmentPatch = {
                courier: "Pathao",
                consignment_id:
                  result?.data?.consignment_id ??
                  result?.data?.data?.consignment_id ??
                  null,
                tracking_code:
                  result?.data?.tracking_code ??
                  result?.data?.data?.tracking_code ??
                  null,
                // raw রাখতে চাইলে:
                pathao_raw: result?.data,
              };

              notifications.show({
                title: "Success (Pathao)",
                message: `Order sent to Pathao${
                  fulfillmentPatch.consignment_id
                    ? ` · CN: ${fulfillmentPatch.consignment_id}`
                    : ""
                }`,
                color: "blue",
                autoClose: 6000,
              });
              break;
            }

            /** ---------------- STEADFAST ------------------ **/
            case "steadfast": {
              const sfPayload = {
                cod_amount: `${normalized?.totals?.grand || 0}`,
                invoice: `${orderID}`,
                note: `${normalized?.notes || ""}`,
                recipient_name: `${normalized?.customer?.name || ""}`,
                recipient_phone: `${normalized?.customer?.phone || ""}`,
                recipient_address: `${
                  normalized?.shipping_address?.street || ""
                }`,
              };

              const resp = await fetch("/api/steadfast/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sfPayload),
              });
              const result = await resp.json();

              if (!resp.ok || result?.type !== "success") {
                throw new Error(result?.message || "Steadfast order failed");
              }

              const cons = result?.data?.consignment || {};
              fulfillmentPatch = {
                courier: "SteadFast",
                consignment_id: cons?.consignment_id ?? null,
                tracking_code: cons?.tracking_code ?? null,
                steadfast_raw: result?.data,
              };

              notifications.show({
                title: "Success (Steadfast)",
                message: `Order sent to Steadfast${
                  fulfillmentPatch.tracking_code
                    ? ` · TRK: ${fulfillmentPatch.tracking_code}`
                    : ""
                }`,
                color: "blue",
                autoClose: 6000,
              });
              break;
            }

            /** --------------- NO 3rd-party --------------- **/
            default: {
              // অন্য কুরিয়ার/ম্যানুয়াল হলে তৃতীয় পক্ষ কল না করে শুধু লোকাল সেভ
              fulfillmentPatch = { courier: normalized?.fulfillment?.courier };
            }
          }
        } catch (err) {
          // 3rd-party ব্যর্থ হলেও লোকাল অর্ডার সেভ করব (status: pending)
          console.error("Courier create failed:", err);
          notifications.show({
            title: "Courier create failed",
            message: err?.message || "Please try again later.",
            color: "orange",
            autoClose: 6000,
          });
        }

        // 3) Firestore-এ সেভ
        const orderData = {
          ...normalized,
          fulfillment: { ...normalized.fulfillment, ...fulfillmentPatch },
          categories: values.categories = values.items.length === 1 ? values.items[0]?.categories : "Double",
            
          orderID,
          created_user: user?.name || "admin",
        };

        try {
          await db.collection("orders").doc(orderID).set(orderData);
          updateCounters(orderData);
        } catch (error) {
          notifications.show({
            title: "Failed to save order",
            message: "Please try again later.",
            color: "red",
            autoClose: 5000,
          });
          console.error("Error placing order:", error);
        } finally {
          sendConfirmationMsg(normalized, orderID);
          router.push("/place-order/id=" + orderID);
          setLoading(false);
          createCustomer(values, orderID);
        }
      })
      .catch((error) => {
        notifications.show({
          title: "Something went wrong!!!",
          message: "Please try again later.",
          color: "orange",
          autoClose: 7000,
        });
        setLoading(false);
        console.error("Transaction failed:", error);
      });
  };

  // create Customer on firebase database
  const createCustomer = async (values, orderID) => {
    if (!values?.customer.phone) {
      console.error("Missing phone number");
      return;
    }

    try {
      await db
        .collection("customers")
        .doc(values?.customer.phone)
        .set({
          customer: { ...values?.customer },
          shipping_address: { ...values?.shipping_address },
          items: [orderID],
          created_at: new Date().toISOString(), // or Firestore serverTimestamp()
          created_user: user?.name || "admin",
        });
      console.log("Customer created successfully");
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  };

  const sendConfirmationMsg = async (values, orderID) => {
    const customer_name = values?.customer?.name || "Customer";
    const company_contact = process.env.SENDER_HOTLINE || "";
    const company_name = process.env.APP_TITLE || "";
    const cod = values?.totals?.grand;

    const url = "https://api.sms.net.bd/sendsms";
    const apiKey = config[0]?.values.bulk_auth;
    const message = `Dear ${customer_name}, Your order has been successfully placed at ${company_name}. Invoice No: ${orderID}. Please keep BDT: ${cod}tk ready while receiving the parcel. Hotline: +88${company_contact}. Thanks for being with us.`;

    const to = values?.customer?.phone;

    const formData = new FormData();
    formData.append("api_key", apiKey);
    formData.append("msg", message);
    formData.append("to", to);

    axios
      .post(url, formData)
      .then((response) => {
        console.log(response.data);
        if (response?.data?.error == 0) {
          notifications.show({
            title: `SMS: Success`,
            message: ERROR_MEANINGS[0],
            color: "blue",
            autoClose: 7000,
          });
        } else if (response?.data?.error == 417) {
          notifications.show({
            title: `SMS: Error!`,
            message: ERROR_MEANINGS[response?.data?.error],
            color: "orange",
            autoClose: 7000,
          });
        } else {
          notifications.show({
            title: `SMS: Error!`,
            message: ERROR_MEANINGS[response?.data?.error],
            color: "red",
            autoClose: 7000,
          });
        }
      })
      .catch((error) => {
        throw new Error(error);
      });
  };

  return (
    <main>
      <div>
        <AppForm
          initialValues={{
            // --- Basics ---
            status: "pending",
            currency: "BDT",
            store_id: "",

            // --- Customer ---
            customer: {
              name: "",
              phone: "",
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

            // --- Items & Discounts ---
            items: [],

            // --- Totals (items auto-calculated in the form) ---
            totals: {
              items: 0,
              discount: 0,
              shipping: 0,
              grand: 0,
            },

            // --- Meta & notes ---
            meta: { source: "web" },
            notes: "",
          }}
          validationSchema={orderValidationSchemaCOD}
          onSubmit={placeOrder}
        >
          <div className="bg-white max-w-2xl mx-auto rounded-xl relative">
            <div className="w-full">
              <div className="flex gap-2 items-center justify-between py-3 px-6 md:px-4">
                <div className="grid gap-1">
                  <h1 className="text-tile text-xl font-medium md:text-2xl">
                    Place new order
                  </h1>
                  <p className="text-sm md:text-lg text-sub-title">
                    Add your product and necessary information from here.
                  </p>
                </div>
              </div>
            </div>
            <div className="">
              <div className="w-full py-3 px-6 md:px-4 mb-4">
                <OrderDetailsFormUp />
              </div>
              <div className="w-full">
                <div className="py-5 px-6 md:px-4 max-h-full grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Button
                      onClick={onClick}
                      title="Cancel"
                      className="bg-red-100 hover:bg-red-200 hover:shadow-lg text-red-600 transition-all duration-300 w-full"
                    />
                  </div>
                  <div className="col-span-2">
                    <FormBtn
                      disabled={loading}
                      loading={loading}
                      onClick={placeOrder}
                      title="Submit"
                      className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg text-white transition-all duration-300 w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppForm>
      </div>
    </main>
  );
};

export default AddNewOrder;
