import React from "react";
import AdminLayout from "@/admin/AdminLayout";
import AddAamOrder from "@/admin/components/placeAam/add_new_order";
import Link from "next/link";
import { BsArrowLeftShort } from "react-icons/bs";

const Products = () => {
  return (
    <AdminLayout>
      <Link href={"/place-aam"} >
        <div className="md:flex max-w-2xl mx-auto hidden items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <AddAamOrder className="pt-10" />
    </AdminLayout>
  );
};

export default Products;
