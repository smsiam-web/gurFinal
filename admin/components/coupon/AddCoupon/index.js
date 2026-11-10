import React, { useState } from "react";
import * as Yup from "yup";
import { AppForm } from "../../shared/Form";
import { uuid } from "../../../utils/helpers";
import FormFooter from "../../shared/FormFooter";
import FormHeader from "../../shared/FormHeader";
import CouponForm from "./CouponForm";

const validationSchema = Yup.object().shape({
  coupon_name: Yup.string().required().label("Campaign Title"),
  coupon_code: Yup.string().required().label("Campaign Code"),
  coupon_validity: Yup.date().required().label("Coupon Validity Time"),
  discount_percentage: Yup.number().required().label("Discount Percentage"),
  minimum_amount: Yup.number().required().label("Minimum Amount"),
  product_type: Yup.string().required().label("Product Type"),
});

const AddCoupon = ({ onClick }) => {
  const [loading, setLoading] = useState(false);

  // // place product handler on submit
  // const placeProduct = async (values) => {
  //   setLoading(true);
  //   await saveProductDetails(values);
  //   const product_id = uuid();
  //   router.push("/sucess?product_id=" + product_id);
  //   await placeOrderHandler(values, product_id);
  //   dispatch(updateBasket([]));
  //   setLoading(false);
  // };
  // // save order details on firebase database
  // const placeOrderHandler = async (values, product_id) => {
  //   const productData = {
  //     order_id,
  //     user_details: { ...user },
  //     // payment: true,
  //     billing_details: values,
  //     items: cartItems,
  //     total: cartTotal,
  //     created_at: timestamp,
  //   };
  //   await db.collection("products").doc(product_id).set(productData);
  // };
  return (
    <main>
      <div>
        <AppForm
          initialValues={{
            coupon_name: "",
            coupon_code: "",
            coupon_validity: "",
            discount_percentage: "",
            minimum_amount: "",
            product_type: "",
          }}
          // onSubmit={placeProduct}
          validationSchema={validationSchema}
        >
          <div className="h-screen relative">
            <div className="w-full">
              <FormHeader
                onClick={onClick}
                title="Add Coupon"
                sub_title={
                  "Add your category and necessary information from here"
                }
              />
            </div>

            <div className="w-full h-[75%] md:h-[80%] overflow-y-scroll py-3 px-6 md:px-4 mb-4">
              <CouponForm />
            </div>

            <div className="fixed bottom-0 right-0 w-full bg-gray-50">
              <FormFooter onClick={onClick} acceptBtn={"Add Coupon"} />
            </div>
          </div>
        </AppForm>
      </div>
    </main>
  );
};

export default AddCoupon;
