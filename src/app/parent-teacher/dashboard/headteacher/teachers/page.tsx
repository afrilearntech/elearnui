"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import {
  getHeadTeacherTeachers,
  TeacherRecord,
} from "@/lib/api/parent-teacher/teacher";
import { getUserProfile } from "@/lib/api/auth";
import { showErrorToast } from "@/lib/toast";
import AddTeacherModal from "@/components/parent-teacher/teacher/AddTeacherModal";
import BulkUploadTeachersModal from "@/components/parent-teacher/teacher/BulkUploadTeachersModal";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusColor = (status: string) => {
  const normalized = status.toUpperCase();
  if (normalized === "APPROVED") return "bg-green-100 text-green-700 border-green-200";
  if (normalized === "PENDING") return "bg-amber-100 text-amber-700 border-amber-200";
  if (normalized === "REJECTED") return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

export default function HeadTeacherTeachersPage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRecord | null>(null);
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

  const refreshTeachers = async () => {
    try {
      setIsLoading(true);
      const data = await getHeadTeacherTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      showErrorToast("Failed to load teachers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

    const boot = async () => {
      await refreshTeachers();
      const token = localStorage.getItem("auth_token");
      if (token) {
        const profile = await getUserProfile(token).catch(() => null);
        if (profile?.teacher?.school_id) {
          setSchoolId(profile.teacher.school_id);
        }
      }
    };

    boot();
  }, [router]);

  const statuses = useMemo(
    () => ["All", ...Array.from(new Set(teachers.map((teacher) => teacher.status))).sort()],
    [teachers]
  );

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const matchesSearch =
        q.length === 0 ||
        teacher.profile.name.toLowerCase().includes(q) ||
        teacher.profile.email.toLowerCase().includes(q) ||
        teacher.profile.phone.toLowerCase().includes(q) ||
        (teacher.teacher_id || "").toLowerCase().includes(q);

      const matchesStatus = selectedStatus === "All" || teacher.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [teachers, search, selectedStatus]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[420px]">
          <div className="text-center">
            <Icon icon="solar:loading-bold" className="w-9 h-9 text-indigo-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading school teachers...</p>
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
                <Icon icon="solar:user-id-bold" className="w-4 h-4" />
                Head Teacher Faculty Management
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Teachers in Your School</h1>
              <p className="text-white/90 mt-2 max-w-2xl">
                View all teachers, add new faculty members, and onboard many at once with bulk upload.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsAddTeacherModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white text-indigo-700 px-5 py-2.5 font-semibold shadow hover:bg-indigo-50 transition-colors"
              >
                <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                Add Teacher
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

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Icon icon="solar:magnifer-bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by teacher name, ID, email, or phone..."
                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
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

          <div className="mb-4 pb-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredTeachers.length}</span> teacher
              {filteredTeachers.length === 1 ? "" : "s"}
            </p>
          </div>

          {filteredTeachers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTeachers.map((teacher) => (
                <article
                  key={teacher.id}
                  className="rounded-xl border border-gray-200 p-4 bg-gray-50/60 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{teacher.profile.name}</h3>
                      <p className="text-xs text-gray-500">{teacher.profile.email}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(teacher.status)}`}>
                      {teacher.status}
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-gray-600 space-y-1.5">
                    <p><span className="font-semibold">Teacher ID:</span> {teacher.teacher_id || `ID ${teacher.id}`}</p>
                    <p><span className="font-semibold">Phone:</span> {teacher.profile.phone || "N/A"}</p>
                    <p><span className="font-semibold">Joined:</span> {formatDate(teacher.created_at)}</p>
                  </div>

                  <button
                    onClick={() => setSelectedTeacher(teacher)}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    <Icon icon="solar:eye-bold" className="w-4 h-4" />
                    View Details
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-sm">No teachers found matching your filters.</p>
            </div>
          )}
        </section>
      </div>

      {selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Teacher Details</h2>
                <p className="text-sm text-gray-600">{selectedTeacher.profile.name}</p>
              </div>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close teacher details"
              >
                <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500 mb-1">Teacher ID</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedTeacher.teacher_id || `ID ${selectedTeacher.id}`}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(selectedTeacher.status)}`}>
                    {selectedTeacher.status}
                  </span>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedTeacher.profile.email}</p>
                </div>
                <div className="rounded-xl border border-gray-200 p-3">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedTeacher.profile.phone || "N/A"}</p>
                </div>
              </div>

              {selectedTeacher.moderation_comment && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Moderation Comment</p>
                  <p className="text-sm text-amber-900">{selectedTeacher.moderation_comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AddTeacherModal
        isOpen={isAddTeacherModalOpen}
        onClose={() => setIsAddTeacherModalOpen(false)}
        onSuccess={refreshTeachers}
        schoolId={schoolId}
        roleMode="headteacher"
      />

      <BulkUploadTeachersModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={refreshTeachers}
        roleMode="headteacher"
      />
    </DashboardLayout>
  );
}

