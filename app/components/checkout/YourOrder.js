import { selectItems, selectTotalPrice } from "@/app/redux/slices/basketSlice";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { TbCurrencyTaka } from "react-icons/tb";
import { FormBtn, FormInput, FormRadio } from "../shared/Form";
import OrderItems from "./OrderItems";
import PaymentMethod from "./PaymentMethod";

const PAYMENT = [
  {
    id: "cod",
    title: "Cash on Delivery",
    image: "payment_cod.png",
    available: true,
  },
  {
    id: "dr_cr",
    title: "Credit/Debit Card",
    image: "payment_dr_cr.png",
    available: false,
  },
  {
    id: "bkash",
    title: "bkash",
    image: "payment_bkash.png",
    available: true,
  },
  {
    id: "nagod",
    title: "nagod",
    image: "payment_nagod.png",
    available: false,
  },
  {
    id: "rocket",
    title: "rocket",
    image: "payment_rocket.png",
    available: false,
  },
];

const YourOrder = ({ placeOrder, loading }) => {
  const orderItem = useSelector(selectItems);
  const totalPrice = useSelector(selectTotalPrice);

  // console.log(paymentMethod);

  return (
    <div>
      <h3 className="text-2xl mb-4 text-sub-title">Your order</h3>
      <div className="bg-gray-100 p-5 rounded-md">
        <div className="flex justify-between pb-5 border-b">
          <h2 className="text-base font-bold">PRODUCT</h2>
          <h2 className="text-base font-bold">TOTAL</h2>
        </div>
        <div className=" bg-white">
          {orderItem?.map((item, i) => (
            <OrderItems key={i} {...item} />
          ))}
        </div>
        <div className="flex justify-between py-5 border-b">
          <h2 className="text-base font-bold">Subtotal</h2>
          <h2 className="text-lg font-bold flex items-center">
            <TbCurrencyTaka size={20} />
            <span>{totalPrice}</span>
          </h2>
        </div>
        <div className="py-5 border-b space-y-3">
          <span className="text-title">Shipping</span>
          <ul className="flex justify-between items-center">
            <li className="">- Flat rate</li>
            <li className="flex gap-1 items-center">
              <TbCurrencyTaka size={20} />
              <span className="font-medium text-lg">00.0</span>
            </li>
          </ul>
          <ul className="flex justify-between items-center">
            <li className="">- COD Fee</li>
            <li className="flex gap-1 items-center">
              <TbCurrencyTaka size={20} />
              <span className="font-medium text-lg">00.0</span>
            </li>
          </ul>
        </div>
        <div className="flex justify-between py-5 border-b">
          <h2 className="text-lg font-bold">Total Payment</h2>
          <h2 className="text-lg font-bold text-green flex items-center text-greens">
            <TbCurrencyTaka size={24} />
            <span className="">{totalPrice}</span>
          </h2>
        </div>
        <div className="pt-5">
          <h2 className="text-lg font-bold">Payment method</h2>
          <div className="flex flex-1 flex-wrap items-center gap-4 p-3">
            {PAYMENT?.map((item) => (
              <PaymentMethod key={item.id} {...item} />
            ))}
            <FormInput
              editProfile={true}
              edit_input="hidden"
              name="payment"
              placeholder="Payment"
            />
          </div>
        </div>
      </div>
      <FormBtn title="Place Order" onClick={placeOrder} loading={loading} />
    </div>
  );
};

export default YourOrder;
