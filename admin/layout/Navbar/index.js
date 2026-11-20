import Logo from "@/app/components/shared/Logo";
import styles from "./Navbar.module.css";
import { AiOutlineMenu } from "react-icons/ai";
import NavUser from "@/admin/components/NavUser";
import Link from "next/link";

function Navbar({ setSidebarActive }) {

  return (
    <div className={`${styles.container} fixed shadow-sm`}>
      <div className={styles.wrapper}>
        <div className="flex px-4 py-2 justify-between w-full items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className="p-2 text-white w-fit cursor-pointer hover:shadow-md transition-all duration-300 bg-indigo-200 rounded-lg"
              onClick={() => setSidebarActive((old) => !old)}
            >
              <AiOutlineMenu size={14} className={styles.icon} />
            </div>
            <span className="text-2xl capitalize font-medium text-title hidden md:block">
              AdminDash
            </span>
          </div>
          <Link href={"/"} className="hidden sm:block">
            <Logo />
          </Link>

          <NavUser />
        </div>
      </div>
    </div>
  );
}

export default Navbar;
