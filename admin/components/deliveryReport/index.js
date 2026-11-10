import React, { useEffect, useState } from "react";
import { LoadingOverlay, Modal } from "@mantine/core";
import { useDispatch, useSelector } from "react-redux";
import AddBy from "./addBy";
import { DatePicker } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";
import Button from "../shared/Button";
import { AiOutlineAppstoreAdd } from "react-icons/ai";
import { db, timestamp } from "@/app/utils/firebase";
import { RxCross2 } from "react-icons/rx";
import { selectUser } from "@/app/redux/slices/authSlice";
import { formatDateToDDMMYYYY } from "@/admin/utils/helpers";
import Link from "next/link";
import { MdDelete, MdOutlineRemoveRedEye } from "react-icons/md";

const DeliveryReports = () => {
  const [value, setValue] = useState(new Date() || null);
  const [ID, setID] = useState();
  const [dispatchData, setDispatchData] = useState([]);
  const [title, setTitle] = useState("Create");
  const [loading, setLoading] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector(selectUser);

  function convertDate(dateString) {
    const months = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };

    const [month, day, year] = dateString.split("-");
    const formattedDay = day.padStart(2, "0"); // Ensure day is two digits
    const formattedMonth = months[month];

    return `${formattedDay}${formattedMonth}${year}`;
  }

  const cg = formatDateToDDMMYYYY(value);
  const formattedDate = new Date().toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  useEffect(() => {
    cg.then((date) => {
      setID(date);
    });
  }, [cg]);

  useEffect(() => {
    db.collection("dispatch")
      .doc(ID)
      .get()
      .then((doc) => {
        if (!!doc.data()) {
          setTitle("Update");
        } else {
          setTitle("Create");
        }
      });
  }, [opened, value, cg]);

  // toggle drawer
  const createDispatch = async () => {
    setLoading(true);
    try {
      await getDispatch();
      console.log(`Document "${ID}" successfully written.`);
      return { success: true };
    } catch (err) {
      console.error(`Error writing document "${ID}":`, err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  console.log(ID);

  // get dispatch
  const getDispatch = () => {
    const unsubscribe = db
      .collection("dispatch")
      .doc(ID)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            router.push(`/delivery-report/create-dispatch?date=${ID}`);
            // setID(null);
          } else {
            const data = {
              timestamp,
              dispatchID: ID,
              createdBy: user?.name || null,
              dispatches: [],
              date: formattedDate,
            };
            db.collection("dispatch").doc(ID).set(data);
            router.push(`/delivery-report/create-dispatch?date=${ID}`);
          }
        },
        (error) => {
          console.error("Error fetching real-time updates:", error);
        }
      );

    // Return the unsubscribe function to stop listening when needed
    return unsubscribe;
  };

  // Get order from firebase database
  useEffect(() => {
    setLoading(true);
    const unSub = db
      .collection("dispatch")
      .orderBy("timestamp", "desc")
      .limit(15)
      .onSnapshot((snap) => {
        const dispatch = [];
        snap.docs.map((doc) => {
          dispatch.push({
            ...doc.data(),
            // timestamp: doc.data().timestamp?.toDate().getTime(),
          });
        });
        setDispatchData(dispatch);
        setLoading(false);
      });
    return () => {
      unSub();
    };
  }, []);

  // console.log(dispatchData);

  return (
    <main className="h-full overflow-y-auto">
      <div>
        <Modal opened={opened} onClose={close} title="Create Dispatch By Date">
          <div className="flex items-center justify-center flex-col">
            <LoadingOverlay
              visible={loading}
              zIndex={1000}
              overlayProps={{ radius: "sm", blur: 2 }}
              loaderProps={{ color: "blue", type: "bars" }}
            />
            <DatePicker value={value} onChange={setValue} />

            <Button
              onClick={() => createDispatch()}
              title={title}
              className="bg-blue-400 hover:bg-blue-500 hover:shadow-lg transition-all duration-300 text-white w-full h-14"
              icon=<AiOutlineAppstoreAdd size={24} />
            />
          </div>
        </Modal>
      </div>
      <div className="grid mx-auto">
        <h1 className="mb-3 text-lg font-bold text-gray-700 ">
          Daily Dispatch
        </h1>
        <AddBy onClick={() => open()} />
      </div>
      <div className="w-full overflow-x-scroll rounded-md relative">
        <table className="w-full whitespace-nowrap table-auto">
          <thead className="text-xs font-semibold tracking-wide text-left text-gray-500 uppercase border-b border-gray-200 bg-gray-100">
            <tr>
              <th className="px-4 py-3">Dispatch ID</th>
              <th className="px-4 py-3">Total</th>
              <th className="hidden md:table-cell px-4 py-3">Date</th>
              <th className="hidden md:table-cell px-4 py-3">Created By</th>
              {/* Other columns hidden on mobile */}
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {!!dispatchData &&
              dispatchData?.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 font-bold">
                    {item?.dispatchID || "null"}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {item?.dispatches?.length <= 9 && "0"}
                    {item?.dispatches?.length || "0"}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 ">
                    {item?.date}
                  </td>
                  <td className="hidden md:table-cell px-4 py-3">
                    {item?.createdBy || "null"}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    <div className="flex gap-5">
                      <Link
                        href={`/delivery-report/create-dispatch?date=${item?.dispatchID}`}
                      >
                        <MdOutlineRemoveRedEye />
                      </Link>
                      <span>
                        <MdDelete />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default DeliveryReports;
