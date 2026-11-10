import React from "react";
import { FormDropdown, FormInput } from "../shared/Form";
const TYPE = [
  { name: "১২ কেজি (ছোট ক্যারেট)", id: "১২ কেজি (ছোট ক্যারেট)" },
  { name: "২৩ কেজি (বড় ক্যারেট)", id: "২৩ কেজি (ছোট ক্যারেট)" },
];
const QuantityFrom = ({ value }) => {
  return (
    <div>
      {/* <FormInput name="first_name" placeholder="First name" /> */}
      <FormDropdown
        name="quantity"
        placeholder="পরিমান নির্বাচন করুন"
        items={TYPE}
      />
    </div>
  );
};

export default QuantityFrom;
