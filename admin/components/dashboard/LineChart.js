import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import { Last7Days } from "../../utils/helpers"
import { Line } from 'react-chartjs-2';

const labels = Last7Days();

const LineChart = ({order, amount}) => {

  const [active, setActive] = useState(true);

  const toggleActive = (item) => {
    (item === "sales") && setActive(true);
    (item === "orders") && setActive(false);

  }


  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      // title: {
      //   display: true,
      //   text: 'Chart.js Line Chart',
      // },
    },
  };
  const Sales = {
    labels,
    datasets: [
      {
        label: 'Sales',
        data: amount,
        borderColor: "green",
        backgroundColor: 'green',
      },

    ],
  };
  const Orders = {
    labels,
    datasets: [
      {
        label: 'Orders',
        data: order,
        borderColor: "orange",
        backgroundColor: 'Orange',
      },

    ],
  };
  return (
    <div className="min-w-0 p-4 bg-white rounded-lg shadow-xs">
      <p className=" md:mb-2 font-semibold text-gray-800 ">
        Weekly Sales
      </p>
      <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700 mb-4">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button
              type="button"
              className={`${active ? "text-green-600 border-green-600 dark:text-green-500 dark:border-green-500" : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 border-transparent"} inline-block p-2 rounded-t-lg border-b-2 focus:outline-none`}
              onClick={() => toggleActive("sales")}
            >
              Sales
            </button>
          </li>
          <li className="mr-2">
            <button
              type="button"
              className={`${!active ? "text-orange-600 border-orange-600 dark:text-orange-500 dark:border-orange-500" : "hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 border-transparent"} inline-block p-2 rounded-t-lg border-b-2 focus:outline-none`}
              onClick={() => toggleActive("orders")}
            >
              Orders
            </button>
          </li>
        </ul>
      </div>
      <Line options={options} data={active ? Sales : Orders} />
    </div>
  )
}

export default LineChart;