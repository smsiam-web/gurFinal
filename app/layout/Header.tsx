import React from "react";
import Link from "next/link";
import Search from "../components/Search";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { FiUserMinus, FiUserCheck } from "react-icons/fi";
import { BiSupport } from "react-icons/bi";
import { TiTick } from "react-icons/ti";
import Logo from "../components/shared/Logo";
import { useSelector } from "react-redux";
import {
  selectTotalCartItems,
  selectTotalPrice,
} from "../redux/slices/basketSlice";
import { TbCurrencyTaka } from "react-icons/tb";
import { selectUser } from "../redux/slices/authSlice";

const Header = () => {
  const user = useSelector(selectUser);
  const cartItems = useSelector(selectTotalCartItems);
  const cartTotalPrice = useSelector(selectTotalPrice);

  return (
    <header className="bg-white py-5 sm:py-7 border-b">
      <div className="container">
        {/* Header Top Area */}
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={"/"}>
            <Logo />
          </Link>

          {/* {Search} */}
          <Search />

          {/* Contact */}
          <div className="group xl:flex flex-col hidden">
            <Link className="text-2xl font-bold" href="tel:+8801313147532">
              +880 1313-147532
            </Link>
            <p className="self-end group-hover:text-primary animate-duration text-sub-title">
              Support 24/7
            </p>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-3 sm:gap-4 ">
            <Link href="tel:+8801837666008" className="xl:hidden">
              <div className="relative pr-1">
                <BiSupport className="text-3xl text-title hover-greens" />
                <span className="bg-green-500 rounded-full text-center absolute  text-sm p-[1px] -right-[1px] -top-1 font-semibold">
                  <TiTick className="text-white" />
                </span>
              </div>
            </Link>
            <Link href="/my-account">
              {!user ? (
                <FiUserMinus className="text-3xl text-title hover-primary" />
              ) : (
                <FiUserCheck className="text-3xl text-title hover-primary" />
              )}
            </Link>
            <Link href="/cart">
              <div className="flex items-center gap-5 mr-3 md:mr-0">
                <div className="relative">
                  <AiOutlineShoppingCart className="text-3xl text-title hover-primary" />
                  <span className="bg-primary rounded text-center absolute px-2 text-sm -right-3 -top-2 font-semibold">
                    {cartItems || 0}
                  </span>
                </div>
                <div className="hidden lg:block">
                  <span className="text-sub-title text-base">Your Cart</span>
                  <p className="text-title flex items-center font-bold text-xl">
                    <TbCurrencyTaka size={22} />
                    <span className="flex items-center font-bold text-lg text-primary text-center">
                      {cartTotalPrice}
                    </span>
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
