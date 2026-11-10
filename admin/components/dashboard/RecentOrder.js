import React from "react";

const RecentOrder = () => {
  return (
    <div className="grid gap-4 w-full overflow-hidden">
      <h1 className="text-title pb-4 text-2xl font-medium">Recent Order</h1>
      <div className="w-full overflow-x-scroll rounded-md">
        <table className="w-full whitespace-nowrap table-auto">
          <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200  bg-gray-100">
            <tr>
              <td className="px-4 py-3 ">Order Time</td>
              <td className="px-4 py-3 ">Delivery Address</td>
              <td className="px-4 py-3 ">Phone</td>
              <td className="px-4 py-3 ">Payment method</td>
              <td className="px-4 py-3 ">Order amount</td>
              <td className="px-4 py-3 ">Status</td>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 ">
            <tr className="">
              <td className="px-4 py-3">
                <span className="text-sm">Apr 4, 2023</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm ">
                  Lahore cantt,Askari 10,Block D,House 452,Street 9
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm">3rfrdg</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold">COD</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold">$33.00</span>
              </td>
              <td className="px-4 py-3">
                <span className="font-serif">
                  <span className="inline-flex px-2 text-xs font-medium leading-5 rounded-full text-yellow-500 bg-yellow-100">
                    Pending
                  </span>
                </span>
              </td>
            </tr>
            <tr className="">
              <td className="px-4 py-3">
                <span className="text-sm">Apr 4, 2023</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm ">dfvsxdf</span>
              </td>
              <td className="px-4 py-3">
                {" "}
                <span className="text-sm">1478525874</span>{" "}
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold">COD</span>
              </td>
              <td className="px-4 py-3">
                {" "}
                <span className="text-sm font-semibold">$182.00</span>{" "}
              </td>
              <td className="px-4 py-3">
                <span className="font-serif">
                  <span className="inline-flex px-2 text-xs font-medium leading-5 rounded-full text-yellow-500 bg-yellow-100">
                    Pending
                  </span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentOrder;
