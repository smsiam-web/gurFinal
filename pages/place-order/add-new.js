import React from "react";
import AdminLayout from "@/admin/AdminLayout";
import AddNewOrder from "@/admin/components/placeOrder/add_new_order";
import Link from "next/link";
import { BsArrowLeftShort } from "react-icons/bs";

const Products = () => {
  return (
    <AdminLayout>
      <Link href={"/place-order"} >
        <div className="md:flex max-w-2xl mx-auto hidden items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <AddNewOrder className="pt-10" />
    </AdminLayout>
  );
};

export default Products;
