import SingleStaff from "@/admin/components/ourStaff/SingleStaff";
import Link from "next/link";
import React from "react";
import { BsArrowLeftShort } from "react-icons/bs";

const Stafff = () => {
  return (
    <div>
      <Link href={"/our-staff"}>
        <div className="flex items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <SingleStaff disabled={true} />
    </div>
  );
};

export default Stafff;
