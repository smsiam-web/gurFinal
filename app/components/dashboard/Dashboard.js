import { selectUser } from "@/app/redux/slices/authSlice";
import { auth, db } from "@/app/utils/firebase";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiLogOut, FiSettings } from "react-icons/fi";
import AccountProfile from "./accountInfo/AccountProfile";
import AccountStatus from "./accountInfo/AccountStatus";
import AccountAddress from "./accountInfo/AccountAddress";
import Button from "../shared/Button";
import Link from "next/link";

const Dashboard = () => {
  const user = useSelector(selectUser);

  const [orders, setOrders] = useState([]);

  // Get orders from firebase
  useEffect(() => {
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
      });
  }, []);

  return (
    <div className="md:px-8 rounded-md">
      <div className="py-4 md:py-0">
        {/* cover image  */}
        <div className="h-2/5 relative">
          <img
            src="/cover.png"
            alt=""
            className="w-full object-top rounded-md"
          />
        </div>
        <AccountProfile />

        <AccountStatus orders={orders} />
        <div className="py-6 md:p-6  grid grid-cols-6 gap-6 bg-white rounded-b-md">
          <AccountAddress />
          <div className="col-span-6 sm:col-span-3">
            <Link href={"/my-account/edit-account"} legacyBehavior>
              <Button
                icon={<FiSettings size={20} />}
                title="Update Profile"
                className={
                  "bg-primary opacity-90 hover:opacity-100 text-white w-full text-sm"
                }
              />
            </Link>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <Button
              onClick={() => auth.signOut()}
              icon={<FiLogOut size={20} />}
              title="Log Out"
              className={
                "bg-slate-800 opacity-90 hover:opacity-100 text-white w-full text-sm"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
