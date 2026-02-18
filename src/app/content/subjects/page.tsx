"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { getSubjects, deleteSubject, SubjectRecord } from "@/lib/api/content/subjects";
import { moderateContent, ModerateAction } from "@/lib/api/content/lessons";
import SubjectsHeader from "@/components/content/subjects/SubjectsHeader";
import SubjectCard, { SubjectStatus } from "@/components/content/subjects/SubjectCard";
import AssignSubjectToTeacherModal from "@/components/content/subjects/AssignSubjectToTeacherModal";

type SubjectRow = {
  id: string;
  name: string;
  grade: string;
  creator: string;
  creatorId: number | null;
  date: string;
  status: "REJECTED" | "VALIDATED" | "PENDING" | "REQUEST_CHANGES" | "DRAFT";
  description: string;
  thumbnail: string | null;
  moderation_comment: string | null;
  objective_items: { id: number; text: string }[];
  created_at: string;
  lessonsCount: number;
};

type StatusFilterOption = "All" | "Published" | "Draft" | "Pending" | "Rejected";
const STATUS_FILTER_OPTIONS: StatusFilterOption[] = ["All", "Published", "Draft", "Pending", "Rejected"];

const statusMap: Record<string, SubjectRow["status"]> = {
  APPROVED: "VALIDATED",
  VALIDATED: "VALIDATED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  REVIEW_REQUESTED: "REQUEST_CHANGES",
  REQUEST_CHANGES: "REQUEST_CHANGES",
  DRAFT: "DRAFT",
};

function normalizeStatus(value?: string | null): SubjectRow["status"] {
  if (!value) return "PENDING";
  const trimmed = String(value).trim();
  if (!trimmed) return "PENDING";
  const upper = trimmed.toUpperCase();
  
  if (statusMap[upper]) {
    return statusMap[upper];
  }
  
  if (["VALIDATED", "REJECTED", "PENDING", "REQUEST_CHANGES", "DRAFT"].includes(upper)) {
    return upper as SubjectRow["status"];
  }
  
  if (upper.includes("PENDING") || upper === "PEND") {
    return "PENDING";
  }
  
  if (upper.includes("DRAFT")) {
    return "DRAFT";
  }
  
  return "PENDING";
}

function getLessonsCount(record: SubjectRecord): number {
  if (typeof record.lessons_count === "number") {
    return record.lessons_count;
  }
  if (Array.isArray(record.teachers)) {
    return record.teachers.length;
  }
  if (typeof record.teachers === "number") {
    return record.teachers;
  }
  return record.objective_items?.length ?? 0;
}

function mapSubject(record: SubjectRecord): SubjectRow {
  const status = normalizeStatus(record.status);
  const formattedDate = record.created_at
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(record.created_at))
    : "";

  return {
    id: record.id.toString(),
    name: record.name,
    grade: record.grade || "Grade -",
    creator: record.created_by ? `Creator ${record.created_by}` : "Unknown Creator",
    creatorId: record.created_by ?? null,
    date: formattedDate,
    status,
    description: record.description || "No description available for this subject.",
    thumbnail: record.thumbnail,
    moderation_comment: record.moderation_comment,
    objective_items: record.objective_items || [],
    created_at: record.created_at,
    lessonsCount: getLessonsCount(record),
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

export default function SubjectsPage() {
  const router = useRouter();
  const [userRole, setUserRole] = React.useState<string>("CONTENTCREATOR");
  const [subjects, setSubjects] = React.useState<SubjectRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [subjectFilter, setSubjectFilter] = React.useState("All");
  const [gradeFilter, setGradeFilter] = React.useState("All");
  const [creatorFilter, setCreatorFilter] = React.useState("All");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterOption>("All");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalSubject, setModalSubject] = React.useState<SubjectRow | null>(null);
  const [isModerationModalOpen, setIsModerationModalOpen] = React.useState(false);
  const [moderationComment, setModerationComment] = React.useState("");
  const [moderationFormError, setModerationFormError] = React.useState<string | null>(null);
  const [pendingModerationAction, setPendingModerationAction] = React.useState<ModerateAction | null>(null);
  const [moderationLoadingAction, setModerationLoadingAction] = React.useState<ModerateAction | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<SubjectRow | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const isModerationProcessing = moderationLoadingAction !== null;
  const isValidator = userRole === "CONTENTVALIDATOR";
  const handleCreatorStatusChange = React.useCallback(
    (value: string) => {
      if (isValidStatusFilterValue(value)) {
        setStatusFilter(value);
      } else {
        setStatusFilter("All");
      }
    },
    [],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      setUserRole(user.role || "CONTENTCREATOR");
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    async function fetchSubjects() {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (typeof window === "undefined") return;

        const token = localStorage.getItem("auth_token");
        if (!token) {
          setLoadError("Missing authentication token. Please sign in again.");
          return;
        }

        const data = await getSubjects(token);
        if (!isMounted) return;

        setSubjects(data.map(mapSubject));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load subjects.";
        setLoadError(message);
        await notifyError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchSubjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const subjectOptions = React.useMemo(() => {
    const options = new Set<string>();
    subjects.forEach((subject) => {
      if (subject.name && subject.name.trim().length > 0) {
        options.add(subject.name);
      }
    });
    return Array.from(options);
  }, [subjects]);

  const gradeOptions = React.useMemo(() => {
    const options = new Set<string>();
    subjects.forEach((subject) => {
      if (subject.grade && subject.grade !== "Grade -" && subject.grade.trim().length > 0) {
        options.add(subject.grade);
      }
    });
    return Array.from(options);
  }, [subjects]);

  const creatorOptions = React.useMemo(() => {
    const options = new Set<string>();
    subjects.forEach((subject) => {
      if (subject.creator && subject.creator !== "Unknown Creator" && subject.creator.trim().length > 0) {
        options.add(subject.creator);
      }
    });
    return Array.from(options);
  }, [subjects]);

  const filtered = React.useMemo(() => {
    return subjects.filter((subject) => {
      const matchesSearch = search.trim().length === 0 || subject.name.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = subjectFilter === "All" || subject.name === subjectFilter;
      const matchesGrade = gradeFilter === "All" || subject.grade === gradeFilter;
      const matchesCreator = creatorFilter === "All" || subject.creator === creatorFilter;
      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Published" && subject.status === "VALIDATED") ||
        (statusFilter === "Draft" && subject.status === "DRAFT") ||
        (statusFilter === "Pending" && (subject.status === "PENDING" || subject.status === "REQUEST_CHANGES")) ||
        (statusFilter === "Rejected" && subject.status === "REJECTED");
      return matchesSearch && matchesSubject && matchesGrade && matchesCreator && matchesStatus;
    });
  }, [subjects, search, subjectFilter, gradeFilter, creatorFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [search, subjectFilter, gradeFilter, creatorFilter, statusFilter]);

  const getStatusBadge = (state: SubjectRow["status"]) => {
    switch (state) {
      case "VALIDATED":
        return "bg-emerald-100 text-emerald-700";
      case "REJECTED":
        return "bg-rose-100 text-rose-700";
      case "PENDING":
        return "bg-amber-100 text-amber-700";
      case "REQUEST_CHANGES":
        return "bg-indigo-100 text-indigo-700";
      case "DRAFT":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const renderStatusLabel = (state: SubjectRow["status"]) => {
    switch (state) {
      case "VALIDATED":
        return "Validated";
      case "REJECTED":
        return "Rejected";
      case "REQUEST_CHANGES":
        return "Revision Requested";
      case "DRAFT":
        return "Draft";
      case "PENDING":
      default:
        return "Pending";
    }
  };

  const handleReview = React.useCallback((subject: SubjectRow) => {
    setModalSubject(subject);
    setIsModalOpen(true);
    setIsModerationModalOpen(false);
    setModerationComment("");
    setModerationFormError(null);
    setPendingModerationAction(null);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsModalOpen(false);
    setModalSubject(null);
    setIsModerationModalOpen(false);
    setModerationComment("");
    setModerationFormError(null);
    setPendingModerationAction(null);
  }, []);

  const updateSubjectStatusInState = React.useCallback(
    (subjectId: number, status: SubjectRow["status"], moderationComment?: string | null) => {
      const subjectIdString = String(subjectId);
      setSubjects((prev) =>
        prev.map((subject) =>
          subject.id === subjectIdString ? { ...subject, status, moderation_comment: moderationComment ?? subject.moderation_comment } : subject,
        ),
      );
      setModalSubject((prev) => {
        if (!prev) return prev;
        if (prev.id === subjectIdString) {
          return { ...prev, status, moderation_comment: moderationComment ?? prev.moderation_comment };
        }
        return prev;
      });
    },
    [],
  );

  const submitModeration = React.useCallback(
    async (action: ModerateAction, comment?: string) => {
      if (!modalSubject) return;
      if (typeof window === "undefined") return;

      const subjectId = typeof modalSubject.id === "string" ? parseInt(modalSubject.id, 10) : modalSubject.id;
      if (!subjectId || Number.isNaN(subjectId)) {
        await notifyError("Invalid subject identifier.");
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        await notifyError("Missing authentication token. Please sign in again.");
        return;
      }

      setModerationLoadingAction(action);
      try {
        const response = await moderateContent(
          {
            model: "subject",
            id: subjectId,
            action,
            ...(comment ? { moderation_comment: comment } : {}),
          },
          token,
        );
        const normalizedStatus = normalizeStatus(response.status);
        const updatedComment = response.moderation_comment ?? comment ?? null;
        updateSubjectStatusInState(response.id, normalizedStatus, updatedComment);

        const successMessage =
          action === "approve"
            ? "Subject approved successfully."
            : action === "reject"
            ? "Subject rejected."
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
          router.push("/content/subjects");
          router.refresh();
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
    [modalSubject, updateSubjectStatusInState, closeModal, router],
  );

  const showModerationActions = modalSubject?.status === "PENDING";

  const handleModerationAction = React.useCallback(
    (action: ModerateAction) => {
      if (!modalSubject || !showModerationActions) return;
      if (action === "request_changes") {
        setPendingModerationAction(action);
        setModerationComment("");
        setModerationFormError(null);
        setIsModerationModalOpen(true);
        return;
      }
      submitModeration(action);
    },
    [modalSubject, showModerationActions, submitModeration],
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

  const getModalThumbnail = (subject: SubjectRow | null): string | null => {
    if (!subject || !subject.thumbnail) return null;
    return subject.thumbnail;
  };

  const getSubjectType = (subjectName: string): string => {
    const lower = subjectName.toLowerCase();
    if (lower.includes("literacy") || lower.includes("english") || lower.includes("language")) return "Literacy";
    if (lower.includes("numeracy") || lower.includes("math")) return "Mathematics";
    if (lower.includes("science")) return "Science";
    return "General";
  };

const getCreatorCardStatus = (state: SubjectRow["status"]): SubjectStatus => {
  switch (state) {
    case "VALIDATED":
      return "APPROVED";
    case "DRAFT":
      return "DRAFT";
    case "REJECTED":
      return "REJECTED";
    case "REQUEST_CHANGES":
    case "PENDING":
    default:
      return "PENDING";
  }
};

const isValidStatusFilterValue = (value: string): value is StatusFilterOption => {
  return STATUS_FILTER_OPTIONS.includes(value as StatusFilterOption);
};

  const handleDeleteSubject = React.useCallback(async () => {
    if (!deleteTarget) return;
    const token = localStorage.getItem("auth_token");
    if (!token) {
      await notifyError("Missing authentication token. Please sign in again.");
      return;
    }

    const subjectId = parseInt(deleteTarget.id, 10);
    if (!subjectId || Number.isNaN(subjectId)) {
      await notifyError("Invalid subject identifier.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSubject(subjectId, token);
      setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      await notifySuccess("Subject deleted successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete subject.";
      await notifyError(message);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  if (!isValidator) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
            <p className="mt-0.5 text-sm text-gray-500">Create and manage your subjects</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gray-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              <Icon icon="solar:user-check-rounded-bold" className="w-5 h-5" />
              Assign to Teacher
            </button>
            <Link
              href="/content/subjects/create"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create Subject
            </Link>
          </div>
        </div>

        {/* Filters */}
        <SubjectsHeader
          onSearch={(value) => setSearch(value)}
          grade={gradeFilter}
          status={statusFilter}
          onGradeChange={(value) => setGradeFilter(value)}
          onStatusChange={handleCreatorStatusChange}
        />

        {/* Results count */}
        {!isLoading && !loadError && filtered.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{filtered.length}</span> {filtered.length === 1 ? "subject" : "subjects"}
            </p>
          </div>
        )}

        {/* Cards */}
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="h-44 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-rose-400">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="mt-3 text-sm font-medium text-rose-700">{loadError}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <h3 className="mt-4 text-sm font-semibold text-gray-900">No subjects found</h3>
            <p className="mt-1 text-sm text-gray-500">Create a new one to get started.</p>
            <Link
              href="/content/subjects/create"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create Subject
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((subject) => (
              <div
                key={subject.id}
                role="button"
                tabIndex={0}
                onClick={() => handleReview(subject)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleReview(subject); }}
                className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-xl"
              >
                <SubjectCard
                  title={subject.name}
                  grade={subject.grade}
                  lessonsCount={subject.lessonsCount}
                  imageSrc={subject.thumbnail}
                  status={getCreatorCardStatus(subject.status)}
                  onDelete={() => setDeleteTarget(subject)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal (Creator) */}
        {deleteTarget ? (
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4"
            onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) setDeleteTarget(null); }}
          >
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Delete Subject</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteTarget.name}</span>? This action cannot be undone.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubject}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <AssignSubjectToTeacherModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Subject</h1>

      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:flex-1">
          <input
            type="text"
            placeholder="search by subject title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 sm:max-w-md text-gray-900 placeholder:text-gray-400"
          />
          <div className="grid w-full gap-3 sm:grid-cols-3">
            <select
              className="min-w-[140px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option>Subject</option>
              <option>All</option>
              {subjectOptions.map((s) => (
                <option key={s}>{s}</option>
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
              value={creatorFilter}
              onChange={(e) => setCreatorFilter(e.target.value)}
            >
              <option>Creator</option>
              <option>All</option>
              {creatorOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-gray-200">
        <button className="relative border-b-2 border-emerald-600 pb-2 px-1">
          <span className="text-sm font-medium text-gray-900">Subjects</span>
          <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">{filtered.length}</span>
        </button>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <div className="min-w-full">
          <div className="grid grid-cols-12 bg-[#F1F7E4] px-5 py-4 text-sm font-semibold text-gray-800">
            <div className="col-span-4">Subject Title</div>
            <div className="col-span-2">Grade Level</div>
            <div className="col-span-2">Creator</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-3 text-right">Actions</div>
          </div>
          {isLoading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-600">Loading subjects...</div>
          ) : loadError ? (
            <div className="px-5 py-8 text-center text-sm text-rose-600">{loadError}</div>
          ) : paged.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-600">No subjects match your filters.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {paged.map((s) => (
                <div key={s.id} className="grid grid-cols-12 items-center px-5 py-4 text-sm hover:bg-gray-50">
                  <div className="col-span-4 text-gray-900 font-medium">{s.name}</div>
                  <div className="col-span-2 text-gray-700">{s.grade}</div>
                  <div className="col-span-2 text-gray-700">{s.creator}</div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap ${getStatusBadge(s.status)}`}>
                      {renderStatusLabel(s.status)}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center justify-end">
                    <button
                      className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                      onClick={() => handleReview(s)}
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
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">Loading subjects...</div>
        ) : loadError ? (
          <div className="rounded-xl border border-rose-200 bg-white p-6 text-center text-sm text-rose-600">{loadError}</div>
        ) : paged.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center text-sm text-gray-600">
            No subjects match your filters.
          </div>
        ) : (
          paged.map((s) => (
            <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.date}</p>
                </div>
                <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap ${getStatusBadge(s.status)}`}>
                  {renderStatusLabel(s.status)}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                <div>
                  <p className="text-xs uppercase text-gray-400">Grade Level</p>
                  <p>{s.grade}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-400">Creator</p>
                  <p>{s.creator}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                  onClick={() => handleReview(s)}
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
                <p className="text-sm font-semibold text-emerald-600 uppercase">Preview of the created subject</p>
                <p className="text-xs text-gray-500">This is how your subject will appear to students. Review all details before publishing.</p>
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
              {modalSubject ? (
                <>
                  {getModalThumbnail(modalSubject) ? (
                    <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl bg-gray-100">
                      <Image
                        src={getModalThumbnail(modalSubject)!}
                        alt={modalSubject?.name || "Subject preview"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 900px"
                        priority
                        unoptimized={getModalThumbnail(modalSubject)?.startsWith("http") || false}
                      />
                    </div>
                  ) : null}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">{modalSubject?.name || "Subject Title"}</h2>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1 text-emerald-700">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5M2 10l10 5M2 10v6c0 1.1.9 2 2 2h4M22 10l-10 5M22 10v6c0 1.1-.9 2-2 2h-4M6 21h12" />
                          </svg>
                          {modalSubject?.grade || "Grade -"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-3 py-1 text-sky-700">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                          </svg>
                          {getSubjectType(modalSubject?.name || "")}
                        </span>
                      </div>
                    </div>

                    <section>
                      <h3 className="text-lg font-semibold text-gray-900">Subject Description</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-700">{modalSubject?.description || "No description provided for this subject."}</p>
                    </section>

                    {modalSubject?.objective_items && modalSubject.objective_items.length > 0 ? (
                      <section>
                        <h3 className="text-lg font-semibold text-gray-900">Learning Objectives</h3>
                        <ul className="mt-3 space-y-2">
                          {modalSubject.objective_items.map((item) => (
                            <li key={item.id} className="flex items-start gap-3 text-sm text-gray-700">
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                {item.id}
                              </span>
                              <span className="flex-1">{item.text}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}

                    {modalSubject?.status === "REQUEST_CHANGES" && modalSubject?.moderation_comment ? (
                      <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            Requested Review
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-amber-900 mb-1">Moderator Comment</h3>
                        <p className="mt-2 text-sm text-amber-800">{modalSubject.moderation_comment}</p>
                      </section>
                    ) : modalSubject?.moderation_comment ? (
                      <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <h3 className="text-sm font-semibold text-amber-900">Moderator Comment</h3>
                        <p className="mt-2 text-sm text-amber-900">{modalSubject.moderation_comment}</p>
                      </section>
                    ) : null}

                    <section className="grid gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase text-gray-400">Status</p>
                        <span className={`mt-1 inline-flex rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusBadge(modalSubject.status)}`}>
                          {renderStatusLabel(modalSubject.status)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">Created On</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {modalSubject.created_at
                            ? new Date(modalSubject.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
                            : "Unknown"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">Creator</p>
                        <p className="text-sm font-semibold text-gray-800">{modalSubject.creator}</p>
                      </div>
                    </section>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-sm text-gray-600">No subject selected.</div>
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
                      "Decline Subject"
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
                      "Approve Subject"
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
                {!isValidator && modalSubject && modalSubject.status === "REQUEST_CHANGES" ? (
                  <Link
                    href={`/content/subjects/create?edit=${modalSubject.id}`}
                    className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Edit Subject
                  </Link>
                ) : null}
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

      {/* Assign Subject to Teacher Modal */}
      <AssignSubjectToTeacherModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSuccess={() => {
          // Optionally refresh subjects if needed
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget ? (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => { if (e.target === e.currentTarget && !isDeleting) setDeleteTarget(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Delete Subject</h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteTarget.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubject}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
