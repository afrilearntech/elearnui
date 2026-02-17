"use client";

import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { 
  getTeacherSubmissions, 
  TeacherSubmissions,
  gradeGeneralAssessment,
  gradeLessonAssessment,
  getTeacherStudents,
  getGeneralAssessments,
  getTeacherLessonAssessments,
  TeacherStudent,
  GeneralAssessment,
  TeacherLessonAssessment
} from "@/lib/api/parent-teacher/teacher";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

interface Submission {
  id: string;
  studentName: string;
  assessmentTitle: string;
  subject: string | null;
  submittedAt: string;
  score?: number;
  maxScore: number;
  status: "graded" | "pending-review";
  fileUrl?: string;
  solution?: string;
  originalSubmission: {
    child_name: string;
    assessment_title: string;
    subject: string | null;
  };
}

const mapSubmissionStatus = (status: string): "graded" | "pending-review" => {
  const upperStatus = status.toUpperCase();
  if (upperStatus === "GRADED") return "graded";
  return "pending-review";
};

const getStatusColor = (status: Submission["status"]) => {
  switch (status) {
    case "graded":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending-review":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function TeacherSubmissionsPage() {
  const [submissionsData, setSubmissionsData] = useState<TeacherSubmissions | null>(null);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [generalAssessments, setGeneralAssessments] = useState<GeneralAssessment[]>([]);
  const [lessonAssessments, setLessonAssessments] = useState<TeacherLessonAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [gradingModal, setGradingModal] = useState<{
    isOpen: boolean;
    submission: Submission | null;
  }>({ isOpen: false, submission: null });
  const [gradeScore, setGradeScore] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [submissionsData, studentsData, generalAssessmentsData, lessonAssessmentsData] = await Promise.all([
          getTeacherSubmissions(),
          getTeacherStudents(),
          getGeneralAssessments(),
          getTeacherLessonAssessments(),
        ]);
        setSubmissionsData(submissionsData);
        setStudents(studentsData);
        setGeneralAssessments(generalAssessmentsData);
        setLessonAssessments(lessonAssessmentsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        showErrorToast("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const submissions: Submission[] = useMemo(() => {
    if (!submissionsData) return [];
    return submissionsData.submissions.map((submission, index) => ({
      id: `${submission.child_name}-${submission.assessment_title}-${index}`,
      studentName: submission.child_name,
      assessmentTitle: submission.assessment_title,
      subject: submission.subject,
      submittedAt: submission.date_submitted,
      score: submission.score ?? undefined,
      maxScore: submission.assessment_score,
      status: mapSubmissionStatus(submission.submission_status),
      fileUrl: submission.solution.attachment || undefined,
      solution: submission.solution.solution,
      originalSubmission: {
        child_name: submission.child_name,
        assessment_title: submission.assessment_title,
        subject: submission.subject,
      },
    }));
  }, [submissionsData]);

  const studentOptions = useMemo(() => {
    const uniqueStudents = Array.from(
      new Set(submissions.map((s) => s.studentName))
    ).sort();
    return ["All", ...uniqueStudents];
  }, [submissions]);

  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(
      new Set(submissions.map((s) => s.subject || "N/A"))
    ).sort();
    return ["All", ...uniqueSubjects];
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesSearch =
        search.trim().length === 0 ||
        submission.assessmentTitle.toLowerCase().includes(search.toLowerCase()) ||
        submission.studentName.toLowerCase().includes(search.toLowerCase()) ||
        (submission.subject || "").toLowerCase().includes(search.toLowerCase());

      const matchesStudent =
        selectedStudent === "All" || submission.studentName === selectedStudent;

      const matchesSubject =
        selectedSubject === "All" || (submission.subject || "N/A") === selectedSubject;

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Graded" && submission.status === "graded") ||
        (selectedStatus === "Pending Review" &&
          submission.status === "pending-review");

      return (
        matchesSearch && matchesStudent && matchesSubject && matchesStatus
      );
    });
  }, [submissions, search, selectedStudent, selectedSubject, selectedStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedSubmissions = filteredSubmissions.slice(start, start + pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenGrading = (submission: Submission) => {
    setGradingModal({ isOpen: true, submission });
    setGradeScore(submission.score?.toString() || "");
  };

  const handleGradeSubmission = async () => {
    if (!gradingModal.submission) return;

    const score = parseFloat(gradeScore);
    if (isNaN(score) || score < 0 || score > gradingModal.submission.maxScore) {
      showErrorToast(`Score must be between 0 and ${gradingModal.submission.maxScore}`);
      return;
    }

    setIsGrading(true);
    try {
      const submission = gradingModal.submission;
      
      // Find student by name
      const student = students.find(
        (s) => s.profile.name === submission.originalSubmission.child_name
      );
      
      if (!student) {
        showErrorToast("Student not found. Please refresh the page and try again.");
        return;
      }

      // Get student_id - use the student record id
      const studentId = student.id;

      // Determine if it's a general assessment (subject is null) or lesson assessment (subject is not null)
      const isGeneralAssessment = submission.originalSubmission.subject === null;

      let assessmentId: number | null = null;

      if (isGeneralAssessment) {
        // Find general assessment by title
        const assessment = generalAssessments.find(
          (a) => a.title === submission.originalSubmission.assessment_title
        );
        if (!assessment) {
          showErrorToast("Assessment not found. Please refresh the page and try again.");
          return;
        }
        assessmentId = assessment.id;
      } else {
        // Find lesson assessment by title
        const assessment = lessonAssessments.find(
          (a) => a.title === submission.originalSubmission.assessment_title
        );
        if (!assessment) {
          showErrorToast("Assessment not found. Please refresh the page and try again.");
          return;
        }
        assessmentId = assessment.id;
      }

      // Grade the submission
      if (isGeneralAssessment) {
        await gradeGeneralAssessment({
          assessment_id: assessmentId,
          student_id: studentId,
          score: score,
        });
      } else {
        await gradeLessonAssessment({
          assessment_id: assessmentId,
          student_id: studentId,
          score: score,
        });
      }

      showSuccessToast("Submission graded successfully!");
      
      // Refresh submissions
      const updatedData = await getTeacherSubmissions();
      setSubmissionsData(updatedData);
      
      setGradingModal({ isOpen: false, submission: null });
      setGradeScore("");
    } catch (error) {
      console.error("Error grading submission:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to grade submission. Please try again.");
      } else {
        showErrorToast("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsGrading(false);
    }
  };

  const pendingCount = submissionsData?.summary.pending || 0;
  const gradedCount = submissionsData?.summary.graded || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
            <p className="text-gray-600 mt-1">
              Review and grade student submissions
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
                  placeholder="Search by assessment, student name, or subject..."
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
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                <option value="All">All Status</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Graded">Graded</option>
              </select>
            </div>
          </div>

          {submissionsData && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-700 mb-1">Total Submissions</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {submissionsData.submissions.length}
                    </p>
                  </div>
                  <div className="bg-emerald-200 rounded-lg p-3">
                    <Icon icon="solar:document-text-bold" className="w-6 h-6 text-emerald-700" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-700 mb-1">Pending Review</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {pendingCount}
                    </p>
                  </div>
                  <div className="bg-amber-200 rounded-lg p-3">
                    <Icon icon="solar:clock-circle-bold" className="w-6 h-6 text-amber-700" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Graded</p>
                    <p className="text-2xl font-bold text-green-900">
                      {gradedCount}
                    </p>
                  </div>
                  <div className="bg-green-200 rounded-lg p-3">
                    <Icon icon="solar:check-circle-bold" className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Icon icon="solar:loading-bold" className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading submissions...</p>
              </div>
            </div>
          ) : pagedSubmissions.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="hidden md:grid grid-cols-7 gap-4 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500">
                  <div>Student</div>
                  <div>Assessment</div>
                  <div>Subject</div>
                  <div>Score</div>
                  <div>Status</div>
                  <div>Submitted</div>
                  <div className="text-right">Action</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {pagedSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="px-4 py-3 flex flex-col gap-2 md:grid md:grid-cols-7 md:items-center md:gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {submission.studentName}
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {submission.subject || "N/A"} • {formatDateTime(submission.submittedAt)}
                        </p>
                      </div>
                      <div className="text-sm text-gray-900 font-medium">
                        {submission.assessmentTitle}
                      </div>
                      <div className="text-sm text-gray-700 hidden md:block">
                        {submission.subject || "N/A"}
                      </div>
                      <div>
                        {submission.score !== undefined ? (
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {submission.score}/{submission.maxScore}
                            </p>
                            <p className="text-xs text-gray-600">
                              {Math.round(
                                (submission.score / submission.maxScore) * 100
                              )}
                              %
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </div>
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            submission.status
                          )}`}
                        >
                          {submission.status === "graded"
                            ? "Graded"
                            : "Pending Review"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 hidden md:block">
                        {formatDateTime(submission.submittedAt)}
                      </div>
                      <div className="md:text-right">
                        {submission.status === "pending-review" ? (
                          <button
                            onClick={() => handleOpenGrading(submission)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            <Icon icon="solar:pen-bold" className="w-4 h-4" />
                            Grade
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenGrading(submission)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Icon icon="solar:eye-bold" className="w-4 h-4" />
                            View
                          </button>
                        )}
                      </div>
                      <div className="md:hidden mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Status:</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                              submission.status
                            )}`}
                          >
                            {submission.status === "graded"
                              ? "Graded"
                              : "Pending Review"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Submitted:</span>
                          <span>{formatDateTime(submission.submittedAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between flex-col sm:flex-row gap-4">
                <div className="text-sm text-gray-600">
                  Showing {start + 1} to{" "}
                  {Math.min(start + pageSize, filteredSubmissions.length)} of{" "}
                  {filteredSubmissions.length} submissions
                </div>
                {totalPages > 1 && (
                  <div className="flex gap-2 flex-wrap justify-center">
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
                No submissions found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {gradingModal.isOpen && gradingModal.submission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Submission Details</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {gradingModal.submission.studentName} • {gradingModal.submission.assessmentTitle}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGradingModal({ isOpen: false, submission: null });
                    setGradeScore("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                  <p className="text-xs font-medium text-emerald-700 mb-1">Subject</p>
                  <p className="text-sm font-bold text-emerald-900">
                    {gradingModal.submission.subject || "N/A (General Assessment)"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">Max Score</p>
                  <p className="text-sm font-bold text-blue-900">
                    {gradingModal.submission.maxScore}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <p className="text-xs font-medium text-purple-700 mb-1">Submitted</p>
                  <p className="text-sm font-bold text-purple-900">
                    {formatDateTime(gradingModal.submission.submittedAt)}
                  </p>
                </div>
              </div>

              {gradingModal.submission.status === "pending-review" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Pending Review</p>
                      <p className="text-xs text-amber-700 mt-1">
                        This submission is awaiting your review and grading.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {gradingModal.submission.status === "graded" && gradingModal.submission.score !== undefined && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-900">Already Graded</p>
                      <p className="text-xs text-green-700 mt-1">
                        Current score: {gradingModal.submission.score}/{gradingModal.submission.maxScore} ({Math.round((gradingModal.submission.score / gradingModal.submission.maxScore) * 100)}%)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round((gradingModal.submission.score / gradingModal.submission.maxScore) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {gradingModal.submission.solution && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Solution
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {gradingModal.submission.solution}
                    </p>
                  </div>
                </div>
              )}

              {gradingModal.submission.fileUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Submission File
                  </label>
                  <a
                    href={gradingModal.submission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Icon icon="solar:document-bold" className="w-4 h-4" />
                    View Submission File
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  {gradingModal.submission.status === "pending-review" ? "Enter Score" : "Update Score"} <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  placeholder="Enter score"
                  min="0"
                  max={gradingModal.submission.maxScore}
                  step="0.5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 text-lg font-semibold"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Maximum score: {gradingModal.submission.maxScore}</span>
                  {gradeScore && !isNaN(parseFloat(gradeScore)) && (
                    <span className="font-medium text-emerald-600">
                      {Math.round((parseFloat(gradeScore) / gradingModal.submission.maxScore) * 100)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setGradingModal({ isOpen: false, submission: null });
                  setGradeScore("");
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGradeSubmission}
                disabled={
                  isGrading ||
                  !gradeScore ||
                  parseFloat(gradeScore) < 0 ||
                  parseFloat(gradeScore) > gradingModal.submission.maxScore
                }
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGrading ? (
                  <span className="flex items-center gap-2">
                    <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                    Grading...
                  </span>
                ) : (
                  gradingModal.submission.status === "pending-review" ? "Submit Grade" : "Update Grade"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

