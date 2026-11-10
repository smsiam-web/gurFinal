import OrderDetails from "@/admin/components/placeAam/singleOrder";
import Link from "next/link";
import React from "react";
import { BsArrowLeftShort } from "react-icons/bs";

const SingleProduct = () => {
  return (
    <div>
      <Link href={"/place-aam"}>
        <div className="flex items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <OrderDetails disabled={true} />
    </div>
  );
};

export default SingleProduct;
