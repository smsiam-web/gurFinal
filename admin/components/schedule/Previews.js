import React, { useState } from "react";
import { Skeleton } from "@mantine/core";
import { AiOutlineLike } from "react-icons/ai";
import { FaRegCommentAlt } from "react-icons/fa";
import { GiEarthAsiaOceania } from "react-icons/gi";
import { RiMessengerLine, RiShareForwardFill } from "react-icons/ri";
import Button from "../shared/Button";

const ACTIONS = [
  {
    name: "like",
    icon: <AiOutlineLike size={20} />,
  },
  {
    name: "Comment",
    icon: <FaRegCommentAlt size={16} />,
  },
  {
    name: "Share",
    icon: <RiShareForwardFill size={20} />,
  },
];
const Previews = () => {
  const [text, setText] = useState(false);
  const [hashtag, setHashtag] = useState(true);
  const [Img, setImg] = useState(true);

  return (
    <div>
      <div className="bg-white card-shadow max-w-md mx-auto rounded-md overflow-hidden p-3 sm:p-5">
        <div className="flex items-center gap-3">
          <img
            src="/saba_agro.jpg"
            alt="page logo"
            className="w-12 h-12 rounded-full"
          />
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
            <div>
              <h3>Some Text</h3>
              {hashtag && (
                <span className="text-sm font-semibold bg-blue-100 text-blue-500">
                  #hashtag
                </span>
              )}
            </div>
          ) : (
            <div>
              <Skeleton height={8} radius="xl" />
              <Skeleton height={8} mt={6} radius="xl" />
              <Skeleton height={8} mt={6} width="70%" radius="xl" />
            </div>
          )}
        </div>
        <div>
          {Img && (
            <img
              src="/placeholder.jpg"
              alt="productIMg"
              className="max-w-full object-center"
            />
          )}
        </div>
        <div className="flex w-full items-center justify-between py-2 px-2 bg-slate-100">
          <div>
            <h1 className="text-sm font-bold">সাবা এগ্রো নার্সারি</h1>
            <span className="text-xs text-gray-400">Product/Service</span>
          </div>
          <div>
            <span className="text-xs flex items-center gap-2 py-2 px-3 rounded-md text-gray-500 bg-gray-300">
              {<RiMessengerLine size={22} />}Send Message
            </span>
          </div>
        </div>
        <div className="flex justify-evenly mt-3 sm:mt-5 text-gray-500">
          {ACTIONS.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2 font-medium cursor-pointer"
            >
              <span>{item.icon}</span> <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Previews;
