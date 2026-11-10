import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { notifications } from "@mantine/notifications";

import { AppForm, FormBtn } from "../../shared/Form";
import FormHeader from "../../shared/FormHeader";
import Button from "../../shared/Button";

import { db } from "@/app/utils/firebase";
import { selectUser } from "@/app/redux/slices/authSlice";
import { selectConfig } from "@/app/redux/slices/configSlice";
import axios from "axios";
import firebase from "firebase";
import OrderDetailsFormUp from "./OrderDetails";
import {
  orderGurValidationSchemaCOD,
  orderValidationSchemaCOD,
} from "@/lib/validationSchema";
import { updateCounters } from "@/lib/counters";
import { ERROR_MEANINGS } from "@/admin/configs";

// Normalize values → IMPORTANT: grand = items - discount + shipping (schema)
const normalizeOrder = (values) => {
  const now = new Date().toISOString();
  const v = { ...values };

  v.created_at = v.created_at || now;
  v.updated_at = now;

  v.currency = (v.currency || "BDT").toUpperCase();
  v.items = (v.items || []).map((it) => ({
    ...it,
    currency: (it.currency || v.currency || "BDT").toUpperCase(),
    line_total:
      typeof it.line_total === "number"
        ? it.line_total
        : Number(it.price || 0) * Number(it.quantity || 0),
  }));

  v.payment = {
    method: (v.payment?.method || "cod").toLowerCase(),
    status: v.payment?.status || "unpaid",
    transaction_id: v.payment?.transaction_id || null,
  };

  v.fulfillment = {
    status: v.fulfillment?.status || "unfulfilled",
    courier: v.fulfillment?.courier || "SteadFast",
    tracking_numbers: v.fulfillment?.tracking_numbers || [],
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

  v.meta = { ...(v.meta || {}), source: v?.meta?.source || "web" };

  return v;
};

const AddOrder = ({ onClick }) => {
  const [loading, setLoading] = useState(false);
  const [config] = useState(useSelector(selectConfig) || null);

  const user = useSelector(selectUser);
  const router = useRouter();

  const placeOrder = async (values) => {
    console.log(values);

    setLoading(true);

    // Normalize + validate (schema checks grand consistency)
    const normalized = normalizeOrder(values);

    await orderValidationSchemaCOD.validate(normalized, { abortEarly: false });

    const prefix = process.env.INVOICE_PREFIX_02 || "";
    const counterRef = db.collection("counters").doc("GurOrderCounter");

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
          normalized?.fulfillment?.courier || "SteadFast"
        ).toLowerCase();

        let fulfillmentPatch = { courier: normalized?.fulfillment?.courier };

        try {
          switch (courierSel) {
            case "steadfast": {
              const sfPayload = {
                cod_amount: `${normalized?.totals?.cod || 0}`,
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
                  fulfillmentPatch.consignment_id
                    ? ` · TRC: ${fulfillmentPatch.consignment_id}`
                    : ""
                }`,
                color: "blue",
                autoClose: 6000,
              });
              break;
            }

            case "pathao": {
              const orderPayload = {
                store_id: 344188,
                merchant_order_id: `${orderID}`,
                recipient_name: `${normalized?.customer?.name || ""}`,
                recipient_phone: `${normalized?.customer?.phone || ""}`,
                recipient_address: `${
                  normalized?.shipping_address?.street || ""
                }`,
                delivery_type: 48,
                item_type: 2,
                special_instruction: `${normalized?.notes || ""}`,
                item_quantity: 1,
                item_weight: `${normalized?.totals?.qtySum || 1}`,
                item_description: `${normalized?.notes || ""}`,
                amount_to_collect: `${normalized?.totals?.cod || 0}`,
              };

              const resp = await fetch("/api/pathaoAamWala/place-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload),
              });
              const result = await resp.json();

              if (!resp.ok || result?.type === "error") {
                throw new Error(result?.message || "Pathao order failed");
              }

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

            default: {
              fulfillmentPatch = { courier: normalized?.fulfillment?.courier };
            }
          }
        } catch (err) {
          console.error("Courier create failed:", err);
          notifications.show({
            title: "Courier create failed",
            message: err?.message || "Please try again later.",
            color: "orange",
            autoClose: 6000,
          });
        }

        const orderData = {
          ...normalized,
          fulfillment: { ...normalized.fulfillment, ...fulfillmentPatch },
          categories: values?.items?.[0]?.categories || "N/A",
          orderID,
          created_user: user?.name || "admin",
        };

        try {
          await db.collection("ordersGur").doc(orderID).set(orderData);
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
          await sendConfirmationMsg(normalized, orderID);
          router.push("/place-gur/id=" + orderID);
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
          created_at: new Date().toISOString(),
          created_user: user?.name || "admin",
        });
      console.log("Customer created successfully");
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  };

  const sendConfirmationMsg = async (values, orderID) => {
    const customer_name = values?.customer?.name || "Customer";
    const company_contact = process.env.SENDER_HOTLINE_02 || "";
    const company_name = process.env.APP_TITLE_02 || "";
    const cod = values?.totals?.grand;

    const url = "https://api.sms.net.bd/sendsms";
    const apiKey = config?.[0]?.values?.bulk_auth;
    const message = `Dear ${customer_name}, Your order has been successfully placed at ${company_name}. Invoice No: ${orderID}. Please keep BDT: ${cod}tk ready while receiving the parcel. Hotline: +88${company_contact}. Thanks for being with us.`;

    const to = values?.customer?.phone;

    const formData = new FormData();
    formData.append("api_key", apiKey);
    formData.append("msg", message);
    formData.append("to", to);

    try {
      const response = await axios.post(url, formData);
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
    } catch (error) {
      console.error("SMS send failed:", error);
    }
  };

  return (
    <main>
      <div>
        <AppForm
          initialValues={{
            status: "pending",
            currency: "BDT",
            customer: { name: "", phone: "" },
            shipping_address: {
              street: "",
              city: "",
              state: "",
              country: "BD",
            },
            payment: { method: "cod", status: "unpaid", transaction_id: "" },
            fulfillment: {
              status: "unfulfilled",
              courier: "Pathao",
              tracking_numbers: [],
            },
            items: [],
            discounts: [],
            totals: {
              items: 0,
              payment: 0,
              discount: 0,
              shipping: 0,
              grand: 0,
              cod: 0,
            },
            meta: { source: "" },
            notes: "",
          }}
          validationSchema={orderGurValidationSchemaCOD}
          onSubmit={placeOrder}
        >
          <div className="h-screen relative">
            <div className="w-full">
              <FormHeader
                onClick={onClick}
                title="Place Order"
                sub_title="Add items and customer details, then submit."
              />
            </div>

            <div className="w-full h-[75%] md:h-[80%] overflow-y-scroll py-3 px-6 md:px-4 mb-4">
              <OrderDetailsFormUp />
            </div>

            <div className="fixed bottom-0 right-0 w-full bg-gray-50">
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
                    type="submit"
                    title="Submit"
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

export default AddOrder;
