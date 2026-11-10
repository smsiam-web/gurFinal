import Button from "@/app/components/shared/Button";
import { BiPlus } from "react-icons/bi";
import { useDisclosure } from "@mantine/hooks";
import { Drawer } from "@mantine/core";
import React, { useEffect } from "react";
import AddCategory from "./AddCategory";
import { useDispatch } from "react-redux";
import { updateTempImgUrl } from "@/app/redux/slices/tempImgUrl";

const SearchCategory = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const dispatch = useDispatch();
  //clear tempUrl when close the drawer
  useEffect(() => {
    dispatch(updateTempImgUrl([]));
  }, [opened]);

  return (
    <>
      {/* add category drawer  */}
      <div>
        <Drawer
          opened={opened}
          onClose={close}
          zIndex={9999999}
          withCloseButton={false}
          position="right"
          size="lg"
          padding={0}
        >
          <AddCategory onClick={close} />
        </Drawer>
      </div>
      <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50  shadow-xs  mb-5">
        <div className="p-4">
          <div className="py-3 grid gap-4 lg:gap-6 xl:gap-6 md:flex xl:flex">
            {/* search category __ input  */}
            <div className="flex-grow-0  md:flex-grow lg:flex-grow xl:flex-grow">
              <input
                className="block w-full px-3 py-1 text-sm focus:outline-neutral-200 leading-5 rounded-md  border-gray-200 h-14 bg-gray-100 border-transparent focus:bg-white"
                type="search"
                // name="search"
                placeholder="Search by category type"
              />
            </div>

            {/* filter category  */}
            <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
              <select className="block w-full px-2 py-1 text-sm cursor-pointer focus:outline-none rounded-md form-select focus:border-gray-200 border-gray-200  focus:shadow-none leading-5 border h-14 bg-gray-100 border-transparent focus:bg-white">
                <option value="All" hidden="">
                  Category
                </option>
                <option value="Organic Food">Organic Food</option>
                <option value="Fish &amp; Meat">Fish &amp; Meat</option>
                <option value="Fruits &amp; Vegetable">
                  Fruits &amp; Vegetable
                </option>
                <option value="Fresh Seafood">Fresh Seafood</option>
                <option value="Cooking Essentials">Cooking Essentials</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Drinks">Drinks</option>
                <option value="Milk &amp; Dairy">Milk &amp; Dairy</option>
                <option value="Organic Food">Organic Food</option>
                <option value="Honey">Honey</option>
                <option value="Sauces &amp; Pickles">
                  Sauces &amp; Pickles
                </option>
                <option value="Jam &amp; Jelly">Jam &amp; Jelly</option>
                <option value="Snacks &amp; Instant">
                  Snacks &amp; Instant
                </option>
                <option value="Biscuits &amp; Cakes">
                  Biscuits &amp; Cakes
                </option>
                <option value="Household Tools">Household Tools</option>
                <option value="Baby Care">Baby Care</option>
                <option value="Pet Care">Pet Care</option>
                <option value="Beauty &amp; Health">Beauty &amp; Health</option>
                <option value="Sports &amp; Fitness">
                  Sports &amp; Fitness
                </option>
              </select>
            </div>

            {/* add category btn  */}
            <div className="w-full md:w-56 lg:w-56 xl:w-56">
              <Button
                onClick={open}
                title="Add Category"
                className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                icon=<BiPlus size={24} />
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchCategory;
