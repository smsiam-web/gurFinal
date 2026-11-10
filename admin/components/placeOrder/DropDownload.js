import React from "react";
import ExportCSV from "../shared/ExportCSV";
import Button from "../shared/Button";

const DropDownload = () => {
  return (
    <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50  shadow-xs mb-5">
      <div className="p-4">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-3">
          <div className="col-span-2">
            <div className="items-center border border-dashed rounded-md border-blue-400 p-6  flex flex-col h-14 justify-center px-3 bg-slate-100">
              Drop CSV file
            </div>
          </div>
          <div className="col-span-2 gap-4 md:col-span-2 xl:col-span-1 min-w-full">
            <div className="grid grid-cols-2 gap-2">
              <div className="md:col-span-1 col-span-2">
                <Button
                  disabled
                  title="Upload"
                  className="bg-gray-200 hover:bg-gray-300 hover:shadow-lg transition-all duration-300 font-medium text-title w-full h-14"
                />
              </div>
              <div className="md:col-span-1 col-span-2">
                <ExportCSV />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DropDownload;
