import { Tooltip } from "@mantine/core";
import React from "react";
import { TbListDetails } from "react-icons/tb";
import { Switch, Group } from "@mantine/core";
import { RxCross2 } from "react-icons/rx";
import { CgCheck } from "react-icons/cg";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import Link from "next/link";
import { updateProductId } from "../../../app/redux/slices/updateProductId";

const singleRow = ({ item }) => {
  return (
    <tr className="" key={item.id}>
      <td className="px-4 py-3">
        <span className="text-sm">{item.id}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm ">{item.product_details.product_name}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm">{item.product_details.parent_category}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold">
          {item.product_details.price}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold bg-green-100 text-green-600 px-3 py-1 rounded-full">
          {item.product_details.sale_price}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold">
          <span className="inline-flex px-2 text-xs font-medium leading-5 rounded-full text-blue-600 bg-blue-100">
            Available from {item.product_details.available_from}
          </span>
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm flex items-center justify-center font-semibold">
          {item.off_price}% Off
        </span>
      </td>
      <td className="px-4 py-3">
        <Link href={`/products/${item.id}`}>
          <Tooltip label="Details" color="blue" withArrow>
            <span className="text-sub-title flex items-center justify-center font-semibold cursor-pointer hover:text-blue-400">
              <TbListDetails size={18} />
            </span>
          </Tooltip>
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-semibold">
          <Group position="center">
            <Switch
              className="cursor-pointer"
              checked={item.isPublished}
              onChange={() =>
                toggleChecked(item.id, item.product_details.product_name)
              }
              color="teal"
              size="sm"
              thumbIcon={
                item.isPublished ? (
                  <CgCheck
                    size="0.8rem"
                    color={theme.colors.teal[theme.fn.primaryShade()]}
                    stroke={3}
                  />
                ) : (
                  <RxCross2
                    size="0.8rem"
                    color={theme.colors.red[theme.fn.primaryShade()]}
                    stroke={3}
                  />
                )
              }
            />
          </Group>
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-semibold flex justify-start gap-5 text-sub-title items-center">
          <Tooltip
            label="Edit"
            color="blue"
            withArrow
            onClick={() => dispatch(updateProductId({ id: item.id }))}
          >
            <span className="cursor-pointer hover:text-blue-400">
              <FiEdit size={16} />
            </span>
          </Tooltip>
          <Tooltip label="Delete" color="red" withArrow>
            <span className="cursor-pointer hover:text-red-400">
              <RiDeleteBinLine size={16} />
            </span>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
};

export default singleRow;
