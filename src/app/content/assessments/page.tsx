"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  getAssessments,
  AssessmentRecord,
  createGeneralAssessment,
  createLessonAssessment,
  createContentQuestion,
  updateContentAssessmentStatus,
} from "@/lib/api/content/assessments";
import { getLessons, LessonRecord } from "@/lib/api/content/lessons";

type AssessmentRow = {
  id: string;
  title: string;
  type: string;
  kind: "general" | "lesson";  
  instructions: string;
  grade: string;
  marks: number;
  dueDate: string;
  dueDateFormatted: string;
  creator: string;
  creatorId: number;
  aiRecommended: boolean;
  isTargeted: boolean;
  targetStudent: number | null;
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
    instructions: record.instructions || "",
    grade: record.grade || "Grade -",
    marks: record.marks,
    dueDate: record.due_at,
    dueDateFormatted,
    creator: record.given_by_id ? `Creator ${record.given_by_id}` : "Unknown Creator",
    creatorId: record.given_by_id,
    aiRecommended: Boolean(record.ai_recommended),
    isTargeted: Boolean(record.is_targeted),
    targetStudent: record.target_student ?? null,
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
  const [lessons, setLessons] = React.useState<LessonRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [userRole, setUserRole] = React.useState<string>("CONTENTCREATOR");
  const isValidator = userRole === "CONTENTVALIDATOR";
  const [showCreateGeneralModal, setShowCreateGeneralModal] = React.useState(false);
  const [showCreateLessonModal, setShowCreateLessonModal] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [generalForm, setGeneralForm] = React.useState({
    title: "",
    type: "QUIZ" as "QUIZ" | "ASSIGNMENT" | "TRIAL",
    grade: "",
    instructions: "",
    marks: 10,
    due_at: "",
  });
  const [lessonForm, setLessonForm] = React.useState({
    lesson: 0,
    title: "",
    type: "QUIZ" as "QUIZ" | "ASSIGNMENT" | "TRIAL",
    grade: "",
    instructions: "",
    marks: 10,
    due_at: "",
  });
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
  type AssessmentModerationAction = "approve" | "reject" | "request_changes";
  const [pendingModerationAction, setPendingModerationAction] = React.useState<AssessmentModerationAction | null>(null);
  const [moderationLoadingAction, setModerationLoadingAction] = React.useState<AssessmentModerationAction | null>(null);
  const isModerationProcessing = moderationLoadingAction !== null;
  const [isQuestionModalOpen, setIsQuestionModalOpen] = React.useState(false);
  const [questionAssessment, setQuestionAssessment] = React.useState<AssessmentRow | null>(null);
  const [isCreatingQuestion, setIsCreatingQuestion] = React.useState(false);
  const [questionFormError, setQuestionFormError] = React.useState<string | null>(null);
  const [questionForm, setQuestionForm] = React.useState({
    type: "MULTIPLE_CHOICE" as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK",
    question: "",
    answer: "",
    options: ["", "", "", ""],
  });

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

  const fetchLessonsForCreator = React.useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;
      const data = await getLessons(token);
      setLessons(data);
    } catch (error) {
      console.error("Failed to load lessons for assessment creation", error);
    }
  }, []);

  React.useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  React.useEffect(() => {
    if (!isValidator) {
      void fetchLessonsForCreator();
    }
  }, [isValidator, fetchLessonsForCreator]);

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

  const resetQuestionForm = React.useCallback(() => {
    setQuestionForm({
      type: "MULTIPLE_CHOICE",
      question: "",
      answer: "",
      options: ["", "", "", ""],
    });
    setQuestionFormError(null);
  }, []);

  const closeQuestionModal = React.useCallback(() => {
    if (isCreatingQuestion) return;
    setIsQuestionModalOpen(false);
    setQuestionAssessment(null);
    resetQuestionForm();
  }, [isCreatingQuestion, resetQuestionForm]);

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
    async (action: AssessmentModerationAction, comment?: string) => {
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

      setModerationLoadingAction(action);
      try {
        const nextStatus =
          action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "REQUEST_CHANGES";

        const response = await updateContentAssessmentStatus(
          modalAssessment.kind,
          assessmentId,
          modalAssessment.kind === "general"
            ? {
                title: modalAssessment.title,
                type: modalAssessment.type as "QUIZ" | "ASSIGNMENT" | "TRIAL",
                given_by: modalAssessment.creatorId,
                instructions: modalAssessment.instructions,
                marks: modalAssessment.marks,
                due_at: modalAssessment.dueDate,
                grade: modalAssessment.grade,
                ai_recommended: modalAssessment.aiRecommended,
                is_targeted: modalAssessment.isTargeted,
                target_student: modalAssessment.targetStudent,
                status: nextStatus,
                moderation_comment: comment ?? modalAssessment.moderation_comment ?? "",
              }
            : {
                lesson: Number(modalAssessment.lessonId ?? 0),
                type: modalAssessment.type as "QUIZ" | "ASSIGNMENT" | "TRIAL",
                given_by: modalAssessment.creatorId,
                title: modalAssessment.title,
                instructions: modalAssessment.instructions,
                marks: modalAssessment.marks,
                due_at: modalAssessment.dueDate,
                ai_recommended: modalAssessment.aiRecommended,
                is_targeted: modalAssessment.isTargeted,
                target_student: modalAssessment.targetStudent,
                status: nextStatus,
                moderation_comment: comment ?? modalAssessment.moderation_comment ?? "",
              },
          token,
        );
        const normalizedStatus = normalizeStatus(
          typeof response.status === "string" ? response.status : nextStatus,
        );
        const updatedComment =
          typeof response.moderation_comment === "string" ? response.moderation_comment : comment ?? null;
        updateAssessmentStatusInState(assessmentId, normalizedStatus, updatedComment);

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

  const showModerationActions = isValidator && modalAssessment?.status === "PENDING";

  const handleModerationAction = React.useCallback(
    (action: AssessmentModerationAction) => {
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

  const handleCreateGeneralAssessment = async () => {
    if (isValidator) {
      await notifyError("Validators cannot create assessments.");
      return;
    }
    if (!generalForm.title.trim() || !generalForm.grade.trim() || !generalForm.instructions.trim() || !generalForm.due_at) {
      await notifyError("Please fill all required general assessment fields.");
      return;
    }
    if (!generalForm.marks || generalForm.marks <= 0) {
      await notifyError("Marks must be greater than zero.");
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) {
      await notifyError("Missing authentication token. Please sign in again.");
      return;
    }

    setIsCreating(true);
    try {
      await createGeneralAssessment(
        {
          ...generalForm,
          status: "PENDING",
          moderation_comment: "",
        },
        token,
      );
      await notifySuccess("General assessment created successfully.");
      setShowCreateGeneralModal(false);
      setGeneralForm({
        title: "",
        type: "QUIZ",
        grade: "",
        instructions: "",
        marks: 10,
        due_at: "",
      });
      await fetchAssessments(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create general assessment.";
      await notifyError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateLessonAssessment = async () => {
    if (isValidator) {
      await notifyError("Validators cannot create assessments.");
      return;
    }
    if (
      !lessonForm.lesson ||
      !lessonForm.title.trim() ||
      !lessonForm.grade.trim() ||
      !lessonForm.instructions.trim() ||
      !lessonForm.due_at
    ) {
      await notifyError("Please fill all required lesson assessment fields.");
      return;
    }
    if (!lessonForm.marks || lessonForm.marks <= 0) {
      await notifyError("Marks must be greater than zero.");
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) {
      await notifyError("Missing authentication token. Please sign in again.");
      return;
    }

    setIsCreating(true);
    try {
      await createLessonAssessment(
        {
          ...lessonForm,
          status: "PENDING",
          moderation_comment: "",
        },
        token,
      );
      await notifySuccess("Lesson assessment created successfully.");
      setShowCreateLessonModal(false);
      setLessonForm({
        lesson: 0,
        title: "",
        type: "QUIZ",
        grade: "",
        instructions: "",
        marks: 10,
        due_at: "",
      });
      await fetchAssessments(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create lesson assessment.";
      await notifyError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const openQuestionModal = React.useCallback(
    (assessment: AssessmentRow) => {
      setQuestionAssessment(assessment);
      setIsQuestionModalOpen(true);
      resetQuestionForm();
    },
    [resetQuestionForm],
  );

  const questionOptions = React.useMemo(
    () => questionForm.options.map((value) => value.trim()).filter((value) => value.length > 0),
    [questionForm.options],
  );

  const answerOptions = React.useMemo(() => {
    if (questionForm.type === "TRUE_FALSE") {
      return ["True", "False"];
    }
    if (questionForm.type === "MULTIPLE_CHOICE") {
      return questionOptions;
    }
    return [];
  }, [questionForm.type, questionOptions]);

  React.useEffect(() => {
    if (questionForm.type === "TRUE_FALSE") {
      setQuestionForm((prev) => (prev.answer ? prev : { ...prev, answer: "True" }));
      return;
    }
    if (questionForm.type === "MULTIPLE_CHOICE") {
      setQuestionForm((prev) => {
        const validAnswer = questionOptions.includes(prev.answer) ? prev.answer : "";
        return validAnswer === prev.answer ? prev : { ...prev, answer: validAnswer };
      });
    }
  }, [questionForm.type, questionOptions]);

  const handleCreateQuestion = async () => {
    if (!questionAssessment) {
      await notifyError("Select an assessment first.");
      return;
    }

    if (!questionForm.question.trim()) {
      setQuestionFormError("Question text is required.");
      return;
    }

    if (!questionForm.answer.trim()) {
      setQuestionFormError("Please provide the correct answer.");
      return;
    }

    if (questionForm.type === "MULTIPLE_CHOICE" && questionOptions.length < 2) {
      setQuestionFormError("Please provide at least two options for multiple choice.");
      return;
    }

    if (questionForm.type === "MULTIPLE_CHOICE" && !questionOptions.includes(questionForm.answer.trim())) {
      setQuestionFormError("The selected correct answer must be one of the options.");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) {
      await notifyError("Missing authentication token. Please sign in again.");
      return;
    }

    setIsCreatingQuestion(true);
    setQuestionFormError(null);

    try {
      const assessmentId = Number(questionAssessment.id);
      await createContentQuestion(
        {
          ...(questionAssessment.kind === "general"
            ? { general_assessment_id: assessmentId }
            : { lesson_assessment_id: assessmentId }),
          type: questionForm.type,
          question: questionForm.question.trim(),
          answer: questionForm.answer.trim(),
          ...(questionForm.type === "MULTIPLE_CHOICE" ? { options: questionOptions } : {}),
        },
        token,
      );

      await notifySuccess("Question added successfully.");
      closeQuestionModal();
      await fetchAssessments(false, Boolean(modalAssessment));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create question.";
      await notifyError(message);
    } finally {
      setIsCreatingQuestion(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-sm text-gray-500">
            {isValidator ? "Review assessment submissions." : "Create and manage your lesson and general assessments."}
          </p>
        </div>
        {!isValidator ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowCreateGeneralModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              + Create General Assessment
            </button>
            <button
              onClick={() => setShowCreateLessonModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              + Create Lesson Assessment
            </button>
          </div>
        ) : null}
      </div>

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
                    <div className="flex items-center gap-2">
                      {!isValidator ? (
                        <button
                          className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
                          onClick={() => openQuestionModal(assessment)}
                        >
                          Add Question
                        </button>
                      ) : null}
                      <button
                        className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                        onClick={() => handleReview(assessment)}
                      >
                        Review
                      </button>
                    </div>
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
                <div className="flex items-center gap-2">
                  {!isValidator ? (
                    <button
                      className="rounded-lg bg-sky-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
                      onClick={() => openQuestionModal(assessment)}
                    >
                      Add Question
                    </button>
                  ) : null}
                  <button
                    className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                    onClick={() => handleReview(assessment)}
                  >
                    Review
                  </button>
                </div>
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

      {isQuestionModalOpen ? (
        <div className="fixed inset-0 z-[135] flex items-center justify-center bg-black/60 px-4" onClick={(event) => event.target === event.currentTarget && closeQuestionModal()}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Add Question</h3>
                <p className="text-sm text-gray-500">
                  {questionAssessment ? `For ${questionAssessment.title}` : "Select a question type and fill the details."}
                </p>
              </div>
              <button
                className="rounded-full border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCreatingQuestion}
                onClick={closeQuestionModal}
                aria-label="Close add question modal"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Question Type</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    value={questionForm.type}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({
                        ...prev,
                        type: event.target.value as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK",
                        answer: "",
                      }))
                    }
                    disabled={isCreatingQuestion}
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="TRUE_FALSE">True / False</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                    <option value="ESSAY">Essay</option>
                    <option value="FILL_IN_THE_BLANK">Fill In The Blank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Question</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  placeholder="Enter the question..."
                  value={questionForm.question}
                  onChange={(event) => setQuestionForm((prev) => ({ ...prev, question: event.target.value }))}
                  disabled={isCreatingQuestion}
                />
              </div>

              {questionForm.type === "MULTIPLE_CHOICE" ? (
                <div>
                  <label className="text-sm font-medium text-gray-700">Options</label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {questionForm.options.map((option, index) => (
                      <input
                        key={`option-${index}`}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(event) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            options: prev.options.map((existing, optionIndex) =>
                              optionIndex === index ? event.target.value : existing,
                            ),
                          }))
                        }
                        disabled={isCreatingQuestion}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-medium text-gray-700">Correct Answer</label>
                {questionForm.type === "MULTIPLE_CHOICE" || questionForm.type === "TRUE_FALSE" ? (
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    value={questionForm.answer}
                    onChange={(event) => setQuestionForm((prev) => ({ ...prev, answer: event.target.value }))}
                    disabled={isCreatingQuestion}
                  >
                    <option value="">Select correct answer</option>
                    {answerOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : questionForm.type === "ESSAY" ? (
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    placeholder="Sample model answer..."
                    value={questionForm.answer}
                    onChange={(event) => setQuestionForm((prev) => ({ ...prev, answer: event.target.value }))}
                    disabled={isCreatingQuestion}
                  />
                ) : (
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                    placeholder="Enter the correct answer"
                    value={questionForm.answer}
                    onChange={(event) => setQuestionForm((prev) => ({ ...prev, answer: event.target.value }))}
                    disabled={isCreatingQuestion}
                  />
                )}
              </div>

              {questionFormError ? <p className="text-sm text-rose-600">{questionFormError}</p> : null}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCreatingQuestion}
                onClick={closeQuestionModal}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isCreatingQuestion}
                onClick={handleCreateQuestion}
              >
                {isCreatingQuestion ? "Saving..." : "Save Question"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateGeneralModal ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4" onClick={(e) => e.target === e.currentTarget && !isCreating && setShowCreateGeneralModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900">Create General Assessment</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" placeholder="Title" value={generalForm.title} onChange={(e) => setGeneralForm((p) => ({ ...p, title: e.target.value }))} />
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" placeholder="Grade (e.g. GRADE 4)" value={generalForm.grade} onChange={(e) => setGeneralForm((p) => ({ ...p, grade: e.target.value }))} />
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" value={generalForm.type} onChange={(e) => setGeneralForm((p) => ({ ...p, type: e.target.value as "QUIZ" | "ASSIGNMENT" | "TRIAL" }))}>
                <option value="QUIZ">QUIZ</option>
                <option value="ASSIGNMENT">ASSIGNMENT</option>
                <option value="TRIAL">TRIAL</option>
              </select>
              <input type="number" min={1} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" placeholder="Marks" value={generalForm.marks} onChange={(e) => setGeneralForm((p) => ({ ...p, marks: Number(e.target.value || 0) }))} />
              <input type="datetime-local" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 sm:col-span-2" value={generalForm.due_at} onChange={(e) => setGeneralForm((p) => ({ ...p, due_at: e.target.value }))} />
              <textarea className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 sm:col-span-2" rows={4} placeholder="Instructions" value={generalForm.instructions} onChange={(e) => setGeneralForm((p) => ({ ...p, instructions: e.target.value }))} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700" disabled={isCreating} onClick={() => setShowCreateGeneralModal(false)}>Cancel</button>
              <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60" disabled={isCreating} onClick={handleCreateGeneralAssessment}>
                {isCreating ? "Creating..." : "Create General Assessment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateLessonModal ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-4" onClick={(e) => e.target === e.currentTarget && !isCreating && setShowCreateLessonModal(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900">Create Lesson Assessment</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 sm:col-span-2" value={lessonForm.lesson} onChange={(e) => setLessonForm((p) => ({ ...p, lesson: Number(e.target.value || 0) }))}>
                <option value={0}>Select Lesson</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
                ))}
              </select>
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" placeholder="Title" value={lessonForm.title} onChange={(e) => setLessonForm((p) => ({ ...p, title: e.target.value }))} />
              <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" placeholder="Grade (e.g. GRADE 4)" value={lessonForm.grade} onChange={(e) => setLessonForm((p) => ({ ...p, grade: e.target.value }))} />
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" value={lessonForm.type} onChange={(e) => setLessonForm((p) => ({ ...p, type: e.target.value as "QUIZ" | "ASSIGNMENT" | "TRIAL" }))}>
                <option value="QUIZ">QUIZ</option>
                <option value="ASSIGNMENT">ASSIGNMENT</option>
                <option value="TRIAL">TRIAL</option>
              </select>
              <input type="number" min={1} className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" placeholder="Marks" value={lessonForm.marks} onChange={(e) => setLessonForm((p) => ({ ...p, marks: Number(e.target.value || 0) }))} />
              <input type="datetime-local" className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 sm:col-span-2" value={lessonForm.due_at} onChange={(e) => setLessonForm((p) => ({ ...p, due_at: e.target.value }))} />
              <textarea className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 sm:col-span-2" rows={4} placeholder="Instructions" value={lessonForm.instructions} onChange={(e) => setLessonForm((p) => ({ ...p, instructions: e.target.value }))} />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700" disabled={isCreating} onClick={() => setShowCreateLessonModal(false)}>Cancel</button>
              <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60" disabled={isCreating} onClick={handleCreateLessonAssessment}>
                {isCreating ? "Creating..." : "Create Lesson Assessment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
