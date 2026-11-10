import React, { useEffect } from "react";
import AdminLayout from "@/admin/AdminLayout";
import DashBoard from "@/admin/components/dashboard";
import { useDispatch } from "react-redux";
import { db } from "@/app/utils/firebase";
import { updateConfig } from "@/app/redux/slices/configSlice";

const AdmainMain = () => {
  const dispatch = useDispatch();

  //get config
  useEffect(() => {
    const unSub = db.collection("config").onSnapshot((snap) => {
      const configData = [];
      snap.docs.map((doc) => {
        configData.push(doc.data());
      });
      dispatch(updateConfig(configData));
    });
    return () => {
      unSub();
    };
  }, []);

  return (
    <AdminLayout>
      <DashBoard />
    </AdminLayout>
  );
};

export default AdmainMain;
