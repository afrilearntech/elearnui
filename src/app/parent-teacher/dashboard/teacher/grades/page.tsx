"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import {
  getTeacherGrades,
  getHeadTeacherGrades,
  TeacherGrades,
} from "@/lib/api/parent-teacher/teacher";
import { showErrorToast } from "@/lib/toast";

interface GradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  grade: string;
  percentage: number;
  status: "excellent" | "good" | "needs-improvement";
  updatedAt: string;
}

const mapStatus = (status: string): "excellent" | "good" | "needs-improvement" => {
  const upperStatus = status.toUpperCase();
  if (upperStatus === "EXCELLENT") return "excellent";
  if (upperStatus === "GOOD") return "good";
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
  if (grade.startsWith("A")) return "text-green-600";
  if (grade.startsWith("B")) return "text-blue-600";
  if (grade.startsWith("C")) return "text-yellow-600";
  return "text-gray-600";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function TeacherGradesPage() {
  const [gradesData, setGradesData] = useState<TeacherGrades | null>(null);
  const [isHeadTeacher, setIsHeadTeacher] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoading(true);
        const userRaw =
          typeof window !== "undefined" ? localStorage.getItem("user") : null;
        let headTeacher = false;

        if (userRaw) {
          try {
            const parsedUser = JSON.parse(userRaw);
            headTeacher = parsedUser?.role === "HEADTEACHER";
          } catch {
            headTeacher = false;
          }
        }

        setIsHeadTeacher(headTeacher);
        const data = headTeacher
          ? await getHeadTeacherGrades()
          : await getTeacherGrades();
        setGradesData(data);
      } catch (error) {
        console.error("Error fetching grades:", error);
        showErrorToast("Failed to load grades. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const grades: GradeRecord[] = useMemo(() => {
    if (!gradesData) return [];
    return gradesData.grades.map((grade, index) => ({
      id: `${grade.student_id}-${grade.subject}-${index}`,
      studentId: grade.student_id || "N/A",
      studentName: grade.student_name,
      subject: grade.subject || "N/A",
      grade: grade.grade_letter,
      percentage: grade.percentage,
      status: mapStatus(grade.status),
      updatedAt: grade.updated_at,
    }));
  }, [gradesData]);

  const studentOptions = useMemo(() => {
    const uniqueStudents = Array.from(
      new Set(grades.map((g) => g.studentName))
    ).sort();
    return ["All", ...uniqueStudents];
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
        grade.studentName.toLowerCase().includes(search.toLowerCase()) ||
        grade.grade.toLowerCase().includes(search.toLowerCase());

      const matchesStudent =
        selectedStudent === "All" || grade.studentName === selectedStudent;

      const matchesSubject =
        selectedSubject === "All" || grade.subject === selectedSubject;

      return matchesSearch && matchesStudent && matchesSubject;
    });
  }, [grades, search, selectedStudent, selectedSubject]);

  const totalPages = Math.max(1, Math.ceil(filteredGrades.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedGrades = filteredGrades.slice(start, start + pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Grades</h1>
            <p className="text-gray-600 mt-1">
              {isHeadTeacher
                ? "View school-wide student grades and performance distribution"
                : "View and manage grades for all your students"}
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
                  placeholder="Search by subject, student name, or grade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto">
              <select
                value={selectedStudent}
                onChange={(e) => {
                  setSelectedStudent(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {studentOptions.map((student) => (
                  <option key={student} value={student}>
                    {student}
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

          {/* Summary Statistics */}
          {gradesData && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 mb-1">Total Grades</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {gradesData.summary.total_grades}
                    </p>
                  </div>
                  <div className="bg-emerald-200 rounded-lg p-3">
                    <Icon icon="solar:diploma-verified-bold" className="w-6 h-6 text-emerald-700" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Excellent</p>
                    <p className="text-2xl font-bold text-green-900">
                      {gradesData.summary.excellent}
                    </p>
                  </div>
                  <div className="bg-green-200 rounded-lg p-3">
                    <Icon icon="solar:star-bold" className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-700 mb-1">Good</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {gradesData.summary.good}
                    </p>
                  </div>
                  <div className="bg-blue-200 rounded-lg p-3">
                    <Icon icon="solar:like-bold" className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-yellow-700 mb-1">Needs Improvement</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {gradesData.summary.needs_improvement}
                    </p>
                  </div>
                  <div className="bg-yellow-200 rounded-lg p-3">
                    <Icon icon="solar:info-circle-bold" className="w-6 h-6 text-yellow-700" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Icon icon="solar:loading-bold" className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading grades...</p>
              </div>
            </div>
          ) : pagedGrades.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="hidden md:grid grid-cols-6 gap-4 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500">
                  <div>Student</div>
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
                          {grade.studentName}
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {grade.subject}
                        </p>
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
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2.5 max-w-[80px] overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all ${
                                grade.percentage >= 90
                                  ? "bg-gradient-to-r from-green-500 to-green-600"
                                  : grade.percentage >= 80
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                  : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                              }`}
                              style={{ width: `${Math.min(100, grade.percentage)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-900 min-w-[45px]">
                            {grade.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="md:hidden">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                grade.percentage >= 90
                                  ? "bg-green-500"
                                  : grade.percentage >= 80
                                  ? "bg-blue-500"
                                  : "bg-yellow-500"
                              }`}
                              style={{ width: `${Math.min(100, grade.percentage)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-gray-700">
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
                        {formatDate(grade.updatedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between flex-col sm:flex-row gap-4">
                <div className="text-sm text-gray-600">
                  Showing {start + 1} to{" "}
                  {Math.min(start + pageSize, filteredGrades.length)} of{" "}
                  {filteredGrades.length} grades
                </div>
                {totalPages > 1 && (
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
                )}
              </div>
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

