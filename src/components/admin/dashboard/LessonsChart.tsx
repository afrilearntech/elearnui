"use client";

import { useState, useMemo } from "react";
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

interface LessonsChartPoint {
  period: string;
  submitted: number;
  approved: number;
  rejected: number;
}

interface LessonsChartProps {
  data: LessonsChartPoint[];
  granularity?: string;
}

type TimeFilter = "Day" | "Month" | "Year";

export default function LessonsChart({ data, granularity = "month" }: LessonsChartProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(
    granularity === "day" ? "Day" : granularity === "year" ? "Year" : "Month"
  );

  const chartData = useMemo(() => {
    return data.map((point) => ({
      month: point.period,
      submitted: point.submitted,
      approved: point.approved,
      rejected: point.rejected,
    }));
  }, [data]);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Lessons</h2>
        {granularity && (
        <div className="flex gap-2">
            {(["Day", "Month", "Year"] as TimeFilter[]).map((filter) => {
              const isActive = 
                (granularity === "day" && filter === "Day") ||
                (granularity === "month" && filter === "Month") ||
                (granularity === "year" && filter === "Year");
              
              return (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
                  disabled={!isActive}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                  ? "bg-[#059669] text-white"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {filter}
            </button>
              );
            })}
        </div>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#047857]"></div>
          <span className="text-sm text-gray-600">Submitted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
          <span className="text-sm text-gray-600">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span className="text-sm text-gray-600">Rejected</span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[400px] text-gray-500">
          <p className="text-sm">No chart data available</p>
        </div>
      ) : (
      <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value / 1000}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
            }}
            formatter={(value) => typeof value === 'number' ? value.toLocaleString() : String(value)}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="circle"
          />
          <Bar
            dataKey="submitted"
            fill="#047857"
            radius={[4, 4, 0, 0]}
            name="Submitted"
          />
          <Bar
            dataKey="approved"
            fill="#10B981"
            radius={[4, 4, 0, 0]}
            name="Approved"
          />
          <Bar
            dataKey="rejected"
            fill="#D1D5DB"
            radius={[4, 4, 0, 0]}
            name="Rejected"
          />
        </BarChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}

