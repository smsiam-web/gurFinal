import React, { useEffect, useState } from "react";
import { MdDelete } from "react-icons/md";
import Quantity from "../shared/Quantity";
import { TbCurrencyTaka } from "react-icons/tb";
import { useDispatch } from "react-redux";
import {
  decreaseItemQuantity,
  increaseItemQuantity,
  itemPriceCalc,
  removeItem,
} from "@/app/redux/slices/basketSlice";
import { notifications } from "@mantine/notifications";

const CartTableMobile = ({
  id,
  quantity,
  weight = 12,
  productImg,
  product_details,
}) => {
  const [checked, setChecked] = useState(true);

  const { product_name } = product_details || "";

  const sale_price = parseInt(product_details?.sale_price);

  //priceCalc
  const priceCalc = weight * sale_price;

  // redux setup
  const dispatch = useDispatch();

  // inCrease item quantity
  const increaseQuantity = () => {
    dispatch(increaseItemQuantity(id));
  };
  // deCrease item quantity
  const decreaseQuantity = () => {
    dispatch(decreaseItemQuantity(id));
  };

  //priceCalc update on redux
  const setPriceCalc = (e) => {
    dispatch(itemPriceCalc(e));
  };

  // remove item from cart
  const RemoveItem = (id) => {
    dispatch(removeItem(id));
    notifications.show({
      title: "Removed successfully!",
      message: `${product_name}, Weight: ${weight}kg`,
      color: "red",
    });
  };

  // update weight
  useEffect(() => {
    if (weight !== 12) {
      setChecked(false);
    } else setChecked(true);
  }, [weight]);

  return (
    <div className="md:hidden flex gap-3 mb-5 border-b pb-5">
      <div>
        <img
          src={productImg.urls}
          loading="lazy"
          alt=""
          className="w-20 h-20 object-cover rounded-md"
        />
      </div>
      <div className="flex-grow">
        <h1 className="text-lg font-bold text-title">{product_name}</h1>
        <div className="text-sm text-gray-500 flex flex-col gap-[2px] px-2">
          <span className="text-base">Weight:</span>
          <div className="flex items-center gap-1">
            <input
              type="radio"
              id="12"
              name={id}
              checked={checked}
              onChange={() => {
                setPriceCalc({ id: id, weight: 12 });
              }}
            />
            <label htmlFor="12kg">12kg</label>
            <div className="flex items-center gap-1"></div>
            <input
              type="radio"
              id="23"
              name={id}
              checked={!checked}
              onChange={() => {
                setPriceCalc({ id: id, weight: 23 });
              }}
            />
            <label htmlFor="23kg">23kg</label>
          </div>
          <div>
            <div className="text-sm text-gray-500 flex items-center">
              Price:
              <span className="text-sub-title font-semibold">
                <div className="flex items-center gap-1">
                  <span className="flex items-center text-center">
                    <TbCurrencyTaka size={18} />
                    {priceCalc}
                  </span>
                  <span className="flex items-center text-center font-normal">
                    <span>/ Per kg</span>
                    <TbCurrencyTaka size={18} />
                    {sale_price}
                  </span>
                </div>
              </span>
            </div>
          </div>
        </div>
        <div className="py-2">
          <Quantity
            quantity={quantity}
            increaseQuantity={increaseQuantity}
            decreaseQuantity={decreaseQuantity}
          />
        </div>
        <div className="text-sm text-gray-500 flex items-center">
          Total Price:
          <div className="text-green font-semibold">
            <span className="flex text-primary items-center text-center">
              <TbCurrencyTaka />
              {(quantity * priceCalc).toFixed(2)}
            </span>
          </div>
          <span className="text-sub-title pl-2 text-xs">
            ({quantity * weight}kg)
          </span>
        </div>
      </div>
      <div className="mt-2">
        <MdDelete
          onClick={() => RemoveItem(id)}
          className="text-2xl cursor-pointer hover-red"
        />
      </div>
    </div>
  );
};

export default CartTableMobile;
