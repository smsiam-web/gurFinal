import React from "react";
import { useSelector } from "react-redux";
import Auth from "../components/auth";
import DashboardWrapper from "../components/dashboard/DashboardWrapper";
import Breadcrumb from "../components/shared/Breadcrumb";
import { selectUser } from "../redux/slices/authSlice";

const SecureLayout = ({ children }) => {
  const user = useSelector(selectUser);
  return (
    <main>
      {user ? (
        <>{children}</>
      ) : (
        <>
          {/* Breadcumb */}
          <div className="bg-[#f5f5f5] p-5 min-h-[64px]">
            <div className="mx-auto max-w-5xl">
              <Breadcrumb />
            </div>
          </div>
          <Auth />
        </>
      )}
    </main>
  );
};

export default SecureLayout;