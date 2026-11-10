import React from "react";
import Slider from "../shared/Slider";
import { Rating, Textarea, TextInput } from "@mantine/core";
import Button from "../shared/Button";

const Reviews = () => {
  return (
    <div className="sm:px-4 py-6">
      <div className="flex justify-between flex-col xl:flex-row gap-3">
        <div className="sm:border xl:w-6/12 w-full md:p-8 rounded-md">
          <div className="flex flex-col gap-3 border-b pb-6">
            <h1 className="text-4xl md:text-6xl text-orange">5.00</h1>
            <Rating value={4.5} fractions={2} readOnly />
            <p className="text-mid text-sm md:text-base">
              Avg. Star Rating:{" "}
              <span className="text-title font-semibold">(1 Reviews)</span>
            </p>
          </div>
          <div className=" border-b md:border-none py-6 sm:pb-0 flex flex-col gap-2">
            <Slider value={100} starcount={5} />
            <Slider value={0} starcount={4} />
            <Slider value={0} starcount={3} />
            <Slider value={0} starcount={2} />
            <Slider value={0} starcount={1} />
          </div>
        </div>
        <div className="flex flex-col py-2 md:py-0 md:px-6 gap-5">
          <div>
            <h2 className="text-xl font-bold pb-2">ADD YOUR REVIEW</h2>
            <p>
              Your email address will not be published. Required fields are
              marked *
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span>Your rating:</span>
            <Rating defaultValue={2} />
          </div>
          <Textarea
            placeholder="Your comment"
            label="Review:"
            radius="md"
            size="lg"
            withAsterisk
          />
          <div className="flex flex-1 gap-2 justify-between">
            <TextInput
              placeholder="Your name"
              label="Full name"
              size="lg"
              withAsterisk
            />
            <TextInput
              placeholder="Your Email"
              label="Email"
              size="lg"
              withAsterisk
            />
          </div>
          {/* submit button  */}
          <Button title="Submit" className={"bg-primary"} />
        </div>
      </div>
      <div></div>
    </div>
  );
};

export default Reviews;
