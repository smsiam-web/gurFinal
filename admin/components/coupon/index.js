import React, { useState } from "react";
import SearchCoupon from "./SearchCoupon";
import CouponTable from "./CouponTable";
import { Drawer } from "@mantine/core";
import AddCoupon from "./AddCoupon";
import { useDisclosure } from "@mantine/hooks";

const Coupon = () => {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <main className="h-full overflow-y-auto">
      <div className="grid mx-auto">
        {/* add category drawer  */}
        <Drawer
          opened={opened}
          onClose={close}
          zIndex={9999}
          withCloseButton={false}
          position="right"
          size="lg"
          padding={0}
        >
          <AddCoupon onClick={close} />
        </Drawer>
        <h1 className="mb-3 text-xl font-bold text-gray-700 ">Coupons</h1>
        <div>
          <SearchCoupon onClick={open} />
          <CouponTable onClick={open} />
        </div>
      </div>
    </main>
  );
};

export default Coupon;
