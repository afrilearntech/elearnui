"use client";

import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/admin/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { getTeachers, TeacherRecord, TeacherStatus, approveAdminTeacher, rejectAdminTeacher } from "@/lib/api/admin/teachers";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";
import AddUserModal from "@/components/admin/users/AddUserModal";

type Teacher = {
  id: string;
  apiId: number;
  name: string;
  email: string;
  subjects: string;
  dateJoined: string;
  status: TeacherStatus;
  avatar?: string;
};

const schools = ["All", "Maplewood High School", "Riverside School", "Central High", "Westside School", "Eastside School"];
const districts = ["All", "District 1", "District 2", "District 3", "District 4"];

function mapTeachers(records: TeacherRecord[]): Teacher[] {
  return records.map((record) => ({
    id: String(record.id),
    apiId: record.id,
    name: record.profile?.name || "Unknown",
    email: record.profile?.email || "Unknown",
    subjects: "-",
    dateJoined: new Date(record.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    status: record.status,
    avatar: undefined,
  }));
}

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [page, setPage] = useState(1);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionButtonRef, setActionButtonRef] = useState<HTMLButtonElement | null>(null);
  const [approvingTeacherId, setApprovingTeacherId] = useState<string | null>(null);
  const [rejectingTeacherId, setRejectingTeacherId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [teacherToReject, setTeacherToReject] = useState<Teacher | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTeacherForDetails, setSelectedTeacherForDetails] = useState<Teacher | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserTab, setAddUserTab] = useState<"single" | "bulk">("single");
  const pageSize = 10;

    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const data = await getTeachers();
        setTeachers(mapTeachers(data));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load teachers";
        showErrorToast(message);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleApproveTeacher = async (teacher: Teacher) => {
    if (!teacher.apiId) {
      showErrorToast(`Cannot approve teacher: Missing teacher ID for ${teacher.name}`);
      return;
    }

    try {
      setApprovingTeacherId(teacher.id);
      await approveAdminTeacher(teacher.apiId);
      showSuccessToast(`${teacher.name} has been approved successfully!`);
      await fetchTeachers(); // Refresh the list
    } catch (error) {
      console.error("Error approving teacher:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to approve teacher");
      } else {
        showErrorToast("An unexpected error occurred while approving teacher");
      }
    } finally {
      setApprovingTeacherId(null);
      closeModal();
    }
  };

  const handleRejectClick = (teacher: Teacher) => {
    setTeacherToReject(teacher);
    setShowRejectModal(true);
    closeModal();
  };

  const handleRejectConfirm = async () => {
    if (!teacherToReject || !teacherToReject.apiId) {
      showErrorToast(`Cannot reject teacher: Missing teacher ID for ${teacherToReject?.name || 'unknown'}`);
      setShowRejectModal(false);
      setTeacherToReject(null);
      return;
    }

    try {
      setRejectingTeacherId(teacherToReject.id);
      await rejectAdminTeacher(teacherToReject.apiId);
      showSuccessToast(`${teacherToReject.name} has been rejected.`);
      await fetchTeachers(); // Refresh the list
      setShowRejectModal(false);
      setTeacherToReject(null);
    } catch (error) {
      console.error("Error rejecting teacher:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to reject teacher");
      } else {
        showErrorToast("An unexpected error occurred while rejecting teacher");
      }
    } finally {
      setRejectingTeacherId(null);
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesSearch =
        search.trim().length === 0 ||
        teacher.name.toLowerCase().includes(search.toLowerCase()) ||
        teacher.email.toLowerCase().includes(search.toLowerCase());
      const matchesSchool =
        selectedSchool === "All" ||
        teacher.subjects.toLowerCase().includes(selectedSchool.toLowerCase());
      const matchesDistrict = selectedDistrict === "All";
      return matchesSearch && matchesSchool && matchesDistrict;
    });
  }, [teachers, search, selectedSchool, selectedDistrict]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedTeachers = filteredTeachers.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, selectedSchool, selectedDistrict]);

  const handleActionClick = (teacher: Teacher, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
    setActionButtonRef(event.currentTarget);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeacher(null);
    setActionButtonRef(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen && actionButtonRef && !actionButtonRef.contains(event.target as Node)) {
        const modal = document.getElementById("teacher-action-dropdown");
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

  const getStatusBadge = (status: TeacherStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-emerald-100 text-emerald-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      case "REVIEW_REQUESTED":
        return "bg-orange-100 text-orange-700";
      case "DRAFT":
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getStatusDisplay = (status: TeacherStatus): string => {
    return status;
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout onAddTeacher={() => {
      setAddUserTab("single");
      setShowAddUserModal(true);
    }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
            <p className="text-gray-600 mt-1">Manage all teachers</p>
          </div>
          <button
            onClick={() => {
              setAddUserTab("single");
              setShowAddUserModal(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors sm:hidden"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add New Teacher
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Icon
                  icon="solar:magnifer-bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="search Name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto">
              <div className="relative sm:w-48">
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white appearance-none"
                >
                  {schools.map((school) => (
                    <option key={school} value={school}>
                      {school === "All" ? "All Schools" : school}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="solar:alt-arrow-down-bold"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                />
              </div>
              <div className="relative sm:w-48">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white appearance-none"
                >
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district === "All" ? "All Districts" : district}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="solar:alt-arrow-down-bold"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading teachers...</p>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No teachers found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-emerald-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Subjects</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date Joined</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pagedTeachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {teacher.avatar ? (
                              <Image
                                src={teacher.avatar}
                                alt={teacher.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="text-sm font-semibold text-emerald-700">
                                  {getInitials(teacher.name)}
                                </span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">{teacher.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{teacher.email}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{teacher.subjects}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{teacher.dateJoined}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                              teacher.status
                            )}`}
                          >
                            {teacher.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={(e) => handleActionClick(teacher, e)}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                          >
                            <Icon icon="solar:menu-dots-bold" className="w-5 h-5 text-gray-600" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing {start + 1} to {Math.min(start + pageSize, filteredTeachers.length)} of{" "}
                    {filteredTeachers.length} teachers
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      &lt;
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
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
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => setPage(totalPages - 1)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {totalPages - 1}
                        </button>
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
            </>
          )}
        </div>
      </div>

      {isModalOpen && selectedTeacher && actionButtonRef && (
        <TeacherActionDropdown
          teacher={selectedTeacher}
          onClose={closeModal}
          buttonRef={actionButtonRef}
          onApprove={handleApproveTeacher}
          onReject={handleRejectClick}
          onViewDetails={(teacher) => {
            setSelectedTeacherForDetails(teacher);
            setShowDetailsModal(true);
            closeModal();
          }}
          isApproving={approvingTeacherId === selectedTeacher.id}
          isRejecting={rejectingTeacherId === selectedTeacher.id}
        />
      )}

      {showAddUserModal && (
        <AddUserModal
          userType="Teacher"
          activeTab={addUserTab}
          onTabChange={setAddUserTab}
          onClose={() => {
            setShowAddUserModal(false);
            setAddUserTab("single");
          }}
          onSuccess={() => {
            fetchTeachers();
          }}
        />
      )}

      {showDetailsModal && selectedTeacherForDetails && (
        <TeacherDetailsModal
          teacher={selectedTeacherForDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTeacherForDetails(null);
          }}
        />
      )}

      {showRejectModal && teacherToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => {
            setShowRejectModal(false);
            setTeacherToReject(null);
          }} />
          <div className="relative z-50 bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon icon="solar:danger-triangle-bold" className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Reject Teacher</h3>
                <p className="text-sm text-gray-600 mt-1">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to reject <span className="font-semibold">{teacherToReject.name}</span>? 
              This will mark the teacher as rejected and they will not be able to access the platform.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setTeacherToReject(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectingTeacherId === teacherToReject.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {rejectingTeacherId === teacherToReject.id ? (
                  <>
                    <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                    Reject Teacher
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

function TeacherDetailsModal({
  teacher,
  onClose,
}: {
  teacher: Teacher;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-black/50 backdrop-blur-sm fixed inset-0" onClick={onClose} />
      <div className="relative z-50 bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Teacher Details</h2>
              <p className="text-sm text-gray-600 mt-1">Complete information about {teacher.name}</p>
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
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center">
                <Icon icon="solar:user-bold" className="w-10 h-10 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{teacher.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{teacher.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    teacher.status === "APPROVED"
                      ? "bg-emerald-100 text-emerald-800"
                      : teacher.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : teacher.status === "REJECTED"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {teacher.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon icon="solar:user-id-bold" className="w-5 h-5 text-blue-600" />
              Teacher Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Teacher ID</p>
                <p className="text-sm font-semibold text-gray-900">#{teacher.apiId || teacher.id}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Email Address</p>
                <p className="text-sm font-semibold text-gray-900">{teacher.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Subjects</p>
                <p className="text-sm font-semibold text-gray-900">{teacher.subjects}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Date Joined</p>
                <p className="text-sm font-semibold text-gray-900">{teacher.dateJoined}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  teacher.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-800"
                    : teacher.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : teacher.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {teacher.status}
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

function TeacherActionDropdown({
  teacher,
  onClose,
  buttonRef,
  onApprove,
  onReject,
  onViewDetails,
  isApproving,
  isRejecting,
}: {
  teacher: Teacher;
  onClose: () => void;
  buttonRef: HTMLButtonElement;
  onApprove: (teacher: Teacher) => void;
  onReject: (teacher: Teacher) => void;
  onViewDetails: (teacher: Teacher) => void;
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
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        id="teacher-action-dropdown"
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-2 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-900 truncate">{teacher.name}</p>
          <p className="text-xs text-gray-500 truncate">{teacher.email}</p>
        </div>
        <div className="py-1">
          {teacher.status === "PENDING" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApprove(teacher);
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
                    <span>Approve Teacher</span>
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(teacher);
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
                    <span>Reject Teacher</span>
                  </>
                )}
              </button>
              <div className="border-t border-gray-200 my-1"></div>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(teacher);
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


