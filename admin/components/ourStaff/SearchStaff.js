import { useEffect, useState } from "react";
import Button from "../shared/Button";
import { BiPlus } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { updateStaff } from "@/app/redux/slices/staffSlice";
import { db } from "@/app/utils/firebase";
import { ROLE } from "@/admin/configs";
import { usePathname } from "next/navigation";
import { selectUser } from "@/app/redux/slices/authSlice";

const SearchStaff = ({ onClick }) => {
  const [currentValue, setCurrentValue] = useState(null);
  const [ourStaffs, setOurStaffs] = useState([]);
  const dispatch = useDispatch();

  const user = useSelector(selectUser);



  const handleChange = (e) => {
    setCurrentValue(e.currentTarget.value);
  };

  // search config
  useEffect(() => {
    let ss = [];
    if (!currentValue) {
      ss = [];
      return;
    }

    const res = ourStaffs.map((i) => {
      if (
        i.name.toLowerCase().split(" ").includes(currentValue?.toLowerCase())
      ) {
        ss.push({ ...i, isFilter: true });
      } else if (i.phone === currentValue) {
        ss.push({ ...i, isFilter: true });
      } else if (i.staff_id === currentValue) {
        ss.push({ ...i, isFilter: true });
      } else if (i.email === currentValue) {
        ss.push({ ...i, isFilter: true });
      } else if (i.name.toLowerCase() === currentValue.toLowerCase()) {
        ss.push({ ...i, isFilter: true });
      }
    });

    ss.length ? dispatch(updateStaff(ss)) : dispatch(updateStaff(ourStaffs));
  }, [currentValue]);

  // search by Role
  const onRoleItemChanged = (e) => {
    e.preventDefault();
    let role = [];

    const res = ourStaffs.map((i) => {
      if (i.staff_role === e.target.value) {
        role.push({ ...i, isFilter: true });
      }
    });

    role.length
      ? dispatch(updateStaff(role))
      : dispatch(updateStaff(ourStaffs));
  };

  // Get Staff details from firebase and update on REDUX
  useEffect(() => {
    const unSub = db
      .collection("users")
      .orderBy("created_at", "desc")
      .onSnapshot((snap) => {
        const ourStaff = [];
        snap.docs.map((doc) => {
          ourStaff.push({
            ...doc.data(),
          });
        });
        setOurStaffs(ourStaff);
      });

    return () => {
      unSub();
    };
  }, []);

  return (
    <>
      <div className="min-w-0 rounded-lg overflow-hidden bg-gray-50  shadow-xs  mb-5">
        <div className="p-4">
          <div className="py-3 grid gap-4 lg:gap-6 xl:gap-6 md:flex xl:flex">
            {/* search category __ input  */}
            <div className="flex-grow-0  md:flex-grow lg:flex-grow xl:flex-grow">
              <input
                className="block w-full px-3 py-1 text-sm focus:outline-neutral-200 leading-5 rounded-md  border-gray-200 h-14 bg-gray-100 border-transparent focus:bg-white"
                type="text"
                onChange={(e) => handleChange(e)}
                placeholder="Search by #ID / Name / Email / Contact"
              />
            </div>

            <div className="flex-grow-0 md:flex-grow lg:flex-grow xl:flex-grow">
              <select
                className="block w-full px-2 py-1 text-sm  focus:outline-none rounded-md form-select focus:border-gray-200 border-gray-200  focus:shadow-none leading-5 border h-14 bg-gray-100 border-transparent focus:bg-gray-50"
                id="roleItem"
                name="roleItem"
                // defaultValue={selectedSubNav}
                onChange={(e) => onRoleItemChanged(e)}
              >
                {ROLE.map((roleItem) => (
                  <option className="" value={roleItem.id} key={roleItem.name}>
                    {roleItem.name}
                  </option>
                ))}
              </select>
            </div>

            {/* add category btn  */}
            <div
              className={`${
                user?.staff_role === "HR" ? "" : "hidden"
              } w-full disabled md:w-56 lg:w-56 xl:w-56`}
            >
              <Button
                onClick={onClick}
                title="Add Staff"
                className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
                icon=<BiPlus size={24} />
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchStaff;
