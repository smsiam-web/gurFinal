import React, { useState } from "react";
import FileUpload from "@/app/components/shared/FileUpload";
import { FormDropdown, FormInput } from "../../shared/Form";

const CouponForm = () => {
  const formInitial = {
    thumbImage: "",
  };
  const [formData, setFormData] = useState(formInitial);
  const dataChangerThumbnail = (value) => {
    setFormData({ ...formData, thumbImage: value });
  };
  return (
    <div className="max-h-full">
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
      <div>
        <span>Campaign Name</span>
        <FormInput name="coupon_name" placeholder="Campaign Title" />
      </div>
      <div>
        <span>Campaign Code</span>
        <FormInput name="coupon_code" placeholder="Campaign code" />
      </div>
      <div>
        <span>Coupon Validity Time</span>
        <FormInput
          name="coupon_validity"
          type="date"
          placeholder="Coupon Validity Time"
        />
      </div>
      <div>
        <span>Discount Percentage</span>
        <FormInput
          name="discount_percentage"
          placeholder="Discount percentage"
        />
      </div>
      <div>
        <span>Minimum Amount</span>
        <FormInput name="minimum_amount" placeholder="Minimum Amount" />
      </div>
      <div>
        <span>Product Type</span>
        <FormDropdown
          name="product_type"
          placeholder="Select type"
          items={null}
        />
      </div>
    </div>
  );
};

export default CouponForm;
