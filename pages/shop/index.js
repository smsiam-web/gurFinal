import React, { useState } from "react";
import Card from "../../app/components/home/products/Card";
import Breadcrumb from "@/app/components/shared/Breadcrumb";
import { useSelector } from "react-redux";
import { selectProduct } from "@/app/redux/slices/productSlice";

const Shop = () => {
  const Products = useSelector(selectProduct);
  const [loading, setLoading] = useState(false);

  setTimeout(() => {
    setLoading(true);
  }, 1500);
  return (
    <>
      <main>
        {/* Breadcumb */}
        <div className="bg-[#f5f5f5] p-5">
          <div className="mx-auto max-w-5xl">
            <Breadcrumb />
          </div>
        </div>

        <div className="p-5">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-2xl md:text-3xl xl:text-4xl text-center font-bold pb-6">
              Shop
            </h1>
            <div>
              {/* Category slider */}
              <div className="w-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
                  {Products &&
                    Products?.map((i) => <Card item={i} key={i.id} />)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Shop;
