import React, { useState } from "react";
import ScheduleTable from "./ScheduleTable";
import ScheduleSearch from "./ScheduleSearch";
import FBAuth from "./FBAuth";
import Link from "next/link";
import { IoIosLogOut } from "react-icons/io";
import Image from "next/image";

const SchedulePost = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [isActive, setActive] = useState(false);
  const toggle = () => {
    {
      isActive === false ? setActive(true) : setActive(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div></div>
      <div className="grid mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl py-5 font-bold text-gray-700">
            Schedule Post
          </h1>
          <div className="relative">
            <Image
              onClick={toggle}
              className="cursor-pointer hover:shadow-md rounded-full"
              src="/fb.png"
              alt="Picture of the author"
              width={40}
              height={40}
              quality={100}
            />
            {isActive && (
              <ul className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white p-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                <li className="justify-between font-serif font-medium py-2 pl-4 transition-colors duration-150 hover:bg-gray-100 text-gray-500 hover:text-green-500 ">
                  <Link href={"/"}>
                    <span className="flex items-center gap-3 text-sm">
                      <IoIosLogOut size={18} />
                      <span>Log Out</span>
                    </span>
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>
        {isLogin ? (
          <FBAuth />
        ) : (
          <>
            <ScheduleSearch />
            <ScheduleTable />
          </>
        )}
      </div>
    </div>
  );
};

export default SchedulePost;
