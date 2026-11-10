import React, { useEffect, useState } from "react";
import { AppTextArea, FormDropdown, FormInput } from "../shared/Form";
import Division from "../../data/Divisions/divisions.json";
import State from "../../data/State/districts.json";
import Upazilas from "../../data/Upazilas/upazilas.json";
import Unions from "../../data/Unions/unions.json";
import { useSelector } from "react-redux";
import { selectId } from "@/app/redux/slices/filterId";

const BillingDetailsForm = () => {
  const filterID = useSelector(selectId);
  const DIVISION = Division[2].data;
  const CITY = State[2].data;
  const UPAZILAS = Upazilas[2].data;
  const UNIONS = Unions[2].data;

  // console.log(UPAZILAS);

  const [city, setCity] = useState(CITY);
  const [upazila, setUpazila] = useState(UPAZILAS);
  const [union, setUnion] = useState(UNIONS);

  useEffect(() => {
    switch (filterID.name) {
      case "division":
        const filterCity = [];
        CITY.find((item) => {
          if (item.division_id === filterID.id) filterCity.push(item);
          setCity(filterCity);
        });
        break;
      case "city":
        const filterUpazila = [];
        UPAZILAS.find((item) => {
          if (item.district_id === filterID.id) filterUpazila.push(item);
          setUpazila(filterUpazila);
        });
        break;
      case "upazila":
        const filterUnion = [];
        UNIONS.find((item) => {
          if (item.upazilla_id === filterID.id) filterUnion.push(item);
          setUnion(filterUnion);
        });
        break;
      default:
      // console.log("");
    }
  }, [filterID.id]);

  return (
    <div>
      <span>Full name:</span>
      <FormInput name="full_name" placeholder="Full name" />
      <span>Division:</span>
      <FormDropdown name="state" placeholder="বিভাগ" items={DIVISION} />
      <span>Districs:</span>
      <FormDropdown name="city" placeholder="জেলা" items={city} />
      <span>Upazila:</span>
      <FormDropdown name="upazila" placeholder="উপজেলা" items={upazila} />
      <span>Union:</span>
      <FormDropdown name="union" placeholder="ইউনিয়ন" items={union} />
      <span>Street address:</span>
      <FormInput
        name="street_address"
        placeholder="Rangs Pearl, 76 Rd 12, Dhaka 1213"
      />
      <span>Post code:</span>
      <FormInput name="zip" placeholder="ZIP / Postal code" />
      <span>Contact number:</span>
      <FormInput name="phone" placeholder="Phone" />
      <span>Email address:</span>
      <FormInput name="email" placeholder="Email address" type="email" />
      <span>Notes:</span>
      <AppTextArea
        name="notes"
        placeholder="Order notes (optional)"
        type="textarea"
      />
    </div>
  );
};

export default BillingDetailsForm;
