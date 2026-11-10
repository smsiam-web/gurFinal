import { selectStaff } from "@/app/redux/slices/staffSlice";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import Link from "next/link";

const SingleStaff = () => {
  const [staff, setStaff] = useState([]);
  const [id, setId] = useState(usePathname()?.split("=")[1]);
  const staffs = useSelector(selectStaff);

  useEffect(() => {
    staffs &&
      staffs?.map((item) => {
        if (item.id !== id) return;
        setStaff(item);
      });
  }, [id]);

  return (
    <>
      {staff && (
        <div className="bg-slate-50 p-3 max-w-3xl mx-auto h-screen rounded-md mt-2">
          <h1 className="text-xl font-medium text-title">Staff Details</h1>
          <div>
            <span className="text-base font-medium">Name:</span>
            <h2 className="inline"> {staff?.staff_details?.staff_name}</h2>
          </div>
          <div>
            <span className="text-base font-medium">Email:</span>
            <h2 className="inline text-blue-500">
              {" "}
              <Link href={`mailto:${staff?.staff_details?.staff_email}`}>
                {staff?.staff_details?.staff_email}
              </Link>
            </h2>
          </div>
          <div>
            <span className="text-base font-medium">Phone:</span>
            <h2 className="inline">
              {" "}
              <Link href={`tel:${staff?.staff_details?.staff_contact}`}>
                {staff?.staff_details?.staff_contact}
              </Link>
            </h2>
          </div>
          <div>
            <span className="text-base font-medium">Role:</span>
            <h2 className="inline"> Admin</h2>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleStaff;
