import React from "react";
import { AppTextArea, FormDropdown, FormInput } from "../shared/Form";
import { STATUS } from "@/admin/configs";

const OrderEditForm = () => {
  return (
    <div className="max-w-xl">
      <FormInput name="customer_name" placeholder="Name" />
      <FormInput type="text" max={11} name="phone_number" placeholder="+880" />
      <FormInput
        name="customer_address"
        placeholder="Ex: H#12, R#04, Sec# 4, Mirpur Dhaka."
      />
      <FormDropdown type="text" name="status" placeholder="Status" items={STATUS} />
    </div>
  );
};

export default OrderEditForm;
