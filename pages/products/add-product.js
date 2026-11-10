import React from "react";
import AdminLayout from "@/admin/AdminLayout";
import Link from "next/link";
import { BsArrowLeftShort } from "react-icons/bs";
import AddProduct from "@/admin/components/products/add-product";


const AadProduct = () => {
  return (
    <AdminLayout>
      <Link href={"/products"}>
        <div className="flex max-w-2xl mx-auto items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <AddProduct className="pt-10" />
    </AdminLayout>
  );
};

export default AadProduct;