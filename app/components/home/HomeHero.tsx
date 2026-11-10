import React from "react";
import { setBackgroundImage } from "../../utils/helpers";
import Link from "next/link";

const HomeHero = () => {
  return (
    <section
      className="py-8 sm:py-12 lg:py-14"
      style={setBackgroundImage("/images/homepage-bg.jpg")}
    >
      <div className="container">
        <div className=" flex flex-wrap sm:flex-nowrap gap-8 items-stretch">
          {/* Hero Left Banner  */}
          <div
            className="flex-1 lg:over-image mobile-image image md:px-14 md:py-20 px-8 py-12 rounded-lg"
            // style={setBackgroundImage("/cover.jpg", {
            //   backgroundPosition: "center",
            //   backgroundSize: "100%",
            // })}
          >
            <div className="flex flex-col justify-between h-full">
              <div className="">
                <h2 className="capitalize text-shadow leading-10 text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold pb-6 md:pb-8 lg:pb-10 text-white">
                  রসালো আমের সাথে <br /> সতেজ গ্রীষ্মকাল
                </h2>
                <p className="text-md text-gray-100">
                  সকল প্রকার ফর্মালিন বা কেমিক্যাল মুক্ত আম নিন এবং <br />
                  আপনার সন্তান ও পরিবারকে সুরক্ষিত রাখুন
                </p>
              </div>
              <Link
                href="/shop"
                className="text-title capitalize bg-white text-sm sm:text-md py-3 px-6 rounded-sm w-fit block font-bold mt-10 md:mt-12 lg:mt-16 hover:shadow-md shadow-sm"
              >
                shop now
              </Link>
            </div>
          </div>
          {/* Hero Right Banner  */}
          <div
            className="w-full sm:w-1/3 md:px-12 md:py-20 bg-white px-8 py-12 rounded-lg"
            style={setBackgroundImage("/images/mango_1.jpg", {
              backgroundPosition: "bottom right",
              backgroundSize: "100%",
            })}
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <h2 className="capitalize text-3xl sm:text-3xl md:text-4xl lg:text-5xl font-bold pb-4 md:pb-8 lg:pb-10 text-title">
                  20% sell off
                </h2>
                <p className="text-lg lg:text-xl text-shadow-white text-title w-5/6 lg:w-1/2">
                  প্রি-অর্ডার করলেই পেয়ে যাবেন ২০% মূল্য ছাড়
                </p>
              </div>
              <Link
                href="/shop"
                className="text-title capitalize bg-primary text-sm sm:text-md py-3 px-6 rounded-sm w-fit block font-bold mt-10 md:mt-12 lg:mt-16 hover:shadow-md"
              >
                shop now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHero;
