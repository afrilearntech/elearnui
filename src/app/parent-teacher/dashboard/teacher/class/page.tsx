"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { getTeacherStudents, TeacherStudent, approveStudent, rejectStudent } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";
import AddStudentModal from "@/components/parent-teacher/teacher/AddStudentModal";
import BulkUploadModal from "@/components/parent-teacher/teacher/BulkUploadModal";
import { ptQueryKeys } from "@/lib/parent-teacher/queryKeys";
import { PortalLoadingOverlay } from "@/components/parent-teacher/PortalDataSkeleton";


const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function MyClassPage() {
  const queryClient = useQueryClient();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ptQueryKeys.teacherClassStudents,
    queryFn: getTeacherStudents,
  });
  const students = data ?? [];

  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<TeacherStudent | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isModerating, setIsModerating] = useState<number | null>(null); // Track which student is being moderated
  const pageSize = 9;

  useEffect(() => {
    if (!isError) return;
    console.error("Error fetching students:", error);
    showErrorToast("Failed to load students. Please try again.");
  }, [isError, error]);

  const invalidateTeacherStudentCaches = () => {
    void queryClient.invalidateQueries({ queryKey: ptQueryKeys.teacherClassStudents });
    void queryClient.invalidateQueries({ queryKey: ptQueryKeys.lessonsBundle });
  };

  const grades = useMemo(() => {
    const uniqueGrades = Array.from(new Set(students.map((s) => s.grade))).sort();
    return ["All", ...uniqueGrades];
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        search.trim().length === 0 ||
        student.profile.name.toLowerCase().includes(search.toLowerCase()) ||
        (student.student_id && student.student_id.toLowerCase().includes(search.toLowerCase())) ||
        student.profile.email.toLowerCase().includes(search.toLowerCase());

      const matchesGrade = selectedGrade === "All" || student.grade === selectedGrade;

      return matchesSearch && matchesGrade;
    });
  }, [students, search, selectedGrade]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedStudents = filteredStudents.slice(start, start + pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleModerateStudent = async (studentId: number, action: "approve" | "reject") => {
    setIsModerating(studentId);
    try {
      let updatedStudent: TeacherStudent;
      
      if (action === "approve") {
        updatedStudent = await approveStudent(studentId);
      } else {
        updatedStudent = await rejectStudent(studentId);
      }

      showSuccessToast(`Student ${action === "approve" ? "approved" : "rejected"} successfully!`);

      queryClient.setQueryData(ptQueryKeys.teacherClassStudents, (old: TeacherStudent[] | undefined) => {
        if (!old) return old;
        return old.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
      });
      void queryClient.invalidateQueries({ queryKey: ptQueryKeys.lessonsBundle });

      if (selectedStudent && selectedStudent.id === studentId) {
        setSelectedStudent(updatedStudent);
      }
    } catch (error) {
      console.error(`Error ${action}ing student:`, error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || `Failed to ${action} student. Please try again.`);
      } else {
        showErrorToast(`An unexpected error occurred. Please try again.`);
      }
    } finally {
      setIsModerating(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Class</h1>
            <p className="text-gray-600 mt-1">
              Manage and view all your students
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
              Add Student
            </button>
            <button
              onClick={() => setIsBulkUploadModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white border-2 border-emerald-600 px-5 py-2.5 text-emerald-600 shadow hover:bg-emerald-50 transition-colors"
            >
              <Icon icon="solar:upload-bold" className="w-5 h-5" />
              Bulk Upload
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Icon
                  icon="solar:magnifer-bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
                />
                <input
                  type="text"
                  placeholder="Search by name, student ID, or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto">
              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold text-emerald-600 text-lg">
                  {filteredStudents.length}
                </p>
                <p className="text-gray-600">Total Students</p>
              </div>
            </div>
          </div>

          {isPending && data === undefined ? (
            <PortalLoadingOverlay label="Loading students…" />
          ) : isError && data === undefined ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Icon icon="solar:danger-circle-bold" className="mx-auto mb-2 h-10 w-10 text-red-400" />
              <p className="text-gray-700 font-medium">Couldn&apos;t load students</p>
              <p className="mt-1 text-sm text-gray-500">Check your connection and try refreshing the page.</p>
            </div>
          ) : pagedStudents.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all hover:border-emerald-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {student.profile.name}
                        </h3>
                        <p className="text-sm text-gray-600">{student.grade}</p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Icon icon="solar:user-bold" className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                    <div 
                      className="space-y-2 text-xs text-gray-600 cursor-pointer"
                      onClick={() => {
                        setSelectedStudent(student);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:id-card-bold" className="w-4 h-4" />
                        <span>ID: {student.student_id || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:letter-bold" className="w-4 h-4" />
                        <span className="truncate">{student.profile.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:school-bold" className="w-4 h-4" />
                        <span className="truncate">{student.school.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:calendar-bold" className="w-4 h-4" />
                        <span>Joined: {formatDate(student.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:shield-check-bold" className="w-4 h-4" />
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          student.status === "APPROVED" 
                            ? "bg-green-100 text-green-800"
                            : student.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {student.status}
                        </span>
                      </div>
                    </div>
                    {student.status !== "APPROVED" && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleModerateStudent(student.id, "approve")}
                          disabled={isModerating === student.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isModerating === student.id ? (
                            <>
                              <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                              Approve
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleModerateStudent(student.id, "reject")}
                          disabled={isModerating === student.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isModerating === student.id ? (
                            <>
                              <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                              Processing...
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
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between flex-col sm:flex-row gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {start + 1} to{" "}
                    {Math.min(start + pageSize, filteredStudents.length)} of{" "}
                    {filteredStudents.length} students
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => {
                          if (
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= page - 1 && pageNum <= page + 1)
                          ) {
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                  pageNum === page
                                    ? "bg-emerald-600 text-white"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          } else if (
                            pageNum === page - 2 ||
                            pageNum === page + 2
                          ) {
                            return (
                              <span
                                key={pageNum}
                                className="px-2 py-2 text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                      )}
                    </div>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-sm">
                No students found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {isDetailsModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete information about {selectedStudent.profile.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-emerald-200 rounded-full flex items-center justify-center">
                    <Icon icon="solar:user-bold" className="w-10 h-10 text-emerald-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{selectedStudent.profile.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedStudent.grade}</p>
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedStudent.status === "APPROVED" 
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : selectedStudent.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : "bg-gray-100 text-gray-800 border border-gray-200"
                      }`}>
                        {selectedStudent.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="solar:user-id-bold" className="w-5 h-5 text-emerald-600" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Student ID</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedStudent.student_id || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedStudent.profile.email}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedStudent.profile.phone || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Date of Birth</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedStudent.profile.dob ? formatDate(selectedStudent.profile.dob) : "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Gender</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedStudent.profile.gender || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Grade</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedStudent.grade}
                    </p>
                  </div>
                </div>
              </div>

              {/* School Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="solar:school-bold" className="w-5 h-5 text-blue-600" />
                  School Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs font-medium text-blue-700 mb-1">School Name</p>
                    <p className="text-sm font-semibold text-blue-900">
                      {selectedStudent.school.name}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs font-medium text-blue-700 mb-1">District</p>
                    <p className="text-sm font-semibold text-blue-900">
                      {selectedStudent.school.district_name}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 sm:col-span-2">
                    <p className="text-xs font-medium text-blue-700 mb-1">County</p>
                    <p className="text-sm font-semibold text-blue-900">
                      {selectedStudent.school.county_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="solar:shield-check-bold" className="w-5 h-5 text-purple-600" />
                  Account Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Account Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedStudent.profile.is_active
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-red-100 text-red-800 border border-red-200"
                    }`}>
                      {selectedStudent.profile.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Email Verified</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedStudent.profile.email_verified
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {selectedStudent.profile.email_verified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Phone Verified</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedStudent.profile.phone_verified
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {selectedStudent.profile.phone_verified ? "Verified" : "Not Verified"}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Registration Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedStudent.status === "APPROVED"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : selectedStudent.status === "PENDING"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-gray-100 text-gray-800 border border-gray-200"
                    }`}>
                      {selectedStudent.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="solar:calendar-bold" className="w-5 h-5 text-gray-600" />
                  Important Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Account Created</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(selectedStudent.profile.created_at)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Last Updated</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(selectedStudent.profile.updated_at)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Student Record Created</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(selectedStudent.created_at)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Student Record Updated</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(selectedStudent.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedStudent.moderation_comment && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-xs font-medium text-amber-700 mb-1">Moderation Comment</p>
                  <p className="text-sm text-amber-900">{selectedStudent.moderation_comment}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
              {selectedStudent.status !== "APPROVED" && (
                <>
                  <button
                    onClick={() => handleModerateStudent(selectedStudent.id, "approve")}
                    disabled={isModerating === selectedStudent.id}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isModerating === selectedStudent.id ? (
                      <>
                        <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleModerateStudent(selectedStudent.id, "reject")}
                    disabled={isModerating === selectedStudent.id}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isModerating === selectedStudent.id ? (
                      <>
                        <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                        Reject
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onSuccess={invalidateTeacherStudentCaches}
      />

      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={invalidateTeacherStudentCaches}
      />
    </DashboardLayout>
  );
}

