"use client";

import React from "react";
import { useRouter } from "next/navigation";

type TypeCardProps = {
  title: string;
  total: number;
  approved: number;
  rejected: number;
  reviewRequested: number;
  type: string;
  route: string;
};

export default function TypeCard({ title, total, approved, rejected, reviewRequested, type, route }: TypeCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(route);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-gray-900">{title}</h3>
        <span className="text-xs sm:text-sm font-medium text-gray-500">Total: {total}</span>
      </div>
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

