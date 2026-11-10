import React, { useEffect, useState } from "react";
import { IoIosLogOut } from "react-icons/io";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { auth } from "@/app/utils/firebase";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/redux/slices/authSlice";
import Button from "../shared/Button";

const NavUser = () => {
  const [isActive, setActive] = useState(false);
  const router = useRouter();
  const user = useSelector(selectUser);
  const toggle = () => {
    {
      isActive === false ? setActive(true) : setActive(false);
    }
  };

  const singOutAction = () => {
    auth.signOut();
    router.push("/");
  };

  useEffect(() => {
    if (isActive === false) return;
    toggle();
  }, [router?.asPath]);

  return (
    <div className="relative">
      <Image
        onClick={toggle}
        className="cursor-pointer hover:shadow-md rounded-full"
        src="https://firebasestorage.googleapis.com/v0/b/rajshahiraamwala-8b7bf.appspot.com/o/avatar.jpg?alt=media&token=a219046d-7fa5-4b20-ba4e-5f7bfab89e81"
        alt="Picture of the author"
        width={35}
        height={35}
        quality={100}
      />
      {isActive && (
        <>
          <ul className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-xl bg-white p-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="flex justify-center pt-3 pb-1">
              <Image
                className="cursor-pointer hover:shadow-md rounded-full"
                src={user?.image ? user?.image : "/avatar.jpg"}
                alt="Picture of the author"
                width={100}
                height={100}
                quality={100}
              />
            </div>
            <li className="justify-between font-serif font-medium cursor-default">
              <p className="text-center text-base sm:text-lg ">
                {user?.name ? user.name : "Name: Null"}
              </p>
            </li>
            <li className="justify-between font-serif font-medium cursor-default">
              <p className="text-center text-sm sm:text-base ">
                {user?.email ? user.email : "Email: Null"}
              </p>
            </li>
            <li className="justify-between font-sans font-medium cursor-default">
              <p className="text-center text-base sm:text-lg ">
                {user?.phone ? user.phone : "Contact: Null"}
              </p>
            </li>
            <li className="justify-between font-serif font-medium cursor-default">
              <p className="text-center text-base sm:text-lg ">
                {user?.staff_role ? user.staff_role : "Null"}
              </p>
            </li>
            <li className="flex justify-center font-serif font-medium py-3">
              <Link href={"/"} onClick={() => singOutAction()}>
                <Button
                  className="bg-primary hover:bg-orange-500 duration-200 ease-in  text-white font-bold"
                  title="Logout"
                  icon={<IoIosLogOut size={18} />}
                />
              </Link>
            </li>
          </ul>
        </>
      )}
    </div>
  );
};

export default NavUser;
