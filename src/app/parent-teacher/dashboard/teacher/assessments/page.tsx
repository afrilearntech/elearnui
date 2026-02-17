"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { getGeneralAssessments, GeneralAssessment } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast } from "@/lib/toast";
import CreateGeneralAssessmentModal from "@/components/parent-teacher/teacher/CreateGeneralAssessmentModal";
import AddQuestionsModal from "@/components/parent-teacher/teacher/AddQuestionsModal";

interface Assessment {
  id: number;
  title: string;
  grade: string;
  type: "QUIZ" | "ASSIGNMENT";
  dueDate: string;
  maxScore: number;
  status: string;
  createdDate: string;
}


const getTypeColor = (type: "QUIZ" | "ASSIGNMENT") => {
  switch (type) {
    case "QUIZ":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "ASSIGNMENT":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-200";
    case "PENDING":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "DRAFT":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-200";
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

export default function TeacherAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        const data = await getGeneralAssessments();
        const mappedAssessments: Assessment[] = data.map((assessment) => ({
          id: assessment.id,
          title: assessment.title,
          grade: assessment.grade,
          type: assessment.type,
          dueDate: assessment.due_at,
          maxScore: assessment.marks,
          status: assessment.status,
          createdDate: assessment.created_at,
        }));
        setAssessments(mappedAssessments);
      } catch (error) {
        console.error("Error fetching assessments:", error);
        showErrorToast("Failed to load assessments. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const grades = useMemo(() => {
    const uniqueGrades = Array.from(
      new Set(assessments.map((a) => a.grade))
    ).sort();
    return ["All", ...uniqueGrades];
  }, [assessments]);

  const types = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(assessments.map((a) => a.type))
    ).sort();
    return ["All", ...uniqueTypes];
  }, [assessments]);

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesSearch =
        search.trim().length === 0 ||
        assessment.title.toLowerCase().includes(search.toLowerCase()) ||
        assessment.grade.toLowerCase().includes(search.toLowerCase());

      const matchesGrade =
        selectedGrade === "All" || assessment.grade === selectedGrade;

      const matchesType =
        selectedType === "All" || assessment.type === selectedType;

      return matchesSearch && matchesGrade && matchesType;
    });
  }, [assessments, search, selectedGrade, selectedType]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="text-gray-600 mt-1">
              Create and manage assessments for your class
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
          >
            <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
            Create Assessment
          </button>
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
                  placeholder="Search by title or subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto">
              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
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
                    {type === "QUIZ" ? "Quiz" : type === "ASSIGNMENT" ? "Assignment" : type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold text-emerald-600 text-lg">
                  {filteredAssessments.length}
                </p>
                <p className="text-gray-600">Total Assessments</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Icon icon="solar:loading-bold" className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading assessments...</p>
              </div>
            </div>
          ) : pagedAssessments.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="hidden md:grid grid-cols-7 gap-4 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500">
                  <div>Assessment</div>
                  <div>Grade</div>
                  <div>Type</div>
                  <div>Max Score</div>
                  <div>Status</div>
                  <div className="text-right">Due Date</div>
                  <div className="text-right">Actions</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {pagedAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="px-4 py-3 flex flex-col gap-2 md:grid md:grid-cols-7 md:items-center md:gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {assessment.title}
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {assessment.grade} • {formatDate(assessment.dueDate)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-700 hidden md:block">
                        {assessment.grade}
                      </div>
                      <div className="hidden md:block">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(
                            assessment.type
                          )}`}
                        >
                          {assessment.type === "QUIZ" ? "Quiz" : "Assignment"}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-900 hidden md:block">
                        {assessment.maxScore}
                      </div>
                      <div className="hidden md:block">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                            assessment.status
                          )}`}
                        >
                          {assessment.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 md:text-right">
                        {formatDate(assessment.dueDate)}
                      </div>
                      <div className="md:text-right">
                        <button
                          onClick={() => {
                            setSelectedAssessment(assessment);
                            setIsQuestionsModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          <Icon icon="solar:question-circle-bold" className="w-4 h-4" />
                          <span className="hidden sm:inline">Add Questions</span>
                          <span className="sm:hidden">Questions</span>
                        </button>
                      </div>
                      <div className="md:hidden space-y-1 mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Type:</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(
                              assessment.type
                            )}`}
                          >
                            {assessment.type === "QUIZ" ? "Quiz" : "Assignment"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Max Score:</span>
                          <span className="font-medium">{assessment.maxScore}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Status:</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                              assessment.status
                            )}`}
                          >
                            {assessment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between flex-col sm:flex-row gap-4">
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

      <CreateGeneralAssessmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={async () => {
          try {
            const data = await getGeneralAssessments();
            const mappedAssessments: Assessment[] = data.map((assessment) => ({
              id: assessment.id,
              title: assessment.title,
              grade: assessment.grade,
              type: assessment.type,
              dueDate: assessment.due_at,
              maxScore: assessment.marks,
              status: assessment.status,
              createdDate: assessment.created_at,
            }));
            setAssessments(mappedAssessments);
          } catch (error) {
            console.error("Error refreshing assessments:", error);
          }
        }}
      />
      {selectedAssessment && (
        <AddQuestionsModal
          isOpen={isQuestionsModalOpen}
          onClose={() => {
            setIsQuestionsModalOpen(false);
            setSelectedAssessment(null);
          }}
          assessmentId={selectedAssessment.id}
          assessmentType="general"
          assessmentTitle={selectedAssessment.title}
        />
      )}
    </DashboardLayout>
  );
}

