import React from "react";
import Button from "@/app/components/shared/Button";
import { BiPlus } from "react-icons/bi";

const SearchCoupon = ({ onClick }) => {
  return (
    <>
      <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50  shadow-xs  mb-5">
        <div className="p-4">
          <div className="py-3 grid gap-4 lg:gap-6 xl:gap-6 md:flex xl:flex">
            {/* search category __ input  */}
            <div className="flex-grow-0  md:flex-grow lg:flex-grow xl:flex-grow">
              <input
                className="block w-full px-3 py-1 text-sm focus:outline-neutral-200 leading-5 rounded-md  border-gray-200 h-14 bg-gray-100 border-transparent focus:bg-white"
                type="search"
                // name="search"
                placeholder="Search by coupon code / name"
              />
            </div>

            {/* add category btn  */}
            <div className="w-full md:w-56 lg:w-56 xl:w-56">
              <Button
                onClick={onClick}
                title="Add Coupon"
                className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                icon=<BiPlus size={24} />
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchCoupon;
