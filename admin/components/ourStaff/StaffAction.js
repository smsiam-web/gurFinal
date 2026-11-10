import { selectStaff } from "@/app/redux/slices/staffSlice";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { AppForm, FormBtn, FormDropdown, FormInput } from "../shared/Form";
import { ROLE } from "../../configs/index";
import { db, timestamp } from "@/app/utils/firebase";
import * as Yup from "yup";
import { useRouter } from "next/router";
import { notifications } from "@mantine/notifications";
import { selectUser } from "@/app/redux/slices/authSlice";

const validationSchema = Yup.object().shape({
  staff_name: Yup.string().required().label("Staff name"),
  staff_email: Yup.string().email().required().label("Email"),
  staff_contact: Yup.string().required().label("Phone number"),
  staff_role: Yup.string().required().label("Staff role"),
});

const SingleStaff = () => {
  const [loading, setLoading] = useState(false);
  const [isShow, setIsShow] = useState(false);
  const [staff, setStaff] = useState([]);
  const [id, setId] = useState(usePathname()?.split("=")[1]);
  const staffs = useSelector(selectStaff);
  const router = useRouter();
  const [limits, setLimits] = useState(false);
  const user = useSelector(selectUser);

  useEffect(() => {
    setLimits(user.staff_role === "HR" || user.staff_role === "CEO");
  }, []);

  useEffect(() => {
    staffs &&
      staffs?.map((item) => {
        if (item.uid !== id) return;
        setStaff(item);
        setIsShow(true);
      });
  }, [id]);

  // place product handler on submit
  const updateStaff = async (values) => {
    setLoading(true);
    const staff_id = id;
    await updateStaffHandler(staff, values, staff_id);
    router.push("/our-staff");
    notifications.show({
      title: "Update details successfully",
      message: `${values.staff_name}, ID: #${id}`,
    });
    setLoading(false);
  };

  // save order details on firebase database
  const updateStaffHandler = async (staff, values, staff_id) => {
    await db
      .collection("users")
      .doc(staff?.uid)
      .set({
        authKey: user.authKey,
        email: staff.email,
        image: staff.image,
        name: values.staff_name,
        phone: values.staff_contact,
        staff_id,
        staff_role: values.staff_role,
        uid: staff.uid,
        created_at: staff?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_user: user?.name,
      });
    // await db
    //   .collection("ourStaff")
    //   .doc(staff_id)
    //   .set({
    //     authKey: user.authKey,
    //     email: staff.email,
    //     image: staff.image,
    //     name: values.staff_name,
    //     phone: values.staff_contact,
    //     staff_id,
    //     staff_role: values.staff_role,
    //     uid: staff.uid,
    //     created_at: staff?.created_at || new Date().toISOString(),
    //     updated_at: new Date().toISOString(),
    //     updated_user: user?.name,
    //   });
  };

  return (
    <>
      <div className="bg-gray-50 p-5 rounded-xl">
        <div className="max-w-2xl">
          {isShow && (
            <AppForm
              initialValues={{
                staff_name: staff?.name || "",
                staff_email: staff?.email || "",
                staff_contact: staff?.phone || "",
                staff_role: staff?.staff_role || "",
              }}
              onSubmit={updateStaff}
              validationSchema={validationSchema}
            >
              <div>
                <span>Staff Name</span>
                <FormInput name="staff_name" placeholder="" />
              </div>
              <div>
                <span>Email</span>
                <FormInput
                  name="staff_email"
                  placeholder="Staff Email"
                  readOnly
                />
              </div>
              <div>
                <span>Contact Number</span>
                <FormInput name="staff_contact" placeholder="Phone number" />
              </div>

              <div>
                <span>Staff Role</span>
                <FormDropdown
                  disabled={staff?.staff_role === "HR"}
                  name="staff_role"
                  placeholder="Staff Role"
                  items={ROLE}
                />
              </div>

              <div className="py-5 px-6 md:px-4 max-h-full grid grid-cols-4 gap-4">
                <div className={`${limits ? "" : "hidden"} col-end-5`}>
                  <FormBtn
                    loading={loading}
                    onClick={updateStaff}
                    title="Update"
                    className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg text-white transition-all duration-300 w-full"
                  />
                </div>
              </div>
            </AppForm>
          )}
        </div>
      </div>
    </>
  );
};

export default SingleStaff;
