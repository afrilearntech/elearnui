"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import {
  getTeacherLessonAssessments,
  getHeadTeacherLessonAssessments,
  getHeadTeacherGeneralAssessments,
  TeacherLessonAssessment,
  GeneralAssessment,
} from "@/lib/api/parent-teacher/teacher";
import { showErrorToast } from "@/lib/toast";
import CreateAssignmentModal from "@/components/parent-teacher/teacher/CreateAssignmentModal";
import AddQuestionsModal from "@/components/parent-teacher/teacher/AddQuestionsModal";

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "PUBLISHED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
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

type AssessmentTab = "lesson" | "general";

type UnifiedAssessment = {
  id: number;
  title: string;
  type: "QUIZ" | "ASSIGNMENT" | "TRIAL";
  marks: number;
  due_at: string;
  status: string;
  created_at: string;
  instructions?: string;
  lesson?: number;
  grade?: string;
  ai_recommended?: boolean;
  is_targeted?: boolean;
  target_student?: number | null;
  scope: AssessmentTab;
};

export default function AssignmentsPage() {
  const [isHeadTeacher, setIsHeadTeacher] = useState(false);
  const [activeTab, setActiveTab] = useState<AssessmentTab>("lesson");
  const [lessonAssessments, setLessonAssessments] = useState<UnifiedAssessment[]>([]);
  const [generalAssessments, setGeneralAssessments] = useState<UnifiedAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedGrade, setSelectedGrade] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<UnifiedAssessment | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const mapLessonAssessments = (rows: TeacherLessonAssessment[]): UnifiedAssessment[] =>
    rows.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      marks: item.marks,
      due_at: item.due_at,
      status: item.status,
      created_at: item.created_at,
      instructions: item.instructions,
      lesson: item.lesson,
      grade: item.grade,
      ai_recommended: item.ai_recommended,
      is_targeted: item.is_targeted,
      target_student: item.target_student,
      scope: "lesson",
    }));

  const mapGeneralAssessments = (rows: GeneralAssessment[]): UnifiedAssessment[] =>
    rows.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      marks: item.marks,
      due_at: item.due_at,
      status: item.status,
      created_at: item.created_at,
      instructions: item.instructions,
      grade: item.grade,
      ai_recommended: item.ai_recommended,
      is_targeted: item.is_targeted,
      target_student: item.target_student,
      scope: "general",
    }));

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        const userStr = localStorage.getItem("user");
        let headTeacher = false;
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            headTeacher = user?.role === "HEADTEACHER";
          } catch {
            headTeacher = false;
          }
        }
        setIsHeadTeacher(headTeacher);

        if (headTeacher) {
          const [lessonData, generalData] = await Promise.all([
            getHeadTeacherLessonAssessments(),
            getHeadTeacherGeneralAssessments(),
          ]);
          setLessonAssessments(mapLessonAssessments(lessonData));
          setGeneralAssessments(mapGeneralAssessments(generalData));
        } else {
          const data = await getTeacherLessonAssessments();
          setLessonAssessments(mapLessonAssessments(data));
          setGeneralAssessments([]);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
        showErrorToast("Failed to load assignments. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const currentAssessments =
    activeTab === "lesson" ? lessonAssessments : generalAssessments;

  const filteredAssessments = useMemo(() => {
    return currentAssessments.filter((assessment) => {
      const matchesSearch =
        search.trim().length === 0 ||
        assessment.title.toLowerCase().includes(search.toLowerCase()) ||
        assessment.instructions?.toLowerCase().includes(search.toLowerCase()) ||
        (assessment.grade || "").toLowerCase().includes(search.toLowerCase());

      const matchesType =
        selectedType === "All" || assessment.type.toUpperCase() === selectedType.toUpperCase();

      const matchesStatus =
        selectedStatus === "All" || assessment.status.toUpperCase() === selectedStatus.toUpperCase();

      const matchesGrade =
        selectedGrade === "All" ||
        (assessment.grade && assessment.grade.toUpperCase() === selectedGrade.toUpperCase());

      return matchesSearch && matchesStatus && matchesType && matchesGrade;
    });
  }, [currentAssessments, search, selectedStatus, selectedType, selectedGrade]);

  const totalPages = Math.max(1, Math.ceil(filteredAssessments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedAssessments = filteredAssessments.slice(start, start + pageSize);

  const statuses = ["All", "DRAFT", "PUBLISHED", "PENDING", "APPROVED", "REJECTED"];
  const types = [
    "All",
    ...Array.from(new Set(currentAssessments.map((item) => item.type?.toUpperCase()))),
  ];
  const grades = [
    "All",
    ...Array.from(
      new Set(
        currentAssessments
          .map((item) => item.grade)
          .filter((grade): grade is string => Boolean(grade))
      )
    ),
  ];

  const handleCreateAssignment = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = async () => {
    try {
      if (isHeadTeacher) {
        const [lessonData, generalData] = await Promise.all([
          getHeadTeacherLessonAssessments(),
          getHeadTeacherGeneralAssessments(),
        ]);
        setLessonAssessments(mapLessonAssessments(lessonData));
        setGeneralAssessments(mapGeneralAssessments(generalData));
      } else {
        const data = await getTeacherLessonAssessments();
        setLessonAssessments(mapLessonAssessments(data));
      }
    } catch (error) {
      console.error("Error refreshing assignments:", error);
    }
  };

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
            <p className="text-gray-600">Loading assignments...</p>
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
              {isHeadTeacher
                ? "Track lesson and general assessments across your school"
                : "Manage and view all lesson assessments"}
            </p>
          </div>
          {!isHeadTeacher && (
            <button
              onClick={handleCreateAssignment}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
              Create Assessment
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          {isHeadTeacher && (
            <div className="mb-5">
              <div className="inline-flex rounded-xl bg-gray-100 p-1">
                <button
                  onClick={() => {
                    setActiveTab("lesson");
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "lesson"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Lesson Assessments ({lessonAssessments.length})
                </button>
                <button
                  onClick={() => {
                    setActiveTab("general");
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === "general"
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  General Assessments ({generalAssessments.length})
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Icon
                  icon="solar:magnifer-bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
                />
                <input
                  type="text"
                  placeholder="Search by title or instructions..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto flex-wrap">
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
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade === "All" ? "All Grades" : grade}
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
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          {pagedAssessments.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Title
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        {activeTab === "lesson" ? "Lesson ID" : "Grade"}
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Marks
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Due Date
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Created
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pagedAssessments.map((assessment) => (
                      <tr key={assessment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-semibold text-gray-900">{assessment.title}</p>
                            {assessment.instructions && (
                              <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                {assessment.instructions}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700">
                            {activeTab === "lesson"
                              ? `#${assessment.lesson || "-"}`
                              : assessment.grade || "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                            {assessment.type}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700">{assessment.marks}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{formatDate(assessment.due_at)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              assessment.status
                            )}`}
                          >
                            {assessment.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{formatDate(assessment.created_at)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => {
                              setSelectedAssessment(assessment);
                              setIsQuestionsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isHeadTeacher}
                          >
                            <Icon icon="solar:question-circle-bold" className="w-4 h-4" />
                            <span>{isHeadTeacher ? "View Only" : "Add Questions"}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between flex-col sm:flex-row gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {start + 1} to {Math.min(start + pageSize, filteredAssessments.length)} of{" "}
                    {filteredAssessments.length} assessments
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
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
                        } else if (pageNum === page - 2 || pageNum === page + 2) {
                          return (
                            <span key={pageNum} className="px-2 py-2 text-gray-700">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
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

      {!isHeadTeacher && (
        <CreateAssignmentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {selectedAssessment && (
        <AddQuestionsModal
          isOpen={isQuestionsModalOpen}
          onClose={() => {
            setIsQuestionsModalOpen(false);
            setSelectedAssessment(null);
          }}
          assessmentId={selectedAssessment.id}
          assessmentType={selectedAssessment.scope}
          assessmentTitle={selectedAssessment.title}
        />
      )}
    </DashboardLayout>
  );
}

