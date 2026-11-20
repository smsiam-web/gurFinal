
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
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";
import { Last7Days } from "../../utils/helpers";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const labels = Last7Days();

const LineChart = ({ order, amount }) => {
  const [active, setActive] = useState(true);

  const toggleActive = (item) => {
    if (item === "sales") setActive(true);
    if (item === "orders") setActive(false);
  };

  const currentData = active ? amount : order;

  const total = (currentData || []).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,

    interaction: {
      mode: "index",
      intersect: false,
    },

    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },

    plugins: {
      legend: {
        display: false,
      },

      title: {
        display: false,
      },

      tooltip: {
        enabled: true,
        backgroundColor: "#172554",
        titleColor: "#ffffff",
        bodyColor: "#e0e7ff",
        padding: 13,
        cornerRadius: 10,
        displayColors: true,

        titleFont: {
          size: 12,
          weight: "bold",
        },

        bodyFont: {
          size: 12,
        },

        callbacks: {
          label: (context) => {
            const value = Number(context.parsed.y || 0);

            return active
              ? ` Sales: ${value.toLocaleString("en-BD")}`
              : ` Orders: ${value.toLocaleString("en-BD")}`;
          },
        },
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },

        border: {
          display: false,
        },

        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
            weight: "500",
          },

          padding: 10,
        },
      },

      y: {
        beginAtZero: true,

        grid: {
          color: "#eef2f7",
          drawBorder: false,
        },

        border: {
          display: false,
          dash: [4, 4],
        },

        ticks: {
          color: "#94a3b8",
          font: {
            size: 11,
          },

          padding: 10,
          precision: 0,
        },
      },
    },

    elements: {
      line: {
        tension: 0.4,
        borderWidth: 3,
      },

      point: {
        radius: 4,
        hoverRadius: 7,
        borderWidth: 3,
        hoverBorderWidth: 3,
      },
    },
  };

  const Sales = {
    labels,

    datasets: [
      {
        label: "Sales",
        data: amount || [],

        borderColor: "#16a34a",
        backgroundColor: "rgba(22, 163, 74, 0.10)",

        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#16a34a",

        pointHoverBackgroundColor: "#16a34a",
        pointHoverBorderColor: "#ffffff",

        fill: true,
      },
    ],
  };

  const Orders = {
    labels,

    datasets: [
      {
        label: "Orders",
        data: order || [],

        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.10)",

        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#f59e0b",

        pointHoverBackgroundColor: "#f59e0b",
        pointHoverBorderColor: "#ffffff",

        fill: true,
      },
    ],
  };

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg sm:p-5">

      {/* Header */}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              active
                ? "bg-green-50 text-green-600"
                : "bg-orange-50 text-orange-500"
            }`}
          >
            {active ? (
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M3 17l6-6 4 4 8-9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 6h6v6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-800 sm:text-lg">
              Weekly Performance
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              Last 7 days overview
            </p>
          </div>

        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-3 py-1.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <span className="text-[11px] font-semibold text-green-700">
            REPORT
          </span>
        </div>

      </div>

      {/* Summary */}

      <div
        className={`mb-5 rounded-xl border p-4 transition-colors ${
          active
            ? "border-green-100 bg-gradient-to-r from-green-50 to-white"
            : "border-orange-100 bg-gradient-to-r from-orange-50 to-white"
        }`}
      >

        <p className="text-xs font-medium text-gray-500">
          {active ? "Total Weekly Sales" : "Total Weekly Orders"}
        </p>

        <div className="mt-1 flex items-end justify-between gap-2">

          <h3
            className={`text-2xl font-extrabold tracking-tight ${
              active ? "text-green-700" : "text-orange-600"
            }`}
          >
            {total.toLocaleString("en-BD", {
              maximumFractionDigits: 2,
            })}
            {active && (
              <span className="ml-1 text-sm font-semibold">৳</span>
            )}
          </h3>

          <span className="text-xs text-gray-400">
            7 day total
          </span>

        </div>

      </div>

      {/* Toggle */}

      <div className="mb-5 flex items-center justify-between gap-3">

        <div>
          <h3 className="text-sm font-semibold text-gray-700">
            Performance Chart
          </h3>

          <p className="mt-1 text-[11px] text-gray-400">
            Select a metric to view
          </p>
        </div>

        <div className="flex rounded-xl bg-gray-100 p-1">

          <button
            type="button"
            onClick={() => toggleActive("sales")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              active
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Sales
          </button>

          <button
            type="button"
            onClick={() => toggleActive("orders")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
              !active
                ? "bg-white text-orange-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Orders
          </button>

        </div>

      </div>

      {/* Chart */}

      <div className="relative h-[260px] w-full sm:h-[290px] md:h-[310px]">

        <Line
          options={options}
          data={active ? Sales : Orders}
        />

      </div>

      {/* Footer */}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4">

        <div className="flex items-center gap-2">

          <span
            className={`h-2.5 w-2.5 rounded-full ${
              active ? "bg-green-500" : "bg-orange-500"
            }`}
          />

          <span className="text-xs font-medium text-gray-500">
            Daily {active ? "Sales" : "Orders"}
          </span>

        </div>

        <span className="text-[11px] text-gray-400">
          {labels.length} days
        </span>

      </div>

    </div>
  );
};

export default LineChart;
