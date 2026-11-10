import React from "react";
import AdminLayout from "@/admin/AdminLayout";
import Link from "next/link";
import { BsArrowLeftShort } from "react-icons/bs";
import EditOrder from "@/admin/components/placeOrder/edit_order";

const EditOrders = () => {
  return (
    <AdminLayout>
      <Link href={"/place-order"}>
        <div className="flex max-w-2xl mx-auto items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <EditOrder className="pt-10" />
    </AdminLayout>
  );
};

export default EditOrders;
