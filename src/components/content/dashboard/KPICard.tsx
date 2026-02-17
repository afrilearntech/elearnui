"use client";

import React from "react";

type KPICardProps = {
  title: string;
  value: string;
  helperText?: string;
};

export default function KPICard({ title, value, helperText }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="text-xs sm:text-sm font-medium text-gray-600 mb-2">{title}</div>
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{value}</div>
      {helperText ? <div className="text-xs sm:text-sm text-gray-500">{helperText}</div> : null}
    </div>
  );
}

