import React, { useEffect, useState } from "react";
import { FormDropdown, FormInput } from "../shared/Form";
import Division from "../../data/Divisions/divisions.json";
import State from "../../data/State/districts.json";
import Upazilas from "../../data/Upazilas/upazilas.json";
import Unions from "../../data/Unions/unions.json";
import { useSelector } from "react-redux";
import { selectId } from "@/app/redux/slices/filterId";

const UpdateAddress = () => {
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
    }
  }, [filterID.id]);
  return (
    <main>
      <center className="border-b md:border-none mb-4">
        <h1 className="text-2xl md:text-4xl font-bold my-4">Update Address</h1>
      </center>
      <div className="w-full mt-10">
        <div className="grid grid-cols-6 gap-6">
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Division
            </label>
            <div className="relative">
              <FormDropdown name="state" placeholder="বিভাগ" items={DIVISION} />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Districs
            </label>
            <div className="relative">
              <FormDropdown name="city" placeholder="জেলা" items={city} />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Upazila
            </label>
            <div className="relative">
              <FormDropdown
                name="upazila"
                placeholder="উপজেলা"
                items={upazila}
              />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Union
            </label>
            <div className="relative">
              <FormDropdown name="union" placeholder="ইউনিয়ন" items={union} />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Street address
            </label>
            <div className="relative">
              <FormInput
                name="street_address"
                placeholder="Rangs Pearl, 76 Rd 12, Dhaka 1213"
              />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Post code
            </label>
            <div className="relative">
              <FormInput name="zip" placeholder="ZIP / Postal code" />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Contact number
            </label>
            <div className="relative">
              <FormInput name="phone" placeholder="Phone" />
            </div>
          </div>
          <div className="col-span-6 sm:col-span-3">
            <label className="block text-gray-500 font-medium text-sm leading-none mb-2">
              Email address
            </label>
            <div className="relative">
              <FormInput
                name="email"
                placeholder="Email address"
                type="email"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default UpdateAddress;
