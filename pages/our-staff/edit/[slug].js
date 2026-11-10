import StaffAction from "@/admin/components/ourStaff/StaffAction";
import Link from "next/link";
import React from "react";
import { BsArrowLeftShort } from "react-icons/bs";

const EditStaff = () => {
  return (
    <div>
      <Link href={"/our-staff"}>
        <div className="flex items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <h1 className="text-2xl font-medium text-title pb-2">Staff Action</h1>
      <StaffAction disabled={true} />
    </div>
  );
};

export default EditStaff;
