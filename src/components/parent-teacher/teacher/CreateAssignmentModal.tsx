"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { createLessonAssessment, getTeacherLessons, TeacherLesson } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAssignmentModal({ isOpen, onClose, onSuccess }: CreateAssignmentModalProps) {
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [isLoadingLessons, setIsLoadingLessons] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    lesson: "",
    title: "",
    instructions: "",
    marks: "",
    due_at: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchLessons();
    }
  }, [isOpen]);

  const fetchLessons = async () => {
    try {
      setIsLoadingLessons(true);
      const data = await getTeacherLessons();
      setLessons(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load lessons.";
      showErrorToast(message);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.lesson) newErrors.lesson = "Please select a lesson";
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.instructions.trim()) newErrors.instructions = "Instructions are required";
    if (!formData.marks || Number(formData.marks) <= 0) {
      newErrors.marks = "Marks must be greater than 0";
    }
    if (!formData.due_at) newErrors.due_at = "Due date is required";
    
    // Validate due date is in the future
    if (formData.due_at) {
      const dueDate = new Date(formData.due_at);
      const now = new Date();
      if (dueDate <= now) {
        newErrors.due_at = "Due date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      lesson: "",
      title: "",
      instructions: "",
      marks: "",
      due_at: "",
    });
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Don't send given_by - let the backend infer it from the authentication token
      await createLessonAssessment({
        lesson: Number(formData.lesson),
        type: "ASSIGNMENT",
        title: formData.title.trim(),
        instructions: formData.instructions.trim(),
        marks: Number(formData.marks),
        due_at: new Date(formData.due_at).toISOString(),
        status: "PENDING",
        moderation_comment: "",
      });

      showSuccessToast("Assignment created successfully!");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create assignment.";
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create Assignment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Lesson Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Lesson<span className="text-red-600">*</span>
            </label>
            <select
              name="lesson"
              value={formData.lesson}
              onChange={handleChange}
              disabled={isLoadingLessons}
              className={`w-full h-11 rounded-lg border px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50 ${
                errors.lesson ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">
                {isLoadingLessons ? "Loading lessons..." : "Select a lesson"}
              </option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title} {lesson.description ? `- ${lesson.description.substring(0, 50)}...` : ""}
                </option>
              ))}
            </select>
            {errors.lesson && (
              <p className="mt-1 text-sm text-red-600">{errors.lesson}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Assignment Title<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Introduction to Algebra Assignment"
              className={`w-full h-11 rounded-lg border px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
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
              rows={4}
              placeholder="Provide detailed instructions for the assignment..."
              className={`w-full resize-y rounded-lg border p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
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
                Total Marks<span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                name="marks"
                value={formData.marks}
                onChange={handleChange}
                min="1"
                placeholder="e.g. 100"
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
                min={today}
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
              {isSubmitting ? "Creating..." : "Create Assignment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

