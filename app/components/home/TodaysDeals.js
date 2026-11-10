import React, { useEffect, useState } from "react";
import SectionHeading from "../shared/SectionHeading";
import ProductCard from "../product/ProductCard";
import { useSelector } from "react-redux";
import { selectProduct } from "@/app/redux/slices/productSlice";
import Loader from "../shared/Loader";

const TodaysDeals = () => {
  const Products = useSelector(selectProduct);
  const [loading, setLoading] = useState(false);

  setTimeout(() => {
    setLoading(true);
  }, 1500);

  return (
    <section className="bg-white">
      <div className="container">
        <SectionHeading
          title="Top Saver Today"
          link="All Offers"
          sliderBtn={true}
        />
        {/* Category slider */}
        <div className="flex pt-8 items-center justify-items-stretch gap-7 overflow-x-auto mt-5 pb-14 pl-2 -ml-2 no-scrollbar">
          {loading ? (
            Products &&
            Products?.map(
              (product) =>
                product?.isPublished && (
                  <ProductCard key={product.id} product={product} />
                )
            )
          ) : (
            <Loader />
          )}
        </div>
      </div>
    </section>
  );
};

export default TodaysDeals;
