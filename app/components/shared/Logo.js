import { motion } from "framer-motion";
import React from "react";
import Image from "next/image";

const Logo = () => {
    const title = process.env.APP_TITLE_02 || "";
  return (
    <div className="flex  justify-between drop-shadow-xl w-fit items-center space-x-3">
      <motion.div
        className="rounded-full  overflow-hidden"
        whileHover={{ scale: 1.03 }}
      >
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/rajshahiraamwala-8b7bf.appspot.com/o/login-dark.png?alt=media&token=aea581a5-f09e-4888-ae1f-984f835bb6af"
          width="60"
          height="60"
          // objectFit="contain"
          alt="Logo"
        />
      </motion.div>
      <div className="border-l-[6px] sm:border-l-8 pl-3">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-green-700">
          {title}
        </h2>
        <span className="text-base font-semibold text-primary">E-commerce</span>
      </div>
    </div>
  );
};

export default Logo;
