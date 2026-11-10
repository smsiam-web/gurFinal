import React from "react";
import { Tabs } from "@mantine/core";
import Description from "./Description";
import { BiDetail, BiInfoCircle, BiStar } from "react-icons/bi";
import AdditionalInfo from "./AdditionalInfo";
import Reviews from "./Reviews";

const ProductMoreInfo = ({ product = null }) => {
  return (
    <div className="flex gap-6">
      <div className=" mt-6 w-full px-4 bg-white rounded-lg p-8">
        <Tabs
          className="sm:flex hidden"
          color="indigo"
          radius="md"
          orientation="vertical"
          defaultValue="description"
        >
          <Tabs.List>
            <Tabs.Tab
              value="description"
              className="text-lg font-semibold text-sub-title"
              icon={<BiDetail size={14} />}
            >
              Description
            </Tabs.Tab>
            <Tabs.Tab
              value="additionalinfo"
              className="text-lg font-semibold text-sub-title"
              icon={<BiInfoCircle size={14} />}
            >
              Additional Info
            </Tabs.Tab>
            <Tabs.Tab
              value="reviews"
              className="text-lg font-semibold text-sub-title"
              icon={<BiStar size={14} />}
            >
              Reviews
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="description" pl="xs">
            <Description />
          </Tabs.Panel>

          <Tabs.Panel value="additionalinfo" pl="xs">
            <AdditionalInfo />
          </Tabs.Panel>

          <Tabs.Panel value="reviews" pl="xs">
            <Reviews />
          </Tabs.Panel>
        </Tabs>
        <Tabs
          className="flex flex-col sm:hidden"
          color="indigo"
          radius="md"
          defaultValue="description"
        >
          <Tabs.List>
            <Tabs.Tab
              value="description"
              className="text-lg font-semibold text-sub-title"
              icon={<BiDetail size={14} />}
            >
              Description
            </Tabs.Tab>
            <Tabs.Tab
              value="additionalinfo"
              className="text-lg font-semibold text-sub-title"
              icon={<BiInfoCircle size={14} />}
            >
              Additional Info
            </Tabs.Tab>
            <Tabs.Tab
              value="reviews"
              className="text-lg font-semibold text-sub-title"
              icon={<BiStar size={14} />}
            >
              Reviews
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="description" pl="xs">
            <Description />
          </Tabs.Panel>

          <Tabs.Panel value="additionalinfo" pl="xs">
            <AdditionalInfo product={product} />
          </Tabs.Panel>

          <Tabs.Panel value="reviews" pl="xs">
            <Reviews />
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductMoreInfo;
