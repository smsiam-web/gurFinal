// import React, { useEffect, useState } from "react";
// import styles from "./Sidebar.module.css";
// import { useRouter } from "next/router";
// import { menus } from "../../configs";
// import Link from "next/link";
// import Logo from "@/app/components/shared/Logo";
// import { RxCross1 } from "react-icons/rx";
// import { useSelector } from "react-redux";
// import { selectUser } from "@/app/redux/slices/authSlice";
// import { selectStaff } from "@/app/redux/slices/staffSlice";

// function Sidebar({ setSidebarActive }) {
//   const [screenWidth, setScreenWidth] = useState(window.innerWidth);
//   const [limits, setLimits] = useState(false);
//   const [staff, setStaff] = useState([]);
//   const user = useSelector(selectUser);
//   const ourStaff = useSelector(selectStaff);
//   const router = useRouter();

//   useEffect(() => {
//     window.addEventListener("resize", () => {
//       setScreenWidth(window.innerWidth);
//     });
//   }, []);

//   useEffect(() => {
//     setLimits(
//       user.staff_role === "Admin" ||
//         user.staff_role === "HR" ||
//         user.staff_role === "CEO"
//     );
//   }, []);

//   useEffect(() => {
//     setStaff(ourStaff);
//   }, [ourStaff]);

//   const toggleMenu = () => {
//     if (screenWidth >= 768) return;
//     setSidebarActive((old) => !old);
//   };

//   return (
//     <>
//       <div className={styles.container}>
//         <div
//           className={"items-center justify-between gap-2 mb-8 " + styles.logo}
//         >
//           <Logo />
//           <div
//             className={styles.sidebarToggle}
//             onClick={() => setSidebarActive((old) => !old)}
//           >
//             <RxCross1 className={styles.icon} />
//           </div>
//         </div>
//         <div className={`${styles.sidebar__items}`}>
//           {/* <h5>Title</h5> */}
//           {menus &&
//             menus?.map(({ pathname, Icon, title }) => (
//               <Link
//                 href={pathname}
//                 key={pathname}
//                 className={
//                   styles.sidebar__item +
//                   " " +
//                   (router.asPath === pathname
//                     ? styles.sidebar__item_active
//                     : "")
//                 }
//                 onClick={() => toggleMenu()}
//               >
//                 {Icon && (
//                   <div className={styles.sidebar__item_icon_wrapper}>
//                     <Icon className={styles.icon} />
//                   </div>
//                 )}
//                 <span>{title}</span>
//               </Link>
//             ))}
//         </div>
//       </div>
//       <div
//         onClick={() => setSidebarActive((old) => !old)}
//         className={styles.backdrop}
//       />
//     </>
//   );
// }

// export default Sidebar;


import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { RxCross1 } from "react-icons/rx";
import { FiChevronRight } from "react-icons/fi";

import styles from "./Sidebar.module.css";
import { menus } from "../../configs";
import Logo from "@/app/components/shared/Logo";

function Sidebar({ sidebarActive, setSidebarActive }) {
  const router = useRouter();

  const [screenWidth, setScreenWidth] = useState(1024);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const closeMobileSidebar = () => {
    if (screenWidth < 768) {
      setSidebarActive(false);
    }
  };

  const isActive = (pathname) => {
    if (!pathname) return false;

    return (
      router.asPath === pathname ||
      router.pathname === pathname ||
      (pathname !== "/" && router.pathname.startsWith(pathname + "/"))
    );
  };

  return (
    <>
      <aside
        className={`${styles.container} ${
          sidebarActive ? styles.sidebarOpen : ""
        }`}
      >
        {/* Sidebar Header */}

        {/* <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <Logo />
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            className={styles.closeButton}
            onClick={() => setSidebarActive(false)}
          >
            <RxCross1 size={18} />
          </button>
        </div> */}

        {/* Navigation */}

        <div className={styles.navigation}>
          <p className={styles.sectionTitle}>
            MAIN MENU
          </p>

          <div className={styles.sidebarItems}>
            {Array.isArray(menus) &&
              menus.map(({ pathname, Icon, title }) => {
                const active = isActive(pathname);

                return (
                  <Link
                    href={pathname}
                    key={pathname}
                    onClick={closeMobileSidebar}
                    className={`${styles.sidebarItem} ${
                      active ? styles.sidebarItemActive : ""
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className={styles.itemIcon}>
                      {Icon && <Icon size={19} />}
                    </span>

                    <span className={styles.itemTitle}>
                      {title}
                    </span>

                    {active && (
                      <FiChevronRight
                        className={styles.activeArrow}
                        size={17}
                      />
                    )}
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Footer */}

        <div className={styles.sidebarFooter}>
          <div className={styles.footerIndicator} />

          <div>
            <p className={styles.footerTitle}>
              Rajshahir Aam Wala
            </p>

            <p className={styles.footerSubtitle}>
              E-commerce Management
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}

      <div
        className={`${styles.backdrop} ${
          sidebarActive ? styles.backdropVisible : ""
        }`}
        onClick={() => setSidebarActive(false)}
      />
    </>
  );
}

export default Sidebar;
