"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { getParentAssessments, ParentAssessment } from "@/lib/api/parent-teacher/parent";
import { showErrorToast } from "@/lib/toast";

interface Assessment {
  id: string;
  childName: string;
  title: string;
  subject: string;
  type: "quiz" | "assignment" | "exam" | "project";
  status: "completed" | "in-progress" | "pending";
  score?: number;
  maxScore: number;
  dueDate: string;
  startDate: string;
}

const mapAssessmentType = (type: string): "quiz" | "assignment" | "exam" | "project" => {
  const upperType = type.toUpperCase();
  if (upperType === "QUIZ") return "quiz";
  if (upperType === "ASSIGNMENT") return "assignment";
  if (upperType === "EXAM") return "exam";
  if (upperType === "PROJECT") return "project";
  return "assignment";
};

const mapAssessmentStatus = (status: string): "completed" | "in-progress" | "pending" => {
  const upperStatus = status.toUpperCase();
  if (upperStatus === "COMPLETED") return "completed";
  if (upperStatus === "IN PROGRESS" || upperStatus === "IN_PROGRESS") return "in-progress";
  return "pending";
};

const getTypeColor = (type: Assessment["type"]) => {
  switch (type) {
    case "quiz":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "assignment":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "exam":
      return "bg-red-100 text-red-800 border-red-200";
    case "project":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusColor = (status: Assessment["status"]) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in-progress":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [summary, setSummary] = useState({ completed: 0, pending: 0, in_progress: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChild, setSelectedChild] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        const data = await getParentAssessments();
        
        const mappedAssessments: Assessment[] = data.assessments.map((assessment, index) => ({
          id: `${assessment.child_name}-${assessment.assessment_title}-${index}`,
          childName: assessment.child_name,
          title: assessment.assessment_title,
          subject: assessment.subject || "N/A",
          type: mapAssessmentType(assessment.assessment_type),
          status: mapAssessmentStatus(assessment.assessment_status),
          score: assessment.child_score ?? undefined,
          maxScore: assessment.assessment_score,
          dueDate: assessment.due_date,
          startDate: assessment.start_date,
        }));

        setAssessments(mappedAssessments);
        setSummary(data.summary);
      } catch (error) {
        console.error("Error fetching assessments:", error);
        showErrorToast("Failed to load assessments. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const childrenOptions = useMemo(() => {
    const uniqueChildren = Array.from(
      new Set(assessments.map((a) => a.childName))
    ).sort();
    return ["All", ...uniqueChildren];
  }, [assessments]);

  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(
      new Set(assessments.map((a) => a.subject).filter((s) => s !== "N/A"))
    ).sort();
    return ["All", ...uniqueSubjects];
  }, [assessments]);

  const types = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(assessments.map((a) => a.type))
    ).sort();
    return ["All", ...uniqueTypes.map((t) => t.charAt(0).toUpperCase() + t.slice(1))];
  }, [assessments]);

  const statusOptions = ["All", "Completed", "In Progress", "Pending"];

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesSearch =
        search.trim().length === 0 ||
        assessment.title.toLowerCase().includes(search.toLowerCase()) ||
        assessment.childName.toLowerCase().includes(search.toLowerCase()) ||
        assessment.subject.toLowerCase().includes(search.toLowerCase());

      const matchesChild =
        selectedChild === "All" || assessment.childName === selectedChild;

      const matchesSubject =
        selectedSubject === "All" || assessment.subject === selectedSubject;

      const matchesType =
        selectedType === "All" ||
        assessment.type === selectedType.toLowerCase();

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Completed" && assessment.status === "completed") ||
        (selectedStatus === "In Progress" && assessment.status === "in-progress") ||
        (selectedStatus === "Pending" && assessment.status === "pending");

      return (
        matchesSearch && matchesChild && matchesSubject && matchesType && matchesStatus
      );
    });
  }, [assessments, search, selectedChild, selectedSubject, selectedType, selectedStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssessments.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedAssessments = filteredAssessments.slice(start, start + pageSize);

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
            <p className="text-gray-600">Loading assessments...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="text-gray-600 mt-1">
              Track and monitor your children's assessment progress
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
                  placeholder="Search by title, child name, or subject..."
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
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <p className="font-semibold text-green-600">{summary.completed}</p>
                <p className="text-gray-600">Completed</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-yellow-600">
                  {summary.in_progress}
                </p>
                <p className="text-gray-600">In Progress</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-600">{summary.pending}</p>
                <p className="text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          {pagedAssessments.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="hidden md:grid grid-cols-7 gap-4 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500">
                  <div>Child</div>
                  <div>Assessment</div>
                  <div>Subject</div>
                  <div>Type</div>
                  <div>Score</div>
                  <div>Status</div>
                  <div className="text-right">Due Date</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {pagedAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="px-4 py-3 flex flex-col gap-2 md:grid md:grid-cols-7 md:items-center md:gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {assessment.childName}
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {assessment.subject} • {formatDate(assessment.dueDate)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-900 font-medium">
                        {assessment.title}
                      </div>
                      <div className="text-sm text-gray-700 hidden md:block">
                        <span className={assessment.subject === "N/A" ? "text-gray-400 italic" : ""}>
                          {assessment.subject}
                        </span>
                      </div>
                      <div className="hidden md:block">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(
                            assessment.type
                          )}`}
                        >
                          {assessment.type.charAt(0).toUpperCase() +
                            assessment.type.slice(1)}
                        </span>
                      </div>
                      <div>
                        {assessment.status === "completed" &&
                        assessment.score !== undefined ? (
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {assessment.score}/{assessment.maxScore}
                            </p>
                            <p className="text-xs text-gray-600">
                              {Math.round(
                                (assessment.score / assessment.maxScore) * 100
                              )}
                              %
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                        <div className="md:hidden mt-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(
                              assessment.type
                            )}`}
                          >
                            {assessment.type.charAt(0).toUpperCase() +
                              assessment.type.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            assessment.status
                          )}`}
                        >
                          {assessment.status === "completed"
                            ? "Completed"
                            : assessment.status === "in-progress"
                            ? "In Progress"
                            : "Pending"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 md:text-right">
                        {formatDate(assessment.dueDate)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {start + 1} to{" "}
                    {Math.min(start + pageSize, filteredAssessments.length)} of{" "}
                    {filteredAssessments.length} assessments
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
                No assessments found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

