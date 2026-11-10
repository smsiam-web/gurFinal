import React from "react";
import { AiOutlineClose } from "react-icons/ai";

const FormHeader = ({ onClick, title, sub_title }) => {
  return (
    <div className="flex gap-2 max-h-full items-center justify-between bg-gray-50 py-3 px-6 md:px-4">
      <div className="grid gap-1">
        <h1 className="text-tile text-xl font-medium md:text-2xl">{title}</h1>
        <p className="text-sm md:text-lg text-sub-title">{sub_title}</p>
      </div>
      <button
        className="bg-red-200 hover:bg-red-300 text-red-600 p-2 rounded-full hover:shadow-xl"
        onClick={onClick}
      >
        <AiOutlineClose size={16} className="text-red-600" />
      </button>
    </div>
  );
};

export default FormHeader;
