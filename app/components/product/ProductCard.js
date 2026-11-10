import React from "react";
import Link from "next/link";
import { TbCurrencyTaka } from "react-icons/tb";
import { BsFillCartCheckFill } from "react-icons/bs";
import { FaCartPlus } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  addItem,
  removeItem,
  selectItems,
} from "@/app/redux/slices/basketSlice";
import { notifications } from "@mantine/notifications";
import { Rating } from "@mantine/core";
import Image from "next/image";

const ProductCard = ({ product }) => {
  const { id, off_price, productImg, product_details } = product;

  // redux setup
  const cartItems = useSelector(selectItems);
  const dispatch = useDispatch();

  // check item exists
  const checkItemExists = (id) => {
    const find = cartItems?.filter((item) => item.id === id);
    return !!find.length;
  };

  // item add to basket
  const addToBasket = (product) => {
    dispatch(
      addItem({
        ...product,
        quantity: 1,
      })
    );
    notifications.show({
      title: "Add to cart successfully",
      message: `${product_details.product_name}, Weight: 12kg`,
    });
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
    <Link href={`/shop/${id}`} className="product-card h-[400px] w-[250px]">
      {/* stock out  */}
      {false && (
        <span className="absolute top-8 left-0 bg-red-500 px-3 mb-2 py-1 text-base font-bold text-slate-100 rounded-md -rotate-45">
          Stock Out.!
        </span>
      )}

      {/* disscunt %  */}
      {off_price && (
        <span className="absolute top-2 left-2 bg-orange px-2 mb-2 py-1 text-sm font-bold text-slate-100 rounded-md bg-primary">
          {off_price}% Off
        </span>
      )}
      <div className="rounded-md flex flex-col justify-center overflow-hidden">
        {/* card image  */}
        <Image width={300} height={300} alt="mango" src={productImg?.urls} />
      </div>
      {/* card text  */}
      <div className="flex flex-col gap-1 w-full mt-2">
        <h3 className="text-sm font-semibold text-mid">
          {product_details.product_type}
        </h3>
        <h1 className="text-xl font-semibold text-title truncate w-[300px]">
          {product_details.product_name}
        </h1>
        <div className="flex items-center gap-1">
          <span className="flex px-1 gap-1 text-primary text-sm">
            <Rating value={4.4} fractions={5} readOnly size="sm" />
          </span>
          <span className="text-sub-mid text-sm">{1}/5</span>
          <span className="text-sub-title text-sm">(169)</span>
        </div>
        <div className="flex items-center gap-1  w-fit my-1">
          <span className="text-xs bg-green-100 px-3 py-1 rounded-full text-green-600">
            Available from:
          </span>
          <span className="text-xs">{product_details.available_from}.</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm tracking-tighter  text-mid">
              {product_details.unit}
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`flex tracking-tighter items-center ${
                  product_details.price ? "text-orange" : "text-greens"
                } font-bold text-lg`}
              >
                <TbCurrencyTaka size={20} />
                {product_details?.sale_price}
              </span>
              {product_details.price && (
                <span className="flex tracking-tighter items-center text-gray-400 font-bold text-base line-through">
                  <TbCurrencyTaka size={18} />
                  {product_details.price}
                </span>
              )}
            </div>
          </div>
          <div>
            {!checkItemExists(id) ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  addToBasket(product);
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
    </Link>
  );
};

export default ProductCard;
