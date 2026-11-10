import EditAamOrder from "@/admin/components/placeAam/edit_order";
import Link from "next/link";
import React from "react";
import { BsArrowLeftShort } from "react-icons/bs";

const SingleEdit = () => {
  return (
    <div>
      <Link href={"/place-aam"}>
        <div className="flex items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <EditAamOrder disabled={true} />
    </div>
  );
};

export default SingleEdit;
