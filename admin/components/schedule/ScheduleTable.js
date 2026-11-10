"use clint";
import { Tooltip } from "@mantine/core";
import React from "react";
import { VscPreview } from "react-icons/vsc";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import Link from "next/link";

const ScheduleTable = () => {
  return (
    <div className="grid gap-4 w-full overflow-hidden">
      {/* <h1 className="text-title pb-4 text-2xl font-medium">Recent Order</h1> */}
      <div className="w-full overflow-x-scroll rounded-md">
        <table className="w-full whitespace-nowrap table-auto">
          <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200  bg-gray-100">
            <tr>
              <td className="px-4 py-3 ">Post id</td>
              <td className="px-4 py-3 ">Upload Date</td>
              <td className="px-4 py-3 ">Post Img</td> {/*  first image only */}
              <td className="px-4 py-3 ">Text</td>
              <td className="px-4 py-3 ">HashTag</td>
              <td className="px-4 py-3 ">Cuttent PostCount</td>
              <td className="px-4 py-3 ">Max PostCount</td>
              <td className="px-4 py-3 ">Previews</td>
              <td className="px-4 py-3 ">ACTIONS</td>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100 ">
            <tr className="">
              <td className="px-4 py-3">
                <span className="text-sm">ID</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm ">08 May, 2022</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm">Image</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold">text</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <span className="text-sm font-semibold bg-blue-100 text-blue-500">
                    #hashtag
                  </span>
                  <span className="text-sm font-semibold bg-blue-100 text-blue-500">
                    #hashtag
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold">26 Times</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-semibold">50</span>
              </td>
              <td className="px-4 py-3">
                <div className="pl-6 w-fit cursor-pointer hover:text-blue-400">
                  <Tooltip label="Post Preview" color="blue" withArrow>
                    <Link href={`/schedule`}>
                      <VscPreview size={16} />
                    </Link>
                  </Tooltip>
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="text-sm font-semibold flex justify-start gap-5 text-sub-title items-center">
                  <Tooltip label="Edit" color="blue" withArrow>
                    <Link
                      href={"/schedule/add_schedule"}
                      className="cursor-pointer hover:text-blue-400"
                    >
                      <FiEdit size={16} />
                    </Link>
                  </Tooltip>
                  <Tooltip label="Delete" color="red" withArrow>
                    <span className="cursor-pointer hover:text-red-400">
                      <RiDeleteBinLine size={16} />
                    </span>
                  </Tooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTable;
