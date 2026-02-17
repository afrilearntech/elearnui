"use client";

import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Timeframe = "Day" | "Month" | "Year";

const monthlyData = [
  { month: "Jan", submitted: 120000, approved: 100000, rejected: 20000 },
  { month: "Feb", submitted: 150000, approved: 130000, rejected: 20000 },
  { month: "Mar", submitted: 180000, approved: 160000, rejected: 20000 },
  { month: "Apr", submitted: 200000, approved: 180000, rejected: 20000 },
  { month: "May", submitted: 250000, approved: 230000, rejected: 20000 },
  { month: "Jun", submitted: 280000, approved: 260000, rejected: 20000 },
  { month: "Jul", submitted: 300000, approved: 280000, rejected: 20000 },
  { month: "Aug", submitted: 450000, approved: 420000, rejected: 30000 },
  { month: "Sep", submitted: 380000, approved: 350000, rejected: 30000 },
  { month: "Oct", submitted: 320000, approved: 300000, rejected: 20000 },
  { month: "Nov", submitted: 280000, approved: 260000, rejected: 20000 },
  { month: "Dec", submitted: 200000, approved: 180000, rejected: 20000 },
];

const dailyData = [
  { day: "Mon", submitted: 50000, approved: 45000, rejected: 5000 },
  { day: "Tue", submitted: 55000, approved: 50000, rejected: 5000 },
  { day: "Wed", submitted: 60000, approved: 55000, rejected: 5000 },
  { day: "Thu", submitted: 58000, approved: 53000, rejected: 5000 },
  { day: "Fri", submitted: 52000, approved: 47000, rejected: 5000 },
  { day: "Sat", submitted: 30000, approved: 28000, rejected: 2000 },
  { day: "Sun", submitted: 25000, approved: 23000, rejected: 2000 },
];

const yearlyData = [
  { year: "2020", submitted: 2500000, approved: 2200000, rejected: 300000 },
  { year: "2021", submitted: 2800000, approved: 2500000, rejected: 300000 },
  { year: "2022", submitted: 3200000, approved: 2900000, rejected: 300000 },
  { year: "2023", submitted: 3500000, approved: 3200000, rejected: 300000 },
  { year: "2024", submitted: 3200000, approved: 3000000, rejected: 200000 },
];

export default function LessonsChart() {
  const [timeframe, setTimeframe] = useState<Timeframe>("Month");

  const getData = () => {
    switch (timeframe) {
      case "Day":
        return dailyData;
      case "Month":
        return monthlyData;
      case "Year":
        return yearlyData;
      default:
        return monthlyData;
    }
  };

  const getXAxisKey = () => {
    switch (timeframe) {
      case "Day":
        return "day";
      case "Month":
        return "month";
      case "Year":
        return "year";
      default:
        return "month";
    }
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const data = getData();
  const xAxisKey = getXAxisKey();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Lessons</h3>
        <div className="flex gap-2 w-full sm:w-auto">
          {(["Day", "Month", "Year"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                timeframe === tf
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#059669]"></div>
          <span className="text-xs sm:text-sm text-gray-600">Submitted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
          <span className="text-xs sm:text-sm text-gray-600">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#D1D5DB]"></div>
          <span className="text-xs sm:text-sm text-gray-600">Rejected</span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full overflow-x-auto">
        <div style={{ minWidth: "600px", height: "400px" }}>
          <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey={xAxisKey}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              stroke="#E5E7EB"
            />
            <YAxis
              tick={{ fill: "#6B7280", fontSize: 12 }}
              stroke="#E5E7EB"
              tickFormatter={formatYAxis}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              formatter={(value) => typeof value === 'number' ? formatYAxis(value) : String(value)}
            />
            <Bar dataKey="submitted" fill="#059669" radius={[4, 4, 0, 0]} />
            <Bar dataKey="approved" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rejected" fill="#D1D5DB" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

