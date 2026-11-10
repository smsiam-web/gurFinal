import React, { useState } from "react";
import FileUpload from "@/app/components/shared/FileUpload";
import { FormInput } from "../../shared/Form";

const CategoryForm = ({uid, urls}) => {
  const formInitial = {
    thumbImage: "",
  };

  // const uid = uuid();

  const [formData, setFormData] = useState(formInitial);
  const dataChangerThumbnail = (value) => {
    setFormData({ ...formData, thumbImage: value });
  };
  return (
    <div className="max-h-full">
      {/* <label className="lable">
        Category Image<span className="text-red-500">*</span>
      </label>
      <FileUpload
        url={urls}
        path="category"
        uid={uid}
        name="thumbImage"
        dataChanger={(value) => dataChangerThumbnail(value)}
        type="image"
        prev_src={"localhost:8001/" + formData?.thumbImage}
        required
        allowed_extensions={["jpg", "jpeg", "png", "gif"]}
        recommended="Recommenden size: Square / 🔳"
      />
      <div>
        <span className="lable">Category Image</span>
        <FormInput
        disabled
          value={urls}
          name="category_image"
          placeholder="Category Icon URL"
          items={null}
        />
      </div> */}
      <div>
        <span className="lable">Category Title</span>
        <FormInput
          name="category_title"
          placeholder="Placeholder Category"
          items={null}
        />
      </div>
      <div>
        <span className="lable">Child Category</span>
        <FormInput name="category_child" placeholder="Select child category" />
      </div>
      <div>
        <span className="lable">Category Path</span>
        <FormInput name="category_path" placeholder="link" />
      </div>
      <div>
        <span className="lable">Category Type</span>
        <FormInput name="category_type" placeholder="Food / Fruits ..." />
      </div>
      <div>
        <span className="lable">Uid</span>
        <FormInput name="category_uid" disabled placeholder="Select type" />
      </div>
    </div>
  );
};

export default CategoryForm;
