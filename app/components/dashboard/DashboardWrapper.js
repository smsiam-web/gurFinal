import React from "react";
import DashboardNavigation from "./DashboardNavigation";

const DashboardWrapper = ({ children }) => {
  return (
    <main>
      <div className="p-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex md:flex-nowrap flex-wrap">
            <div className="w-full md:w-1/4 bg-gray-100 rounded-md h-fit">
              <DashboardNavigation />
            </div>
            <div className="w-full md:w-3/4">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardWrapper;
