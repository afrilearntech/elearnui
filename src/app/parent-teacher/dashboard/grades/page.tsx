"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { getParentGrades, ParentGrade } from "@/lib/api/parent-teacher/parent";
import { showErrorToast } from "@/lib/toast";

interface GradeRecord {
  id: string;
  childName: string;
  subject: string;
  grade: string;
  percentage: number;
  status: "excellent" | "good" | "needs-improvement";
  updatedAt: string;
  studentId: string | null;
}

const getStatusFromRemark = (remark: string): "excellent" | "good" | "needs-improvement" => {
  const lowerRemark = remark.toLowerCase();
  if (lowerRemark.includes("excellent") || lowerRemark.includes("outstanding") || lowerRemark.includes("distinction")) {
    return "excellent";
  }
  if (lowerRemark.includes("good") || lowerRemark.includes("pass") || lowerRemark.includes("satisfactory")) {
    return "good";
  }
  return "needs-improvement";
};

const getStatusColor = (status: GradeRecord["status"]) => {
  switch (status) {
    case "excellent":
      return "bg-green-100 text-green-800 border-green-200";
    case "good":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "needs-improvement":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getGradeColor = (grade: string) => {
  const upperGrade = grade.toUpperCase();
  if (upperGrade.startsWith("A")) return "text-green-600";
  if (upperGrade.startsWith("B")) return "text-blue-600";
  if (upperGrade.startsWith("C")) return "text-yellow-600";
  if (upperGrade.startsWith("D")) return "text-orange-600";
  return "text-red-600";
};

const calculatePercentage = (score: number): number => {
  return Math.min(100, Math.max(0, score));
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function GradesPage() {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChild, setSelectedChild] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoading(true);
        const data = await getParentGrades();
        
        const mappedGrades: GradeRecord[] = data.map((grade, index) => ({
          id: `${grade.child_name}-${grade.subject}-${index}`,
          childName: grade.child_name,
          subject: grade.subject,
          grade: grade.score_grade,
          percentage: calculatePercentage(grade.overall_score),
          status: getStatusFromRemark(grade.score_remark),
          updatedAt: grade.updated_at,
          studentId: grade.student_id,
        }));

        setGrades(mappedGrades);
      } catch (error) {
        console.error("Error fetching grades:", error);
        showErrorToast("Failed to load grades. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const childrenOptions = useMemo(() => {
    const uniqueChildren = Array.from(
      new Set(grades.map((g) => g.childName))
    ).sort();
    return ["All", ...uniqueChildren];
  }, [grades]);

  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(
      new Set(grades.map((g) => g.subject))
    ).sort();
    return ["All", ...uniqueSubjects];
  }, [grades]);

  const filteredGrades = useMemo(() => {
    return grades.filter((grade) => {
      const matchesSearch =
        search.trim().length === 0 ||
        grade.subject.toLowerCase().includes(search.toLowerCase()) ||
        grade.childName.toLowerCase().includes(search.toLowerCase()) ||
        grade.grade.toLowerCase().includes(search.toLowerCase());

      const matchesChild =
        selectedChild === "All" || grade.childName === selectedChild;

      const matchesSubject =
        selectedSubject === "All" || grade.subject === selectedSubject;

      return matchesSearch && matchesChild && matchesSubject;
    });
  }, [grades, search, selectedChild, selectedSubject]);

  const totalPages = Math.max(1, Math.ceil(filteredGrades.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedGrades = filteredGrades.slice(start, start + pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading grades...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Grades</h1>
            <p className="text-gray-600 mt-1">
              View and track your children's academic performance
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Icon
                  icon="solar:magnifer-bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
                />
                <input
                  type="text"
                  placeholder="Search by subject, child name, or grade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto">
              <select
                value={selectedChild}
                onChange={(e) => {
                  setSelectedChild(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {childrenOptions.map((child) => (
                  <option key={child} value={child}>
                    {child}
                  </option>
                ))}
              </select>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {pagedGrades.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="hidden md:grid grid-cols-6 gap-4 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500">
                  <div>Child</div>
                  <div>Subject</div>
                  <div>Grade</div>
                  <div>Percentage</div>
                  <div>Status</div>
                  <div className="text-right">Updated</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {pagedGrades.map((grade) => (
                    <div
                      key={grade.id}
                      className="px-4 py-3 flex flex-col gap-2 md:grid md:grid-cols-6 md:items-center md:gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {grade.childName}
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {grade.subject}
                        </p>
                        {grade.studentId && (
                          <p className="text-xs text-gray-400 mt-1 md:hidden">
                            ID: {grade.studentId}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 hidden md:block">
                        {grade.subject}
                      </div>
                      <div>
                        <span
                          className={`text-base font-bold ${getGradeColor(
                            grade.grade
                          )}`}
                        >
                          {grade.grade}
                        </span>
                        <p className="text-xs text-gray-500 md:hidden">
                          {grade.percentage}%
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[60px]">
                            <div
                              className={`h-1.5 rounded-full ${
                                grade.percentage >= 90
                                  ? "bg-green-500"
                                  : grade.percentage >= 80
                                  ? "bg-blue-500"
                                  : "bg-yellow-500"
                              }`}
                              style={{ width: `${grade.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-700">
                            {grade.percentage}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            grade.status
                          )}`}
                        >
                          {grade.status === "excellent"
                            ? "Excellent"
                            : grade.status === "good"
                            ? "Good"
                            : "Needs Improvement"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 md:text-right">
                        <div>{formatDate(grade.updatedAt)}</div>
                        {grade.studentId && (
                          <div className="text-xs text-gray-400 mt-1">
                            ID: {grade.studentId}
                          </div>
                        )}
                        {!grade.studentId && (
                          <div className="text-xs text-gray-400 italic mt-1">
                            ID: N/A
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {start + 1} to{" "}
                    {Math.min(start + pageSize, filteredGrades.length)} of{" "}
                    {filteredGrades.length} grades
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => {
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= page - 1 && pageNum <= page + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  pageNum === page
                                    ? "bg-emerald-600 text-white"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            pageNum === page - 2 ||
                            pageNum === page + 2
                          ) {
                            return (
                              <span
                                key={pageNum}
                                className="px-2 py-2 text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                      )}
                    </div>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-sm">
                No grades found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

