"use client";
import React from "react";
import { Skeleton } from "@mantine/core";
import { AiOutlineLike } from "react-icons/ai";
import { FaRegCommentAlt } from "react-icons/fa";
import { TbShare3 } from "react-icons/tb";
import { GiEarthAsiaOceania } from "react-icons/gi";
import Image from "next/image";
import Breadcrumb from "@/app/components/shared/Breadcrumb";


const SinglePost = () => {
  const text = false;
  const hashtag = true;
  const Img = true;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 sm:mb-10">
        <Breadcrumb />
        <h1 className="text-2xl text-gray-700">Facebook Feed Review</h1>
      </div>
      <div className="bg-white card-shadow max-w-xl mx-auto rounded-md overflow-hidden p-3 sm:p-5">
        <div className="flex items-center gap-3">
          <Image src="/saba_agro.jpg" width={500} height={500} alt="p" />

          <div>
            <h1 className="text-base font-semibold">সাবা এগ্রো নার্সারি</h1>
            <div className="flex gap-1 items-center">
              <span className="text-sm text-gray-400">Just Now .</span>
              <GiEarthAsiaOceania />
            </div>
          </div>
        </div>
        <div className="my-2 sm:my-4">
          {text ? (
            <>
              <h3>Some Text</h3>
              {hashtag && (
                <span className="text-sm font-semibold bg-blue-100 text-blue-500">
                  #hashtag
                </span>
              )}
            </>
          ) : (
            <>
              <Skeleton height={8} radius="xl" />
              <Skeleton height={8} mt={6} radius="xl" />
              <Skeleton height={8} mt={6} width="70%" radius="xl" />
            </>
          )}
        </div>
        <div>
          {Img && (
            <Image src="/placeholder.jpg" width={500} height={500} alt="productIMg" />
          )}
        </div>
        <div className="flex justify-evenly mt-3 sm:mt-5 text-gray-500">
          <div className="flex items-center gap-2 font-medium cursor-pointer">
            <AiOutlineLike size={20} /> Like
          </div>
          <div className="flex items-center gap-2 font-medium cursor-pointer">
            <FaRegCommentAlt size={16} /> Comment
          </div>
          <div className="flex items-center gap-2 font-medium cursor-pointer">
            <TbShare3 size={18} />
            Share
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePost;
