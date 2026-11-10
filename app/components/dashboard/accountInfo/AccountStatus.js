import React from "react";
import { FiShoppingCart, FiTruck } from "react-icons/fi";
import { MdOutlineDownloadDone, MdOutlinePendingActions } from "react-icons/md";

const AccountStatus = ({ orders }) => {
  return (
    <main>
      <div className="p-6 grid grid-cols-6 gap-6 bg-white border-b">
        <div className="col-span-6 sm:col-span-3 p-6 border rounded-md hover:shadow-lg animate-duration">
          <div className="flex items-center gap-3">
            <span className="p-4 text-red-600 bg-red-200 rounded-full text-center">
              <FiShoppingCart size={20} />
            </span>
            <h1 className="text-base flex flex-col font-semibold text-sub-title">
              Total Order{" "}
              <span className="text-2xl font-bold text-title">
                0{orders.length}
              </span>
            </h1>
          </div>
        </div>
        <div className="col-span-6 sm:col-span-3 p-6 border rounded-md hover:shadow-lg animate-duration">
          <div className="flex items-center gap-3">
            <span className="p-4 text-base text-orange-600 bg-orange-200 rounded-full text-center">
              <MdOutlinePendingActions size={20} />
            </span>
            <h1 className="text-base flex flex-col font-semibold text-sub-title">
              Pending Order{" "}
              <span className="text-2xl font-bold text-title">
                0{orders.length}
              </span>
            </h1>
          </div>
        </div>
        <div className="col-span-6 sm:col-span-3 p-6 border rounded-md hover:shadow-lg animate-duration">
          <div className="flex items-center gap-3">
            <span className="p-4 text-indigo-600 bg-indigo-200 rounded-full text-center">
              <FiTruck size={20} />
            </span>
            <h1 className="text-base flex flex-col font-semibold text-sub-title">
              Processing Order{" "}
              <span className="text-2xl font-bold text-title">00</span>
            </h1>
          </div>
        </div>
        <div className="col-span-6 sm:col-span-3 p-6 border rounded-md hover:shadow-lg animate-duration">
          <div className="flex items-center gap-3">
            <span className="p-4 text-emerald-600 bg-emerald-200  rounded-full text-center">
              <MdOutlineDownloadDone size={20} />
            </span>
            <h1 className="text-base flex flex-col font-semibold text-sub-title">
              Complete Order{" "}
              <span className="text-2xl font-bold text-title">00</span>
            </h1>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AccountStatus;
