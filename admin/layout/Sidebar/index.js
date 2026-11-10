import React, { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";
import { useRouter } from "next/router";
import { menus } from "../../configs";
import Link from "next/link";
import Logo from "@/app/components/shared/Logo";
import { RxCross1 } from "react-icons/rx";
import { useSelector } from "react-redux";
import { selectUser } from "@/app/redux/slices/authSlice";
import { selectStaff } from "@/app/redux/slices/staffSlice";

function Sidebar({ setSidebarActive }) {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [limits, setLimits] = useState(false);
  const [staff, setStaff] = useState([]);
  const user = useSelector(selectUser);
  const ourStaff = useSelector(selectStaff);
  const router = useRouter();

  useEffect(() => {
    window.addEventListener("resize", () => {
      setScreenWidth(window.innerWidth);
    });
  }, []);

  useEffect(() => {
    setLimits(
      user.staff_role === "Admin" ||
        user.staff_role === "HR" ||
        user.staff_role === "CEO"
    );
  }, []);

  useEffect(() => {
    setStaff(ourStaff);
  }, [ourStaff]);

  const toggleMenu = () => {
    if (screenWidth >= 768) return;
    setSidebarActive((old) => !old);
  };

  return (
    <>
      <div className={styles.container}>
        <div
          className={"items-center justify-between gap-2 mb-8 " + styles.logo}
        >
          <Logo />
          <div
            className={styles.sidebarToggle}
            onClick={() => setSidebarActive((old) => !old)}
          >
            <RxCross1 className={styles.icon} />
          </div>
        </div>
        <div className={`${styles.sidebar__items}`}>
          {/* <h5>Title</h5> */}
          {menus &&
            menus?.map(({ pathname, Icon, title }) => (
              <Link
                href={pathname}
                key={pathname}
                className={
                  styles.sidebar__item +
                  " " +
                  (router.asPath === pathname
                    ? styles.sidebar__item_active
                    : "")
                }
                onClick={() => toggleMenu()}
              >
                {Icon && (
                  <div className={styles.sidebar__item_icon_wrapper}>
                    <Icon className={styles.icon} />
                  </div>
                )}
                <span>{title}</span>
              </Link>
            ))}
        </div>
      </div>
      <div
        onClick={() => setSidebarActive((old) => !old)}
        className={styles.backdrop}
      />
    </>
  );
}

export default Sidebar;
