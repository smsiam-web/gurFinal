import React, { useState } from "react";
import { AppForm, FormBtn } from "../../shared/Form";
import FormHeader from "../../shared/FormHeader";
import { db, timestamp } from "@/app/utils/firebase";
import Button from "../../shared/Button";
import { useRouter } from "next/router";
import ProductDetailsFormUp from "./ProductDetailsFormUp";
import { porductInitialValues, productValidationSchema } from "@/lib/validationSchema";
import { notifications } from "@mantine/notifications";

const AddProduts = ({ onClick }) => {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const router = useRouter();

  const product_details = product && product[0]?.product_details;


  // save product to Firestore
const placeProductHandler = async (values) => {
  setLoading(true);

  try {
    const col = db.collection("products");
    let docId = values?.id ? String(values.id) : null;

    if (!docId) {
      // create a new doc id if none provided
      const ref = col.doc();
      docId = ref.id;
      await ref.set({ ...values, id: docId, created_at: new Date().toISOString(),  title_lower: values?.title.toLowerCase(), }, { merge: true });
    } else {
      await col.doc(docId).set({ ...values, created_at: new Date().toISOString(), title_lower: values?.title.toLowerCase(), }, { merge: true });
    }

    notifications.show({
      title: "Success",
      message: "Product updated successfully",
      color: "green",
      autoClose: 2500,
    });

    // navigate after successful write
    router.push(`/products/id=${docId}`);
  } catch (err) {
    console.error("placeProductHandler error:", err);
    notifications.show({
      title: "Update failed",
      message: err?.message || "Something went wrong while saving the product.",
      color: "red",
      autoClose: 4000,
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <main>
      <div>
        <AppForm
          initialValues={porductInitialValues(product_details)}
          onSubmit={placeProductHandler}
          validationSchema={productValidationSchema}
        >
          <div className="h-screen relative">
            <div className="w-full">
              <FormHeader
                onClick={onClick}
                title={"Add Product"}
                sub_title="Add your product and necessary information from here."
              />
            </div>

            <div className="w-full h-[75%] md:h-[80%] overflow-y-scroll py-3 px-6 md:px-4 mb-4">
              <ProductDetailsFormUp edit={false} />
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
                  disabled={loading}
                    loading={loading}
                    onClick={placeProductHandler}
                    title={"Add Product"}
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

export default AddProduts;
