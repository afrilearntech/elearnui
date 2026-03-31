"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/admin/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { getAdminStudents, AdminStudent, approveAdminStudent, rejectAdminStudent } from "@/lib/api/admin/students";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";
import AddUserModal from "@/components/admin/users/AddUserModal";
import { ptQueryKeys } from "@/lib/parent-teacher/queryKeys";

type StudentStatus = "Active" | "Inactive" | "Creator" | "APPROVED" | "PENDING" | "REJECTED";

type Student = {
  id: string;
  apiId?: number;
  name: string;
  school: string;
  email: string;
  linkedParent: string;
  gradeLevel: string;
  status: StudentStatus;
  avatar?: string;
};

const mapStatus = (status: string): StudentStatus => {
  const upperStatus = status.toUpperCase();
  if (upperStatus === "APPROVED") return "APPROVED";
  if (upperStatus === "PENDING") return "PENDING";
  if (upperStatus === "REJECTED") return "REJECTED";
  // Fallback for old status values
  if (upperStatus === "ACTIVE" || upperStatus === "CREATOR") return "APPROVED";
  return "PENDING";
};

const mapAdminStudents = (data: AdminStudent[]): Student[] =>
  data.map((student) => ({
    id: `${student.id}`,
    apiId: student.id,
    name: student.name,
    school: student.school,
    email: student.email,
    linkedParent: student.linked_parents || "N/A",
    gradeLevel: student.grade,
    status: mapStatus(student.status),
  }));

const getUniqueGrades = (students: Student[]): string[] => {
  const gradesSet = new Set<string>(["All"]);
  students.forEach((student) => {
    if (student.gradeLevel) {
      gradesSet.add(student.gradeLevel);
    }
  });
  return Array.from(gradesSet).sort();
};

const getUniqueSchools = (students: Student[]): string[] => {
  const schoolsSet = new Set<string>(["All"]);
  students.forEach((student) => {
    if (student.school) {
      schoolsSet.add(student.school);
    }
  });
  return Array.from(schoolsSet).sort();
};


export default function StudentsPage() {
  const queryClient = useQueryClient();
  const { data, isPending, isError, error } = useQuery({
    queryKey: ptQueryKeys.adminStudents,
    queryFn: getAdminStudents,
  });
  const students = useMemo(() => mapAdminStudents(data ?? []), [data]);
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedSchool, setSelectedSchool] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionButtonRef, setActionButtonRef] = useState<HTMLButtonElement | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserTab, setAddUserTab] = useState<"single" | "bulk">("single");
  const pageSize = 10;

  const [approvingStudentId, setApprovingStudentId] = useState<string | null>(null);
  const [rejectingStudentId, setRejectingStudentId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [studentToReject, setStudentToReject] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<Student | null>(null);

  useEffect(() => {
    if (!isError) return;
    console.error("Error fetching students:", error);
    if (error instanceof ApiClientError) {
      showErrorToast(error.message || "Failed to fetch students");
    } else {
      showErrorToast("An unexpected error occurred while fetching students");
    }
  }, [isError, error]);

  const handleApproveStudent = async (student: Student) => {
    if (!student.apiId) {
      showErrorToast(`Cannot approve student: Missing student ID for ${student.name}`);
      return;
    }

    try {
      setApprovingStudentId(student.id);
      await approveAdminStudent(student.apiId);
      showSuccessToast(`${student.name} has been approved successfully!`);
      await queryClient.invalidateQueries({ queryKey: ptQueryKeys.adminStudents });
    } catch (error) {
      console.error("Error approving student:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to approve student");
      } else {
        showErrorToast("An unexpected error occurred while approving student");
      }
    } finally {
      setApprovingStudentId(null);
      closeModal();
    }
  };

  const handleRejectClick = (student: Student) => {
    setStudentToReject(student);
    setShowRejectModal(true);
    closeModal();
  };

  const handleRejectConfirm = async () => {
    if (!studentToReject || !studentToReject.apiId) {
      showErrorToast(`Cannot reject student: Missing student ID for ${studentToReject?.name || 'unknown'}`);
      setShowRejectModal(false);
      setStudentToReject(null);
      return;
    }

    try {
      setRejectingStudentId(studentToReject.id);
      await rejectAdminStudent(studentToReject.apiId);
      showSuccessToast(`${studentToReject.name} has been rejected.`);
      await queryClient.invalidateQueries({ queryKey: ptQueryKeys.adminStudents });
      setShowRejectModal(false);
      setStudentToReject(null);
    } catch (error) {
      console.error("Error rejecting student:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to reject student");
      } else {
        showErrorToast("An unexpected error occurred while rejecting student");
      }
    } finally {
      setRejectingStudentId(null);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        search.trim().length === 0 ||
        student.name.toLowerCase().includes(search.toLowerCase()) ||
        student.email.toLowerCase().includes(search.toLowerCase()) ||
        student.school.toLowerCase().includes(search.toLowerCase());
      const matchesGrade = selectedGrade === "All" || student.gradeLevel === selectedGrade;
      const matchesSchool = selectedSchool === "All" || student.school.includes(selectedSchool);
      return matchesSearch && matchesGrade && matchesSchool;
    });
  }, [students, search, selectedGrade, selectedSchool]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedStudents = filteredStudents.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, selectedGrade, selectedSchool]);

  const handleActionClick = (student: Student, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActionButtonRef(event.currentTarget);
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setActionButtonRef(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen && actionButtonRef && !actionButtonRef.contains(event.target as Node)) {
        const modal = document.getElementById("student-action-dropdown");
        if (modal && !modal.contains(event.target as Node)) {
          closeModal();
        }
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isModalOpen, actionButtonRef]);


  const getStatusBadge = (status: StudentStatus) => {
    if (status === "APPROVED") {
      return "bg-emerald-100 text-emerald-700";
    }
    if (status === "PENDING") {
      return "bg-yellow-100 text-yellow-700";
    }
    if (status === "REJECTED") {
      return "bg-red-100 text-red-700";
    }
    // Fallback for old status values
    if (status === "Active" || status === "Creator") {
      return "bg-emerald-100 text-emerald-700";
    }
    return "bg-gray-100 text-gray-600";
  };

  const getStatusDisplay = (status: StudentStatus): string => {
    if (status === "APPROVED") return "Approved";
    if (status === "PENDING") return "Pending";
    if (status === "REJECTED") return "Rejected";
    return status;
  };

  const grades = useMemo(() => getUniqueGrades(students), [students]);
  const schools = useMemo(() => getUniqueSchools(students), [students]);

  return (
    <DashboardLayout onAddStudent={() => {
      setAddUserTab("single");
      setShowAddUserModal(true);
    }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="text-gray-600 mt-1">Manage all students</p>
          </div>
          <button
            onClick={() => {
              setAddUserTab("single");
              setShowAddUserModal(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors sm:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add New Student
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Icon
                  icon="solar:magnifer-bold"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="search subjects, lessons..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-sm min-w-[140px] text-gray-900"
                >
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-sm min-w-[140px] text-gray-900"
                  >
                    {schools.map((school) => (
                      <option key={school} value={school}>
                        {school}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-emerald-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Linked Parent (s)
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Grade Level
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isPending && data === undefined ? (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <Icon icon="solar:loading-bold" className="w-5 h-5 animate-spin text-emerald-600" />
                        <span>Loading students...</span>
                      </div>
                    </td>
                  </tr>
                ) : pagedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  pagedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {student.avatar ? (
                              <Image
                                src={student.avatar}
                                alt={student.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <span className="text-gray-600 font-semibold text-sm">
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 truncate block max-w-[200px]">{student.school}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 truncate block max-w-[200px]">{student.email}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{student.linkedParent}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{student.gradeLevel}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                            student.status
                          )}`}
                        >
                          {getStatusDisplay(student.status)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap relative">
                        <button
                          onClick={(e) => handleActionClick(student, e)}
                          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <Icon icon="solar:menu-dots-bold" className="w-5 h-5 text-gray-600" />
                        </button>
                        {isModalOpen && selectedStudent?.id === student.id && actionButtonRef && (
                          <StudentActionDropdown
                            student={selectedStudent}
                            onClose={closeModal}
                            buttonRef={actionButtonRef}
                            onApprove={handleApproveStudent}
                            onReject={handleRejectClick}
                            onViewDetails={(student) => {
                              setSelectedStudentForDetails(student);
                              setShowDetailsModal(true);
                              closeModal();
                            }}
                            isApproving={approvingStudentId === student.id}
                            isRejecting={rejectingStudentId === student.id}
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700 text-center sm:text-left">
                Showing {start + 1} to {Math.min(start + pageSize, filteredStudents.length)} of {filteredStudents.length} students
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 10) {
                    pageNum = i + 1;
                  } else if (currentPage <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 4) {
                    pageNum = totalPages - 9 + i;
                  } else {
                    pageNum = currentPage - 4 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 10 && currentPage < totalPages - 4 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddUserModal && (
        <AddUserModal
          userType="Student"
          activeTab={addUserTab}
          onTabChange={setAddUserTab}
          onClose={() => {
            setShowAddUserModal(false);
            setAddUserTab("single");
          }}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ptQueryKeys.adminStudents });
          }}
        />
      )}

      {showDetailsModal && selectedStudentForDetails && (
        <StudentDetailsModal
          student={selectedStudentForDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedStudentForDetails(null);
          }}
        />
      )}

      {showRejectModal && studentToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setShowRejectModal(false);
            setStudentToReject(null);
          }} />
          <div className="relative z-50 bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="solar:danger-triangle-bold" className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Reject Student</h3>
                <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
              </div>
                  </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to reject <span className="font-semibold">{studentToReject.name}</span>? 
              This will mark the student as rejected and they will not be able to access the platform.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setStudentToReject(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectingStudentId === studentToReject.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {rejectingStudentId === studentToReject.id ? (
                  <>
                    <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                    Reject Student
                  </>
                )}
              </button>
                    </div>
                  </div>
                </div>
              )}
    </DashboardLayout>
  );
}

function StudentDetailsModal({
  student,
  onClose,
}: {
  student: Student;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-black/50 backdrop-blur-sm fixed inset-0" onClick={onClose} />
      <div className="relative z-50 bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
                  <div>
              <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
              <p className="text-sm text-gray-600 mt-1">Complete information about {student.name}</p>
                  </div>
                      <button
              onClick={onClose}
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
                <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{student.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    student.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : student.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {student.status}
                        </span>
                            </div>
                          </div>
                          </div>
                        </div>

          {/* Student Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon icon="solar:user-id-bold" className="w-5 h-5 text-emerald-600" />
              Student Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Student ID</p>
                <p className="text-sm font-semibold text-gray-900">#{student.apiId || student.id}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Email Address</p>
                <p className="text-sm font-semibold text-gray-900">{student.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">School</p>
                <p className="text-sm font-semibold text-gray-900">{student.school}</p>
                    </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Grade Level</p>
                <p className="text-sm font-semibold text-gray-900">{student.gradeLevel}</p>
                  </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Linked Parents</p>
                <p className="text-sm font-semibold text-gray-900">{student.linkedParent}</p>
                </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  student.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800"
                    : student.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {student.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentActionDropdown({
  student,
  onClose,
  buttonRef,
  onApprove,
  onReject,
  onViewDetails,
  isApproving,
  isRejecting,
}: {
  student: Student;
  onClose: () => void;
  buttonRef: HTMLButtonElement;
  onApprove: (student: Student) => void;
  onReject: (student: Student) => void;
  onViewDetails: (student: Student) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef) {
        const rect = buttonRef.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4,
          left: rect.right - 200,
        });
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [buttonRef]);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        id="student-action-dropdown"
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-2 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
          <p className="text-xs text-gray-500 truncate">{student.email}</p>
        </div>
        <div className="py-1">
          {student.status === "PENDING" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(student);
                }}
                disabled={isApproving || isRejecting}
                className="w-full text-left px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApproving ? (
                  <>
                    <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-600" />
                    <span>Approve Student</span>
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(student);
                }}
                disabled={isApproving || isRejecting}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRejecting ? (
                  <>
                    <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin text-red-600" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <Icon icon="solar:close-circle-bold" className="w-4 h-4 text-red-600" />
                    <span>Reject Student</span>
                  </>
                )}
              </button>
              <div className="border-t border-gray-200 my-1"></div>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(student);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Icon icon="solar:eye-bold" className="w-4 h-4 text-gray-600" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </>
  );
}

