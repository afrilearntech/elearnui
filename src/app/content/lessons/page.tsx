"use client";
import LessonsHeader from "@/components/content/lessons/LessonsHeader";
import {
  getLessons,
  deleteLesson,
  LessonRecord,
  moderateContent,
  ModerateAction,
} from "@/lib/api/content/lessons";
import { createLessonAssessment as createContentLessonAssessment } from "@/lib/api/content/assessments";
import Image from "@/components/images/SafeImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

type LessonRow = {
  id: string;
  title: string;
  type: string;
  subject: string;
  subjectId: number | null;
  grade: string;
  period: number | null;
  creator: string;
  creatorId: number | null;
  date: string;
  status: "REJECTED" | "VALIDATED" | "PENDING" | "REQUEST_CHANGES";
  description: string;
  resource: string | null;
  thumbnail: string | null;
  duration: number | null;
  topic: number | null;
  created_at: string | null;
  moderation_comment: string | null;
};

const statusMap: Record<string, LessonRow["status"]> = {
  APPROVED: "VALIDATED",
  VALIDATED: "VALIDATED",
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  REQUEST_CHANGES: "REQUEST_CHANGES",
  CHANGES_REQUESTED: "REQUEST_CHANGES",
  REQUEST_REVIEW: "REQUEST_CHANGES",
  REVIEW_REQUESTED: "REQUEST_CHANGES",
};

function normalizeStatus(value?: string | null): LessonRow["status"] {
  if (!value) return "PENDING";
  const upper = value.toUpperCase();
  if (statusMap[upper]) {
    return statusMap[upper];
  }
  if (["VALIDATED", "REJECTED", "PENDING", "REQUEST_CHANGES"].includes(upper)) {
    return upper as LessonRow["status"];
  }
  return "PENDING";
}

function formatDuration(minutes?: number | null) {
  if (!minutes || Number.isNaN(minutes)) return null;
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"}`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs} hr${hrs === 1 ? "" : "s"}${mins ? ` ${mins} min` : ""}`;
}

function mapLesson(record: LessonRecord): LessonRow {
  const status = normalizeStatus(record.status);
  const formattedDate = record.created_at
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(record.created_at))
    : "";

  return {
    id: record.id.toString(),
    title: record.title,
    type: record.type || "Lesson",
    subject: record.subject ? `Subject ${record.subject}` : "Subject -",
    subjectId: record.subject ?? null,
    grade: record.period ? `Grade ${record.period}` : "Grade -",
    period: record.period ?? null,
    creator: record.created_by ? `Creator ${record.created_by}` : "Unknown Creator",
    creatorId: record.created_by ?? null,
    date: formattedDate,
    status,
    description: record.description || "No description available for this lesson.",
    resource: record.resource,
    thumbnail: record.thumbnail,
    duration: record.duration_minutes ?? null,
    topic: record.topic ?? null,
    created_at: record.created_at ?? null,
    moderation_comment: record.moderation_comment ?? null,
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
  } else {
    console.log(message);
  }
}

export default function LessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = React.useState<LessonRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [subject, setSubject] = React.useState("All");
  const [grade, setGrade] = React.useState("All");
  const [status, setStatus] = React.useState("All");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalLesson, setModalLesson] = React.useState<LessonRecord | LessonRow | null>(null);
  const [isModerationModalOpen, setIsModerationModalOpen] = React.useState(false);
  const [moderationComment, setModerationComment] = React.useState("");
  const [moderationFormError, setModerationFormError] = React.useState<string | null>(null);
  const [pendingModerationAction, setPendingModerationAction] = React.useState<ModerateAction | null>(null);
  const [moderationLoadingAction, setModerationLoadingAction] = React.useState<ModerateAction | null>(null);
  const [userRole, setUserRole] = React.useState<string>("CONTENTCREATOR");
  const [deleteTarget, setDeleteTarget] = React.useState<LessonRow | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isCreateAssessmentModalOpen, setIsCreateAssessmentModalOpen] = React.useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = React.useState(false);
  const [assessmentFormErrors, setAssessmentFormErrors] = React.useState<Record<string, string>>({});
  const [assessmentLessonSearch, setAssessmentLessonSearch] = React.useState("");
  const [assessmentLessonGradeFilter, setAssessmentLessonGradeFilter] = React.useState("All");
  const [assessmentLessonSubjectFilter, setAssessmentLessonSubjectFilter] = React.useState("All");
  const [assessmentForm, setAssessmentForm] = React.useState({
    lesson: "",
    type: "QUIZ" as "QUIZ" | "ASSIGNMENT" | "TRIAL",
    title: "",
    instructions: "",
    marks: "",
    due_at: "",
    grade: "",
  });
  const isModerationProcessing = moderationLoadingAction !== null;
  const isValidator = userRole === "CONTENTVALIDATOR";

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

    async function fetchLessons() {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (typeof window === "undefined") return;

        const token = localStorage.getItem("auth_token");
        if (!token) {
          setLoadError("Missing authentication token. Please sign in again.");
          return;
        }

        const data = await getLessons(token);
        if (!isMounted) return;

        setLessons(data.map(mapLesson));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load lessons.";
        setLoadError(message);
        await notifyError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchLessons();

    return () => {
      isMounted = false;
    };
  }, []);

  const subjectOptions = React.useMemo(() => {
    const options = new Set<string>();
    lessons.forEach((lesson) => {
      if (lesson.subject !== "Subject -" && lesson.subject.trim().length > 0) {
        options.add(lesson.subject);
      }
    });
    return Array.from(options);
  }, [lessons]);

  const gradeOptions = React.useMemo(() => {
    const options = new Set<string>();
    lessons.forEach((lesson) => {
      if (lesson.grade !== "Grade -" && lesson.grade.trim().length > 0) {
        options.add(lesson.grade);
      }
    });
    return Array.from(options);
  }, [lessons]);

  const filtered = React.useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch = search.trim().length === 0 || lesson.title.toLowerCase().includes(search.toLowerCase());
      const matchesSubject = subject === "All" || lesson.subject === subject;
      const matchesGrade = grade === "All" || lesson.grade === grade;
      const matchesStatus =
        status === "All" ||
        (status === "Validated" && lesson.status === "VALIDATED") ||
        (status === "Pending" && lesson.status === "PENDING") ||
        (status === "Rejected" && lesson.status === "REJECTED");
      return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
    });
  }, [lessons, search, subject, grade, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [search, subject, grade, status]);

  const getStatusBadge = (state: LessonRow["status"]) => {
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

  const renderStatusLabel = (state: LessonRow["status"]) => {
    if (state === "VALIDATED") return "Validated";
    if (state === "REJECTED") return "Rejected";
    if (state === "REQUEST_CHANGES") return "Revision Requested";
    return "Pending";
  };

  const handleReview = React.useCallback((lesson: LessonRow) => {
    setIsModalOpen(true);
    setModalLesson(lesson);
    setIsModerationModalOpen(false);
    setModerationComment("");
    setModerationFormError(null);
    setPendingModerationAction(null);
  }, []);

  const closeModal = React.useCallback(() => {
    setIsModalOpen(false);
    setModalLesson(null);
    setIsModerationModalOpen(false);
    setModerationComment("");
    setModerationFormError(null);
    setPendingModerationAction(null);
  }, []);

  const displayGrade = (lesson: LessonRecord | LessonRow | null) => {
    if (!lesson) return "Grade -";
    const periodValue = (lesson as LessonRecord | LessonRow).period;
    if (typeof periodValue === "number" && periodValue > 0) return `Grade ${periodValue}`;
    if ("grade" in lesson) return lesson.grade;
    return "Grade -";
  };

  const displaySubject = (lesson: LessonRecord | LessonRow | null) => {
    if (!lesson) return "Subject -";
    if ("subject" in lesson) {
      if (typeof lesson.subject === "string" && lesson.subject.startsWith("Subject")) {
        return lesson.subject;
      }
      if (typeof lesson.subject === "number") {
        return `Subject ${lesson.subject}`;
      }
    }
    if ("subjectId" in lesson && lesson.subjectId) {
      return `Subject ${lesson.subjectId}`;
    }
    return "Subject -";
  };

  const displayDuration = (lesson: LessonRecord | LessonRow | null) => {
    if (!lesson) return "Unknown duration";
    const duration = "duration_minutes" in lesson ? lesson.duration_minutes : lesson.duration;
    return formatDuration(duration) || "Unknown duration";
  };

  const getModalThumbnail = (lesson: LessonRecord | LessonRow | null) => {
    if (!lesson) return null;
    const image = (lesson as LessonRecord | LessonRow).thumbnail;
    if (!image) return null;
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }
    return image.startsWith("/") ? image : `/${image}`;
  };

  const modalStatus = React.useMemo<LessonRow["status"]>(() => {
    if (!modalLesson) return "PENDING";
    if ("status" in modalLesson) {
      return normalizeStatus(modalLesson.status as string);
    }
    return "PENDING";
  }, [modalLesson]);

  const updateLessonStatusInState = React.useCallback(
    (lessonId: number, status: LessonRow["status"], moderationComment?: string | null) => {
      const lessonIdString = String(lessonId);
      setLessons((prev) =>
        prev.map((lesson) =>
          lesson.id === lessonIdString ? { ...lesson, status, moderation_comment: moderationComment ?? lesson.moderation_comment } : lesson,
        ),
      );
      setModalLesson((prev) => {
        if (!prev) return prev;
        if ("duration_minutes" in prev) {
          return { ...prev, status, moderation_comment: moderationComment ?? (prev as LessonRecord).moderation_comment } as LessonRecord;
        }
        return { ...prev, status, moderation_comment: moderationComment ?? (prev as LessonRow).moderation_comment } as LessonRow;
      });
    },
    [setLessons],
  );

  const submitModeration = React.useCallback(
    async (action: ModerateAction, comment?: string) => {
      if (!modalLesson) return;
      if (typeof window === "undefined") return;

      const lessonId = typeof modalLesson.id === "string" ? parseInt(modalLesson.id, 10) : modalLesson.id;
      if (!lessonId || Number.isNaN(lessonId)) {
        await notifyError("Invalid lesson identifier.");
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
            model: "lesson",
            id: lessonId,
            action,
            ...(comment ? { moderation_comment: comment } : {}),
          },
          token,
        );
        const normalizedStatus = normalizeStatus(response.status);
        const updatedComment = response.moderation_comment ?? comment ?? null;
        updateLessonStatusInState(response.id, normalizedStatus, updatedComment);

        const successMessage =
          action === "approve"
            ? "Lesson approved successfully."
            : action === "reject"
            ? "Lesson rejected."
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
          router.push("/content/lessons");
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
    [modalLesson, updateLessonStatusInState, closeModal, router],
  );

  const showModerationActions = isValidator && modalStatus === "PENDING";

  const handleModerationAction = React.useCallback(
    (action: ModerateAction) => {
      if (!modalLesson || !showModerationActions) return;
      if (action === "request_changes") {
        setPendingModerationAction(action);
        setModerationComment("");
        setModerationFormError(null);
        setIsModerationModalOpen(true);
        return;
      }
      submitModeration(action);
    },
    [modalLesson, showModerationActions, submitModeration],
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

  const handleDeleteLesson = React.useCallback(async () => {
    if (!deleteTarget) return;
    const token = localStorage.getItem("auth_token");
    if (!token) {
      await notifyError("Missing authentication token. Please sign in again.");
      return;
    }

    const lessonId = parseInt(deleteTarget.id, 10);
    if (!lessonId || Number.isNaN(lessonId)) {
      await notifyError("Invalid lesson identifier.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteLesson(lessonId, token);
      setLessons((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      await notifySuccess("Lesson deleted successfully.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete lesson.";
      await notifyError(message);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget]);

  const lessonPickerGradeOptions = React.useMemo(
    () => ["All", ...Array.from(new Set(lessons.map((lesson) => lesson.grade).filter((g) => g && g !== "Grade -")))],
    [lessons],
  );

  const lessonPickerSubjectOptions = React.useMemo(
    () => ["All", ...Array.from(new Set(lessons.map((lesson) => lesson.subject).filter((s) => s && s !== "Subject -")))],
    [lessons],
  );

  const filteredLessonsForAssessment = React.useMemo(() => {
    const needle = assessmentLessonSearch.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const matchesSearch =
        !needle ||
        lesson.title.toLowerCase().includes(needle) ||
        lesson.description.toLowerCase().includes(needle) ||
        lesson.subject.toLowerCase().includes(needle) ||
        lesson.grade.toLowerCase().includes(needle);
      const matchesGrade =
        assessmentLessonGradeFilter === "All" || lesson.grade === assessmentLessonGradeFilter;
      const matchesSubject =
        assessmentLessonSubjectFilter === "All" || lesson.subject === assessmentLessonSubjectFilter;
      return matchesSearch && matchesGrade && matchesSubject;
    });
  }, [lessons, assessmentLessonSearch, assessmentLessonGradeFilter, assessmentLessonSubjectFilter]);

  const selectedLessonForAssessment = React.useMemo(
    () => lessons.find((lesson) => lesson.id === assessmentForm.lesson) ?? null,
    [lessons, assessmentForm.lesson],
  );

  const resetAssessmentForm = () => {
    setAssessmentForm({
      lesson: "",
      type: "QUIZ",
      title: "",
      instructions: "",
      marks: "",
      due_at: "",
      grade: "",
    });
    setAssessmentLessonSearch("");
    setAssessmentLessonGradeFilter("All");
    setAssessmentLessonSubjectFilter("All");
    setAssessmentFormErrors({});
  };

  const handleCreateAssessmentSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!assessmentForm.lesson) nextErrors.lesson = "Please select a lesson";
    if (!assessmentForm.title.trim()) nextErrors.title = "Title is required";
    if (!assessmentForm.instructions.trim()) nextErrors.instructions = "Instructions are required";
    if (!assessmentForm.marks || Number(assessmentForm.marks) <= 0) nextErrors.marks = "Marks must be greater than 0";
    if (!assessmentForm.due_at) nextErrors.due_at = "Due date is required";
    if (!assessmentForm.grade.trim()) nextErrors.grade = "Grade is required";
    if (Object.keys(nextErrors).length > 0) {
      setAssessmentFormErrors(nextErrors);
      return;
    }

    setIsCreatingAssessment(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        await notifyError("Missing authentication token. Please sign in again.");
        return;
      }
      await createContentLessonAssessment(
        {
          lesson: Number(assessmentForm.lesson),
          type: assessmentForm.type,
          title: assessmentForm.title.trim(),
          instructions: assessmentForm.instructions.trim(),
          marks: Number(assessmentForm.marks),
          due_at: new Date(assessmentForm.due_at).toISOString(),
          grade: assessmentForm.grade.trim(),
          status: "DRAFT",
          moderation_comment: "",
        },
        token,
      );
      await notifySuccess("Lesson assessment created successfully.");
      setIsCreateAssessmentModalOpen(false);
      resetAssessmentForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create lesson assessment.";
      await notifyError(message);
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lessons</h1>
          <p className="text-sm text-gray-500">
            {isValidator ? "Review submitted lessons awaiting moderation." : "Create, refine, and track your lesson drafts."}
          </p>
        </div>
        {!isValidator ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/content/assessments"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-indigo-700"
            >
              Manage Assessments
            </Link>
            <Link
              href="/content/lessons/create"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
            >
              <span className="text-lg leading-none">+</span>
              Create Lesson
            </Link>
          </div>
        ) : null}
      </div>

      <LessonsHeader
        search={search}
        subject={subject}
        grade={grade}
        status={status}
        subjectOptions={subjectOptions}
        gradeOptions={gradeOptions}
        onSearch={setSearch}
        onSubjectChange={setSubject}
        onGradeChange={setGrade}
        onStatusChange={setStatus}
      />

      {isValidator ? (
        <>
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="grid grid-cols-12 bg-[#F1F7E4] px-5 py-4 text-sm font-semibold text-gray-800">
              <div className="col-span-4">Lesson Title</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Subject</div>
              <div className="col-span-1">Grade Level</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {isLoading ? (
              <div className="px-5 py-8 text-center text-sm text-gray-600">Loading lessons...</div>
            ) : loadError ? (
              <div className="px-5 py-8 text-center text-sm text-rose-600">{loadError}</div>
            ) : paged.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-600">No lessons match your filters.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {paged.map((lesson) => (
                  <div key={lesson.id} className="grid grid-cols-12 items-center px-5 py-4 text-sm hover:bg-gray-50">
                    <div className="col-span-4 text-gray-900 font-medium">{lesson.title}</div>
                    <div className="col-span-2 text-gray-700">{lesson.type}</div>
                    <div className="col-span-2 text-gray-700">{lesson.subject}</div>
                    <div className="col-span-1 text-gray-700">{lesson.grade}</div>
                    <div className="col-span-1">
                      <span className={`inline-flex max-w-[120px] justify-center rounded-lg px-2 py-1 text-[11px] font-semibold text-center leading-tight tracking-wide ${getStatusBadge(lesson.status)}`}>
                        {renderStatusLabel(lesson.status)}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      <button
                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                        onClick={() => handleReview(lesson)}
                      >
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 md:hidden">
            {isLoading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">Loading lessons...</div>
            ) : loadError ? (
              <div className="rounded-xl border border-rose-200 bg-white p-6 text-center text-sm text-rose-600">{loadError}</div>
            ) : paged.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                No lessons match your filters.
              </div>
            ) : (
              paged.map((lesson) => (
                <div key={lesson.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">{lesson.title}</p>
                      <p className="text-xs text-gray-500">{lesson.date}</p>
                    </div>
                    <span className={`inline-flex max-w-[140px] justify-center rounded-lg px-3 py-1 text-[11px] font-semibold text-center leading-tight tracking-wide whitespace-nowrap ${getStatusBadge(lesson.status)}`}>
                      {renderStatusLabel(lesson.status)}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
                    <div>
                      <p className="text-xs uppercase text-gray-400">Type</p>
                      <p>{lesson.type}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Subject</p>
                      <p>{lesson.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Grade Level</p>
                      <p>{lesson.grade}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-gray-400">Creator</p>
                      <p>{lesson.creator}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                      onClick={() => handleReview(lesson)}
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
              className={`rounded-md border px-3 py-1.5 text-sm ${currentPage === 1 ? "border-gray-200 text-gray-300" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
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
                      className={`rounded-md border px-3 py-1.5 text-sm ${totalPages === currentPage ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
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
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    active ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`rounded-md border px-3 py-1.5 text-sm ${currentPage === totalPages ? "border-gray-200 text-gray-300" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              &gt;
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Result count */}
          {!isLoading && !loadError && filtered.length > 0 && (
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{filtered.length}</span> {filtered.length === 1 ? "lesson" : "lessons"}
            </p>
          )}

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                    <div className="h-3 w-full rounded bg-gray-100" />
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
              <h3 className="mt-4 text-sm font-semibold text-gray-900">No lessons found</h3>
              <p className="mt-1 text-sm text-gray-500">Create a new lesson to get started.</p>
              <Link
                href="/content/lessons/create"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create Lesson
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((lesson) => (
                <div
                  key={lesson.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/content/lessons/create/learning-material/preview?id=${lesson.id}`)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") router.push(`/content/lessons/create/learning-material/preview?id=${lesson.id}`); }}
                  className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm outline-none transition-all duration-200 hover:shadow-md hover:border-gray-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  {/* Image */}
                  <div className="relative h-44 w-full shrink-0 overflow-hidden bg-gray-100">
                    {lesson.thumbnail ? (
                      <Image
                        src={lesson.thumbnail}
                        alt={lesson.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                          <polygon points="23 7 16 12 23 17 23 7" />
                          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />

                    {/* Status badge */}
                    <div className="absolute left-3 top-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm ${getStatusBadge(lesson.status)}`}>
                        {renderStatusLabel(lesson.status)}
                      </span>
                    </div>

                    {/* Type badge */}
                    <div className="absolute right-3 bottom-3">
                      <span className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 backdrop-blur-sm">{lesson.type}</span>
                    </div>

                    {/* Delete button (hidden for approved/validated lessons) */}
                    {lesson.status !== "VALIDATED" ? (
                      <button
                        aria-label="Delete lesson"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(lesson);
                        }}
                        className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    ) : null}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900">{lesson.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-gray-500">
                      {lesson.description || "No description provided yet."}
                    </p>
                    <div className="mt-auto flex items-center gap-4 pt-3 text-[13px] text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h7" />
                        </svg>
                        {lesson.subject}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                          <path d="M22 10v6M2 10l10-5 10 5M2 10l10 5M2 10v6c0 1.1.9 2 2 2h4M22 10l-10 5M22 10v6c0 1.1-.9 2-2 2h-4M6 21h12" />
                        </svg>
                        {lesson.grade}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {isValidator && isModalOpen ? (
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
                <p className="text-sm font-semibold text-emerald-600 uppercase">Preview of the lesson</p>
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
              {modalLesson ? (
                <>
                  {getModalThumbnail(modalLesson) ? (
                    <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl bg-gray-100">
                      <Image
                        src={getModalThumbnail(modalLesson)!}
                        alt={modalLesson?.title || "Lesson preview"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 900px"
                        priority
                      />
                    </div>
                  ) : null}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">{modalLesson?.title || "Lesson Title"}</h2>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-700">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-1 text-emerald-700">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                          {displayGrade(modalLesson)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-3 py-1 text-sky-700">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 6h16" />
                            <path d="M4 12h16" />
                            <path d="M4 18h7" />
                          </svg>
                          {displaySubject(modalLesson)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-3 py-1 text-purple-700">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </svg>
                          {modalLesson?.type || "Lesson Type"}
                        </span>
                      </div>
                    </div>

                    <section>
                      <h3 className="text-lg font-semibold text-gray-900">Lesson Description</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-700">{modalLesson?.description || "No description provided for this lesson."}</p>
                    </section>

                    <section className="grid gap-4 rounded-3xl border border-gray-100 bg-gray-50 p-4 md:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase text-gray-400">Duration</p>
                        <p className="text-sm font-semibold text-gray-800">{displayDuration(modalLesson)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">Status</p>
                        <span className={`mt-1 inline-flex rounded-lg px-3 py-1 text-xs font-semibold whitespace-nowrap ${getStatusBadge(modalStatus)}`}>
                          {renderStatusLabel(modalStatus)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-gray-400">Created On</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {modalLesson && "created_at" in modalLesson && modalLesson.created_at
                            ? new Date(modalLesson.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
                            : "Unknown"}
                        </p>
                      </div>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">Resources & Metadata</h3>
                      <div className="rounded-2xl border border-gray-100 p-4">
                        <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase text-gray-400">Lesson Asset</p>
                            {modalLesson && "resource" in modalLesson && modalLesson.resource ? (
                              <a href={modalLesson.resource} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">
                                View resource
                              </a>
                            ) : (
                              <p>Not provided</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs uppercase text-gray-400">Creator</p>
                            <p>
                              {modalLesson && "created_by" in modalLesson && modalLesson.created_by
                                ? `Creator ${modalLesson.created_by}`
                                : modalLesson && "creator" in modalLesson
                                ? modalLesson.creator
                                : "Unknown"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-gray-400">Subject</p>
                            <p>{displaySubject(modalLesson)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-gray-400">Topic</p>
                            <p>
                              {modalLesson && "topic" in modalLesson && modalLesson.topic
                                ? `Topic ${modalLesson.topic}`
                                : "Not specified"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {modalLesson?.moderation_comment ? (
                      <section className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <h3 className="text-sm font-semibold text-amber-900">Moderator Comment</h3>
                        <p className="mt-2 text-sm text-amber-900">{modalLesson.moderation_comment}</p>
                      </section>
                    ) : null}

                    <section>
                      <h3 className="text-lg font-semibold text-gray-900">Tone & Approach</h3>
                      <p className="mt-2 text-sm text-gray-700">
                        {modalLesson?.description
                          ? "Engaging, exploratory, and hands-on — encouraging pupils to connect real-life experiences with the lesson content."
                          : "Details will be provided by the creator."}
                      </p>
                    </section>
                  </div>
                </>
              ) : (
                <div className="py-16 text-center text-sm text-gray-600">No lesson selected.</div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isModerationProcessing}
              >
                Close
              </button>
              {showModerationActions ? (
                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-lg bg-rose-100 px-5 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleModerationAction("reject")}
                    disabled={isModerationProcessing}
                  >
                    {moderationLoadingAction === "reject" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-rose-700 border-t-transparent" />
                        Declining...
                      </span>
                    ) : (
                      "Decline Lesson"
                    )}
                  </button>
                  <button
                    className="rounded-lg bg-indigo-100 px-5 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={() => handleModerationAction("request_changes")}
                    disabled={isModerationProcessing}
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
                    disabled={isModerationProcessing}
                  >
                    {moderationLoadingAction === "approve" ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Approving...
                      </span>
                    ) : (
                      "Approve Lesson"
                    )}
                  </button>
                </div>
              ) : null}
            </div>

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
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Delete Lesson</h3>
              <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteTarget.title}</span>? This action cannot be undone.
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
                onClick={handleDeleteLesson}
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

      {!isValidator && isCreateAssessmentModalOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4" onClick={(e) => e.target === e.currentTarget && !isCreatingAssessment && setIsCreateAssessmentModalOpen(false)}>
          <div className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Create Lesson Assessment</h3>
                <p className="text-sm text-gray-500">Pick a lesson, then set assessment details.</p>
              </div>
              <button onClick={() => setIsCreateAssessmentModalOpen(false)} className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <input
                value={assessmentLessonSearch}
                onChange={(e) => setAssessmentLessonSearch(e.target.value)}
                placeholder="Search lesson, subject or grade..."
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
              <select
                value={assessmentLessonGradeFilter}
                onChange={(e) => setAssessmentLessonGradeFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                {lessonPickerGradeOptions.map((g) => (
                  <option key={g} value={g}>{g === "All" ? "All Grades" : g}</option>
                ))}
              </select>
              <select
                value={assessmentLessonSubjectFilter}
                onChange={(e) => setAssessmentLessonSubjectFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                {lessonPickerSubjectOptions.map((s) => (
                  <option key={s} value={s}>{s === "All" ? "All Subjects" : s}</option>
                ))}
              </select>
            </div>

            <div className={`mt-4 rounded-xl border ${assessmentFormErrors.lesson ? "border-rose-300" : "border-gray-200"} max-h-64 overflow-y-auto`}>
              {filteredLessonsForAssessment.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No lessons match your filters.</p>
              ) : (
                filteredLessonsForAssessment.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      setAssessmentForm((prev) => ({
                        ...prev,
                        lesson: lesson.id,
                        grade: lesson.grade && lesson.grade !== "Grade -" ? lesson.grade.toUpperCase().replace("GRADE ", "GRADE ") : prev.grade,
                        title: prev.title || `${lesson.title} Assessment`,
                      }));
                      setAssessmentFormErrors((prev) => ({ ...prev, lesson: "" }));
                    }}
                    className={`w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${assessmentForm.lesson === lesson.id ? "bg-indigo-50" : ""}`}
                  >
                    <p className="font-semibold text-gray-900">{lesson.title}</p>
                    <p className="text-xs text-gray-500">{lesson.subject} • {lesson.grade}</p>
                  </button>
                ))
              )}
            </div>
            {assessmentFormErrors.lesson ? <p className="mt-1 text-xs text-rose-600">{assessmentFormErrors.lesson}</p> : null}

            {selectedLessonForAssessment ? (
              <p className="mt-3 text-sm text-gray-600">Selected lesson: <span className="font-semibold text-gray-900">{selectedLessonForAssessment.title}</span></p>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                value={assessmentForm.title}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Assessment title"
                className={`rounded-lg border px-3 py-2 text-sm text-gray-900 ${assessmentFormErrors.title ? "border-rose-300" : "border-gray-300"}`}
              />
              <select
                value={assessmentForm.type}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, type: e.target.value as "QUIZ" | "ASSIGNMENT" | "TRIAL" }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="QUIZ">Quiz</option>
                <option value="ASSIGNMENT">Assignment</option>
                <option value="TRIAL">Trial</option>
              </select>
              <input
                value={assessmentForm.grade}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, grade: e.target.value }))}
                placeholder="Grade (e.g. GRADE 3)"
                className={`rounded-lg border px-3 py-2 text-sm text-gray-900 ${assessmentFormErrors.grade ? "border-rose-300" : "border-gray-300"}`}
              />
              <input
                type="number"
                min={1}
                value={assessmentForm.marks}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, marks: e.target.value }))}
                placeholder="Marks"
                className={`rounded-lg border px-3 py-2 text-sm text-gray-900 ${assessmentFormErrors.marks ? "border-rose-300" : "border-gray-300"}`}
              />
              <input
                type="datetime-local"
                value={assessmentForm.due_at}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, due_at: e.target.value }))}
                className={`rounded-lg border px-3 py-2 text-sm text-gray-900 md:col-span-2 ${assessmentFormErrors.due_at ? "border-rose-300" : "border-gray-300"}`}
              />
              <textarea
                value={assessmentForm.instructions}
                onChange={(e) => setAssessmentForm((prev) => ({ ...prev, instructions: e.target.value }))}
                rows={4}
                placeholder="Assessment instructions"
                className={`rounded-lg border px-3 py-2 text-sm text-gray-900 md:col-span-2 ${assessmentFormErrors.instructions ? "border-rose-300" : "border-gray-300"}`}
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsCreateAssessmentModalOpen(false);
                  resetAssessmentForm();
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                disabled={isCreatingAssessment}
              >
                Cancel
              </button>
              <button
                onClick={() => void handleCreateAssessmentSubmit()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                disabled={isCreatingAssessment}
              >
                {isCreatingAssessment ? "Creating..." : "Create Assessment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
