import { useSelector } from "react-redux";
import SectionHeading from "../shared/SectionHeading";
import { selectCategory } from "@/app/redux/slices/categorySlice";
import { useState } from "react";
import CategoryCard from "./CategoryCard";


const HomeCategory = () => {
  const [Category, setCateGory] = useState(null);
  const CATEGORY = useSelector(selectCategory);
  console.log(CATEGORY);

  return (
    <section className="bg-white">
      <div className="container py-14">
        <SectionHeading
          title="Browse by Category"
          link="All Categories"
          sliderBtn={true}
        />
        {/* Category slider */}
        <div className="flex pt-8 items-center gap-7 overflow-x-auto mt-5 pb-14 pl-2 -ml-2 no-scrollbar">
          {!!CATEGORY.length && CATEGORY.map((item) => (
            item.isPublished && <CategoryCard item={item} key={item?.id} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeCategory;
