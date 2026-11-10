import React, { useEffect, useState } from "react";

import { Drawer } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";
import SearchStaff from "./SearchStaff";
import StaffTable from "./StaffTable";
import AddStaff from "./AddStaff";
import { updateStaff } from "@/app/redux/slices/staffSlice";
import { useDispatch } from "react-redux";
import { db } from "@/app/utils/firebase";

const OurStaff = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const dispatch = useDispatch()
    useEffect(() => {
      const unSub = db
        .collection("users")
        .orderBy("created_at", "desc")
        .onSnapshot((snap) => {
          const ourStaffs = [];
          snap.docs.map((doc) => {
            ourStaffs.push({
              id: doc.id,
              ...doc.data(),
              authKey: "null",
            });
          });
       
          dispatch(updateStaff(ourStaffs));
        });
  
      return () => {
        unSub();
      };
    }, []);
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
          <AddStaff onClick={close} />
        </Drawer>
        <h1 className="text-2xl pb-5 font-bold text-gray-700">Our Staff</h1>
        <div>
          <SearchStaff onClick={open} />
          <StaffTable onClick={open} />
        </div>
      </div>
    </main>
  );
};

export default OurStaff;
