"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import {
  getHeadTeacherStudents,
  HeadTeacherStudent,
  approveHeadTeacherStudent,
  rejectHeadTeacherStudent,
} from "@/lib/api/parent-teacher/teacher";
import { getUserProfile } from "@/lib/api/auth";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import AddStudentModal from "@/components/parent-teacher/teacher/AddStudentModal";
import BulkUploadModal from "@/components/parent-teacher/teacher/BulkUploadModal";

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const todayDateOnly = () => new Date().toISOString().split("T")[0];

const statusColor = (status: string) => {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "bg-green-100 text-green-700 border-green-200";
  if (normalized === "PENDING") return "bg-amber-100 text-amber-700 border-amber-200";
  if (normalized === "REJECTED") return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

export default function HeadTeacherStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<HeadTeacherStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState<HeadTeacherStudent | null>(null);
  const [headTeacherSchoolId, setHeadTeacherSchoolId] = useState<number | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isModeratingStudentId, setIsModeratingStudentId] = useState<number | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/parent-teacher/sign-in/teacher");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user?.role !== "HEADTEACHER") {
        router.push("/parent-teacher/dashboard/teacher");
        return;
      }
    } catch {
      router.push("/parent-teacher/sign-in/teacher");
      return;
    }

    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("auth_token");
        const [data, profile] = await Promise.all([
          getHeadTeacherStudents(),
          token ? getUserProfile(token).catch(() => null) : Promise.resolve(null),
        ]);
        setStudents(data);
        if (profile?.teacher?.school_id) {
          setHeadTeacherSchoolId(profile.teacher.school_id);
        }
      } catch (error) {
        console.error("Error fetching headteacher students:", error);
        showErrorToast("Failed to load students. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [router]);

  const grades = useMemo(
    () => ["All", ...Array.from(new Set(students.map((s) => s.grade))).sort()],
    [students]
  );

  const statuses = useMemo(
    () => ["All", ...Array.from(new Set(students.map((s) => s.status))).sort()],
    [students]
  );

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        student.profile.name.toLowerCase().includes(normalizedSearch) ||
        student.profile.email.toLowerCase().includes(normalizedSearch) ||
        (student.student_id || "").toLowerCase().includes(normalizedSearch) ||
        student.school.name.toLowerCase().includes(normalizedSearch);

      const matchesGrade = selectedGrade === "All" || student.grade === selectedGrade;
      const matchesStatus = selectedStatus === "All" || student.status === selectedStatus;
      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [students, search, selectedGrade, selectedStatus]);

  const stats = useMemo(() => {
    const total = filteredStudents.length;
    const totalPoints = filteredStudents.reduce((sum, s) => sum + (s.points || 0), 0);
    const avgPoints = total > 0 ? Math.round(totalPoints / total) : 0;
    const avgCurrentStreak =
      total > 0
        ? Math.round(
            filteredStudents.reduce((sum, s) => sum + (s.current_login_streak || 0), 0) / total
          )
        : 0;
    const activeToday = filteredStudents.filter(
      (student) => student.last_login_activity_date === todayDateOnly()
    ).length;
    return { total, avgPoints, avgCurrentStreak, activeToday };
  }, [filteredStudents]);

  const handleModerateStudent = async (student: HeadTeacherStudent, action: "approve" | "reject") => {
    try {
      setIsModeratingStudentId(student.id);
      const updated =
        action === "approve"
          ? await approveHeadTeacherStudent(student.id)
          : await rejectHeadTeacherStudent(student.id);

      setStudents((prev) => prev.map((item) => (item.id === student.id ? updated : item)));
      setSelectedStudent((prev) => (prev && prev.id === student.id ? updated : prev));
      showSuccessToast(
        action === "approve"
          ? `${student.profile.name} approved successfully.`
          : `${student.profile.name} rejected successfully.`
      );
    } catch (error) {
      console.error(`Error trying to ${action} student`, error);
      showErrorToast(`Failed to ${action} student. Please try again.`);
    } finally {
      setIsModeratingStudentId(null);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[420px]">
          <div className="text-center">
            <Icon icon="solar:loading-bold" className="w-9 h-9 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading school students...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 text-white p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold tracking-wide uppercase mb-3">
                <Icon icon="solar:users-group-two-rounded-bold" className="w-4 h-4" />
                Head Teacher Student Management
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Students in Your School</h1>
              <p className="text-white/90 mt-2 max-w-2xl">
                Track attendance signals, engagement points, and learning consistency across the entire school.
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-4 min-w-[220px]">
              <p className="text-xs text-white/80">Active Today</p>
              <p className="text-3xl font-bold">{stats.activeToday}</p>
              <p className="text-xs text-white/80 mt-1">Students with login activity</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsAddStudentModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white text-indigo-700 px-5 py-2.5 font-semibold shadow hover:bg-indigo-50 transition-colors"
              >
                <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                Add Student
              </button>
              <button
                onClick={() => setIsBulkUploadModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white/15 border border-white/30 text-white px-5 py-2.5 font-semibold hover:bg-white/20 transition-colors"
              >
                <Icon icon="solar:upload-bold" className="w-5 h-5" />
                Bulk Upload
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <article className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total.toLocaleString()}</p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Average Points</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.avgPoints.toLocaleString()}</p>
          </article>
          <article className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Average Streak</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.avgCurrentStreak} days</p>
          </article>
          <article className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Grades Covered</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{Math.max(0, grades.length - 1)}</p>
          </article>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Icon icon="solar:magnifer-bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by student name, ID, email, or school..."
                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade === "All" ? "All Grades" : grade}
                  </option>
                ))}
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "All Statuses" : status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStudents.map((student) => (
                <article key={student.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50/60 hover:shadow-sm transition-shadow">
                  {(() => {
                    const isPending = student.status?.toUpperCase() === "PENDING";
                    return (
                      <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{student.profile.name}</h3>
                      <p className="text-xs text-gray-500">{student.profile.email}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(student.status)}`}>
                      {student.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                      <p className="text-gray-500">Grade</p>
                      <p className="font-semibold text-gray-800">{student.grade}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                      <p className="text-gray-500">Student ID</p>
                      <p className="font-semibold text-gray-800">{student.student_id || `ID ${student.id}`}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                      <p className="text-gray-500">Points</p>
                      <p className="font-semibold text-emerald-700">{(student.points || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white p-2.5">
                      <p className="text-gray-500">Current Streak</p>
                      <p className="font-semibold text-orange-700">{student.current_login_streak || 0} day(s)</p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    <p className="truncate"><span className="font-semibold">School:</span> {student.school.name}</p>
                    <p className="truncate"><span className="font-semibold">District:</span> {student.school.district_name}</p>
                    <p className="truncate"><span className="font-semibold">Last Active:</span> {formatDate(student.last_login_activity_date)}</p>
                  </div>

                  <button
                    onClick={() => setSelectedStudent(student)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Icon icon="solar:eye-bold" className="w-4 h-4" />
                    View Details
                  </button>

                  {isPending && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleModerateStudent(student, "approve")}
                        disabled={isModeratingStudentId === student.id}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isModeratingStudentId === student.id ? (
                          <>
                            <Icon icon="solar:loading-bold" className="w-3.5 h-3.5 animate-spin" />
                            Processing
                          </>
                        ) : (
                          <>
                            <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleModerateStudent(student, "reject")}
                        disabled={isModeratingStudentId === student.id}
                        className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isModeratingStudentId === student.id ? (
                          <>
                            <Icon icon="solar:loading-bold" className="w-3.5 h-3.5 animate-spin" />
                            Processing
                          </>
                        ) : (
                          <>
                            <Icon icon="solar:close-circle-bold" className="w-3.5 h-3.5" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  )}
                      </>
                    );
                  })()}
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-sm">No students found for your current filters.</p>
            </div>
          )}
        </section>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35">
          {(() => {
            const isPending = selectedStudent.status?.toUpperCase() === "PENDING";
            return (
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Student Details</h2>
                <p className="text-sm text-gray-600">{selectedStudent.profile.name}</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close student details"
              >
                <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {isPending && (
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleModerateStudent(selectedStudent, "approve")}
                    disabled={isModeratingStudentId === selectedStudent.id}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isModeratingStudentId === selectedStudent.id ? (
                      <>
                        <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleModerateStudent(selectedStudent, "reject")}
                    disabled={isModeratingStudentId === selectedStudent.id}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isModeratingStudentId === selectedStudent.id ? (
                      <>
                        <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                        Processing
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Points</p>
                  <p className="text-lg font-bold text-emerald-700">{selectedStudent.points.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Current Streak</p>
                  <p className="text-lg font-bold text-orange-700">{selectedStudent.current_login_streak} day(s)</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Best Streak</p>
                  <p className="text-lg font-bold text-indigo-700">{selectedStudent.max_login_streak} day(s)</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Last Activity</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(selectedStudent.last_login_activity_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500 mb-1">Profile</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedStudent.profile.name}</p>
                  <p className="text-xs text-gray-600">{selectedStudent.profile.email}</p>
                  <p className="text-xs text-gray-600 mt-1">{selectedStudent.profile.phone || "No phone"}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500 mb-1">School</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedStudent.school.name}</p>
                  <p className="text-xs text-gray-600">
                    {selectedStudent.school.district_name}, {selectedStudent.school.county_name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Grade: {selectedStudent.grade}</p>
                </div>
              </div>

              {selectedStudent.moderation_comment && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Moderation Comment</p>
                  <p className="text-sm text-amber-900">{selectedStudent.moderation_comment}</p>
                </div>
              )}
            </div>
          </div>
            );
          })()}
        </div>
      )}

      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        roleMode="headteacher"
        schoolId={headTeacherSchoolId}
        onSuccess={async () => {
          try {
            const data = await getHeadTeacherStudents();
            setStudents(data);
          } catch (error) {
            console.error("Error refreshing students:", error);
          }
        }}
      />

      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        roleMode="headteacher"
        onSuccess={async () => {
          try {
            const data = await getHeadTeacherStudents();
            setStudents(data);
          } catch (error) {
            console.error("Error refreshing students:", error);
          }
        }}
      />
    </DashboardLayout>
  );
}

