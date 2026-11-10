import React, { useState } from "react";
import * as Yup from "yup";
import { AppForm } from "../../shared/Form";
import { uuid } from "@/admin/utils/helpers";
import FormFooter from "../../shared/FormFooter";
import FormHeader from "../../shared/FormHeader";
import CategoryForm from "./CategoryForm";
import { db, timestamp } from "@/app/utils/firebase";
import { useDispatch, useSelector } from "react-redux";
import { selectTempUrl, updateTempImgUrl } from "@/app/redux/slices/tempImgUrl";
import { notifications } from "@mantine/notifications";

const validationSchema = Yup.object().shape({
  // category_image: Yup.string().label("Category Image"),
  category_title: Yup.string().required().label("Category Title"),
  category_child: Yup.string().required().label("Child Category"),
  category_path: Yup.string().required().label("Category Path"),
  category_type: Yup.string().required().label("Select type"),
  category_uid: Yup.string().label("Select type"),
});

const AddCategory = ({ onClick }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const uid = uuid();
  const tempImgUrl = useSelector(selectTempUrl);


  // place product handler on submit
  const placeCategory = async (values) => {
    setLoading(true);
    console.log({...values, category_image: tempImgUrl});
    const category_uid = values?.category_uid;
    await placeCategoryHandler(values, category_uid);
    // dispatch(updateBasket([]));
    setLoading(false);
    //clear previous url
    dispatch(updateTempImgUrl([]));
    notifications.show({
      title: "Success",
      message: `Category ${values.category_title} added seccessfully`,
      color: "blue",
      autoClose: 3000,
    });
    //for close the tab
    onClick();
  };
  // save order details on firebase database
  const placeCategoryHandler = async (values, category_uid) => {
    await db
      .collection("category")
      .doc(category_uid)
      .set({...values, category_image: tempImgUrl, timestamp, isPublished: false});
  };
  return (
    <main>
      <div>
        <AppForm
          initialValues={ {
            category_title: "",
            category_child: "",
            category_path: "",
            category_type: "",
            category_uid: (uid && uid) || "",
          }}
          onSubmit={placeCategory}
          validationSchema={validationSchema}
        >
          <div className="h-screen relative">
            <div className="w-full">
              <FormHeader
                onClick={onClick}
                title="Add Category"
                sub_title={
                  "Add your category and necessary information from here"
                }
              />
            </div>

            <div className="w-full h-[75%] md:h-[80%] overflow-y-scroll py-3 px-6 md:px-4 mb-4">
              <CategoryForm uid={uid} url={tempImgUrl} />
            </div>

            <div className="fixed bottom-0 right-0 w-full bg-gray-50">
              <FormFooter
                disabled={!tempImgUrl.length}
                title={"Submit"}
                onClick={onClick}
                loading={loading}
                acceptBtn={placeCategory}
              />
            </div>
          </div>
        </AppForm>
      </div>
    </main>
  );
};

export default AddCategory;
