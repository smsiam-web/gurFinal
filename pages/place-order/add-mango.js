import React from "react";
import AdminLayout from "@/admin/AdminLayout";
import AddMangoOrder from "@/admin/components/placeOrder/mango";
import Link from "next/link";
import { BsArrowLeftShort } from "react-icons/bs";

const MangoOrder = () => {
  return (
    <AdminLayout>
      <Link href={"/place-order"}>
        <div className="flex max-w-2xl mx-auto items-center justify-start text-sub-title">
          <BsArrowLeftShort size={22} />
          <span>Back</span>
        </div>
      </Link>
      <AddMangoOrder className="pt-10" />
    </AdminLayout>
  );
};

export default MangoOrder;
