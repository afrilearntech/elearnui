"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import {
  getTeacherSubjects,
  TeacherSubject,
  updateTeacherGeneralAssessment,
  updateTeacherLessonAssessment,
} from "@/lib/api/parent-teacher/teacher";
import { ApiClientError } from "@/lib/api/client";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type Scope = "lesson" | "general";

export type EditTeacherAssessmentShape = {
  id: number;
  scope: Scope;
  title: string;
  type: "QUIZ" | "ASSIGNMENT" | "TRIAL";
  instructions: string;
  marks: number;
  due_at: string;
  grade?: string;
  lesson?: number;
};

interface EditTeacherAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assessment: EditTeacherAssessmentShape | null;
}

const TYPE_OPTIONS: { value: "QUIZ" | "ASSIGNMENT"; label: string }[] = [
  { value: "QUIZ", label: "Quiz" },
  { value: "ASSIGNMENT", label: "Assignment" },
];

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditTeacherAssessmentModal({
  isOpen,
  onClose,
  onSuccess,
  assessment,
}: EditTeacherAssessmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"QUIZ" | "ASSIGNMENT">("QUIZ");
  const [instructions, setInstructions] = useState("");
  const [marks, setMarks] = useState("");
  const [dueAtLocal, setDueAtLocal] = useState("");
  const [grade, setGrade] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const assignedGradeOptions = useMemo(
    () =>
      Array.from(
        new Set(subjects.map((s) => s.grade).filter((g): g is string => Boolean(g && String(g).trim()))),
      ).sort(),
    [subjects],
  );

  const gradeSelectOptions = useMemo(() => {
    const base = [...assignedGradeOptions];
    if (assessment?.scope === "general" && assessment.grade && !base.includes(assessment.grade)) {
      base.unshift(assessment.grade);
    }
    return base;
  }, [assignedGradeOptions, assessment]);

  useEffect(() => {
    if (!isOpen || !assessment) return;

    setTitle(assessment.title);
    setType(assessment.type === "ASSIGNMENT" ? "ASSIGNMENT" : "QUIZ");
    setInstructions(assessment.instructions || "");
    setMarks(String(assessment.marks));
    setDueAtLocal(toDatetimeLocalValue(assessment.due_at));
    setGrade(assessment.grade || "");
    setErrors({});

    if (assessment.scope === "general") {
      void (async () => {
        try {
          setIsLoadingSubjects(true);
          const rows = await getTeacherSubjects();
          setSubjects(rows);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Could not load grades.";
          showErrorToast(message);
        } finally {
          setIsLoadingSubjects(false);
        }
      })();
    }
  }, [isOpen, assessment]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Title is required";
    if (!instructions.trim()) next.instructions = "Instructions are required";
    const marksNum = Number(marks);
    if (!Number.isFinite(marksNum) || marksNum < 0) next.marks = "Valid marks required";
    if (!dueAtLocal) next.due_at = "Due date is required";
    else if (Number.isNaN(new Date(dueAtLocal).getTime())) next.due_at = "Invalid date";

    if (assessment?.scope === "general") {
      if (!grade) next.grade = "Grade is required";
    } else if (assessment?.scope === "lesson") {
      const lid = assessment.lesson;
      if (lid == null || !Number.isFinite(lid) || lid <= 0) {
        next.lesson = "This assessment has no linked lesson. Contact support.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment || !validate()) return;

    setIsSubmitting(true);
    try {
      const dueIso = new Date(dueAtLocal).toISOString();
      const marksNum = Number(marks);

      if (assessment.scope === "general") {
        await updateTeacherGeneralAssessment(assessment.id, {
          title: title.trim(),
          type,
          instructions: instructions.trim(),
          marks: marksNum,
          due_at: dueIso,
          grade,
        });
      } else {
        const lessonIdLocked = assessment.lesson;
        if (lessonIdLocked == null || !Number.isFinite(lessonIdLocked) || lessonIdLocked <= 0) {
          showErrorToast("Cannot save: missing lesson link on this assessment.");
          return;
        }
        await updateTeacherLessonAssessment(assessment.id, {
          lesson: lessonIdLocked,
          type,
          title: title.trim(),
          instructions: instructions.trim(),
          marks: marksNum,
          due_at: dueIso,
        });
      }

      showSuccessToast("Assessment updated successfully.");
      onSuccess();
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to update assessment.";
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !assessment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-assessment-title"
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {assessment.scope === "general" ? "General assessment" : "Lesson assessment"}
            </p>
            <h2 id="edit-assessment-title" className="text-lg font-bold text-gray-900">
              Edit assessment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <Icon icon="solar:close-circle-bold" className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-5 py-4">
          <div>
            <label htmlFor="edit-title" className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-type" className="mb-1 block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="edit-type"
                value={type}
                onChange={(e) => setType(e.target.value as "QUIZ" | "ASSIGNMENT")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-marks" className="mb-1 block text-sm font-medium text-gray-700">
                Marks
              </label>
              <input
                id="edit-marks"
                type="number"
                min={0}
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                  errors.marks ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.marks && <p className="mt-1 text-sm text-red-600">{errors.marks}</p>}
            </div>
          </div>

          {assessment.scope === "lesson" ? (
            <div className="space-y-1">
              <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                The linked lesson cannot be changed here. You can update title, type, marks, due date, and
                instructions only.
              </p>
              {errors.lesson ? <p className="text-sm text-red-600">{errors.lesson}</p> : null}
            </div>
          ) : (
            <div>
              <label htmlFor="edit-grade" className="mb-1 block text-sm font-medium text-gray-700">
                Grade
              </label>
              <select
                id="edit-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                disabled={isLoadingSubjects}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:bg-gray-50 ${
                  errors.grade ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">{isLoadingSubjects ? "Loading grades…" : "Select grade"}</option>
                {gradeSelectOptions.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {!isLoadingSubjects && gradeSelectOptions.length === 0 ? (
                <p className="mt-1 text-xs text-amber-700">
                  No assigned subject grades found. Assign subjects to your account to choose a grade.
                </p>
              ) : null}
              {errors.grade && <p className="mt-1 text-sm text-red-600">{errors.grade}</p>}
            </div>
          )}

          <div>
            <label htmlFor="edit-due" className="mb-1 block text-sm font-medium text-gray-700">
              Due date
            </label>
            <input
              id="edit-due"
              type="datetime-local"
              value={dueAtLocal}
              onChange={(e) => setDueAtLocal(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                errors.due_at ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.due_at && <p className="mt-1 text-sm text-red-600">{errors.due_at}</p>}
          </div>

          <div>
            <label htmlFor="edit-instructions" className="mb-1 block text-sm font-medium text-gray-700">
              Instructions
            </label>
            <textarea
              id="edit-instructions"
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                errors.instructions ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.instructions && <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving…
                </>
              ) : (
                <>
                  <Icon icon="solar:diskette-bold" className="h-4 w-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
