import React from "react";
import Image from "next/image";

const NotFound = ({text}) => {
  return (
    <div className="text-center flex flex-col items-center justify-center align-middle mx-auto p-5 my-5">
      <Image src="/notFound01.svg" width={500} height={500} alt="no-result" className=""/>
      <h2 className="text-lg md:text-xl lg:text-2xl xl:text-2xl text-center mt-2 font-medium font-serif text-gray-600">
        Sorry, We can't find this. There are no {text} right now.
        <span role="img" aria-labelledby="img">
          😞
        </span>
      </h2>
    </div>
  );
};

export default NotFound;
