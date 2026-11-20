
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { db } from "@/app/utils/firebase";
import ChartJS from "chart.js/auto";

// ==========================================
// DATE HELPERS - BANGLADESH TIME
// ==========================================

const getDhakaToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};

  parts.forEach((part) => {
    values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
};

// ==========================================
// LAST 7 DAYS
// ==========================================

const getLast7Dates = () => {
  const [year, month, day] = getDhakaToday()
    .split("-")
    .map(Number);

  const dates = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(
      Date.UTC(year, month - 1, day - i)
    );

    dates.push(
      [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, "0"),
        String(date.getUTCDate()).padStart(2, "0"),
      ].join("-")
    );
  }

  return dates;
};

// ==========================================
// DATE LABEL
// ==========================================

const formatDate = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(
    new Date(Date.UTC(year, month - 1, day))
  );
};

// ==========================================
// NUMBER FORMAT
// ==========================================

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  });

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function Last7DaysOrderChart() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const [dailyData, setDailyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dates = useMemo(() => getLast7Dates(), []);

  // ==========================================
  // FIRESTORE REALTIME LISTENER
  // ==========================================

  useEffect(() => {
    let active = true;

    const unsubscribers = [];
    const receivedDates = new Set();

    setLoading(true);
    setError("");

    const result = {};

    dates.forEach((date) => {
      const unsubscribe = db
        .collection("orderSummary")
        .doc(date)
        .onSnapshot(
          (snapshot) => {
            if (!active) return;

            result[date] = snapshot.exists
              ? snapshot.data()
              : {
                  totalOrders: 0,
                  totalKg: 0,
                  totalAmount: 0,
                };

            receivedDates.add(date);

            setDailyData({ ...result });

            if (receivedDates.size === dates.length) {
              setLoading(false);
            }
          },
          (err) => {
            console.error(
              "Order summary listener error:",
              err
            );

            if (!active) return;

            setError(
              err.message || "Unable to load order summary"
            );

            setLoading(false);
          }
        );

      unsubscribers.push(unsubscribe);
    });

    return () => {
      active = false;

      unsubscribers.forEach((unsubscribe) => {
        unsubscribe();
      });
    };
  }, [dates]);

  // ==========================================
  // PREPARE DAILY ROWS
  // ==========================================

  const chartRows = useMemo(() => {
    return dates.map((date) => {
      const data = dailyData[date] || {};

      return {
        date,
        orders: Number(data.totalOrders || 0),
        kg: Number(data.totalKg || 0),
        amount: Number(data.totalAmount || 0),
      };
    });
  }, [dates, dailyData]);

  // ==========================================
  // LAST 7 DAYS TOTAL
  // ==========================================

  const totals = useMemo(() => {
    return chartRows.reduce(
      (acc, row) => ({
        orders: acc.orders + row.orders,
        kg: acc.kg + row.kg,
        amount: acc.amount + row.amount,
      }),
      {
        orders: 0,
        kg: 0,
        amount: 0,
      }
    );
  }, [chartRows]);

  // ==========================================
  // CHART CONFIGURATION
  // ==========================================

  const chartConfig = useMemo(() => {
    return {
      type: "line",

      data: {
        labels: chartRows.map((row) =>
          formatDate(row.date)
        ),

        datasets: [
          {
            label: "Daily Orders",

            data: chartRows.map((row) => row.orders),

            borderColor: "#2563eb",
            backgroundColor: "rgba(37,99,235,0.08)",

            pointBackgroundColor: "#2563eb",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,

            pointRadius: 4,
            pointHoverRadius: 7,

            borderWidth: 2.5,
            tension: 0.4,
            fill: false,

            yAxisID: "y",
          },

          {
            label: "Daily KG",

            data: chartRows.map((row) => row.kg),

            borderColor: "#16a34a",
            backgroundColor: "rgba(22,163,74,0.08)",

            pointBackgroundColor: "#16a34a",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,

            pointRadius: 4,
            pointHoverRadius: 7,

            borderWidth: 2.5,
            tension: 0.4,
            fill: false,

            yAxisID: "y1",
          },

          {
            label: "Daily Sales Amount (৳)",

            data: chartRows.map((row) => row.amount),

            borderColor: "#d97706",
            backgroundColor: "rgba(217,119,6,0.08)",

            pointBackgroundColor: "#d97706",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,

            pointRadius: 4,
            pointHoverRadius: 7,

            borderWidth: 2.5,
            tension: 0.4,
            fill: false,

            yAxisID: "y2",
          },
        ],
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        interaction: {
          mode: "index",
          intersect: false,
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            backgroundColor: "#111827",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            padding: 12,
            cornerRadius: 10,

            callbacks: {
              label: (context) => {
                const value = formatNumber(
                  context.parsed.y
                );

                if (context.dataset.yAxisID === "y") {
                  return ` Orders: ${value}`;
                }

                if (context.dataset.yAxisID === "y1") {
                  return ` Weight: ${value} KG`;
                }

                return ` Sales: ৳${value}`;
              },
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },

            ticks: {
              color: "#64748b",
              font: {
                size: 11,
              },
            },

            border: {
              display: false,
            },
          },

          y: {
            type: "linear",
            position: "left",
            beginAtZero: true,

            ticks: {
              precision: 0,
              color: "#2563eb",
            },

            title: {
              display: true,
              text: "Orders",
              color: "#2563eb",
            },

            grid: {
              color: "rgba(148,163,184,0.12)",
            },
          },

          y1: {
            type: "linear",
            position: "right",
            beginAtZero: true,

            ticks: {
              color: "#16a34a",
            },

            title: {
              display: true,
              text: "KG",
              color: "#16a34a",
            },

            grid: {
              drawOnChartArea: false,
            },
          },

          y2: {
            type: "linear",
            position: "right",
            display: false,
            beginAtZero: true,

            grid: {
              drawOnChartArea: false,
            },
          },
        },
      },
    };
  }, [chartRows]);

  // ==========================================
  // RENDER CHART USING CHART.JS
  // ==========================================

  useEffect(() => {
    if (loading || error || !canvasRef.current) {
      return;
    }

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    try {
      chartRef.current = new ChartJS(
        canvasRef.current,
        chartConfig
      );
    } catch (err) {
      console.error("Chart rendering error:", err);

      setError("Chart could not be rendered.");
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartConfig, loading, error]);

  // ==========================================
  // UI
  // ==========================================

  return (
    <section className="w-full overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">

            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3v18h18M7 14l4-4 4 3 6-7"
              />
            </svg>

          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Last 7 Days Performance
            </h2>

            <p className="text-xs text-gray-500">
              Daily order, weight and sales analysis
            </p>
          </div>

        </div>

        <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          LIVE
        </span>

      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">

        {/* ORDERS */}

        <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">

          <p className="text-xs font-semibold text-blue-700">
            Total Orders
          </p>

          <h3 className="mt-2 text-3xl font-extrabold text-blue-700">
            {formatNumber(totals.orders)}
          </h3>

          <p className="mt-1 text-xs text-blue-600">
            Last 7 days
          </p>

        </div>

        {/* KG */}

        <div className="rounded-xl border border-green-100 bg-green-50/70 p-4">

          <p className="text-xs font-semibold text-green-700">
            Total Weight
          </p>

          <h3 className="mt-2 text-3xl font-extrabold text-green-700">
            {formatNumber(totals.kg)} KG
          </h3>

          <p className="mt-1 text-xs text-green-600">
            Last 7 days
          </p>

        </div>

        {/* SALES */}

        <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">

          <p className="text-xs font-semibold text-amber-700">
            Sales Amount
          </p>

          <h3 className="mt-2 break-words text-2xl font-extrabold text-amber-700">
            ৳{formatNumber(totals.amount)}
          </h3>

          <p className="mt-1 text-xs text-amber-600">
            Last 7 days
          </p>

        </div>

      </div>

      {/* CHART AREA */}

      <div className="px-4 pb-4">

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

          <div>
            <h3 className="text-sm font-bold text-gray-700">
              Daily Performance Trend
            </h3>

            <p className="text-xs text-gray-400">
              Bangladesh Time (UTC+6)
            </p>
          </div>

          <div className="flex flex-wrap gap-3">

            <span className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              Orders
            </span>

            <span className="flex items-center gap-1.5 text-xs font-medium text-green-700">
              <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
              KG
            </span>

            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
              Sales
            </span>

          </div>

        </div>

        {loading ? (

          <div className="flex h-80 items-center justify-center text-sm text-gray-500">
            Loading performance data...
          </div>

        ) : error ? (

          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>

        ) : (

          <div className="relative h-[340px] w-full">
            <canvas ref={canvasRef} />
          </div>

        )}

      </div>

      {/* FOOTER */}

      <div className="flex flex-wrap justify-between gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">

        <span className="text-xs text-gray-500">
          Firestore: orderSummary
        </span>

        <span className="text-xs font-medium text-indigo-600">
          Today + Previous 6 Days
        </span>

      </div>

    </section>
  );
}
