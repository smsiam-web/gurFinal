import React, { useEffect, useState } from "react";
import OrderTableRow from "./OrderTableRow";
import OrderTableMobile from "./OrderTableMobile";
import { db } from "./../../utils/firebase";
import { LoadingOverlay } from "@mantine/core";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/redux/slices/authSlice";

const OrderTable = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useSelector(selectUser);

  // Get orders from firebase
  useEffect(() => {
    setLoading(true);
    db.collection("orders")
      .orderBy("created_at", "desc")
      .get()
      .then((querySnapshot) => {
        const orders = [];
        querySnapshot.forEach((doc) => {
          orders.push({
            id: doc.id,
            ...doc.data(),
            created_at: doc.data().created_at.toDate().getTime(),
          });
        });
        const filterOrder = orders.filter((item) => {
          const filterItem = [];
          if (item.user_details.uid !== user.uid) return;
          //
          filterItem.push(item);
          return filterItem;
        });
        setOrders(filterOrder);
      })
      .finally(() => setLoading(false));
  }, []);
  console.log(orders);

  return (
    <div className="relative w-full">
      <LoadingOverlay visible={loading} />
      {orders.length ? (
        <div>
          <div className="mx-auto mb-3 border-b md:border-none max-w-5xl">
            <h1 className="text-2xl md:text-3xl xl:text-4xl text-center font-bold py-4 capitalize">
              Your Order
            </h1>
          </div>
          <table className="w-full md:table hidden mx-4">
            <thead className="bg-gray-100">
              <tr className="text-left w-full">
                <th className="text-title py-5 pl-3 w-24">Order Id</th>
                <th className="text-title py-5 w-44">Products</th>
                <th className="text-title py-5 w-[120px]">Total Price</th>
                <th className="text-title py-5 w-[140px]">Time ago</th>
                <th className="text-title py-5 w-20">Payment</th>
                <th className="text-title py-5 w-24">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((item, i) => (
                <OrderTableRow key={i} {...item} />
              ))}
            </tbody>
          </table>
          {orders.map((item, i) => (
            <OrderTableMobile key={i} {...item} />
          ))}
        </div>
      ) : (
        <div className="mx-auto w-full">
          <h1 className="text-2xl md:text-3xl xl:text-4xl text-center font-bold pb-6 py-8">
            {loading ? "Finding your Order..." : "Waiting for your Order..."}
          </h1>
          <div className="max-w-full flex items-center justify-center">
            <img
              src="/gif/order.jpg"
              loading="lazy"
              alt="Empty_gif"
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTable;
