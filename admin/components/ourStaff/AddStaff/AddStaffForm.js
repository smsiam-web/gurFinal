import React, { useState, useEffect } from "react";
import { FormDropdown, FormInput } from "../../shared/Form";
import { ROLE } from "../../../configs/index";
import { db } from "@/app/utils/firebase";

const AddStaffForm = ({onChange}) => {
  const [users, setUsers] = useState(null);
  const [user, setUser] = useState(null);

  const realV = (e) => {
    e.preventDefault();
    users && users.map((i) => {
      (i.email === e.target.value) ? setUser(i) : setUser(null)
    })
  }

    // Get user from firebase database
    useEffect(() => {
      const unSub = db
        .collection("users")
        .onSnapshot((snap) => {
          const user = [];
          snap.docs.map((doc) => {
            user.push({
              id: doc.id,
              ...doc.data(),
            });
          });
          setUsers(user);
        });
      return () => {
        unSub();
      };
    }, []);

  return (
    <div className="max-h-full">
      <div>
        <span>Email</span>
        {/* <input
        onChange={(e) => realV(e)}
        required
        name="staff_email"
        type="email"
          placeholder="Staff Email"
          className="outline-none border-[1px] py-3 text-sm appearance-none opacity-75 text-title px-5 rounded-md w-full border-gray-200 focus:outline-none
        focus:border-primary transition duration-200
        focus:ring-0 ease-in-out mb-4"
        /> */}
        <FormInput  name="staff_email"  placeholder="Staff Email" />
      </div>

      <div>
        <span>Staff Name</span>
        <FormInput name="staff_name"  placeholder="Staff Name" />
      </div>

      <div>
        <span>Contact Number</span>
        <FormInput name="staff_contact" placeholder="Phone number" />
      </div>

      <div>
        <span>Staff Role</span>
        <FormDropdown name="staff_role" placeholder="Staff Role" items={ROLE} />
      </div>
    </div>
  );
};

export default AddStaffForm;
