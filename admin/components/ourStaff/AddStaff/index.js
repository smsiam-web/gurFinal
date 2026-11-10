import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { AppForm, FormBtn } from "../../shared/Form";
import { uuid } from "../../../utils/helpers";
import FormHeader from "../../shared/FormHeader";
import AddStaffForm from "./AddStaffForm";
import Button from "../../shared/Button";
import { db, timestamp } from "@/app/utils/firebase";
import { useRouter } from "next/router";
import { notifications } from "@mantine/notifications";

const validationSchema = Yup.object().shape({
  staff_name: Yup.string().required().label("Staff name"),
  staff_email: Yup.string().email().required().label("Email"),
  staff_contact: Yup.string().required().label("Phone number"),
  staff_role: Yup.string().required().label("Staff role"),
});

const AddStaff = ({ onClick }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState(null);
  const [user, setUser] = useState(null);
  const [key, setKey] = useState(null);

  const router = useRouter();

  const realV = (e) => {
    e.preventDefault();
    users &&
      users.map((i) => {
        i.email === e.target.value ? setUser(i) : setUser(null);
      });
  };

  // place product handler on submit
  const placeStaff = async (values) => {
    setLoading(true);
    const staff_id = uuid();
    users &&
      users.map((i) => {
        if (i.email === values.staff_email) {
          placeStaffHandler(i, values, staff_id);
          updateUser(i, values, staff_id);
        }
      });

    router.push("/our-staff/id=" + staff_id);
    setLoading(false);
    notifications.show({
      title: "Staff Added Sucessfully",
      message: `Staff Name: ${values.staff_name}, ID: #${staff_id}`,
    });
  };

  // save order details on firebase database
  const placeStaffHandler = async (i, values, staff_id) => {
    await db
      .collection("users")
      .doc(staff_id)
      .set(
        {
          ...i,
          staff_id,
          name: values.staff_name,
          phone: values.staff_contact,
          staff_role: values.staff_role,
          authKey: key,
          created_at: new Date().toISOString(),
        },
        { merge: true }
      );
  };
  // save order details on firebase database
  const updateUser = async (i, values, staff_id) => {
    await db
      .collection("users")
      .doc(i.uid)
      .set(
        {
          ...i,
          staff_id,
          name: values.staff_name,
          phone: values.staff_contact,
          staff_role: values.staff_role,
          authKey: key,
          created_at: i?.created_at || new Date().toISOString(),
          updated_at:  new Date().toISOString(),
        },
        { merge: true }
      );
  };

  // Get user from firebase database
  useEffect(() => {
    const unSub = db.collection("users").onSnapshot((snap) => {
      const user = [];
      snap.docs.map((doc) => {
        user.push({
          ...doc.data(),
        });
      });
      setUsers(user);
    });
    return () => {
      unSub();
    };
  }, []);
  // Get key from firebase database
  useEffect(() => {
    const unSub = db.collection("authKey").onSnapshot((snap) => {
      snap.docs.map((doc) => {
        setKey(doc.data().key);
      });
    });
    return () => {
      unSub();
    };
  }, []);

  return (
    <main>
      <div>
        <AppForm
          initialValues={{
            staff_name: "",
            staff_email: "",
            staff_contact: "",
            staff_role: "",
          }}
          onSubmit={placeStaff}
          validationSchema={validationSchema}
        >
          <div className="h-screen relative">
            <div className="w-full">
              <FormHeader
                onClick={onClick}
                title="Add Staff"
                sub_title={"Submit your necessary information carefully"}
              />
            </div>

            <div className="w-full h-[75%] md:h-[80%] overflow-y-scroll py-3 px-6 md:px-4 mb-4">
              <AddStaffForm onChange={(e) => realV(e)} />
            </div>

            <div className="fixed bottom-0 right-0 w-full bg-gray-50">
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
                    loading={loading}
                    onClick={placeStaff}
                    title="Add Staff"
                    className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg text-white transition-all duration-300 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </AppForm>
      </div>
    </main>
  );
};

export default AddStaff;
