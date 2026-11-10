import React, { useState } from "react";
import BillingInfo from "./BillingInfo";
import YourOrder from "./YourOrder";
import * as Yup from "yup";
import { AppForm } from "../shared/Form";
import { db, timestamp } from "@/app/utils/firebase";
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "@/app/redux/slices/authSlice";
import {
  selectItems,
  selectTotalPrice,
  updateBasket,
} from "@/app/redux/slices/basketSlice";
import { uuid } from "@/app/utils/helpers";
import { useRouter } from "next/router";

const validationSchema = Yup.object().shape({
  full_name: Yup.string().max(25).required().label("Full name"),
  state: Yup.string().label("বিভাগ"),
  city: Yup.string().required().label("জেলা"),
  upazila: Yup.string().required().label("উপজেলা"),
  union: Yup.string().required().label("ইউনিয়ন"),
  street_address: Yup.string().required().label("State / Province"),
  zip: Yup.string().required().label("ZIP / Postal code"),
  phone: Yup.string().required().label("Phone"),
  email: Yup.string().email().required().label("Email"),
  notes: Yup.string().max(500).label("Order notes"),
  payment: Yup.string().required().label("Payment Method"),
});

const CheckoutContent = () => {
  const user = useSelector(selectUser);
  const cartItems = useSelector(selectItems);
  const cartTotal = useSelector(selectTotalPrice);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  console.log(!!user.order_id);

  // place order handler on submit
  const placeOrder = async (values) => {
    setLoading(true);

    const order_id = uuid();

    await saveBillingDetails(values);

    router.push("/sucess?order_id=" + order_id);

    await placeOrderHandler(order_id);

    dispatch(updateBasket([]));

    setLoading(false);
  };

  // save billing details in user collection
  const saveBillingDetails = async (values) => {
    const ref = db.collection("users").doc(user.uid);
    return ref.set(
      {
        billing_details: values,
      },
      { merge: true }
    );
  };

  // save order details on firebase database
  const placeOrderHandler = async (order_id) => {
    const orderData = {
      order_id,
      user_details: { ...user },
      // billing_details: values,
      items: cartItems,
      total: cartTotal,
      created_at: timestamp,
    };
    await db.collection("orders").doc(order_id).set(orderData);
  };

  return (
    <main className="py-6 sm:py-8 md:py-10 lg:py-12">
      <div className="flex flex-wrap md:flex-nowrap gap-5">
        <AppForm
          initialValues={{
            full_name: user?.billing_details?.full_name || "",
            state: user?.billing_details?.state || "",
            city: user?.billing_details?.city || "",
            upazila: user?.billing_details?.upazila || "",
            union: user?.billing_details?.union || "",
            street_address: user?.billing_details?.street_address || "",
            zip: user?.billing_details?.zip || "",
            phone: user?.billing_details?.phone || "",
            email: user?.billing_details?.email || "",
            payment: true,
            notes: "",
          }}
          onSubmit={placeOrder}
          validationSchema={validationSchema}
        >
          <div className="w-full md:w-[60%]">
            <BillingInfo />
          </div>
          <div className="w-full md:w-[40%]">
            <YourOrder placeOrder={placeOrder} loading={loading} />
          </div>
        </AppForm>
      </div>
    </main>
  );
};

export default CheckoutContent;
