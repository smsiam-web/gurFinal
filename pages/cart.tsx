import CartActions from "@/app/components/cart/CartActions";
import CartTable from "@/app/components/cart/CartTable";
import Breadcrumb from "@/app/components/shared/Breadcrumb";
import Button from "@/app/components/shared/Button";
import { selectTotalCartItems } from "@/app/redux/slices/basketSlice";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";

const Cart = () => {
  const cartItem = useSelector(selectTotalCartItems);
  return (
    <main>
      {/* Breadcumb */}
      <div className="bg-[#f5f5f5] p-5">
        <div className="mx-auto max-w-5xl">
          <Breadcrumb />
        </div>
      </div>
      {!cartItem ? (
        <div className="p-5">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-2xl md:text-3xl xl:text-4xl text-center font-bold pb-6 capitalize">
              your cart is empty!!!
            </h1>
            <div className=" flex items-center justify-center">
            <Image src="/gif/empty_cart.gif" width={500} height={500} alt="Empty_gif" />
          
            </div>
            <Link
              href={"/shop"}
              className="flex items-center justify-center py-4 sm:py-8"
            >
              <Button
                title="Shop Now"
                className="text-white bg-primary hover:card-shadow animate-duration"
              />
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-2xl md:text-3xl xl:text-4xl text-center font-bold">
              Cart
            </h1>
            <CartTable />
            <CartActions />
          </div>
        </div>
      )}
    </main>
  );
};

export default Cart;
