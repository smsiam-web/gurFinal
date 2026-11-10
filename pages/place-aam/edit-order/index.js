import React from "react";
import AdminLayout from "@/admin/AdminLayout";
import Link from "next/link";
import { BsArrowLeftShort } from "react-icons/bs";
import EditAamOrder from "@/admin/components/placeAam/edit_order";

const EditOrders = () => {
  return (
    <AdminLayout>
      <Link href={"/place-aam"}>
        <div className="flex max-w-2xl mx-auto items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <EditAamOrder className="pt-10" />
    </AdminLayout>
  );
};

export default EditOrders;
