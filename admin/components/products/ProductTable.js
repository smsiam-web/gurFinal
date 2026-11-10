import { Tooltip, LoadingOverlay } from "@mantine/core";
import React, { useEffect } from "react";
import { TbListDetails } from "react-icons/tb";
import { useState } from "react";
import { Switch, Group, useMantineTheme, Modal } from "@mantine/core";
import { RxCross2 } from "react-icons/rx";
import { CgCheck } from "react-icons/cg";
import { FiEdit } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import Link from "next/link";
import { db } from "@/app/utils/firebase";
import { notifications } from "@mantine/notifications";
import { useDispatch } from "react-redux";
import { updateProductId } from "../../../app/redux/slices/updateProductId";
import FormHeader from "../shared/FormHeader";
import Button from "../shared/Button";

const ProductTable = ({ onClick }) => {
  const theme = useMantineTheme();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState(null);
  const [filterProduct, setFilterProduct] = useState(null);
  const dispatch = useDispatch();

  const [opened, setOpened] = useState(false);

  const toggleOpen = () => {
    opened ? setOpened(false) : setOpened(true);
  };

  const toggleChecked = (id, name) => {
    products.map((item) => {
      if (item.id !== id) return;
      else {
        item.isPublished
          ? UpdatePublishedState(id, name, false)
          : UpdatePublishedState(id, name, true);
      }
    });
  };

  // update published state
  const UpdatePublishedState = async (id, name, values) => {
    const ref = db.collection("products").doc(id);
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
            })
          : notifications.show({
              title: "Removed successfully",
              message: `${name}, ID: ${id}`,
              color: "orange",
            });
      })
      .catch((error) => {
        notifications.show({
          title: "Somthing went Wrong",
          message: { error },
          color: "red ",
        });
        console.log(error);
      });
  };

  // Confirmation product from firebase
  const ConfirmationDelete = async (item) => {
    toggleOpen();
    setFilterProduct(item);
  };

  //after confirmaiton Delete porduct from firebase
  const DeleteProduct = async (item) => {
    await db
      .collection("products")
      .doc(item.id)
      .delete()
      .then(() => {
        notifications.show({
          title: "Delete successfully",
          message: `${item.product_details.product_name}, ID: ${item.id}`,
          color: "orange",
        });
      })
      .catch((error) => {
        console.error("Error removing document: ", error);
      });
    toggleOpen();
    setFilterProduct(null);
  };

  // Get products from firebase
  useEffect(() => {
    setLoading(true);
    const unSub = db
      .collection("products")
      .orderBy("created_at", "desc")
      .onSnapshot((snap) => {
        const product = [];
        snap.docs.map((doc) => {
          product.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setProducts(product);
      });
    setLoading(false);
    return () => {
      unSub();
    };
  }, []);

  return (
    <main>
      <Modal
        opened={opened}
        withCloseButton={false}
        onClose={() => toggleOpen()}
        // title="Confirmation"
        centered
      >
        <div className="p-2 rounded-lg">
          <FormHeader
            onClick={() => toggleOpen()}
            title={"Confirmation"}
            sub_title="Are you sure you want to Delete this item...!!!"
          />
          {filterProduct && (
            <div className="bg-gray-50 py-10">
              <div className="flex flex-col items-center gap-3">
                {/* <div className="rounded-md flex justify-center overflow-hidden">
                  <img
                    src={filterProduct?.productImg.urls}
                    alt="product_img"
                    className="object-cover h-40 w-64 rounded-md overflow-hidden "
                  />
                </div> */}
                <div className="text-center">
                  <h1 className="text-2xl font-semibold text-title">
                    {filterProduct?.title}
                  </h1>
                  <h1 className="text-base font-semibold text-sub-title">
                    {filterProduct?.id}
                  </h1>
                </div>
                <div className="grid grid-cols-2 gap-6 mt-4">
                  <Button
                    onClick={() => toggleOpen()}
                    title="Cancel"
                    className="text-md bg-indigo-400 hover:bg-indigo-500 text-white px-8"
                  />
                  <Button
                    onClick={() => DeleteProduct(filterProduct)}
                    title="Delete"
                    className="text-md bg-red-500 hover:bg-red-600 text-white px-8"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
      <div className="grid gap-4 w-full overflow-hidden ">
        <div className="w-full overflow-x-scroll rounded-md relative">
          <table className="w-full whitespace-nowrap table-auto">
            <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200  bg-gray-100">
              <tr>
                <td className="px-4 py-3 ">Product id</td>
                <td className="px-4 py-3 ">sku</td>
                <td className="px-4 py-3 ">store</td>
                <td className="px-4 py-3 ">PRODUCT NAME</td>
                <td className="px-4 py-3 ">CATEGORY</td>
                <td className="px-4 py-3 ">SALE PRICE</td>
                <td className="px-4 py-3 ">STOCK</td>
                <td className="px-4 py-3 ">Options</td>
                <td className="px-4 py-3 ">Status</td>
                <td className="px-4 py-3 ">DETAILS</td>
                <td className="px-4 py-3 ">PUBLISHED</td>
                <td className="px-4 py-3 ">ACTIONS</td>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100 ">
              {loading ? (
                <div className="h-40">
                  <LoadingOverlay visible={loading} overlayBlur={0.5} />
                </div>
              ) : (
                <>
                  {!!products &&
                    products?.map((item) => (
                      <tr className="" key={item.id}>
                          <td className="px-4 py-3">
                        <Link href={`/products/id=${item?.id}`}>
                            <span className="text-sm font-bold">
                              #{item?.id || "null"}
                            </span>
                        </Link>
                          </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">
                            {item?.single_sku ||
                              item?.variants[0]?.sku ||
                              "null"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">
                            {item?.store_id || "null"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm ">
                            {item?.title || "null"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">
                            {item?.categories[0]?.id || "null"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {item?.variants?.map((item) => (
                            <h6
                              key={item?.id}
                              className="text-sm font-semibold"
                            >
                              {item?.price}
                            </h6>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          {item?.variants?.map((item) => (
                            <h6
                              key={item?.id}
                              className="text-sm font-semibold"
                            >
                              {item?.inventory[0]?.stock_on_hand}
                            </h6>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          {item?.options?.map((item) => (
                            <h6
                              key={item?.name}
                              className="text-sm font-semibold"
                            >
                              {`${item?.name}: `}
                              {item?.values.map((e) => `${e?.value}, `)}
                            </h6>
                          ))}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold">
                            <span className="inline-flex px-2 text-xs font-medium leading-5 rounded-full text-blue-600 bg-blue-100">
                              {item?.status}
                            </span>
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <Link href={`/products/id=${item.id}`}>
                            <Tooltip label="Details" color="blue" withArrow>
                              <span className="text-sub-title flex items-center justify-center font-semibold cursor-pointer hover:text-blue-400">
                                <TbListDetails size={18} />
                              </span>
                            </Tooltip>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold">
                            <Group position="center" className="cursor-pointer">
                              <Switch
                                className="cursor-pointer"
                                checked={item.isPublished}
                                onChange={() =>
                                  toggleChecked(item?.id, item?.title)
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
                            <Link href={`/products/edit-product/id=${item.id}`}>
                              <Tooltip label="Edit" color="blue" withArrow>
                                <span className="text-sub-title flex items-center justify-center font-semibold cursor-pointer hover:text-blue-400">
                                  <FiEdit size={16} />
                                </span>
                              </Tooltip>
                            </Link>

                            <Tooltip label="Delete" color="red" withArrow>
                              <span
                                onClick={() => ConfirmationDelete(item)}
                                className="cursor-pointer hover:text-red-400"
                              >
                                <RiDeleteBinLine size={16} />
                              </span>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default ProductTable;
