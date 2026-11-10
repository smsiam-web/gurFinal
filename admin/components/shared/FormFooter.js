import React from "react";
import Button from "./Button";
import FormBtn from "./Form/FormBtn";

const FormFooter = ({disabled, onClick, acceptBtn, loading, title }) => {
  return (
    <div className="py-5 px-6 md:px-4 max-h-full grid grid-cols-4 gap-4">
      <div className="col-span-2">
        <Button
          onClick={onClick}
          title="Cancel"
          className="bg-red-100 hover:bg-red-200 hover:shadow-lg text-red-600 transition-all duration-300 w-full"
        />
      </div>
      <div className="col-span-2">
        <FormBtn
          disabled={disabled}
          loading={loading}
          onClick={acceptBtn}
          title={title}
          className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg text-white transition-all duration-300 w-full"
        />
      </div>
    </div>
  );
};

export default FormFooter;
