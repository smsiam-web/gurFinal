import { selectUser } from "@/app/redux/slices/authSlice";
import React from "react";
import { useSelector } from "react-redux";

const AccountProfile = () => {
  // get User from Redux
  const user = useSelector(selectUser);

  return (
    <div className="flex flex-col items-center md:flex-row gap-3 py-6 border-b bg-white px-6">
      <img
        src={user.image}
        alt="user_img"
        className="rounded-full w-[120px] h-[120px] object-cover object-center"
      />
      <div className="flex flex-col items-center md:items-start py-2 gap-1">
        <h1 className="text-2xl sm:text-2xl font-bold text-title ">
          {user.name}
        </h1>
        <span className="text-primary text-base pl-1">{user.email}</span>
        <span className="text-sub-title text-base pl-1">
          {user.billing_details?.phone || "01234 567889"}
        </span>
      </div>
    </div>
  );
};

export default AccountProfile;
