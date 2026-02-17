"use client";

import React from "react";
import Link from "next/link";

type SubjectsHeaderProps = {
  onSearch?: (value: string) => void;
  grade?: string;
  status?: string;
  onGradeChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
};

export default function SubjectsHeader({ onSearch, grade = "All", status = "All", onGradeChange, onStatusChange }: SubjectsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="search subjects, lessons..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 sm:max-w-md text-gray-700 placeholder:text-gray-400"
          onChange={(e) => onSearch?.(e.target.value)}
        />
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Select Grade</label>
            <select
              className="min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
              value={grade}
              onChange={(e) => onGradeChange?.(e.target.value)}
            >
              <option>All</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1}>{`Grade ${i + 1}`}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Select Status</label>
            <select
              className="min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
              value={status}
              onChange={(e) => onStatusChange?.(e.target.value)}
            >
              <option>All</option>
              <option>Published</option>
              <option>Draft</option>
              <option>Pending</option>
            </select>
          </div>
        </div>
      </div>
      {/* Mobile-only Create Subject button */}
      <div className="sm:hidden">
        <Link href="/subjects/create" className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-white shadow hover:bg-emerald-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Subject
        </Link>
      </div>
    </div>
  );
}


