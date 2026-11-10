import { Pagination, Tooltip } from "@mantine/core";
import React, { useEffect, useState } from "react";
import { useMantineTheme } from "@mantine/core";
import { BsBagPlus } from "react-icons/bs";
import { RiDeleteBinLine } from "react-icons/ri";
import Link from "next/link";
import { db } from "@/app/utils/firebase";
import { TimeStampToDate } from "@/admin/utils/helpers";

const CustomersRow = () => {
  const theme = useMantineTheme();
  const [customers, setCustomer] = useState(null);
  const [page, setPagee] = useState(1);

  const setPage = (i) => {
    setPagee(i);
  };

  // Get customer from firebase database
  // useEffect(() => {
  //   const unSub = db.collection("createCustomer").onSnapshot((snap) => {
  //     const customer = [];
  //     snap.docs.map((doc) => {
  //       customer.push({
  //         ...doc.data(),
  //       });
  //     });
  //     setCustomer(customer);
  //   });
  //   return () => {
  //     unSub();
  //   };
  // }, []);

  return (
    <main>
      <div className="grid gap-4 w-full overflow-hidden">
        {/* <h1 className="text-title pb-4 text-2xl font-medium">Recent Order</h1> */}
        <div className="w-full overflow-x-scroll rounded-md">
          <table className="w-full whitespace-nowrap table-auto">
            <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200  bg-gray-100">
              <tr>
                <td className="px-4 py-3 ">ID</td>
                <td className="px-4 py-3 ">Joining Date</td>
                <td className="px-4 py-3 ">Name</td>
                <td className="px-4 py-3 ">Email</td>
                <td className="px-4 py-3 ">Phone</td>
                <td className="px-4 py-3 ">Address</td>
                <td className="px-4 py-3 ">ACTIONS</td>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 ">
              {customers &&
                customers?.map(
                  (item, index) =>
                    index >= 15 * page - 15 &&
                    index + 1 <= 15 * page && (
                      <tr className="" key={item?.cusetomer_id}>
                        <td className="px-4 py-3">
                          <span className="text-sm">{item.cusetomer_id}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm ">
                            {TimeStampToDate(item.timestamp)}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex items-center justify-start gap-2">
                          <span>{item.cus_name}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="">
                            {item?.cus_email ? item.cus_email : "null"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm flex items-center justify-start">
                            {item.cus_contact}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm flex items-center justify-start">
                            {item.cus_address}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold flex gap-5 justify-start text-sub-title items-center">
                            <Tooltip label="Views Order" color="blue" withArrow>
                              <Link href={"/customers/order-id?=sdfjkhd"}>
                                <span className="cursor-pointer hover:text-blue-400">
                                  <BsBagPlus size={16} />
                                </span>
                              </Link>
                            </Tooltip>
                            <Tooltip label="Delete User" color="red" withArrow>
                              <span className="cursor-pointer hover:text-red-400">
                                <RiDeleteBinLine size={16} />
                              </span>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    )
                )}
            </tbody>
          </table>
        </div>
      </div>
      {customers?.length >= 15 && (
        <div className="bg-white py-3 rounded-b-md justify-center flex">
          <Pagination
            total={Math.ceil(customers?.length / 15)}
            boundaries={1}
            defaultValue={1}
            onChange={(i) => setPage(i)}
          />
        </div>
      )}
    </main>
  );
};

export default CustomersRow;
