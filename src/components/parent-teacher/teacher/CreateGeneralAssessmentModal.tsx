"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { createGeneralAssessment } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

interface CreateGeneralAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const GRADE_OPTIONS = [
  "GRADE 1",
  "GRADE 2",
  "GRADE 3",
  "GRADE 4",
  "GRADE 5",
  "GRADE 6",
  "GRADE 7",
  "GRADE 8",
  "GRADE 9",
  "GRADE 10",
  "GRADE 11",
  "GRADE 12",
];

const TYPE_OPTIONS = [
  { value: "QUIZ", label: "Quiz" },
  { value: "ASSIGNMENT", label: "Assignment" },
];

export default function CreateGeneralAssessmentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateGeneralAssessmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "QUIZ" as "QUIZ" | "ASSIGNMENT",
    instructions: "",
    marks: "",
    due_at: "",
    grade: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      title: "",
      type: "QUIZ",
      instructions: "",
      marks: "",
      due_at: "",
      grade: "",
    });
    setErrors({});
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = "Instructions are required";
    }

    if (!formData.marks || Number(formData.marks) <= 0) {
      newErrors.marks = "Marks must be greater than 0";
    }

    if (!formData.due_at) {
      newErrors.due_at = "Due date is required";
    } else {
      const dueDate = new Date(formData.due_at);
      const now = new Date();
      if (dueDate <= now) {
        newErrors.due_at = "Due date must be in the future";
      }
    }

    if (!formData.grade) {
      newErrors.grade = "Grade is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createGeneralAssessment({
        title: formData.title.trim(),
        type: formData.type,
        instructions: formData.instructions.trim(),
        marks: Number(formData.marks),
        due_at: new Date(formData.due_at).toISOString(),
        grade: formData.grade,
        status: "APPROVED",
      });

      showSuccessToast("General assessment created successfully!");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating general assessment:", error);

      if (error instanceof ApiClientError) {
        if (error.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(error.errors).forEach(([field, messages]) => {
            fieldErrors[field] = Array.isArray(messages) ? messages.join(", ") : messages;
          });
          setErrors(fieldErrors);

          const errorMessage = error.message || "Please check the form for errors.";
          showErrorToast(errorMessage);
        } else {
          showErrorToast(error.message || "Unable to create assessment.");
        }
      } else {
        const message =
          error instanceof Error ? error.message : "Unable to create assessment.";
        showErrorToast(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create General Assessment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Title<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter assessment title"
              className={`w-full h-11 rounded-lg border px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Type and Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Type<span className="text-red-600">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`w-full h-11 rounded-lg border px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                  errors.type ? "border-red-500" : "border-gray-300"
                }`}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Grade<span className="text-red-600">*</span>
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className={`w-full h-11 rounded-lg border px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                  errors.grade ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select grade</option>
                {GRADE_OPTIONS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              {errors.grade && (
                <p className="mt-1 text-sm text-red-600">{errors.grade}</p>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Instructions<span className="text-red-600">*</span>
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              placeholder="Enter assessment instructions"
              rows={4}
              className={`w-full rounded-lg border px-4 py-3 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                errors.instructions ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.instructions && (
              <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>
            )}
          </div>

          {/* Marks and Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Marks<span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="marks"
                value={formData.marks}
                onChange={handleChange}
                placeholder="Enter maximum marks"
                min="1"
                className={`w-full h-11 rounded-lg border px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                  errors.marks ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.marks && (
                <p className="mt-1 text-sm text-red-600">{errors.marks}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Due Date<span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                name="due_at"
                value={formData.due_at}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                className={`w-full h-11 rounded-lg border px-4 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                  errors.due_at ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.due_at && (
                <p className="mt-1 text-sm text-red-600">{errors.due_at}</p>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-6 -mb-6 -mx-6 px-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Assessment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

