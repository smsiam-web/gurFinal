import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { AppForm, FormBtn } from "../../components/shared/Form";
import UpdateStaffForm from "./UpdateStaffForm";
import { db, timestamp } from "@/app/utils/firebase";
import Link from "next/link";
import Button from "../shared/Button";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { selectConfig, updateConfig } from "@/app/redux/slices/configSlice";
import { ToDateAndTime } from "@/admin/utils/helpers";
import { selectUser } from "@/app/redux/slices/authSlice";

const validationSchema = Yup.object().shape({
  company_name: Yup.string().required().label("Staff name"),
  buissnes_email: Yup.string().required().label("Email"),
  address: Yup.string().required().max(25).label("address max 25 Char."),
  company_contact: Yup.string().required().label("Phone number"),
  placeholder_invoice: Yup.string().label("Invoice Placeholder"),
  bulk_auth: Yup.string().label("Staff role"),
  sfc_api_key: Yup.string().label("Staff role"),
  sfc_secret_key: Yup.string().label("Staff role"),
});

const Setting = () => {
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [config, setConfig] = useState(useSelector(selectConfig) || null);
  const router = useRouter();
  const dispatch = useDispatch()
    //get config
    useEffect(() => {
      const unSub = db.collection("config").onSnapshot((snap) => {
        const configData = [];
        snap.docs.map((doc) => {
          configData.push(doc.data());
        });
        dispatch(updateConfig(configData));
      });
      return () => {
        unSub();
      };
    }, []);

  const [limits, setLimits] = useState(true);
  const user = useSelector(selectUser);
  useEffect(() => {
    setLimits(
      ((user.staff_role === "HR" || user.staff_role === "CEO") && true) || false
    );
    // config && setLastUpdate(ToDateAndTime(config[0]?.created_at));
  }, []);

  console.log(!config);

  const lastUpdates = ToDateAndTime(config && config[0]?.created_at || null);
  let today = new Date();

  // place product handler on submit
  const placeConfig = async (values) => {
    setLoading(true);
    await placeConfigHandeler(values);
    notifications.show({
      title: "Sucess",
      message: "Config Update Sucessfully",
      color: "green",
    });

    setLoading(false);
    router.push("/");
  };

  // save order details on firebase database
  const placeConfigHandeler = async (values) => {
    const configData = {
      values,
      created_at: timestamp,
    };
    await db.collection("config").doc("afADfadsfdsDadsfk").set(configData);
  };

  console.log(config);

  return (
    <main className="max-w-4xl  mx-auto">
      <div className="">
        <main className="h-full overflow-y-auto">
          <h1 className="text-2xl pb-5 font-bold text-gray-700">
            Edit Profile
          </h1>
          <div className="grid mx-auto p-5 rounded-lg bg-white">
            <AppForm
              initialValues={{
                company_name:
                  (!!config && config[0]?.values.company_name) || "",
                buissnes_email:
                  (!!config && config[0]?.values.buissnes_email) || "",
                address: (!!config && config[0]?.values.address) || "",
                company_contact:
                  (!!config && config[0]?.values.company_contact) || "",
                bulk_auth:
                  (!!config && limits && config[0]?.values.bulk_auth) || "",
                sfc_api_key:
                  (!!config && limits && config[0]?.values.sfc_api_key) || "",
                sfc_secret_key:
                  (!!config && limits && config[0]?.values.sfc_secret_key) ||
                  "",
                placeholder_invoice:
                  (!!config &&
                    limits &&
                    config[0]?.values.placeholder_invoice) ||
                  "",
              }}
              onSubmit={placeConfig}
              validationSchema={validationSchema}
            >
              <div className="">
                <UpdateStaffForm onClick={placeConfig} loading={loading} />
              </div>
              <div>
                <span className="block text-gray-500 font-medium text-sm leading-none mb-2">
                  Last Update
                </span>
                <span className="text-sub-title">{lastUpdates}</span>
              </div>
              {limits && (
                <div className="py-5 px-6 md:px-4 w-full grid grid-cols-4 gap-4">
                  <div className="col-span-4 sm:col-span-2">
                    <Link href={"/"}>
                      <Button
                        title="Cancel"
                        className="bg-red-100 hover:bg-red-200 hover:shadow-lg text-red-600 transition-all duration-300 w-full"
                      />
                    </Link>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <FormBtn
                      loading={loading}
                      onClick={placeConfig}
                      title="Submit"
                      className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg text-white transition-all duration-300 w-full"
                    />
                  </div>
                </div>
              )}
            </AppForm>
          </div>
        </main>
      </div>
    </main>
  );
};

export default Setting;
