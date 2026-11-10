"use client";
import Breadcrumb from "../../../../app/components/shared/Breadcrumb";
import React from "react";
import CreatePost from "./CreatePost";
import AdminLayout from "@/admin/AdminLayout";
import Previews from "../Previews";

const Add_Schedule = () => {
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="text-gray-500">
          <Breadcrumb />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2 md:col-span-1">
            <h1 className="text-2xl py-3 text-gray-700">Create post</h1>
            <CreatePost />
          </div>
          <div className="col-span-2 max-w-md md:col-span-1">
            <h1 className="text-2xl py-3 text-gray-700">
              Facebook feed preview
            </h1>
            <Previews />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Add_Schedule;
