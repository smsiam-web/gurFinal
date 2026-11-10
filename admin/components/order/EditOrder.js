import OrderEditForm from "@/admin/components/order/OrderEditForm";
import Button from "@/admin/components/shared/Button";
import { AppForm, FormBtn } from "@/admin/components/shared/Form";
import { selectOrder } from "@/app/redux/slices/orderSlice";
import { usePathname } from "next/navigation";
import Router from "next/router";
import React, { useState, useEffect } from "react";
import { BsArrowLeftShort } from "react-icons/bs";
import { useSelector } from "react-redux";
import * as Yup from "yup";
const validationSchema = Yup.object().shape({
  delivery_type: Yup.boolean().required().label("Delivery type"),
  phone_number: Yup.string()
    .matches(/^[0-9]{11}$/, "Must be exactly 11 digits")
    .required()
    .label("Phone number"),
  customer_name: Yup.string().max(50).required().label("Name"),
  status: Yup.string().max(50).required().label("Status"),
  customer_address: Yup.string().max(300).required().label("Address"),
  salePrice: Yup.number().required().label("Sale Price"),
  note: Yup.string().max(500).label("Note"),
  patali_gol: Yup.number().positive().label("Weight"),
  patali_pata: Yup.number().positive().label("Weight"),
  patali_foial: Yup.number().positive().label("Weight"),
  patali_narkel: Yup.number().positive().label("Weight"),
  liquid: Yup.number().positive().label("Weight"),
  dana: Yup.number().positive().label("Weight"),
});

const EditOrder = () => {
  const [id, setId] = useState(usePathname()?.split("=")[1]);
  const [order, setOrder] = useState(null);
  const Order = useSelector(selectOrder);

  useEffect(() => {
    Order.filter((item) => item.id === id && setOrder(item));
  }, [id]);

  console.log(order);

  return (
    <main className="max-w-full overflow-y-auto">
      <div
        onClick={() => Router.back()}
        className="flex w-fit items-center justify-start text-sub-title cursor-pointer"
      >
        <BsArrowLeftShort size={22} />
        <span>Back</span>
      </div>

      <div className="grid mx-auto">
        <h1 className="text-xl pb-5 font-bold text-gray-700">Edit Order</h1>
      </div>

      <div class="bg-white rounded-md py-3 px-6 md:px-4 mb-4">
        <div>
          <h1 className="text-gray-700 font-bold text-xl text-center pt-3">
            ID #{id}{" "}
            <span className="text-lg font-medium">(Home Delivery)</span>
          </h1>
          <div className="flex justify-end gap-2 border-b pb-1 mb-5">
            <button
              className="bg-blue-500 px-3 py-2 rounded-md text-white text-sm"
              title="Add New"
            >
              Add New
            </button>
            <button
              className="bg-blue-500 px-3 py-2 rounded-md text-white text-sm"
              title="Add New"
            >
              Print
            </button>
          </div>
          {order && (
            <AppForm
              initialValues={{
                delivery_type: true || "",
                phone_number: order?.customer_details.phone_number || "",
                status: order?.status || "",
                customer_name: order?.customer_details.customer_name || "",
                customer_address:
                  order?.customer_details.customer_address || "",
                salePrice: "",
                note: "",
                patali_gol: "",
                patali_pata: "",
                patali_foial: "",
                patali_narkel: "",
                liquid: "",
                dana: "",
              }}
              //   onSubmit={placeOrder}
              validationSchema={validationSchema}
            >
              <div className="h-screen relative">
                <div className="w-full ">
                  <OrderEditForm />
                </div>

                <div className="  w-full ">
                  <div className="py-5 px-6 md:px-4 max-h-full grid grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <Button
                        // onClick={onClick}
                        title="Cancel"
                        className="bg-red-100 hover:bg-red-200 hover:shadow-lg text-red-600 transition-all duration-300 w-full"
                      />
                    </div>
                    <div className="col-span-2">
                      <FormBtn
                        // loading={loading}
                        // onClick={placeOrder}
                        title="Submit"
                        className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg text-white transition-all duration-300 w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </AppForm>
          )}
        </div>
      </div>
    </main>
  );
};

export default EditOrder;
