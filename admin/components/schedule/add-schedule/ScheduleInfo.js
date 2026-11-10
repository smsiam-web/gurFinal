"use clint";
import React from "react";
import { useState, useRef } from "react";
import { DateInput, TimeInput } from "@mantine/dates";
import { ActionIcon, NumberInput, Select } from "@mantine/core";
import { MdSchedule } from "react-icons/md";

const ScheduleInfo = () => {
  const [value, setValue] = useState(null);
  const [data, setData] = useState([
    { value: "74:00", label: "every 3 days" },
    { value: "48:00", label: "every 2 days" },
    { value: "02:00", label: "every 2 hours" },
    { value: "01:00", label: "every 1 hour" },
    { value: "00:30", label: "every 30 min" },
    { value: "02:00", label: "every 1 hour" },
  ]);
  const ref = useRef();

  return (
    <div className="max-w-full">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 md:col-span-1">
          <DateInput
            value={value}
            onChange={setValue}
            label="Schedule Date"
            placeholder="Date input"
            maw={400}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <TimeInput
            label="Schedule Time"
            ref={ref}
            rightSection={
              <ActionIcon onClick={() => ref.current.showPicker()}>
                <MdSchedule size={22} />
              </ActionIcon>
            }
            maw={400}
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          <NumberInput
            type="number"
            placeholder="Repost  this post"
            label="Repost  this post"
            rightSection={
              <span className="bg-indigo-100 text-indigo-500 -translate-x-[13.6px] p-[4.6px] rounded-tr-[.25rem] rounded-br-[.25rem]">
                Times
              </span>
            }
            hideControls
          />
        </div>
        <div className="col-span-2 md:col-span-1">
          {/* make it dynamic  */}
          <Select
            label="Time Interval"
            data={data}
            placeholder="Select times"
            nothingFound="Nothing found"
            searchable
            creatable
            getCreateLabel={(query) => `+ Create ${query}`}
            onCreate={(query) => {
              const item = { value: query, label: query };
              setData((current) => [...current, item]);
              return item;
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ScheduleInfo;
