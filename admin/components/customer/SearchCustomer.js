import React from "react";

const SearchCustomer = () => {
  return (
    <div className="min-w-0 rounded-lg overflow-hidden bg-white shadow-xs  mb-5">
      {/* search category __ input  */}
      <div className="flex-grow-0 p-4  md:flex-grow lg:flex-grow xl:flex-grow">
        <input
          className="block w-full px-3 py-1 text-sm focus:outline-neutral-200 leading-5 rounded-md  border-gray-200 h-14 bg-gray-100 border-transparent focus:bg-white"
          type="search"
          // name="search"
          placeholder="Search by name / email / phone..."
        />
      </div>
    </div>
  );
};

export default SearchCustomer;
