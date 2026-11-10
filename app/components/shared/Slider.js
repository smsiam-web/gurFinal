import React from "react";
import { Progress } from "@mantine/core";

const SingleSlider = ({ value, starcount }) => {
  return (
    <div className="flex justify-start items-center gap-2 md:gap-4">
      <p className="w-fit text-sm md:text-base">{starcount} stars</p>
      <div className="w-8/12">
        <Progress color="yellow" radius="xs" size="sm" value={value} />
      </div>
      <div className="w-8/12 hidden">
        <Progress color="yellow" radius="xs" size="lg" value={value} />
      </div>
      <span className="text-title text-sm md:text-base">{value}%</span>
    </div>
  );
};

export default SingleSlider;
