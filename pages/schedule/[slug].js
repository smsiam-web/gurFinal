import Previews from "@/admin/components/schedule/Previews";
import Breadcrumb from "@/app/components/shared/Breadcrumb";
import React from "react";

const SinglePreview = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-10">
        <Breadcrumb />
        <h1 className="text-2xl text-gray-700">Facebook Feed Review</h1>
      </div>
      <Previews />
    </div>
  );
};

export default SinglePreview;
