import ScaleLoader from "react-spinners/ScaleLoader";
import React from "react";

const Loader = () => {
  return (
    <div className="flex items-center justify-center mx-auto">
      <ScaleLoader color="#ffd601" height={40} width={4} />
    </div>
  );
};

export default Loader;
