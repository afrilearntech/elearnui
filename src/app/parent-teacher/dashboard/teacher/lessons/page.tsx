"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import {
  getTeacherLessons,
  getHeadTeacherLessons,
  TeacherLesson,
  getTeacherSubjects,
  getHeadTeacherSubjects,
  TeacherSubject,
  getTeacherStudents,
  getHeadTeacherStudents,
  TeacherStudent,
  unlockLessonForStudent,
  unlockHeadTeacherLessonForStudent,
  UnlockLessonResponse,
  revokeTeacherLessonUnlock,
  revokeHeadTeacherLessonUnlock,
} from "@/lib/api/parent-teacher/teacher";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";
import { normalizeStoredUserRole } from "@/lib/parent-teacher/displayRole";
import {
  gradesMatch,
  isApprovedStudentStatus,
  lessonHasAssignableGrade,
  resolveLessonGrade,
} from "@/lib/parent-teacher/gradeMatch";
import CreateLessonModal from "@/components/parent-teacher/teacher/CreateLessonModal";
import { ptQueryKeys } from "@/lib/parent-teacher/queryKeys";
import { PortalLoadingOverlay } from "@/components/parent-teacher/PortalDataSkeleton";

function readIsHeadTeacher(): boolean {
  if (typeof window === "undefined") return false;
  const userStr = localStorage.getItem("user");
  if (!userStr) return false;
  try {
    const user = JSON.parse(userStr);
    return normalizeStoredUserRole(user.role) === "Head Teacher";
  } catch {
    return false;
  }
}

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "APPROVED":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "REJECTED":
      return "bg-red-100 text-red-800 border-red-200";
    case "REVIEW_REQUESTED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getTypeColor = (type: string) => {
  switch (type.toUpperCase()) {
    case "VIDEO":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "AUDIO":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "TEXT":
      return "bg-green-100 text-green-800 border-green-200";
    case "INTERACTIVE":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getGradeColor = (grade: string) => {
  const normalizedGrade = grade.toUpperCase();
  if (normalizedGrade.includes("GRADE 1")) return "bg-pink-100 text-pink-800 border-pink-200";
  if (normalizedGrade.includes("GRADE 2")) return "bg-purple-100 text-purple-800 border-purple-200";
  if (normalizedGrade.includes("GRADE 3")) return "bg-sky-100 text-sky-800 border-sky-200";
  if (normalizedGrade.includes("GRADE 4")) return "bg-blue-100 text-blue-800 border-blue-200";
  if (normalizedGrade.includes("GRADE 5")) return "bg-orange-100 text-orange-800 border-orange-200";
  if (normalizedGrade.includes("GRADE 6")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

interface LessonDetailsModalProps {
  lesson: TeacherLesson | null;
  isOpen: boolean;
  onClose: () => void;
}

function LessonDetailsModal({ lesson, isOpen, onClose }: LessonDetailsModalProps) {
  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Lesson Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {lesson.thumbnail && (
              <img
                src={lesson.thumbnail}
                alt={lesson.title}
                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(
                    lesson.type
                  )}`}
                >
                  <Icon icon="solar:play-bold" className="w-4 h-4" />
                  {lesson.type}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                    lesson.status
                  )}`}
                >
                  <Icon icon="solar:document-bold" className="w-4 h-4" />
                  {lesson.status}
                </span>
                {lesson.duration_minutes > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border bg-indigo-50 text-indigo-700 border-indigo-200">
                    <Icon icon="solar:clock-circle-bold" className="w-4 h-4" />
                    {formatDuration(lesson.duration_minutes)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {lesson.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600 leading-relaxed">{lesson.description}</p>
            </div>
          )}

          {/* Resource */}
          {lesson.resource && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Resource</h4>
              <div className="flex items-center gap-2">
                <a
                  href={lesson.resource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 underline flex items-center gap-2"
                >
                  <Icon icon="solar:link-bold" className="w-4 h-4" />
                  View Resource
                </a>
              </div>
            </div>
          )}

          {/* Moderation Comment */}
          {lesson.moderation_comment && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Moderation Comment</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-gray-700">{lesson.moderation_comment}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Subject ID</h4>
              <p className="text-sm text-gray-900">#{lesson.subject}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Topic ID</h4>
              <p className="text-sm text-gray-900">#{lesson.topic}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Period ID</h4>
              <p className="text-sm text-gray-900">#{lesson.period}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Created By</h4>
              <p className="text-sm text-gray-900">Teacher ID: {lesson.created_by}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Created At</h4>
              <p className="text-sm text-gray-900">{formatDateTime(lesson.created_at)}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Last Updated</h4>
              <p className="text-sm text-gray-900">{formatDateTime(lesson.updated_at)}</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Lesson ID</h4>
              <p className="text-sm text-gray-900">#{lesson.id}</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

type TeacherLessonWithMeta = TeacherLesson & {
  subjectName: string;
  grade: string;
};

interface UnlockLessonModalProps {
  isOpen: boolean;
  lesson: TeacherLessonWithMeta | null;
  students: TeacherStudent[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { studentId: number; durationHours: number; reason: string }) => Promise<void>;
}

function UnlockLessonModal({
  isOpen,
  lesson,
  students,
  isSubmitting,
  onClose,
  onSubmit,
}: UnlockLessonModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [durationHours, setDurationHours] = useState<number>(72);
  const [reason, setReason] = useState("");

  const canMatchByGrade = lesson ? lessonHasAssignableGrade(lesson.grade) : false;

  const eligibleStudents = useMemo(() => {
    if (!lesson || !canMatchByGrade) return [];
    return students.filter(
      (student) => gradesMatch(lesson.grade, student.grade) && isApprovedStudentStatus(student.status)
    );
  }, [lesson, students, canMatchByGrade]);

  useEffect(() => {
    if (!isOpen || !lesson) return;
    setDurationHours(72);
    setReason("");
    setSelectedStudentId(eligibleStudents[0] ? String(eligibleStudents[0].id) : "");
  }, [isOpen, lesson, eligibleStudents]);

  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl border border-gray-200">
        <div className="border-b border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Unlock Lesson for Student</h3>
              <p className="text-sm text-gray-600 mt-1">
                Open <span className="font-semibold text-gray-900">{lesson.title}</span> for a student in the same
                grade as this lesson.
              </p>
              {canMatchByGrade ? (
                <div className="mt-3 inline-flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lesson grade</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getGradeColor(
                      lesson.grade
                    )}`}
                  >
                    {lesson.grade}
                  </span>
                  <span className="text-xs text-gray-500">
                    Only {lesson.grade} students you can manage are listed.
                  </span>
                </div>
              ) : null}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors" aria-label="Close unlock lesson modal">
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form
          className="p-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const studentId = Number(selectedStudentId);
            if (!studentId) {
              showErrorToast("Please select a student.");
              return;
            }
            if (!Number.isFinite(durationHours) || durationHours <= 0) {
              showErrorToast("Duration must be greater than 0 hours.");
              return;
            }
            if (reason.trim().length < 3) {
              showErrorToast("Please provide a short reason (at least 3 characters).");
              return;
            }
            await onSubmit({
              studentId,
              durationHours,
              reason: reason.trim(),
            });
          }}
        >
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 text-sm text-emerald-800">
              <Icon icon="solar:info-circle-bold" className="w-4 h-4" />
              Student sees this lesson as available until it expires.
            </div>
          </div>

          {!canMatchByGrade ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Cannot unlock yet</p>
              <p className="text-sm text-amber-800 mt-1">
                This lesson’s subject has no grade assigned in the system. Assign a grade to the subject first, then
                you can unlock for students in that grade.
              </p>
            </div>
          ) : eligibleStudents.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">No matching students</p>
              <p className="text-sm text-gray-600 mt-1">
                There are no approved students in <span className="font-semibold">{lesson.grade}</span> in your list.
                Add or approve students for this grade, then try again.
              </p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Student <span className="text-gray-400 font-normal">({lesson.grade} only)</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={!canMatchByGrade || eligibleStudents.length === 0}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            >
              {eligibleStudents.length === 0 ? (
                <option value="">Select a student…</option>
              ) : (
                eligibleStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.profile.name} — {student.grade} ({student.student_id || `ID ${student.id}`})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (hours)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {[24, 48, 72, 168].map((hours) => (
                <button
                  type="button"
                  key={hours}
                  onClick={() => setDurationHours(hours)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    durationHours === hours
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-emerald-300 hover:bg-emerald-50"
                  }`}
                >
                  {hours}h
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={720}
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Example: Student was absent and needs catch-up access."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm resize-none"
            />
          </div>

          <div className="pt-1 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canMatchByGrade || eligibleStudents.length === 0}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>
                  <Icon icon="solar:lock-unlocked-bold" className="w-4 h-4" />
                  Unlock Lesson
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RevokeLessonModalProps {
  isOpen: boolean;
  lesson: TeacherLessonWithMeta | null;
  students: TeacherStudent[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: { studentId: number }) => Promise<void>;
}

function RevokeLessonModal({
  isOpen,
  lesson,
  students,
  isSubmitting,
  onClose,
  onSubmit,
}: RevokeLessonModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);

  const canMatchByGrade = lesson ? lessonHasAssignableGrade(lesson.grade) : false;

  const eligibleStudents = useMemo(() => {
    if (!lesson || !canMatchByGrade) return [];
    return students.filter(
      (student) => gradesMatch(lesson.grade, student.grade) && isApprovedStudentStatus(student.status)
    );
  }, [lesson, students, canMatchByGrade]);

  useEffect(() => {
    if (!isOpen || !lesson) return;
    setConfirmed(false);
    setSelectedStudentId(eligibleStudents[0] ? String(eligibleStudents[0].id) : "");
  }, [isOpen, lesson, eligibleStudents]);

  if (!isOpen || !lesson) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Icon icon="solar:lock-password-bold" className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold tracking-tight">Remove manual access</h3>
                <p className="text-sm text-white/90 mt-1 leading-snug">
                  Revoke the temporary unlock for{" "}
                  <span className="font-semibold text-white">{lesson.title}</span>. The student follows normal lesson
                  rules again unless another unlock is granted.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/90 hover:text-white transition-colors shrink-0"
              aria-label="Close revoke access modal"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form
          className="p-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const studentId = Number(selectedStudentId);
            if (!studentId) {
              showErrorToast("Please select a student.");
              return;
            }
            if (!confirmed) {
              showErrorToast("Confirm that you want to remove this student’s access.");
              return;
            }
            await onSubmit({ studentId });
          }}
        >
          {canMatchByGrade ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <div className="flex gap-2 text-sm text-rose-900">
                <Icon icon="solar:danger-triangle-bold" className="w-5 h-5 shrink-0 text-rose-600" />
                <p>
                  This ends teacher-granted access immediately. If the lesson is still locked by progression, the
                  student will not be able to open it until they meet the usual requirements.
                </p>
              </div>
            </div>
          ) : null}

          {!canMatchByGrade ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Cannot revoke from this lesson</p>
              <p className="text-sm text-amber-800 mt-1">
                This lesson’s subject has no grade assigned, so we cannot match students safely. Fix the subject grade
                first.
              </p>
            </div>
          ) : eligibleStudents.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">No matching students</p>
              <p className="text-sm text-gray-600 mt-1">
                There are no approved students in <span className="font-semibold">{lesson.grade}</span> in your list.
              </p>
            </div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Student <span className="text-gray-400 font-normal">({lesson.grade} only)</span>
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={!canMatchByGrade || eligibleStudents.length === 0}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            >
              {eligibleStudents.length === 0 ? (
                <option value="">Select a student…</option>
              ) : (
                eligibleStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.profile.name} — {student.grade} ({student.student_id || `ID ${student.id}`})
                  </option>
                ))
              )}
            </select>
          </div>

          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-gray-200 bg-gray-50/80 p-3 hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="text-sm text-gray-700 leading-relaxed">
              I understand this removes the active manual unlock for the selected student and this lesson.
            </span>
          </label>

          <div className="pt-1 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canMatchByGrade || eligibleStudents.length === 0 || !confirmed}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                  Revoking…
                </>
              ) : (
                <>
                  <Icon icon="solar:lock-bold" className="w-4 h-4" />
                  Revoke access
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LessonsPage() {
  const queryClient = useQueryClient();
  const { data: lessonsBundle, isPending: isLessonsLoading, isError: isLessonsError, error: lessonsError } = useQuery({
    queryKey: ptQueryKeys.lessonsBundle,
    queryFn: async () => {
      const isHeadTeacher = readIsHeadTeacher();
      const [lessonsData, subjectsData, studentsData] = await Promise.all([
        isHeadTeacher ? getHeadTeacherLessons() : getTeacherLessons(),
        isHeadTeacher ? getHeadTeacherSubjects() : getTeacherSubjects(),
        isHeadTeacher ? getHeadTeacherStudents() : getTeacherStudents(),
      ]);
      return {
        lessons: lessonsData,
        subjects: subjectsData,
        students: studentsData,
      };
    },
  });

  useEffect(() => {
    if (!isLessonsError) return;
    console.error("Error fetching lessons:", lessonsError);
    showErrorToast("Failed to load lessons. Please try again.");
  }, [isLessonsError, lessonsError]);

  const lessons = lessonsBundle?.lessons ?? [];
  const subjects = lessonsBundle?.subjects ?? [];
  const students = lessonsBundle?.students ?? [];
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("All");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedLesson, setSelectedLesson] = useState<TeacherLesson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockLessonTarget, setUnlockLessonTarget] = useState<TeacherLessonWithMeta | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [revokeLessonTarget, setRevokeLessonTarget] = useState<TeacherLessonWithMeta | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const subjectMap = useMemo(() => {
    return subjects.reduce<Record<number, TeacherSubject>>((acc, subject) => {
      acc[subject.id] = subject;
      return acc;
    }, {});
  }, [subjects]);

  const lessonsWithSubjectMeta = useMemo(() => {
    return lessons.map((lesson) => {
      const matchedSubject = subjectMap[lesson.subject];
      return {
        ...lesson,
        subjectName: matchedSubject?.name || `Subject #${lesson.subject}`,
        grade: resolveLessonGrade(lesson, matchedSubject),
      };
    });
  }, [lessons, subjectMap]);

  const filteredLessons = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return lessonsWithSubjectMeta.filter((lesson) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        lesson.title.toLowerCase().includes(normalizedSearch) ||
        lesson.description?.toLowerCase().includes(normalizedSearch) ||
        lesson.subjectName.toLowerCase().includes(normalizedSearch) ||
        lesson.grade.toLowerCase().includes(normalizedSearch);

      const matchesType = selectedType === "All" || lesson.type.toUpperCase() === selectedType.toUpperCase();
      const matchesStatus =
        selectedStatus === "All" || lesson.status.toUpperCase() === selectedStatus.toUpperCase();
      const matchesGrade = selectedGrade === "All" || lesson.grade === selectedGrade;
      const matchesSubject =
        selectedSubjectId === "All" || lesson.subject.toString() === selectedSubjectId;

      return matchesSearch && matchesType && matchesStatus && matchesGrade && matchesSubject;
    });
  }, [lessonsWithSubjectMeta, search, selectedType, selectedStatus, selectedGrade, selectedSubjectId]);

  const types = ["All", ...Array.from(new Set(lessonsWithSubjectMeta.map((l) => l.type)))];
  const grades = ["All", ...Array.from(new Set(lessonsWithSubjectMeta.map((l) => l.grade)))];
  const gradeTabOptions = ["All", ...grades.filter((grade) => grade !== "All")];
  const allSubjectOptions = [
    ...Array.from(
      new Map(
        lessonsWithSubjectMeta.map((lesson) => [
          lesson.subject,
          { id: lesson.subject.toString(), name: lesson.subjectName },
        ])
      ).values()
    ).sort((a, b) => a.name.localeCompare(b.name)),
  ];
  const subjectOptions = [
    { id: "All", name: "All Subjects" },
    ...allSubjectOptions.filter((subject) => {
      if (selectedGrade === "All") return true;
      return lessonsWithSubjectMeta.some(
        (lesson) => lesson.subject.toString() === subject.id && lesson.grade === selectedGrade
      );
    }),
  ];
  const statuses = ["All", "DRAFT", "PENDING", "APPROVED", "REJECTED", "REVIEW_REQUESTED"];
  const sortedLessons = useMemo(() => {
    return [...filteredLessons].sort((a, b) => {
      const subjectComparison = a.subjectName.localeCompare(b.subjectName);
      if (subjectComparison !== 0) return subjectComparison;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [filteredLessons]);

  useEffect(() => {
    if (selectedSubjectId === "All") return;
    const existsInOptions = subjectOptions.some((subject) => subject.id === selectedSubjectId);
    if (!existsInOptions) {
      setSelectedSubjectId("All");
    }
  }, [selectedSubjectId, subjectOptions]);

  const handleView = (lesson: TeacherLesson) => {
    setSelectedLesson(lesson);
    setIsModalOpen(true);
  };

  const handleCreateLesson = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ptQueryKeys.lessonsBundle });
  };

  const handleOpenUnlock = (lesson: TeacherLessonWithMeta) => {
    setUnlockLessonTarget(lesson);
    setIsUnlockModalOpen(true);
  };

  const handleOpenRevoke = (lesson: TeacherLessonWithMeta) => {
    setRevokeLessonTarget(lesson);
    setIsRevokeModalOpen(true);
  };

  const handleUnlockSubmit = async (payload: { studentId: number; durationHours: number; reason: string }) => {
    if (!unlockLessonTarget) return;
    const lesson = unlockLessonTarget;
    if (
      !lessonHasAssignableGrade(lesson.grade) ||
      !students.some(
        (s) =>
          s.id === payload.studentId &&
          gradesMatch(lesson.grade, s.grade) &&
          isApprovedStudentStatus(s.status)
      )
    ) {
      showErrorToast("Choose a student in the same grade as this lesson.");
      return;
    }
    try {
      setIsUnlocking(true);
      const studentRecord = students.find((s) => s.id === payload.studentId);
      const unlockBase = {
        lesson_id: unlockLessonTarget.id,
        duration_hours: payload.durationHours,
        reason: payload.reason,
      };

      const callUnlock = async (studentIdForApi: number): Promise<UnlockLessonResponse> => {
        const body = { ...unlockBase, student_id: studentIdForApi };
        if (readIsHeadTeacher()) {
          try {
            return await unlockHeadTeacherLessonForStudent(body);
          } catch (err) {
            if (err instanceof ApiClientError && err.status === 404) {
              return await unlockLessonForStudent(body);
            }
            throw err;
          }
        }
        return await unlockLessonForStudent(body);
      };

      let response: UnlockLessonResponse;
      try {
        response = await callUnlock(payload.studentId);
      } catch (firstErr) {
        const looksLikeGradeMismatch =
          firstErr instanceof ApiClientError &&
          /lesson grade does not match/i.test(String(firstErr.message));
        const profileId = studentRecord?.profile?.id;
        if (
          looksLikeGradeMismatch &&
          profileId != null &&
          profileId !== payload.studentId
        ) {
          response = await callUnlock(profileId);
        } else {
          throw firstErr;
        }
      }

      const expiresLabel = response.expires_at ? formatDateTime(response.expires_at) : `${payload.durationHours} hours`;
      showSuccessToast(`Lesson unlocked successfully. Access expires ${expiresLabel}.`);

      await queryClient.invalidateQueries({ queryKey: ptQueryKeys.lessonsBundle });

      setIsUnlockModalOpen(false);
      setUnlockLessonTarget(null);
    } catch (error) {
      console.error("Error unlocking lesson:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to unlock lesson. Please try again.");
      } else {
        showErrorToast("Failed to unlock lesson. Please try again.");
      }
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleRevokeSubmit = async (payload: { studentId: number }) => {
    if (!revokeLessonTarget) return;
    const lesson = revokeLessonTarget;
    if (
      !lessonHasAssignableGrade(lesson.grade) ||
      !students.some(
        (s) =>
          s.id === payload.studentId &&
          gradesMatch(lesson.grade, s.grade) &&
          isApprovedStudentStatus(s.status)
      )
    ) {
      showErrorToast("Choose a student in the same grade as this lesson.");
      return;
    }
    try {
      setIsRevoking(true);
      const revokeBase = {
        lesson_id: revokeLessonTarget.id,
        student_id: payload.studentId,
      };

      const callRevoke = async (studentIdForApi: number): Promise<UnlockLessonResponse> => {
        const body = { ...revokeBase, student_id: studentIdForApi };
        if (readIsHeadTeacher()) {
          try {
            return await revokeHeadTeacherLessonUnlock(body);
          } catch (err) {
            if (err instanceof ApiClientError && err.status === 404) {
              return await revokeTeacherLessonUnlock(body);
            }
            throw err;
          }
        }
        return await revokeTeacherLessonUnlock(body);
      };

      try {
        await callRevoke(payload.studentId);
      } catch (firstErr) {
        const gradeMismatch =
          firstErr instanceof ApiClientError &&
          /lesson grade does not match/i.test(String(firstErr.message));
        const studentRecord = students.find((s) => s.id === payload.studentId);
        const profileId = studentRecord?.profile?.id;
        if (gradeMismatch && profileId != null && profileId !== payload.studentId) {
          await callRevoke(profileId);
        } else {
          throw firstErr;
        }
      }

      showSuccessToast("Manual access removed. The student no longer has this unlock.");

      await queryClient.invalidateQueries({ queryKey: ptQueryKeys.lessonsBundle });

      setIsRevokeModalOpen(false);
      setRevokeLessonTarget(null);
    } catch (error) {
      console.error("Error revoking lesson unlock:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to revoke access. Please try again.");
      } else {
        showErrorToast("Failed to revoke access. Please try again.");
      }
    } finally {
      setIsRevoking(false);
    }
  };

  if (isLessonsLoading && !lessonsBundle) {
    return (
      <DashboardLayout>
        <PortalLoadingOverlay label="Loading lessons…" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lessons</h1>
            <p className="text-gray-600 mt-1">Manage and view all your lessons</p>
          </div>
          <button
            onClick={handleCreateLesson}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
          >
            <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
            Create Lesson
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          {/* Grade Tabs */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Grades</p>
            <div className="overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max">
                {gradeTabOptions.map((grade) => {
                  const isSelected = selectedGrade === grade;
                  const gradeCount = grade === "All"
                    ? lessonsWithSubjectMeta.length
                    : lessonsWithSubjectMeta.filter((lesson) => lesson.grade === grade).length;
                  return (
                    <button
                      key={grade}
                      onClick={() => setSelectedGrade(grade)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-gray-700 border-gray-300 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      {grade === "All" ? "All Grades" : grade} ({gradeCount})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Icon
                  icon="solar:magnifer-bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
                />
                <input
                  type="text"
                  placeholder="Search by title, description, grade, or subject..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto flex-wrap">
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {subjectOptions.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type === "All" ? "All Resource Types" : type}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "All Statuses" : status}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedGrade("All");
                  setSelectedSubjectId("All");
                  setSelectedType("All");
                  setSelectedStatus("All");
                }}
                className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredLessons.length}</span> lesson
            {filteredLessons.length !== 1 ? "s" : ""} in{" "}
            <span className="font-semibold text-gray-900">{selectedGrade === "All" ? "all grades" : selectedGrade}</span>
          </div>

          {/* Lessons Table */}
          {sortedLessons.length > 0 ? (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full table-fixed min-w-[1060px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="w-[30%] text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Lesson</th>
                      <th className="w-[18%] text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Subject</th>
                      <th className="w-[12%] text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Grade</th>
                      <th className="w-[10%] text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Duration</th>
                      <th className="w-[13%] text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Created</th>
                      <th className="w-[17%] text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedLessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {lesson.thumbnail && (
                              <img
                                src={lesson.thumbnail}
                                alt={lesson.title}
                                className="w-10 h-10 object-cover rounded border border-gray-200 hidden sm:block"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{lesson.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${getTypeColor(lesson.type)}`}>
                                  {lesson.type}
                                </span>
                                {lesson.description && (
                                  <p className="text-xs text-gray-500 line-clamp-1">
                                    {lesson.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="block text-sm font-medium text-gray-800 truncate">{lesson.subjectName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getGradeColor(lesson.grade)}`}>
                            {lesson.grade}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-700">
                            {lesson.duration_minutes > 0 ? formatDuration(lesson.duration_minutes) : "N/A"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-gray-600">{formatDate(lesson.created_at)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenUnlock(lesson)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              <Icon icon="solar:lock-unlocked-bold" className="w-4 h-4" />
                              Unlock
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRevoke(lesson)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                            >
                              <Icon icon="solar:lock-bold" className="w-4 h-4" />
                              Revoke
                            </button>
                            <button
                              type="button"
                              onClick={() => handleView(lesson)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                            >
                              <Icon icon="solar:eye-bold" className="w-4 h-4" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-sm">
                No lessons found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>

      <LessonDetailsModal
        lesson={selectedLesson}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLesson(null);
        }}
      />

      <CreateLessonModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <UnlockLessonModal
        isOpen={isUnlockModalOpen}
        lesson={unlockLessonTarget}
        students={students}
        isSubmitting={isUnlocking}
        onClose={() => {
          if (isUnlocking) return;
          setIsUnlockModalOpen(false);
          setUnlockLessonTarget(null);
        }}
        onSubmit={handleUnlockSubmit}
      />

      <RevokeLessonModal
        isOpen={isRevokeModalOpen}
        lesson={revokeLessonTarget}
        students={students}
        isSubmitting={isRevoking}
        onClose={() => {
          if (isRevoking) return;
          setIsRevokeModalOpen(false);
          setRevokeLessonTarget(null);
        }}
        onSubmit={handleRevokeSubmit}
      />
    </DashboardLayout>
  );
}

