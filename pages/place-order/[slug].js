import OrderDetails from "@/admin/components/placeOrder/singleOrder";
import Link from "next/link";
import React from "react";
import { BsArrowLeftShort } from "react-icons/bs";

const SingleProduct = () => {
  return (
    <div>
      <Link href={"/place-order"}>
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
