import React, { useState } from "react";
import { FormInput } from "../shared/Form";
import FileUpload from "../shared/FileUpload";

const UpdateProfile = () => {
  const formInitial = {
    thumbImage: "",
  };
  const [formData, setFormData] = useState(formInitial);
  const dataChangerThumbnail = (value) => {
    setFormData({ ...formData, thumbImage: value });
  };
  return (
    <main>
      <center className="border-b md:border-none mb-4">
        <h1 className="text-2xl md:text-4xl font-bold my-4">Update Profile</h1>
      </center>
      {/* image input field  */}
      <div>
        <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
          Photo
        </label>
        <FileUpload
          name="thumbImage"
          dataChanger={(value) => dataChangerThumbnail(value)}
          type="image"
          prev_src={"localhost:8001/" + formData?.thumbImage}
          required
          allowed_extensions={["jpg", "jpeg", "png", "gif"]}
          recommended="Recommenden size: Square / 🔳"
        />
      </div>
      <div className="w-full mt-10">
        <div className="grid grid-cols-6 gap-6">
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Full Name
            </label>
            <div className="relative">
              <FormInput name="name" placeholder="Full name" />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Email Address
            </label>
            <div className="relative">
              <FormInput
                name="email"
                placeholder="Your Email"
                disabled
                className="bg-slate-200"
              />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Phone/Mobile
            </label>
            <div className="relative">
              <FormInput name="phone" placeholder="Phone" />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Street Address
            </label>
            <div className="relative">
              <FormInput
                name="street_address"
                placeholder="Rangs Pearl, 76 Rd 12, Dhaka 1213"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UpdateProfile;
