import React, { useState } from "react";
import * as Yup from "yup";
import FormHeader from "../../shared/FormHeader";
import CategoryForm from "../AddCategory/CategoryForm";
import FormFooter from "../../shared/FormFooter";
import { AppForm } from "../../shared/Form";
import { selectTempUrl, updateTempImgUrl } from "@/app/redux/slices/tempImgUrl";
import { useDispatch, useSelector } from "react-redux";
import { db } from "@/app/utils/firebase";
import { notifications } from "@mantine/notifications";

const validationSchema = Yup.object().shape({
  category_image: Yup.string().label("Category Image"),
  category_title: Yup.string().required().label("Category Title"),
  category_child: Yup.string().required().label("Child Category"),
  category_path: Yup.string().required().label("Category Path"),
  category_type: Yup.string().required().label("Select type"),
  category_uid: Yup.string().label("Select type"),
});

const CategoryAction = ({ onClick, item }) => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch(); 
  const tempImgUrl = useSelector(selectTempUrl);
  const url = !!tempImgUrl.length ? tempImgUrl : item?.category_image;

  // place product handler on submit
  const categoryUpdate = async (values) => {
    setLoading(true);
    const category_uid = values?.category_uid;
    console.log(category_uid)
    await updateCategoryHandler(values, category_uid);
    setLoading(false);

        //clear previous url
        dispatch(updateTempImgUrl([]));
    //for close the tab
    onClick();
    notifications.show({
      title: "Success",
      message: `Category ${values.category_title} Update seccessfully`,
      color: "blue",
      autoClose: 3000,
    });
  };
  // save order details on firebase database
  const updateCategoryHandler = async (values, category_uid) => {
    await db
      .collection("category")
      .doc(category_uid)
      .set({
        ...values,
        category_image: url,
        isPublished: false
      }, {merge:true});
  };
  return (
    <div>
      {item && (
        <AppForm
          initialValues={{
            category_image: "",
            category_title: item.category_title || "",
            category_child: item.category_child || "",
            category_path: item.category_path || "",
            category_type: item.category_type || "",
            category_uid: item.category_uid || "",
          }}
          onSubmit={categoryUpdate}
          validationSchema={validationSchema}
        >
          {" "}
          <div className="h-screen relative">
            <div className="w-full">
              <FormHeader
                onClick={onClick}
                title="Update Category"
                sub_title={
                  "Update your category and necessary information from here"
                }
              />
            </div>

            <div className="w-full h-[75%] md:h-[80%] overflow-y-scroll py-3 px-6 md:px-4 mb-4">
              <CategoryForm uid={item.category_uid} urls={url} />
            </div>

            <div className="fixed bottom-0 right-0 w-full bg-gray-50">
              <FormFooter
                title={"Update"}
                onClick={onClick}
                loading={loading}
                acceptBtn={categoryUpdate}
              />
            </div>
          </div>
        </AppForm>
      )}
    </div>
  );
};

export default CategoryAction;
