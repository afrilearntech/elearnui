"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { getAssessments, AssessmentRecord } from "@/lib/api/content/assessments";
import { moderateContent, ModerateAction } from "@/lib/api/content/lessons";

type AssessmentRow = {
  id: string;
  title: string;
  type: string;
  kind: "general" | "lesson";
  grade: string;
  marks: number;
  dueDate: string;
  dueDateFormatted: string;
  creator: string;
  creatorId: number;
  status: "REJECTED" | "VALIDATED" | "PENDING" | "REQUEST_CHANGES";
  lessonId?: number;
  lessonTitle?: string;
  subjectId?: number;
  subjectName?: string;
  moderation_comment?: string | null;
};

const statusMap: Record<string, AssessmentRow["status"]> = {
  APPROVED: "VALIDATED",
  VALIDATED: "VALIDATED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  REVIEW_REQUESTED: "REQUEST_CHANGES",
  REQUEST_CHANGES: "REQUEST_CHANGES",
};

function normalizeStatus(value?: string | null): AssessmentRow["status"] {
  if (!value) return "PENDING";
  const upper = value.toUpperCase();
  return statusMap[upper] ?? (["VALIDATED", "REJECTED", "PENDING", "REQUEST_CHANGES"].includes(upper) ? (upper as AssessmentRow["status"]) : "PENDING");
}

function mapAssessment(record: AssessmentRecord): AssessmentRow {
  const status = normalizeStatus(record.status);
  const dueDate = record.due_at ? new Date(record.due_at) : null;
  const dueDateFormatted = dueDate
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(dueDate)
    : "No due date";

  return {
    id: record.id.toString(),
    title: record.title,
    type: record.type,
    kind: record.kind,
    grade: record.grade || "Grade -",
    marks: record.marks,
    dueDate: record.due_at,
    dueDateFormatted,
    creator: record.given_by_id ? `Creator ${record.given_by_id}` : "Unknown Creator",
    creatorId: record.given_by_id,
    status,
    lessonId: record.lesson_id,
    lessonTitle: record.lesson_title,
    subjectId: record.subject_id,
    subjectName: record.subject_name,
    moderation_comment: record.moderation_comment,
  };
}

async function notifyError(message: string) {
  if (typeof window !== "undefined") {
    const { showErrorToast } = await import("@/lib/toast");
    showErrorToast(message);
  } else {
    console.error(message);
  }
}

async function notifySuccess(message: string) {
  if (typeof window !== "undefined") {
    const { showSuccessToast } = await import("@/lib/toast");
    showSuccessToast(message);
  }
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = React.useState<AssessmentRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [kindFilter, setKindFilter] = React.useState("All");
  const [gradeFilter, setGradeFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalAssessment, setModalAssessment] = React.useState<AssessmentRow | null>(null);
  const [isModerationModalOpen, setIsModerationModalOpen] = React.useState(false);
  const [moderationComment, setModerationComment] = React.useState("");
  const [moderationFormError, setModerationFormError] = React.useState<string | null>(null);
  const [pendingModerationAction, setPendingModerationAction] = React.useState<ModerateAction | null>(null);
  const [moderationLoadingAction, setModerationLoadingAction] = React.useState<ModerateAction | null>(null);
  const isModerationProcessing = moderationLoadingAction !== null;

  const fetchAssessments = React.useCallback(async (showLoading = true, updateModal = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
        setLoadError(null);
      }

      if (typeof window === "undefined") return;

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setLoadError("Missing authentication token. Please sign in again.");
        return;
      }

      const data = await getAssessments(token);
      const mappedAssessments = data.map(mapAssessment);
      setAssessments(mappedAssessments);

      if (updateModal) {
        setModalAssessment((prev) => {
          if (!prev) return prev;
          const updatedAssessment = mappedAssessments.find((a) => a.id === prev.id);
          return updatedAssessment || prev;
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load assessments.";
      setLoadError(message);
      await notifyError(message);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const kindOptions = React.useMemo(() => {
    const options = new Set<string>();
    assessments.forEach((assessment) => {
      if (assessment.kind) {
        options.add(assessment.kind);
      }
    });
    return Array.from(options);
  }, [assessments]);

  const gradeOptions = React.useMemo(() => {
    const options = new Set<string>();
    assessments.forEach((assessment) => {
      if (assessment.grade && assessment.grade !== "Grade -" && assessment.grade.trim().length > 0) {
        options.add(assessment.grade);
      }
    });
    return Array.from(options);
  }, [assessments]);

  const filtered = React.useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesSearch = search.trim().length === 0 || assessment.title.toLowerCase().includes(search.toLowerCase());
      const matchesKind = kindFilter === "All" || assessment.kind === kindFilter;
      const matchesGrade = gradeFilter === "All" || assessment.grade === gradeFilter;
      const matchesStatus = statusFilter === "All" || assessment.status === statusFilter;
      return matchesSearch && matchesKind && matchesGrade && matchesStatus;
    });
  }, [assessments, search, kindFilter, gradeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [search, kindFilter, gradeFilter, statusFilter]);

  const getStatusBadge = (state: AssessmentRow["status"]) => {
    switch (state) {
      case "VALIDATED":
        return "bg-emerald-100 text-emerald-700";
      case "REJECTED":
        return "bg-rose-100 text-rose-700";
      case "PENDING":
        return "bg-amber-100 text-amber-700";
      case "REQUEST_CHANGES":
        return "bg-indigo-100 text-indigo-700";
    }
  };

  const renderStatusLabel = (state: AssessmentRow["status"]) => {
    if (state === "VALIDATED") return "Validated";
    if (state === "REJECTED") return "Rejected";
    if (state === "REQUEST_CHANGES") return "Revision Requested";
    return "Pending";
  };

  const handleReview = React.useCallback((assessment: AssessmentRow) => {
    setModalAssessment(assessment);
    setIsModalOpen(true);
    setIsModerationModalOpen(false);
    setModerationComment("");
    setModerationFormError(null);
    setPendingModerationAction(null);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsModalOpen(false);
    setModalAssessment(null);
    setIsModerationModalOpen(false);
    setModerationComment("");
    setModerationFormError(null);
    setPendingModerationAction(null);
  }, []);

  const updateAssessmentStatusInState = React.useCallback(
    (assessmentId: number, status: AssessmentRow["status"], moderationComment?: string | null) => {
      const assessmentIdString = String(assessmentId);
      setAssessments((prev) =>
        prev.map((assessment) =>
          assessment.id === assessmentIdString
            ? { ...assessment, status, moderation_comment: moderationComment ?? assessment.moderation_comment }
            : assessment,
        ),
      );
      setModalAssessment((prev) => {
        if (!prev) return prev;
        if (prev.id === assessmentIdString) {
          return { ...prev, status, moderation_comment: moderationComment ?? prev.moderation_comment };
        }
        return prev;
      });
    },
    [],
  );

  const submitModeration = React.useCallback(
    async (action: ModerateAction, comment?: string) => {
      if (!modalAssessment) return;
      if (typeof window === "undefined") return;

      const assessmentId = typeof modalAssessment.id === "string" ? parseInt(modalAssessment.id, 10) : modalAssessment.id;
      if (!assessmentId || Number.isNaN(assessmentId)) {
        await notifyError("Invalid assessment identifier.");
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        await notifyError("Missing authentication token. Please sign in again.");
        return;
      }

      const modelType = modalAssessment.kind === "general" ? "general_assessment" : "lesson_assessment";

      setModerationLoadingAction(action);
      try {
        const response = await moderateContent(
          {
            model: modelType,
            id: assessmentId,
            action,
            ...(comment ? { moderation_comment: comment } : {}),
          },
          token,
        );
        const normalizedStatus = normalizeStatus(response.status);
        const updatedComment = response.moderation_comment ?? comment ?? null;
        updateAssessmentStatusInState(response.id, normalizedStatus, updatedComment);

        await fetchAssessments(false, true);

        const successMessage =
          action === "approve"
            ? "Assessment approved successfully."
            : action === "reject"
            ? "Assessment rejected."
            : "Revision request submitted.";
        await notifySuccess(successMessage);

        if (action === "request_changes") {
          setIsModerationModalOpen(false);
          setModerationComment("");
          setModerationFormError(null);
          setPendingModerationAction(null);
          closeModal();
        } else if (action === "approve") {
          closeModal();
        } else if (action === "reject") {
          closeModal();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to complete moderation action.";
        await notifyError(message);
      } finally {
        setModerationLoadingAction(null);
      }
    },
    [modalAssessment, updateAssessmentStatusInState, closeModal, fetchAssessments],
  );

  const showModerationActions = modalAssessment?.status === "PENDING";

  const handleModerationAction = React.useCallback(
    (action: ModerateAction) => {
      if (!modalAssessment || !showModerationActions) return;
      if (action === "request_changes") {
        setPendingModerationAction(action);
        setModerationComment("");
        setModerationFormError(null);
        setIsModerationModalOpen(true);
        return;
      }
      submitModeration(action);
    },
    [modalAssessment, showModerationActions, submitModeration],
  );

  const handleModerationModalSubmit = async () => {
    if (!pendingModerationAction) return;
    if (moderationComment.trim().length === 0) {
      setModerationFormError("Moderation comment is required.");
      return;
    }
    setModerationFormError(null);
    await submitModeration(pendingModerationAction, moderationComment.trim());
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:flex-1">
          <input
            type="text"
            placeholder="search by assessment title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 sm:max-w-md text-gray-900 placeholder:text-gray-400"
          />
          <div className="grid w-full gap-3 sm:grid-cols-3">
            <select
              className="min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
            >
              <option>Kind</option>
              <option>All</option>
              {kindOptions.map((k) => (
                <option key={k} value={k}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </option>
              ))}
            </select>
            <select
              className="min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
            >
              <option>Grade</option>
              <option>All</option>
              {gradeOptions.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <select
              className="min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Status</option>
              <option>All</option>
              <option value="PENDING">Pending</option>
              <option value="VALIDATED">Validated</option>
              <option value="REJECTED">Rejected</option>
              <option value="REQUEST_CHANGES">Revision Requested</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-200">
        <button className="relative border-b-2 border-emerald-600 pb-2 px-1">
          <span className="text-sm font-medium text-gray-900">Assessments</span>
          <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">{filtered.length}</span>
        </button>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <div className="min-w-full">
          <div className="grid grid-cols-12 bg-[#F1F7E4] px-5 py-4 text-sm font-semibold text-gray-800">
            <div className="col-span-3">Title</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-1">Kind</div>
            <div className="col-span-1">Grade</div>
            <div className="col-span-1">Marks</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {isLoading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-600">Loading assessments...</div>
          ) : loadError ? (
            <div className="px-5 py-8 text-center text-sm text-rose-600">{loadError}</div>
          ) : paged.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-600">No assessments match your filters.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paged.map((assessment) => (
                <div key={assessment.id} className="grid grid-cols-12 items-center px-5 py-4 text-sm hover:bg-gray-50">
                  <div className="col-span-3 text-gray-900 font-medium">{assessment.title}</div>
                  <div className="col-span-1 text-gray-700">{assessment.type}</div>
                  <div className="col-span-1 text-gray-700 capitalize">{assessment.kind}</div>
                  <div className="col-span-1 text-gray-700">{assessment.grade}</div>
                  <div className="col-span-1 text-gray-700">{assessment.marks}</div>
                  <div className="col-span-2 text-gray-700">{assessment.dueDateFormatted}</div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap ${getStatusBadge(assessment.status)}`}>
                      {renderStatusLabel(assessment.status)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-end">
                    <button
                      className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                      onClick={() => handleReview(assessment)}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">Loading assessments...</div>
        ) : loadError ? (
          <div className="rounded-xl border border-rose-200 bg-white p-6 text-center text-sm text-rose-600">{loadError}</div>
        ) : paged.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-600">
            No assessments match your filters.
          </div>
        ) : (
          paged.map((assessment) => (
            <div key={assessment.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900">{assessment.title}</p>
                  <p className="text-xs text-gray-500">{assessment.dueDateFormatted}</p>
                </div>
                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap ${getStatusBadge(assessment.status)}`}>
                  {renderStatusLabel(assessment.status)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <p className="text-xs uppercase text-gray-400">Type</p>
                  <p>{assessment.type}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Kind</p>
                  <p className="capitalize">{assessment.kind}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Grade</p>
                  <p>{assessment.grade}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Marks</p>
                  <p>{assessment.marks}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                  onClick={() => handleReview(assessment)}
                >
                  Review
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            currentPage === 1
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          &lt;
        </button>
        {Array.from({ length: Math.min(totalPages, 10) }).map((_, i) => {
          const n = i + 1;
          const active = n === currentPage;
          if (totalPages > 10 && i === 8) {
            return (
              <React.Fragment key="ellipsis">
                <span className="px-2 text-gray-500">...</span>
                <button
                  onClick={() => setPage(totalPages)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    totalPages === currentPage
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {totalPages}
                </button>
              </React.Fragment>
            );
          }
          if (totalPages > 10 && i > 8) return null;
          return (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {n}
            </button>
          );
        })}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
            currentPage === totalPages
              ? "border-gray-200 text-gray-300 cursor-not-allowed"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          &gt;
        </button>
      </div>

      {isModalOpen ? (
        <div
          className="fixed inset-0 z-120 flex items-start justify-center overflow-y-auto bg-black/60 py-10 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600 uppercase">Preview of the assessment</p>
                <p className="text-xs text-gray-500">Review all information before approving or requesting revisions</p>
              </div>
              <button
                aria-label="Close"
                onClick={closeModal}
                className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="max-h-[80vh] overflow-y-auto p-6">
              {modalAssessment ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">{modalAssessment.title}</h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1 text-emerald-700">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 10v6M2 10l10-5 10 5M2 10l10 5M2 10v6c0 1.1.9 2 2 2h4M22 10l-10 5M22 10v6c0 1.1-.9 2-2 2h-4M6 21h12" />
                        </svg>
                        {modalAssessment.grade}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-3 py-1 text-sky-700">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        {modalAssessment.type}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-3 py-1 text-purple-700 capitalize">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {modalAssessment.kind}
                      </span>
                    </div>
                  </div>

                  <section className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase text-gray-400">Marks</p>
                      <p className="text-sm font-semibold text-gray-800">{modalAssessment.marks}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Due Date</p>
                      <p className="text-sm font-semibold text-gray-800">{modalAssessment.dueDateFormatted}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Status</p>
                      <span className={`mt-1 inline-flex rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusBadge(modalAssessment.status)}`}>
                        {renderStatusLabel(modalAssessment.status)}
                      </span>
                    </div>
                  </section>

                  {modalAssessment.kind === "lesson" && (modalAssessment.lessonTitle || modalAssessment.subjectName) ? (
                    <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Lesson Information</h3>
                      <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                        {modalAssessment.lessonTitle ? (
                          <div>
                            <p className="text-xs uppercase text-gray-400">Lesson Title</p>
                            <p className="font-medium">{modalAssessment.lessonTitle}</p>
                          </div>
                        ) : null}
                        {modalAssessment.subjectName ? (
                          <div>
                            <p className="text-xs uppercase text-gray-400">Subject</p>
                            <p className="font-medium">{modalAssessment.subjectName}</p>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  <section className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Assessment Details</h3>
                    <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase text-gray-400">Creator</p>
                        <p>{modalAssessment.creator}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">Kind</p>
                        <p className="capitalize">{modalAssessment.kind}</p>
                      </div>
                    </div>
                  </section>

                  {modalAssessment.moderation_comment ? (
                    <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <h3 className="text-sm font-semibold text-amber-900">Moderator Comment</h3>
                      <p className="mt-2 text-sm text-amber-900">{modalAssessment.moderation_comment}</p>
                    </section>
                  ) : null}
                </div>
              ) : (
                <div className="py-16 text-center text-sm text-gray-600">No assessment selected.</div>
              )}
            </div>
            {showModerationActions ? (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isModerationProcessing}
                >
                  Close
                </button>
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-lg bg-rose-100 px-5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleModerationAction("reject")}
                    disabled={isModerationProcessing && moderationLoadingAction === "reject"}
                  >
                    {moderationLoadingAction === "reject" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-700 border-t-transparent" />
                        Declining...
                      </span>
                    ) : (
                      "Decline Assessment"
                    )}
                  </button>
                  <button
                    className="rounded-lg bg-indigo-100 px-5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleModerationAction("request_changes")}
                    disabled={isModerationProcessing && moderationLoadingAction === "request_changes"}
                  >
                    {moderationLoadingAction === "request_changes" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-700 border-t-transparent" />
                        Sending...
                      </span>
                    ) : (
                      "Request Revision"
                    )}
                  </button>
                  <button
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleModerationAction("approve")}
                    disabled={isModerationProcessing && moderationLoadingAction === "approve"}
                  >
                    {moderationLoadingAction === "approve" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Approving...
                      </span>
                    ) : (
                      "Approve Assessment"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            )}

            {showModerationActions && isModerationModalOpen ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 px-4 py-6 backdrop-blur-[1px]">
                <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Request Revisions</h4>
                      <p className="text-sm text-gray-500">Tell the creator what needs to change.</p>
                    </div>
                    <button
                      aria-label="Close moderation modal"
                      onClick={() => {
                        setIsModerationModalOpen(false);
                        setModerationComment("");
                        setModerationFormError(null);
                        setPendingModerationAction(null);
                      }}
                      className="rounded-full p-1 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isModerationProcessing}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-800">
                        Moderation Comment<span className="text-rose-600">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={moderationComment}
                        onChange={(event) => setModerationComment(event.target.value)}
                        className={`mt-1 w-full rounded-xl border px-4 py-3 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 ${
                          moderationFormError ? "border-rose-400" : "border-gray-200"
                        }`}
                        placeholder="Describe the changes needed..."
                        disabled={isModerationProcessing}
                      />
                      {moderationFormError ? (
                        <p className="mt-1 text-xs text-rose-600">{moderationFormError}</p>
                      ) : null}
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => {
                          setIsModerationModalOpen(false);
                          setModerationComment("");
                          setModerationFormError(null);
                          setPendingModerationAction(null);
                        }}
                        disabled={moderationLoadingAction === "request_changes"}
                      >
                        Cancel
                      </button>
                      <button
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={handleModerationModalSubmit}
                        disabled={moderationLoadingAction === "request_changes"}
                      >
                        {moderationLoadingAction === "request_changes" ? (
                          <span className="flex items-center gap-2">
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Sending...
                          </span>
                        ) : (
                          "Send Request"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
