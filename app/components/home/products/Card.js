import Image from "next/image";
import Link from "next/link";
import React from "react";
import { TbCurrencyTaka } from "react-icons/tb";
import { Rating } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import {
  addItem,
  removeItem,
  selectItems,
} from "@/app/redux/slices/basketSlice";
import { BsFillCartCheckFill } from "react-icons/bs";
import { FaCartPlus } from "react-icons/fa";
import { notifications } from "@mantine/notifications";
import { updateSingleProduct } from "@/app/redux/slices/singleProduct";

const ProductCard = ({ item = "" }) => {
  const { id, productImg, product_details } = item || "";

  const {
    available_from,
    product_name,
    product_type,
    price,
    sale_price,
    unit,
  } = product_details || "";

  // redux setup
  const cartItems = useSelector(selectItems);
  const dispatch = useDispatch();

  // check item exists
  const checkItemExists = (id) => {
    const find = cartItems?.filter((item) => item.id === id);
    return !!find.length;
  };

  // item add to basket
  const addToBasket = (item) => {
    dispatch(
      addItem({
        ...item,
        quantity: 1,
      })
    );
    notifications.show({
      title: "Add to cart successfully",
      message: `${product_details.product_name}, Weight: 12kg`,
    });
  };
  // updateSingleProduct
  const updateSinProduct = (item) => {
    dispatch(
      updateSingleProduct({
        ...item,
      })
    );
  };

  // remove from basket
  const removeItems = (id) => {
    dispatch(removeItem(id));
    notifications.show({
      title: "Removed successfully!",
      message: `${product_details.product_name}, Weight: 12kg`,
      color: "red",
    });
  };

  return (
    <div className="product-card group box-border overflow-hidden flex rounded-md shadow-sm p flex-col items-center relative bg-white">
      <Link href={`/shop/${id}`} onClick={() => updateSinProduct(item)}>
        {/* stock out  */}
        {false && (
          <span className="absolute top-8 left-0 bg-red-500 px-3 mb-2 py-1 text-xs sm:text-sm font-bold text-slate-100 rounded-md -rotate-45">
            Stock Out.!
          </span>
        )}

        {/* disscunt %  */}
        {true && true && (
          <span className="absolute top-2 left-2 bg-orange px-2 mb-2 py-1 text-xs sm:text-sm font-bold text-slate-100 rounded-md bg-primary">
            10% Off
          </span>
        )}
        <div className="flex flex-col justify-between items-stretch">
          <div className="rounded-md flex flex-col justify-center overflow-hidden max-w-full">
            {/* card image  */}
            <Image src={productImg?.urls} width={300} height={300} alt="product_img" />
          </div>

          {/* card text  */}
          <div className="flex flex-col gap-1 w-full mt-2 ">
            <h3 className="text-xs sm:text-sm font-semibold text-mid">
              {product_type}
            </h3>
            <h1 className="text-base font-semibold text-title truncate">
              {product_name}
            </h1>
            <div className="flex flex-wrap items-center gap-1">
              <span className="flex gap-1 text-primary text-sm">
                <Rating value={4.4} fractions={5} readOnly size="xs" />
              </span>
              <span className="text-sub-mid text-xs sm:text-sm">3.5/5</span>
              <span className="text-sub-title text-xs sm:text-sm">(169)</span>
            </div>
            <div className="flex items-center gap-1  w-fit my-1">
              <span className="text-xs bg-green-100 px-3 py-1 rounded-full text-green-600">
                Available:
              </span>
              <span className="text-xs">{available_from}.</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm tracking-tighter text-mid">
                  {unit}
                </span>
                <div className="flex items-center gap-1">
                  <span
                    className={`flex tracking-tighter items-center ${
                      price ? "text-orange" : "text-greens"
                    } font-bold text-lg`}
                  >
                    <TbCurrencyTaka size={20} />
                    {sale_price}
                  </span>

                  <span className="flex tracking-tighter items-center text-gray-400 font-bold text-base line-through">
                    <TbCurrencyTaka size={18} />
                    {price}
                  </span>
                </div>
              </div>
              <div>
                {!checkItemExists(id) ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      addToBasket(item);
                    }}
                    className="text-white bg-primary p-3 rounded-full text-center flex items-center"
                  >
                    <FaCartPlus className="" size={18} />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      removeItems(id);
                    }}
                    className="text-gray-100 bg-gray-600 p-3 rounded-full text-center flex items-center"
                  >
                    <BsFillCartCheckFill className="" size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
