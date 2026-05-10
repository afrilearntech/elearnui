"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  getQuestions,
  updateTeacherQuestion,
  type Question,
  type CreateQuestionRequest,
} from "@/lib/api/parent-teacher/teacher";
import { showSuccessToast, showErrorToast, formatErrorMessage } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

interface EditAssessmentQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: number;
  assessmentType: "general" | "lesson";
  assessmentTitle: string;
  onSaved?: () => void;
}

const QUESTION_TYPES = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
  { value: "ESSAY", label: "Essay" },
  { value: "FILL_IN_THE_BLANK", label: "Fill in the Blank" },
] as const;

function LoadingQuestionsPanel() {
  return (
    <div
      className="flex min-h-[220px] flex-col items-center justify-center gap-3 py-10"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Icon icon="solar:loading-bold" className="h-10 w-10 shrink-0 animate-spin text-indigo-600" />
      <p className="text-sm font-medium text-gray-600">Loading questions…</p>
    </div>
  );
}

function questionToFormState(q: Question): {
  type: CreateQuestionRequest["type"];
  question: string;
  answer: string;
  options: string[];
} {
  const opts = q.options?.map((o) => o.value) ?? [];
  if (q.type === "TRUE_FALSE" && opts.length < 2) {
    return {
      type: q.type,
      question: q.question,
      answer: q.answer,
      options: ["True", "False"],
    };
  }
  if (q.type === "MULTIPLE_CHOICE" && opts.length === 0) {
    return { type: q.type, question: q.question, answer: q.answer, options: ["", "", "", ""] };
  }
  return { type: q.type, question: q.question, answer: q.answer, options: opts };
}

export default function EditAssessmentQuestionsModal({
  isOpen,
  onClose,
  assessmentId,
  assessmentType,
  assessmentTitle,
  onSaved,
}: EditAssessmentQuestionsModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formType, setFormType] = useState<CreateQuestionRequest["type"]>("MULTIPLE_CHOICE");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [formOptions, setFormOptions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const params =
        assessmentType === "general"
          ? { general_assessment_id: assessmentId }
          : { lesson_assessment_id: assessmentId };
      const data = await getQuestions(params);
      setQuestions(data);
      setSelectedId((prev) => {
        if (data.length === 0) return null;
        if (prev != null && data.some((q) => q.id === prev)) return prev;
        return data[0].id;
      });
    } catch {
      showErrorToast("Failed to load questions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setQuestions([]);
    setSelectedId(null);
    void loadQuestions();
  }, [isOpen, assessmentId, assessmentType]);

  useEffect(() => {
    if (isLoading) return;
    const q = questions.find((x) => x.id === selectedId);
    if (!q) {
      if (questions.length === 0) {
        setFormQuestion("");
        setFormAnswer("");
        setFormOptions(["", "", "", ""]);
      }
      return;
    }
    const s = questionToFormState(q);
    setFormType(s.type);
    setFormQuestion(s.question);
    setFormAnswer(s.answer);
    setFormOptions(
      s.type === "MULTIPLE_CHOICE" && s.options.length < 2
        ? ["", "", "", ""]
        : s.type === "FILL_IN_THE_BLANK" && s.options.length === 0
          ? [""]
          : s.options.length > 0
            ? [...s.options]
            : s.type === "TRUE_FALSE"
              ? ["True", "False"]
              : []
    );
    setErrors({});
  }, [selectedId, questions, isLoading]);

  const handleTypeChange = (next: CreateQuestionRequest["type"]) => {
    setFormType(next);
    if (next === "MULTIPLE_CHOICE") setFormOptions((o) => (o.length >= 2 ? o : ["", "", "", ""]));
    else if (next === "TRUE_FALSE") {
      setFormOptions(["True", "False"]);
      if (formAnswer && !["True", "False"].includes(formAnswer)) setFormAnswer("");
    } else if (next === "FILL_IN_THE_BLANK") setFormOptions((o) => (o.length > 0 ? o : [""]));
    else setFormOptions([]);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formQuestion.trim()) e.question = "Question is required";
    if (!formAnswer.trim()) e.answer = "Answer is required";
    if (formType === "MULTIPLE_CHOICE") {
      const valid = formOptions.filter((o) => o.trim() !== "");
      if (valid.length < 2) e.options = "At least 2 options required";
      else if (!valid.includes(formAnswer.trim())) e.answer = "Answer must match one of the options";
    }
    if (formType === "TRUE_FALSE") {
      const a = formAnswer.trim();
      if (a.toUpperCase() !== "TRUE" && a.toUpperCase() !== "FALSE") {
        e.answer = "Use True or False";
      }
    }
    if (formType === "FILL_IN_THE_BLANK") {
      const valid = formOptions.filter((o) => o.trim() !== "");
      if (valid.length === 0) e.options = "At least one option required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayloadOptions = (): string[] => {
    if (formType === "MULTIPLE_CHOICE") return formOptions.filter((o) => o.trim() !== "");
    if (formType === "TRUE_FALSE") return formOptions.length >= 2 ? formOptions : ["True", "False"];
    if (formType === "FILL_IN_THE_BLANK") return formOptions.filter((o) => o.trim() !== "");
    return [];
  };

  const handleSave = async () => {
    if (!selectedId || !validate()) return;
    setIsSaving(true);
    try {
      const options = buildPayloadOptions();
      await updateTeacherQuestion(selectedId, {
        type: formType,
        question: formQuestion.trim(),
        answer: formAnswer.trim(),
        options,
      });
      showSuccessToast("Question updated.");
      await loadQuestions();
      onSaved?.();
    } catch (err) {
      if (err instanceof ApiClientError) {
        showErrorToast(formatErrorMessage(err.message || "Failed to update question"));
      } else {
        showErrorToast("Failed to update question.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit questions</h2>
            <p className="text-sm text-gray-600">{assessmentTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <Icon icon="solar:close-circle-bold" className="h-6 w-6" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-2">
          <div className="border-b border-gray-200 lg:border-b-0 lg:border-r lg:border-gray-200">
            <div className="max-h-[40vh] overflow-y-auto p-4 lg:max-h-[min(70vh,560px)]">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Questions {isLoading ? "" : `(${questions.length})`}
              </h3>
              {isLoading ? (
                <LoadingQuestionsPanel />
              ) : questions.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500">No questions yet. Add some first.</p>
              ) : (
                <ul className="space-y-2">
                  {questions.map((q, idx) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(q.id)}
                        className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                          selectedId === q.id
                            ? "border-indigo-300 bg-indigo-50"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <span className="text-xs font-medium text-gray-500">#{idx + 1} · {q.type.replace(/_/g, " ")}</span>
                        <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-900">{q.question}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-4 lg:max-h-[min(70vh,560px)]">
            {isLoading ? (
              <LoadingQuestionsPanel />
            ) : !selectedId || questions.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">
                {questions.length === 0
                  ? "No questions yet. Add some first."
                  : "Select a question to edit."}
              </p>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Edit selected</h3>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => handleTypeChange(e.target.value as CreateQuestionRequest["type"])}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Question</label>
                  <textarea
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    rows={3}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${
                      errors.question ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.question ? <p className="mt-1 text-xs text-red-600">{errors.question}</p> : null}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Answer</label>
                  {formType === "MULTIPLE_CHOICE" ? (
                    <select
                      value={formAnswer}
                      onChange={(e) => setFormAnswer(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 ${
                        errors.answer ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select correct option</option>
                      {formOptions.filter((o) => o.trim()).map((o, i) => (
                        <option key={`${o}-${i}`} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : formType === "TRUE_FALSE" ? (
                    <select
                      value={formAnswer}
                      onChange={(e) => setFormAnswer(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 ${
                        errors.answer ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </select>
                  ) : formType === "ESSAY" ? (
                    <textarea
                      value={formAnswer}
                      onChange={(e) => setFormAnswer(e.target.value)}
                      rows={4}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 ${
                        errors.answer ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={formAnswer}
                      onChange={(e) => setFormAnswer(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 ${
                        errors.answer ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                  )}
                  {errors.answer ? <p className="mt-1 text-xs text-red-600">{errors.answer}</p> : null}
                </div>

                {(formType === "MULTIPLE_CHOICE" || formType === "FILL_IN_THE_BLANK") && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Options</label>
                    <div className="space-y-2">
                      {formOptions.map((opt, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...formOptions];
                              next[i] = e.target.value;
                              setFormOptions(next);
                            }}
                            className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                              errors.options ? "border-red-500" : "border-gray-300"
                            }`}
                          />
                          {formOptions.length > (formType === "MULTIPLE_CHOICE" ? 2 : 1) ? (
                            <button
                              type="button"
                              onClick={() => setFormOptions(formOptions.filter((_, j) => j !== i))}
                              className="text-red-600"
                              aria-label="Remove option"
                            >
                              <Icon icon="solar:trash-bin-trash-bold" className="h-5 w-5" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormOptions([...formOptions, ""])}
                        className="text-sm font-medium text-indigo-600"
                      >
                        + Add option
                      </button>
                    </div>
                    {errors.options ? <p className="mt-1 text-xs text-red-600">{errors.options}</p> : null}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isSaving ? (
                      <Icon icon="solar:loading-bold" className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon icon="solar:diskette-bold" className="h-4 w-4" />
                    )}
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
