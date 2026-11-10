import React from "react";

const FooterCard = ({
  image = "null",
  title = "there was no title",
  subTitle = "empty",
}) => {
  return (
    <div className="flex gap-5 items-center w-fit">
      <img src={image} alt="icon" loading="lazy" />
      <div>
        <h1 className="font-bold text-lg text-mid">{title}</h1>
        <p className="text-sm leading-6">{subTitle}</p>
      </div>
    </div>
  );
};

export default FooterCard;
