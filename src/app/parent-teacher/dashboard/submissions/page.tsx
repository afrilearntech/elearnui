"use client";

import { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { getParentSubmissions, ParentSubmission } from "@/lib/api/parent-teacher/parent";
import { showErrorToast } from "@/lib/toast";

interface Submission {
  id: string;
  childName: string;
  assessmentTitle: string;
  subject: string;
  submittedAt: string;
  score?: number;
  maxScore: number;
  status: "graded" | "pending-review";
  solution: string;
  attachment: string | null;
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

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
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [summary, setSummary] = useState({ graded: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChild, setSelectedChild] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true);
        const data = await getParentSubmissions();
        
        const mappedSubmissions: Submission[] = data.submissions.map((submission, index) => ({
          id: `${submission.child_name}-${submission.assessment_title}-${index}`,
          childName: submission.child_name,
          assessmentTitle: submission.assessment_title,
          subject: submission.subject || "N/A",
          submittedAt: submission.date_submitted,
          score: submission.score ?? undefined,
          maxScore: submission.assessment_score,
          status: mapSubmissionStatus(submission.submission_status),
          solution: submission.solution.solution,
          attachment: submission.solution.attachment,
        }));

        setSubmissions(mappedSubmissions);
        setSummary(data.summary);
      } catch (error) {
        console.error("Error fetching submissions:", error);
        showErrorToast("Failed to load submissions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const childrenOptions = useMemo(() => {
    const uniqueChildren = Array.from(
      new Set(submissions.map((s) => s.childName))
    ).sort();
    return ["All", ...uniqueChildren];
  }, [submissions]);

  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(
      new Set(submissions.map((s) => s.subject).filter((s) => s !== "N/A"))
    ).sort();
    return ["All", ...uniqueSubjects];
  }, [submissions]);

  const statusOptions = ["All", "Graded", "Pending Review"];

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const matchesSearch =
        search.trim().length === 0 ||
        submission.assessmentTitle
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        submission.childName.toLowerCase().includes(search.toLowerCase()) ||
        submission.subject.toLowerCase().includes(search.toLowerCase());

      const matchesChild =
        selectedChild === "All" || submission.childName === selectedChild;

      const matchesSubject =
        selectedSubject === "All" || submission.subject === selectedSubject;

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Graded" && submission.status === "graded") ||
        (selectedStatus === "Pending Review" &&
          submission.status === "pending-review");

      return matchesSearch && matchesChild && matchesSubject && matchesStatus;
    });
  }, [submissions, search, selectedChild, selectedSubject, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedSubmissions = filteredSubmissions.slice(start, start + pageSize);

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
            <p className="text-gray-600">Loading submissions...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
            <p className="text-gray-600 mt-1">
              Review your children's assessment submissions
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
                <p className="font-semibold text-green-600">{summary.graded}</p>
                <p className="text-gray-600">Graded</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-yellow-600">
                  {summary.pending}
                </p>
                <p className="text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>

          {pagedSubmissions.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="hidden md:grid grid-cols-7 gap-4 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500">
                  <div>Child</div>
                  <div>Assessment</div>
                  <div>Subject</div>
                  <div>Score</div>
                  <div>Status</div>
                  <div>Submitted At</div>
                  <div className="text-right">Actions</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {pagedSubmissions.map((submission) => {
                    const hasScore =
                      submission.status === "graded" &&
                      submission.score !== undefined;
                    const percentage = hasScore
                      ? Math.round(
                          (submission.score as number / submission.maxScore) * 100
                        )
                      : null;

                    return (
                      <div
                        key={submission.id}
                        className="px-4 py-3 flex flex-col gap-2 md:grid md:grid-cols-7 md:items-center md:gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {submission.childName}
                          </p>
                          <p className="text-xs text-gray-500 md:hidden">
                            {submission.subject}
                          </p>
                        </div>
                        <div className="text-sm text-gray-900 font-medium">
                          {submission.assessmentTitle}
                        </div>
                        <div className="hidden md:block text-sm text-gray-700">
                          <span className={submission.subject === "N/A" ? "text-gray-400 italic" : ""}>
                            {submission.subject}
                          </span>
                        </div>
                        <div>
                          {hasScore ? (
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {submission.score}/{submission.maxScore}
                              </p>
                              <p className="text-xs text-gray-600">
                                {percentage}%{" "}
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
                        <div className="text-xs text-gray-500">
                          {formatDateTime(submission.submittedAt)}
                        </div>
                        <div className="flex md:justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Icon
                              icon="solar:eye-bold"
                              className="w-4 h-4 text-gray-500"
                            />
                            View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {start + 1} to{" "}
                    {Math.min(start + pageSize, filteredSubmissions.length)} of{" "}
                    {filteredSubmissions.length} submissions
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
                No submissions found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
                Submission Details
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedSubmission(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                    Child Name
                  </label>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedSubmission.childName}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                    Assessment Title
                  </label>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedSubmission.assessmentTitle}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                    Subject
                  </label>
                  <p className={`text-sm text-gray-900 ${selectedSubmission.subject === "N/A" ? "text-gray-400 italic" : ""}`}>
                    {selectedSubmission.subject}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                    Status
                  </label>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      selectedSubmission.status
                    )}`}
                  >
                    {selectedSubmission.status === "graded"
                      ? "Graded"
                      : "Pending Review"}
                  </span>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                    Score
                  </label>
                  {selectedSubmission.score !== undefined ? (
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedSubmission.score}/{selectedSubmission.maxScore}
                      </p>
                      <p className="text-xs text-gray-600">
                        {Math.round(
                          (selectedSubmission.score / selectedSubmission.maxScore) * 100
                        )}%
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">
                    Submitted At
                  </label>
                  <p className="text-sm text-gray-900">
                    {formatDateTime(selectedSubmission.submittedAt)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 block">
                  Solution
                </label>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {selectedSubmission.solution || "No solution provided."}
                  </p>
                </div>
              </div>

              {selectedSubmission.attachment && (
                <div className="border-t border-gray-200 pt-6">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 block">
                    Attachment
                  </label>
                  <div className="flex items-center gap-3">
                    <a
                      href={selectedSubmission.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      <Icon icon="solar:download-bold" className="w-4 h-4" />
                      View Attachment
                    </a>
                    {selectedSubmission.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                      <div className="flex-1">
                        <img
                          src={selectedSubmission.attachment}
                          alt="Submission attachment"
                          className="max-w-full max-h-48 rounded-lg border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedSubmission(null);
                }}
                className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


