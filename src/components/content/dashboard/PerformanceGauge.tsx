"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { name: "Approved", value: 89, color: "#10B981" },
  { name: "Remaining", value: 11, color: "#E5E7EB" },
];

export default function PerformanceGauge() {
  const performancePercent = 89;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance</h3>

      <div className="flex flex-col items-center justify-center">
        {/* Circular Gauge */}
        <div className="relative w-full max-w-[280px] mx-auto mb-6">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                startAngle={180}
                endAngle={0}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">{performancePercent}%</div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6 px-2">
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Congratulations to the team, You performed better this month
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500"></div>
            <span className="text-sm text-gray-700">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-300"></div>
            <span className="text-sm text-gray-700">Rejected</span>
          </div>
        </div>
      </div>
    </div>
  );
}

