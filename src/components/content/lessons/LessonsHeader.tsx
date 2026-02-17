"use client";

import React from "react";

type LessonsHeaderProps = {
  search?: string;
  subject?: string;
  grade?: string;
  status?: string;
  subjectOptions?: string[];
  gradeOptions?: string[];
  onSearch?: (v: string) => void;
  onSubjectChange?: (v: string) => void;
  onGradeChange?: (v: string) => void;
  onStatusChange?: (v: string) => void;
};

export default function LessonsHeader({
  search = "",
  subject = "All",
  grade = "All",
  status = "All",
  subjectOptions = [],
  gradeOptions = [],
  onSearch,
  onSubjectChange,
  onGradeChange,
  onStatusChange,
}: LessonsHeaderProps) {
  const computedSubjects = subjectOptions.length ? subjectOptions : ["Mathematics", "English", "Science"];
  const computedGrades = gradeOptions.length ? gradeOptions : Array.from({ length: 12 }).map((_, i) => `Grade ${i + 1}`);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="search by lesson title"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:max-w-md"
            value={search}
            onChange={(e) => onSearch?.(e.target.value)}
          />
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center">
            <select className="min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700" value={subject} onChange={(e) => onSubjectChange?.(e.target.value)}>
              <option>All</option>
              {computedSubjects.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select className="min-w-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700" value={grade} onChange={(e) => onGradeChange?.(e.target.value)}>
              <option>All</option>
              {computedGrades.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <select className="min-w-[120px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700" value={status} onChange={(e) => onStatusChange?.(e.target.value)}>
              <option>All</option>
              <option>Validated</option>
              <option>Pending</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>
        {/* Create Lesson button lives in the Navbar on this route */}
      </div>
    </div>
  );
}


