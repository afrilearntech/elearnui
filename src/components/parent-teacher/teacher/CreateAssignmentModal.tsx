"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [isLessonPickerOpen, setIsLessonPickerOpen] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");
  const [lessonGradeFilter, setLessonGradeFilter] = useState("All");
  const [lessonSubjectFilter, setLessonSubjectFilter] = useState("All");

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
      void fetchLessons();
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

  const getLessonGrade = (lesson: TeacherLesson) =>
    lesson.grade ||
    lesson.subject_grade ||
    lesson.topic_grade ||
    lesson.period_grade ||
    lesson.subject_detail?.grade ||
    (lesson.period ? `GRADE ${lesson.period}` : "Unknown");

  const getLessonSubjectLabel = (lesson: TeacherLesson) =>
    lesson.subject ? `Subject ${lesson.subject}` : "Unassigned Subject";

  const selectedLesson = useMemo(
    () => lessons.find((lesson) => String(lesson.id) === formData.lesson) ?? null,
    [lessons, formData.lesson],
  );

  const lessonGradeOptions = useMemo(() => {
    const values = new Set<string>();
    lessons.forEach((lesson) => values.add(getLessonGrade(lesson)));
    return ["All", ...Array.from(values)];
  }, [lessons]);

  const lessonSubjectOptions = useMemo(() => {
    const values = new Set<string>();
    lessons.forEach((lesson) => values.add(getLessonSubjectLabel(lesson)));
    return ["All", ...Array.from(values)];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const needle = lessonSearch.trim().toLowerCase();
    return lessons.filter((lesson) => {
      const grade = getLessonGrade(lesson);
      const subjectLabel = getLessonSubjectLabel(lesson);
      const matchesSearch =
        !needle ||
        lesson.title.toLowerCase().includes(needle) ||
        lesson.description.toLowerCase().includes(needle) ||
        grade.toLowerCase().includes(needle) ||
        subjectLabel.toLowerCase().includes(needle);
      const matchesGrade = lessonGradeFilter === "All" || grade === lessonGradeFilter;
      const matchesSubject = lessonSubjectFilter === "All" || subjectLabel === lessonSubjectFilter;
      return matchesSearch && matchesGrade && matchesSubject;
    });
  }, [lessons, lessonSearch, lessonGradeFilter, lessonSubjectFilter]);

  const handleLessonPick = (lesson: TeacherLesson) => {
    setFormData((prev) => ({ ...prev, lesson: String(lesson.id) }));
    if (errors.lesson) {
      setErrors((prev) => ({ ...prev, lesson: "" }));
    }
    setIsLessonPickerOpen(false);
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
    setLessonSearch("");
    setLessonGradeFilter("All");
    setLessonSubjectFilter("All");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createLessonAssessment({
        lesson: Number(formData.lesson),
        type: "ASSIGNMENT",
        title: formData.title.trim(),
        instructions: formData.instructions.trim(),
        marks: Number(formData.marks),
        due_at: new Date(formData.due_at).toISOString(),
        status: "APPROVED",
        moderation_comment: "",
      });

      showSuccessToast("Assessment created successfully!");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create assessment.";
      showErrorToast(message);
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
            <h2 className="text-2xl font-bold text-gray-900">Create Assessment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Lesson<span className="text-red-600">*</span>
            </label>
            <button
              type="button"
              disabled={isLoadingLessons}
              onClick={() => setIsLessonPickerOpen(true)}
              className={`w-full min-h-[48px] rounded-lg border px-4 py-2 text-left text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50 ${
                errors.lesson ? "border-red-500" : "border-gray-300"
              }`}
            >
              {selectedLesson ? (
                <div>
                  <p className="font-medium text-gray-900">{selectedLesson.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getLessonSubjectLabel(selectedLesson)} • {getLessonGrade(selectedLesson)}
                  </p>
                </div>
              ) : (
                <span className="text-gray-400">{isLoadingLessons ? "Loading lessons..." : "Select a lesson"}</span>
              )}
            </button>
            {errors.lesson && <p className="mt-1 text-sm text-red-600">{errors.lesson}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Assessment Title<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Introduction to Algebra Assessment"
              className={`w-full h-11 rounded-lg border px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Instructions<span className="text-red-600">*</span>
            </label>
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={4}
              placeholder="Provide detailed instructions for the assessment..."
              className={`w-full resize-y rounded-lg border p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                errors.instructions ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.instructions && <p className="mt-1 text-sm text-red-600">{errors.instructions}</p>}
          </div>

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
              {errors.marks && <p className="mt-1 text-sm text-red-600">{errors.marks}</p>}
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
              {errors.due_at && <p className="mt-1 text-sm text-red-600">{errors.due_at}</p>}
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
              {isSubmitting ? "Creating..." : "Create Assessment"}
            </button>
          </div>
        </form>
      </div>

      {isLessonPickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-gray-200 max-h-[88vh] overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Lesson</h3>
                  <p className="text-sm text-gray-500">Search lessons and filter by grade or subject.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLessonPickerOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={lessonSearch}
                  onChange={(e) => setLessonSearch(e.target.value)}
                  placeholder="Search by title, description, grade..."
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={lessonGradeFilter}
                  onChange={(e) => setLessonGradeFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                >
                  {lessonGradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade === "All" ? "All Grades" : grade}
                    </option>
                  ))}
                </select>
                <select
                  value={lessonSubjectFilter}
                  onChange={(e) => setLessonSubjectFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                >
                  {lessonSubjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject === "All" ? "All Subjects" : subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="max-h-[55vh] overflow-y-auto divide-y divide-gray-100">
              {filteredLessons.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No lessons match your filters.</div>
              ) : (
                filteredLessons.map((lesson) => {
                  const isActive = String(lesson.id) === formData.lesson;
                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => handleLessonPick(lesson)}
                      className={`w-full text-left px-5 py-4 transition-colors ${isActive ? "bg-emerald-50" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{lesson.title}</p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{lesson.description || "No description"}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {getLessonSubjectLabel(lesson)} • {getLessonGrade(lesson)}
                          </p>
                        </div>
                        {isActive ? <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-emerald-600 shrink-0" /> : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

