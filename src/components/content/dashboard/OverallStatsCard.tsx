"use client";

import React from "react";

type OverallStatsCardProps = {
  total: number;
  approved: number;
  rejected: number;
  reviewRequested: number;
};

export default function OverallStatsCard({ total, approved, rejected, reviewRequested }: OverallStatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Overall Statistics</div>
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Total: {total}</div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-emerald-600">{approved}</div>
          <div className="text-xs text-gray-500 mt-1">Approved</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-rose-600">{rejected}</div>
          <div className="text-xs text-gray-500 mt-1">Rejected</div>
        </div>
        <div className="text-center">
          <div className="text-lg sm:text-xl font-bold text-amber-600">{reviewRequested}</div>
          <div className="text-xs text-gray-500 mt-1">Review</div>
        </div>
      </div>
    </div>
  );
}

