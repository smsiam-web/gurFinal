import React, { useState } from "react";
import { DateInput } from "@mantine/dates";
const FormDate = ({ name, placeholder }) => {
  const [value, setValue] = useState(null);
  return (
    <DateInput
      name={name}
      value={value}
      onChange={setValue}
      placeholder={placeholder}
      maw={400}
      mx="auto"
      className="pb-5 pt-2"
    />
  );
};

export default FormDate;

// add this css on your route/global css file

// .mantine-13qt2rl {
//   width: 100% !important;
//   max-width: none !important;
// }

// .mantine-DateInput-input {
//   outline: 2px solid transparent !important;
//   border-width: 1px;
//   outline-offset: 2px !important;
//   padding: 22px 20px;
//   font-size: 14px;
//   line-height: 20px;
//   opacity: 0.75;
//   appearance: none;
//   border-radius: 6px;
//   -webkit-border-radius: 6px;
//   -moz-border-radius: 6px;
//   -ms-border-radius: 6px;
//   -o-border-radius: 6px;
// }
