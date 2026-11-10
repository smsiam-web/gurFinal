import { AiOutlineSetting } from "react-icons/ai";
import { FiSliders } from "react-icons/fi";
import { BsCart } from "react-icons/bs";
import { TbAddressBook } from "react-icons/tb";
import { MdPassword } from "react-icons/md";

export const DASHBOARD_NAV = [
  {
    title: "Dashboard",
    href: "/my-account",
    icon: <FiSliders />,
  },
  {
    title: "Orders",
    href: "/my-account/orders",
    icon: <BsCart />,
  },
  {
    title: "Update Profile",
    href: "/my-account/edit-account",
    icon: <AiOutlineSetting />,
  },
  {
    title: "Addresses",
    href: "/my-account/addresses",
    icon: <TbAddressBook />,
  },

  // {
  //   title: "Change Password",
  //   href: "/my-account/reset-password",
  //   icon: <MdPassword />,
  // },
];
export default DASHBOARD_NAV;
