import { useFormikContext, getIn } from "formik";
import { useEffect, useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { BsFillInfoCircleFill } from "react-icons/bs";
import { Tooltip } from "@mantine/core";
import { db } from "@/app/utils/firebase";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSingleCustomer,
  updateSingleCustomer,
} from "@/app/redux/slices/singleCustomerSlice";

function FormInput({
  item,
  id,
  name,
  tooltip = false,
  hoverBoxContent,
  type = "text",
  editProfile = false,
  edit_input,
  parse, // optional value parser
  ...otherProps
}) {
  const {
    setFieldTouched,
    setFieldValue,
    setValues,
    errors,
    touched,
    values,
  } = useFormikContext();

  const [inputType, setInputType] = useState(type);
  const dispatch = useDispatch();
  const getCustomer = useSelector(selectSingleCustomer);

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  // deep getters
  const value = getIn(values, name) ?? (type === "number" ? "" : "");
  const error = getIn(errors, name);
  const isTouched = getIn(touched, name);

  // coercion
  const coerce = (raw) => {
    if (parse) return parse(raw);
    if (type === "number") {
      const n = Number(raw);
      return Number.isFinite(n) ? n : "";
    }
    if (type === "checkbox") return !!raw;
    return raw;
  };

  const onChange = (e) => {
    const raw = e?.target
      ? e.target.type === "checkbox"
        ? e.target.checked
        : e.target.value
      : e;
    setFieldValue(name, coerce(raw));
  };

  useEffect(() => {
    setCustomer(getCustomer);
  }, [getCustomer]);

  // hydrate customer fields when customer changes
  // useEffect(() => {
  //   setValues((prev) => ({
  //     ...prev,
  //     customer_name: customer?.cus_name || "",
  //     customer_address: customer?.cus_address || "",
  //   }));
  //   setLoading(false);
  // }, [customer, setValues]);

  // auto-fetch customer by phone
  useEffect(() => {
    if (name === "phone_number") {
      const phone = getIn(values, "phone_number");
      if (phone && String(phone).length === 11) customerData(phone);
    }
  }, [name, values]);

  const customerData = async (id) => {
    setLoading(true);
    dispatch(updateSingleCustomer([]));
    const doc = await db.collection("createCustomer").doc(id).get();
    const data = doc.data();
    if (data) dispatch(updateSingleCustomer({ ...data }));
    else dispatch(updateSingleCustomer([]));
  };

  return (
    <div className={`${!editProfile ? "mb-4" : ""}`}>
      <div className="relative flex items-center">
        <input
          name={name}
          onBlur={() => setFieldTouched(name, true)}
          onChange={onChange}
          value={value}
          type={inputType}
          {...otherProps}
          className={`outline-none border-[1px] py-3 text-sm appearance-none opacity-75 text-title px-5 rounded-md w-full border-gray-200 focus:outline-none
          focus:border-primary transition duration-200
          focus:ring-0 ease-in-out ${!editProfile ? "app_input" : edit_input}`}
        />

        {!!tooltip && (
          <span className="ml-2">
            <Tooltip
              wrapLines
              withArrow
              width={220}
              label={typeof tooltip === "string" ? tooltip : hoverBoxContent}
              color="dark"
              position="right"
              transition="fade"
              transitionDuration={200}
            >
              <BsFillInfoCircleFill color="#63CF50" />
            </Tooltip>
          </span>
        )}

        {type === "password" && (
          <>
            {inputType === "password" ? (
              <AiFillEye
                onClick={() => setInputType("text")}
                className="absolute z-20 cursor-pointer right-0 mr-4 text-[#63CF50]"
                size={23}
              />
            ) : (
              <AiFillEyeInvisible
                onClick={() => setInputType("password")}
                className="absolute z-20 cursor-pointer right-0 mr-4 text-[#63CF50]"
                size={23}
              />
            )}
          </>
        )}
      </div>

      {isTouched && error && (
        <span className="text-red-400 text-sm">{String(error)}</span>
      )}
    </div>
  );
}

export default FormInput;
