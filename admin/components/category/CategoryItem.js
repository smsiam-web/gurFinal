import React, { useEffect, useState } from "react";
import {
  Switch,
  Group,
  useMantineTheme,
  Modal,
  Tooltip,
  Drawer,
  Pagination,
} from "@mantine/core";
import { RxCross2 } from "react-icons/rx";
import { CgCheck } from "react-icons/cg";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import { db } from "@/app/utils/firebase";
import { updateCategory } from "@/app/redux/slices/categorySlice";
import { useDispatch } from "react-redux";
import { notifications } from "@mantine/notifications";
import Image from "next/image";
import { useDisclosure } from "@mantine/hooks";
import Button from "../shared/Button";
import CategoryAction from "./CategoryAction";

const CategoryItem = () => {
  const theme = useMantineTheme();
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [filterCategory, setFilterCategory] = useState(null);
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();

  const toggleDrawer = (item) => {
    isOpen ? setIsOpen(false) : setIsOpen(true);
    setFilterCategory(item);
  };

  //   console.log(category);
  const deleteCategory = (item) => {
    open();
    setFilterCategory(item);
  };

  //after confirmaiton Delete category details from firebase
  const DeleteCategory = async (item) => {
    await db
      .collection("category")
      .doc(item.category_uid)
      .delete()
      .then(() => {
        notifications.show({
          title: "Delete successfully",
          message: `${item.category_title}, ID: ${item.category_uid}`,
          color: "orange",
        });
      })
      .catch((error) => {
        console.error("Error removing document: ", error);
      });
    close();
    setFilterCategory(null);
  };

  const toggleChecked = (id, name) => {
    category.map((item) => {
      if (item.category_uid !== id) return;
      else {
        item.isPublished
          ? UpdatePublishedState(id, name, false)
          : UpdatePublishedState(id, name, true);
      }
    });
  };

  // update published state
  const UpdatePublishedState = async (id, name, values) => {
    const ref = db.collection("category").doc(id);
    return ref
      .set(
        {
          isPublished: values,
        },
        { merge: true }
      )
      .then(() => {
        values
          ? notifications.show({
              title: "Published successfully",
              message: `${name}, ID: ${id}`,
              autoClose: 3000,
            })
          : notifications.show({
              title: "Removed successfully",
              message: `${name}, ID: ${id}`,
              color: "orange",
              autoClose: 3000,
            });
      })
      .catch((error) => {
        notifications.show({
          title: "Somthing went Wrong",
          message: { error },
          color: "red ",
          autoClose: 3000,
        });
        console.log(error);
      });
  };

  // Get order from firebase database
  useEffect(() => {
    setLoading(true);
    const unSub = db
      .collection("category")
      .orderBy("timestamp", "desc")
      .onSnapshot((snap) => {
        const categorys = [];
        snap.docs.map((doc) => {
          categorys.push({
            ...doc.data(),
          });
        });
        setCategory(categorys);
        dispatch(updateCategory(categorys));
        setLoading(false);
      });
    return () => {
      unSub();
    };
  }, []);

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        centered
        zIndex={99999}
        withCloseButton={false}
        size="lg"
        padding={0}
      >
        <div className="px-16 py-12 pb-0 flex flex-col items-center text-center gap-3">
          <span className="text-red-500">
            <RiDeleteBinLine size={50} />
          </span>
          <h1 className="text-2xl text-title">
            Are You Sure! Want to{" "}
            <span className="text-red-500">Delete!!!</span>{" "}
            <span className="text-primary">
              {filterCategory?.category_title}
            </span>{" "}
          </h1>
          <p className="text-base pb-6">
            If you delete these records? Then you can't view this in your list
            anymore.!
          </p>
        </div>
        <div className="bg-gray-50 w-full flex items-center justify-center gap-5 py-5">
          <Button
            onClick={close}
            title="No, keep it!"
            className="bg-green-500 outline-none hover:shadow-xl transition-all duration-300 font-normal text-white"
          />
          <Button
            onClick={() => DeleteCategory(filterCategory)}
            title="Yes, Delete it!"
            className="text-gray-50 font-normal bg-red-400 hover:bg-red-500 hover:shadow-xl transition-all duration-300"
          />
        </div>
      </Modal>
      <Drawer
        opened={isOpen}
        onClose={close}
        zIndex={9999999}
        withCloseButton={false}
        position="right"
        size="lg"
        padding={0}
      >
        <CategoryAction onClick={() => toggleDrawer()} item={filterCategory} />
      </Drawer>
      <div className="grid gap-4 w-full overflow-hidden">
        {/* <h1 className="text-title pb-4 text-2xl font-medium">Recent Order</h1> */}
        <div className="w-full overflow-x-scroll rounded-md">
          <table className="w-full whitespace-nowrap table-auto">
            <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200  bg-gray-100">
              <tr>
                <td className="px-4 py-3 ">ID</td>
                <td className="px-4 py-3 ">Icon</td>
                <td className="px-4 py-3 ">PARENT</td>
                <td className="px-4 py-3 ">CHILDREN</td>
                <td className="px-4 py-3 ">TYPE</td>
                <td className="px-4 py-3 ">PUBLISHED</td>
                <td className="px-4 py-3 ">ACTIONS</td>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 ">
              <>
                {!!category &&
                  category?.map(
                    (item, index) =>
                      index >= 15 * page - 15 &&
                      index + 1 <= 15 * page && (
                        <tr key={index}>
                          <td className="px-4 py-3 font-bold">
                            {/* <Link href={`/admin/place-order/id=${item.id}`}> */}
                            <span className="text-sm">{item.category_uid}</span>
                            {/* </Link> */}
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-sm ">
                              <Image
                                src={item?.category_image}
                                width={20}
                                height={20}
                                alt={`${item?.category_title} icon`}
                              />
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold ">
                              {item?.category_title}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold">
                              {item?.category_child}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold">
                              {item?.category_type}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold">
                              <Group position="center">
                                <Switch
                                  className="cursor-pointer"
                                  checked={item.isPublished}
                                  onChange={() =>
                                    toggleChecked(
                                      item.category_uid,
                                      item.category_title
                                    )
                                  }
                                  color="teal"
                                  size="sm"
                                  thumbIcon={
                                    item.isPublished ? (
                                      <CgCheck
                                        size="0.8rem"
                                        color={
                                          theme.colors.teal[
                                            theme.fn.primaryShade()
                                          ]
                                        }
                                        stroke={3}
                                      />
                                    ) : (
                                      <RxCross2
                                        size="0.8rem"
                                        color={
                                          theme.colors.red[
                                            theme.fn.primaryShade()
                                          ]
                                        }
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
                              <Tooltip label="Edit" color="blue" withArrow>
                                <span
                                  onClick={() => toggleDrawer(item)}
                                  className="cursor-pointer hover:text-blue-400"
                                >
                                  <FiEdit size={16} />
                                </span>
                              </Tooltip>

                              <Tooltip label="Delete" color="red" withArrow>
                                <span
                                  className="cursor-pointer"
                                  onClick={() => deleteCategory(item)}
                                >
                                  <RiDeleteBinLine size={17} />
                                </span>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      )
                  )}
              </>
            </tbody>
          </table>
        </div>
        {category?.length >= 15 && (
          <div className="bg-white py-3 justify-center flex">
            <Pagination
              total={Math.ceil(category?.length / 15)}
              boundaries={1}
              defaultValue={1}
              onChange={(i) => setPage(i)}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default CategoryItem;
