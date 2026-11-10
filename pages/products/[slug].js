import EditProduts from "@/admin/components/products/productDetail";
import ProductDetails from "@/app/components/product/singleProduct/PorductDetails";
import Link from "next/link";
import React from "react";
import { BsArrowLeftShort } from "react-icons/bs";

const SingleProduct = () => {
  return (
    <div>
      <Link href={"/products"}>
        <div className="flex items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <EditProduts disabled={true} />
    </div>
  );
};

export default SingleProduct;
