import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

const Percentage = () => {
  const piData = {
    labels: ['Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [
      {
        label: 'Totall selling ',
        data: [22,51,20,35],
        backgroundColor: [
          '#FFB000',
          '#07bc0c',
          '#7091F5',
          '#e74c3c',
        ],
      },
    ],
  };

  return (
    <div className="min-w-0 p-4 bg-white rounded-lg shadow-xs ">
      <p className="mb-4 font-semibold text-gray-800 ">
        Best Selling Products
      </p>
      <div className="w-full xl:w-1/2 xl:mx-auto flex justify-center">
        <Pie data={piData}  />
      </div>
    </div>
  );
};

export default Percentage;
