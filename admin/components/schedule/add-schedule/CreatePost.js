"use client";
import React, { useState } from "react";
import { Select, Textarea, Tabs } from "@mantine/core";
import { MdAddPhotoAlternate, MdLocationOn } from "react-icons/md";
import { AiOutlineSchedule } from "react-icons/ai";
import { RiVideoFill, RiMessengerLine } from "react-icons/ri";
import { BsWhatsapp, BsTelephone } from "react-icons/bs";
import ScheduleInfo from "./ScheduleInfo";
import Button from "../../../../app/components/shared/Button";

const CreatePost = () => {
  const [data, setData] = useState([
    { value: "সাবা এগ্রো নার্সারি", label: "সাবা এগ্রো নার্সারি" },
  ]);
  const [hashTag, setHashTag] = useState([
    { value: "#সাবা_এগ্রো_নার্সারি", label: "#সাবা_এগ্রো_নার্সারি" },
    { value: "#চারাগাছ", label: "#চারাগাছ" },
  ]);
  const ActionBtn = [
    {
      name: "location",
      icon: <MdLocationOn size={22} />,
    },
    {
      name: "Get Message",
      icon: <RiMessengerLine size={22} />,
    },
    {
      name: "Get WhatsApp Message",
      icon: <BsWhatsapp size={20} />,
    },
    {
      name: "Get Phone Call",
      icon: <BsTelephone size={20} />,
    },
  ];

  return (
    <div className="flex flex-wrap flex-col gap-5">
      <div className="bg-white py-4 px-3 rounded-md shadow-sm">
        <div className="pb-2">
          <h1 className="text-base sm:text-lg text-gray-700">Post to</h1>
        </div>
        <>
          <Select
            placeholder="Pick one"
            // itemComponent={SelectItem}
            data={data}
            searchable
            maxDropdownHeight={400}
            nothingFound="Nobody here"
            filter={(value, item) =>
              item.label.toLowerCase().includes(value.toLowerCase().trim()) ||
              item.description
                .toLowerCase()
                .includes(value.toLowerCase().trim())
            }
          />
        </>
      </div>
      <div className="bg-white py-4 px-3 rounded-md shadow-sm">
        <div className="pb-2">
          <h1 className="text-base sm:text-lg text-gray-700">Media</h1>
          <p className="text-sm text-gray-500">
            Share photos or a video. Facebook posts can't exceed 10 photos.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-[260px] py-2">
          <div className="col-span-1">
            <label htmlFor="Image" className="cursor-pointer">
              <div className="flex items-center gap-1 border w-fit px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-gray-700 text-sm transition-all duration-300">
                <MdAddPhotoAlternate size={22} />
                <span>Add Photo</span>
              </div>
            </label>
            <input
              id="Image"
              type="file"
              name="Image"
              accept="image/png, image/jpg, image/jpeg"
              className="hidden"
              multiple
            />
          </div>
          <div className="col-span-1">
            <label htmlFor="video" className="cursor-pointer">
              <div className="flex items-center gap-1 border w-fit px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-gray-700 text-sm transition-all duration-300">
                <RiVideoFill size={22} />
                <span>Add Video</span>
              </div>
            </label>
            <input
              id="video"
              type="file"
              name="video"
              accept="video/*"
              className="hidden"
            />
          </div>
        </div>
      </div>
      <div className="bg-white py-4 px-3 rounded-md shadow-sm">
        <div className="pb-2">
          <h1 className="text-base sm:text-lg text-gray-700">Post details</h1>
        </div>

        <div>
          <div className="mb-3">
            <Textarea placeholder="" label="Text" />
          </div>
          <div className="flex items-center gap-2">
            {ActionBtn &&
              ActionBtn.map((item) => (
                <div
                  className="hover:bg-indigo-100 text-indigo-400 hover:text-indigo-500 w-fit p-[6px] rounded-full cursor-pointer transition-all duration-300"
                  key={item.name}
                >
                  {item.icon}
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="bg-white py-4 px-3 rounded-md shadow-sm">
        <h1 className="text-base sm:text-lg text-gray-700 pb-3">
          Scheduling options
        </h1>
        <div>
          <Tabs variant="pills" color="violet" defaultValue="schedule">
            <Tabs.List>
              <Tabs.Tab
                value="schedule"
                icon={<AiOutlineSchedule size={20} />}
                className="bg-indigo-100 text-indigo-500 font-medium"
              >
                Schedule
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="schedule" pt="xs">
              <ScheduleInfo />
            </Tabs.Panel>
          </Tabs>
        </div>
      </div>
      <div className="bg-white py-4 px-3 rounded-md shadow-sm grid grid-cols-2 gap-5">
        <div className="col-span-2 md:col-span-1">
          <Button
            title="Cancle"
            className="w-full xl:text-lg bg-slate-200 text-gray-600 hover:bg-slate-300 transi duration-300"
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <Button
            title="Schedule"
            className="w-full xl:text-lg bg-indigo-500 hover:bg-indigo-600 text-white transi duration-300"
          />
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
