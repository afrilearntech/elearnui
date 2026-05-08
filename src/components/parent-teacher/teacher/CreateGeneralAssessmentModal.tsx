"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import {
  createGeneralAssessment,
  getTeacherStudents,
  getTeacherSubjects,
  TeacherStudent,
  TeacherSubject,
} from "@/lib/api/parent-teacher/teacher";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

interface CreateGeneralAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentGradeFilter, setStudentGradeFilter] = useState("All");
  const [studentSubjectFilter, setStudentSubjectFilter] = useState("All");
  const [isTargeted, setIsTargeted] = useState(false);
  const [selectedStudentDbId, setSelectedStudentDbId] = useState<number | null>(null);
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
      void fetchStudentsForTargeting();
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
    setStudentSearch("");
    setStudentGradeFilter("All");
    setStudentSubjectFilter("All");
    setIsTargeted(false);
    setSelectedStudentDbId(null);
  };

  const fetchStudentsForTargeting = async () => {
    try {
      setIsLoadingStudents(true);
      const [studentRows, subjectRows] = await Promise.all([getTeacherStudents(), getTeacherSubjects()]);
      setStudents(studentRows);
      setSubjects(subjectRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load students.";
      showErrorToast(message);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const subjectOptions = ["All", ...Array.from(new Set(subjects.map((subject) => subject.name).filter(Boolean)))];
  const gradeOptions = ["All", ...Array.from(new Set(students.map((student) => student.grade).filter(Boolean)))];
  const assignedGradeOptions = Array.from(
    new Set(subjects.map((subject) => subject.grade).filter((grade) => Boolean(grade && grade.trim()))),
  );

  const filteredStudents = students.filter((student) => {
    if (student.status !== "APPROVED") return false;
    const needle = studentSearch.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      student.profile.name.toLowerCase().includes(needle) ||
      student.profile.email.toLowerCase().includes(needle) ||
      (student.student_id || "").toLowerCase().includes(needle);
    const matchesGrade = studentGradeFilter === "All" || student.grade === studentGradeFilter;
    const matchingSubjectGrades = new Set(
      subjects
        .filter((subject) => studentSubjectFilter === "All" || subject.name === studentSubjectFilter)
        .map((subject) => subject.grade),
    );
    const matchesSubject =
      studentSubjectFilter === "All" ||
      (matchingSubjectGrades.size > 0 && matchingSubjectGrades.has(student.grade));
    return matchesSearch && matchesGrade && matchesSubject;
  });

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

    const selectedStudent = students.find((student) => student.id === selectedStudentDbId) ?? null;
    const selectedStudentPublicId = selectedStudent?.student_id?.trim() || "";

    if (isTargeted && !selectedStudentDbId) {
      newErrors.target_student = "Please select a student to target.";
    } else if (isTargeted && selectedStudentPublicId.length === 0) {
      newErrors.target_student = "Selected student does not have a valid student ID.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const selectedStudent = students.find((student) => student.id === selectedStudentDbId) ?? null;

    setIsSubmitting(true);
    try {
      await createGeneralAssessment({
        title: formData.title.trim(),
        type: formData.type,
        instructions: formData.instructions.trim(),
        marks: Number(formData.marks),
        due_at: new Date(formData.due_at).toISOString(),
        grade: formData.grade,
        ai_recommended: false,
        is_targeted: isTargeted,
        target_student: isTargeted && selectedStudent?.student_id ? selectedStudent.student_id : null,
        status: "APPROVED",
        moderation_comment: "",
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
                disabled={isLoadingStudents}
                className={`w-full h-11 rounded-lg border px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                  errors.grade ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">
                  {isLoadingStudents ? "Loading assigned grades..." : "Select grade"}
                </option>
                {assignedGradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              {!isLoadingStudents && assignedGradeOptions.length === 0 ? (
                <p className="mt-1 text-xs text-amber-700">
                  No assigned subject grades found for this teacher yet.
                </p>
              ) : null}
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

          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Target Assessment to One Student</h3>
                <p className="mt-1 text-xs text-gray-600">
                  Turn this on to create personalized assessments for a selected student.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !isTargeted;
                  setIsTargeted(next);
                  if (!next) {
                    setSelectedStudentDbId(null);
                    setErrors((prev) => ({ ...prev, target_student: "" }));
                  }
                }}
                className={`inline-flex h-7 w-14 items-center rounded-full transition ${
                  isTargeted ? "bg-indigo-600 justify-end" : "bg-gray-300 justify-start"
                } p-1`}
                aria-label="Toggle targeted assessment"
              >
                <span className="h-5 w-5 rounded-full bg-white shadow" />
              </button>
            </div>

            {isTargeted ? (
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsStudentPickerOpen(true);
                    void fetchStudentsForTargeting();
                  }}
                  className={`inline-flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm ${
                    errors.target_student ? "border-red-400 bg-red-50" : "border-indigo-300 bg-white"
                  }`}
                >
                  <span className="text-gray-700">
                    {selectedStudentDbId
                      ? `Selected student: ${
                          students.find((student) => student.id === selectedStudentDbId)?.student_id ||
                          selectedStudentDbId
                        }`
                      : "Select student to target"}
                  </span>
                  <Icon icon="solar:users-group-two-rounded-bold" className="h-5 w-5 text-indigo-600" />
                </button>
                {errors.target_student ? (
                  <p className="text-sm text-red-600">{errors.target_student}</p>
                ) : null}
              </div>
            ) : null}
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

      {isStudentPickerOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-2xl max-h-[88vh] overflow-hidden">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Select Target Student</h3>
                  <p className="text-sm text-gray-500">Filter by class and subject to find students faster.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStudentPickerOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by name, email, or ID..."
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={studentGradeFilter}
                  onChange={(e) => setStudentGradeFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade === "All" ? "All Classes (Grades)" : grade}
                    </option>
                  ))}
                </select>
                <select
                  value={studentSubjectFilter}
                  onChange={(e) => setStudentSubjectFilter(e.target.value)}
                  className="h-10 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                >
                  {subjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject === "All" ? "All Subjects" : subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="max-h-[55vh] overflow-y-auto divide-y divide-gray-100">
              {isLoadingStudents ? (
                <div className="p-8 text-center text-sm text-gray-500">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No approved students match your filters.</div>
              ) : (
                filteredStudents.map((student) => {
                  const isActive = selectedStudentDbId === student.id;
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => setSelectedStudentDbId(student.id)}
                      className={`w-full px-5 py-4 text-left transition-colors ${
                        isActive ? "bg-indigo-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{student.profile.name}</p>
                          <p className="mt-1 text-xs text-gray-600">{student.profile.email}</p>
                          <p className="mt-2 text-xs text-gray-500">
                            {student.grade} • ID: {student.student_id || student.id}
                          </p>
                        </div>
                        {isActive ? (
                          <Icon icon="solar:check-circle-bold" className="h-5 w-5 shrink-0 text-indigo-600" />
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="border-t border-gray-200 p-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsStudentPickerOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

