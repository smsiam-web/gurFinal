import Link from "next/link";
import React from "react";
import Button from "../shared/Button";
import { HiArrowLeft } from "react-icons/hi";
import Image from "next/image";

const NotFound = () => {
  return (
    <div className="max-w-2xl mx-auto my-10 px-10">
      <Image width={500} height={500}  src="/404.svg" alt="404.svg" />
      <div className="">
        <h1 className="text-2xl text-title text-center py-6">
          Page is not found..!!!
        </h1>
        <Link href={"/"} className="flex justify-center">
          <Button
            icon={<HiArrowLeft size={18} />}
            title="back to home"
            className="bg-emerald-400 text-white capitalize"
          />
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
