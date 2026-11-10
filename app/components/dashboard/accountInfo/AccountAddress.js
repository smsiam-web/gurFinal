import { selectUser } from "@/app/redux/slices/authSlice";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { MdLocationOn } from "react-icons/md";
import { useSelector } from "react-redux";
import Division from "../../../data/Divisions/divisions.json";
import State from "../../../data/State/districts.json";
import Upazilas from "../../../data/Upazilas/upazilas.json";
import Unions from "../../../data/Unions/unions.json";
import { useRouter } from "next/router";

const AccountAddress = () => {
  // get User from Redux
  const user = useSelector(selectUser);
  const route = useRouter();
  // console.log(route.asPath);
  //set Hooks
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [upazila, setUpazila] = useState("");
  const [union, setUnion] = useState("");

  useEffect(() => {
    Division[2].data.filter((item) => {
      if (item.id !== user?.billing_details?.state) return;
      setState(item.bn_name);
    });
    State[2].data.filter((item) => {
      if (item.id !== user?.billing_details?.city) return;
      setCity(item.bn_name);
    });
    Upazilas[2].data.filter((item) => {
      if (item.id !== user?.billing_details?.upazila) return;
      setUpazila(item.bn_name);
    });
    Unions[2].data.filter((item) => {
      if (item.id !== user?.billing_details?.union) return;
      setUnion(item.bn_name);
    });
  }, []);

  return (
    <main className="col-span-6 p-6 border w-auto rounded-md hover:shadow-lg animate-duration">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold pb-2">Shipping Address</h1>
        <Link href={"/my-account/addresses"} legacyBehavior>
          <span
            title="Edit"
            className="text-red-600 bg-red-200 py-1 px-3 cursor-pointer h-fit rounded-md"
          >
            Edit
          </span>
        </Link>
      </div>
      <div className="flex p-1 gap-2">
        <span className="text-indigo-600 bg-indigo-200 p-2 h-fit rounded-full">
          <MdLocationOn size={26} />
        </span>
        <div className="flex flex-col">
          <h2 className="text-xl text-title font-semibold">{user?.name}</h2>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:pr-6">
              <p className="text-base text-sub-title">
                {user?.billing_details?.email || ""}
              </p>
              <p className="text-base text-sub-title pb-1">
                {user?.billing_details?.phone || ""}
              </p>
              <span className="text-sm text-title">
                {user?.billing_details?.street_address || ""}
              </span>
            </div>

            <div className=" bg-indigo-200 p-5 rounded-md text-title lg:tl-4 grid grid-cols-6 gap-3 lg:pl-6">
              <span className="text-sm col-span-6 sm:col-span-3">
                ইউঃ<span className=""> {union},</span>
              </span>
              <span className="text-sm col-span-6 sm:col-span-3">
                উপজেলাঃ<span className=""> {upazila},</span>
              </span>
              <span className="text-sm col-span-6 sm:col-span-3">
                জেলাঃ<span className=""> {city},</span>
              </span>
              <span className="text-sm col-span-6 sm:col-span-3">
                বিভাগঃ<span className=""> {state}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AccountAddress;
