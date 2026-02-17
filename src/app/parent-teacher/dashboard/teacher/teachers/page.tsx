"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { getTeachers, TeacherRecord } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast } from "@/lib/toast";
import AddTeacherModal from "@/components/parent-teacher/teacher/AddTeacherModal";
import BulkUploadTeachersModal from "@/components/parent-teacher/teacher/BulkUploadTeachersModal";

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  school: string;
  status: string;
  joinedDate: string;
  teacher_id?: string | null;
}

const dummyTeachers: Teacher[] = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+1234567890",
    school: "Royal Academy",
    status: "APPROVED",
    joinedDate: "2025-09-01",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1234567891",
    school: "Royal Academy",
    status: "APPROVED",
    joinedDate: "2025-09-05",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael.brown@example.com",
    phone: "+1234567892",
    school: "Adekyee School",
    status: "PENDING",
    joinedDate: "2025-09-10",
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.davis@example.com",
    phone: "+1234567893",
    school: "Royal Academy",
    status: "APPROVED",
    joinedDate: "2025-09-15",
  },
  {
    id: 5,
    name: "David Wilson",
    email: "david.wilson@example.com",
    phone: "+1234567894",
    school: "Adekyee School",
    status: "APPROVED",
    joinedDate: "2025-09-20",
  },
  {
    id: 6,
    name: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    phone: "+1234567895",
    school: "Royal Academy",
    status: "APPROVED",
    joinedDate: "2025-09-25",
  },
  {
    id: 7,
    name: "Robert Taylor",
    email: "robert.taylor@example.com",
    phone: "+1234567896",
    school: "Adekyee School",
    status: "PENDING",
    joinedDate: "2025-10-01",
  },
  {
    id: 8,
    name: "Jennifer Martinez",
    email: "jennifer.martinez@example.com",
    phone: "+1234567897",
    school: "Royal Academy",
    status: "APPROVED",
    joinedDate: "2025-10-05",
  },
  {
    id: 9,
    name: "William Thomas",
    email: "william.thomas@example.com",
    phone: "+1234567898",
    school: "Adekyee School",
    status: "APPROVED",
    joinedDate: "2025-10-10",
  },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800 border-green-200";
    case "PENDING":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const pageSize = 9;

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setIsLoading(true);
        const data = await getTeachers();
        // Map API response to UI format
        const mappedTeachers: Teacher[] = data.map((teacher) => ({
          id: teacher.id,
          name: teacher.profile.name,
          email: teacher.profile.email,
          phone: teacher.profile.phone,
          school: `School ID: ${teacher.school}`, // Display school ID for now
          status: teacher.status,
          joinedDate: teacher.created_at,
          teacher_id: teacher.teacher_id,
        }));
        setTeachers(mappedTeachers);
        
        // Get school_id from first teacher (assuming all teachers are from same school)
        if (data.length > 0 && data[0].school) {
          setSchoolId(data[0].school);
        }
      } catch (error) {
        console.error("Error fetching teachers:", error);
        showErrorToast("Failed to load teachers. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const schools = useMemo(() => {
    const uniqueSchools = Array.from(new Set(teachers.map((t) => t.school))).sort();
    return ["All", ...uniqueSchools];
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => {
      const matchesSearch =
        search.trim().length === 0 ||
        teacher.name.toLowerCase().includes(search.toLowerCase()) ||
        teacher.email.toLowerCase().includes(search.toLowerCase()) ||
        teacher.phone.toLowerCase().includes(search.toLowerCase());

      const matchesSchool = selectedSchool === "All" || teacher.school === selectedSchool;

      return matchesSearch && matchesSchool;
    });
  }, [teachers, search, selectedSchool]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedTeachers = filteredTeachers.slice(start, start + pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
            <p className="text-gray-600 mt-1">
              View and manage all teachers
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsAddTeacherModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
              Add Teacher
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
                  placeholder="Search by name, email, or phone..."
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
                value={selectedSchool}
                onChange={(e) => {
                  setSelectedSchool(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {schools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold text-emerald-600 text-lg">
                  {filteredTeachers.length}
                </p>
                <p className="text-gray-600">Total Teachers</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Icon icon="solar:loading-bold" className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading teachers...</p>
              </div>
            </div>
          ) : pagedTeachers.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    onClick={() => {
                      setSelectedTeacher(teacher);
                      setIsDetailsModalOpen(true);
                    }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer hover:border-emerald-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {teacher.name}
                        </h3>
                        <p className="text-sm text-gray-600">{teacher.school}</p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Icon icon="solar:user-bold" className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                    <div className="space-y-2 text-xs text-gray-600">
                      {teacher.teacher_id && (
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:id-card-bold" className="w-4 h-4" />
                          <span>ID: {teacher.teacher_id}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:letter-bold" className="w-4 h-4" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:phone-bold" className="w-4 h-4" />
                        <span>{teacher.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:school-bold" className="w-4 h-4" />
                        <span className="truncate">{teacher.school}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:calendar-bold" className="w-4 h-4" />
                          <span>Joined: {formatDate(teacher.joinedDate)}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            teacher.status
                          )}`}
                        >
                          {teacher.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between flex-col sm:flex-row gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {start + 1} to{" "}
                    {Math.min(start + pageSize, filteredTeachers.length)} of{" "}
                    {filteredTeachers.length} teachers
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
                No teachers found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {isDetailsModalOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Teacher Details</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete information about {selectedTeacher.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedTeacher(null);
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
                    <h3 className="text-xl font-bold text-gray-900">{selectedTeacher.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedTeacher.school}</p>
                    <div className="mt-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          selectedTeacher.status
                        )}`}
                      >
                        {selectedTeacher.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="solar:phone-calling-bold" className="w-5 h-5 text-emerald-600" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedTeacher.teacher_id && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-1">Teacher ID</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedTeacher.teacher_id}
                      </p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTeacher.email}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-1">Phone</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTeacher.phone}
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
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">School Name</p>
                  <p className="text-sm font-semibold text-blue-900">
                    {selectedTeacher.school}
                  </p>
                </div>
              </div>

              {/* Status Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="solar:shield-check-bold" className="w-5 h-5 text-purple-600" />
                  Status Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-1">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      selectedTeacher.status
                    )}`}
                  >
                    {selectedTeacher.status}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Icon icon="solar:calendar-bold" className="w-5 h-5 text-gray-600" />
                  Important Dates
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-1">Joined Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(selectedTeacher.joinedDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedTeacher(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AddTeacherModal
        isOpen={isAddTeacherModalOpen}
        onClose={() => setIsAddTeacherModalOpen(false)}
        onSuccess={async () => {
          try {
            const data = await getTeachers();
            const mappedTeachers: Teacher[] = data.map((teacher) => ({
              id: teacher.id,
              name: teacher.profile.name,
              email: teacher.profile.email,
              phone: teacher.profile.phone,
              school: `School ID: ${teacher.school}`,
              status: teacher.status,
              joinedDate: teacher.created_at,
              teacher_id: teacher.teacher_id,
            }));
            setTeachers(mappedTeachers);
            if (data.length > 0 && data[0].school) {
              setSchoolId(data[0].school);
            }
          } catch (error) {
            console.error("Error refreshing teachers:", error);
          }
        }}
        schoolId={schoolId}
      />

      <BulkUploadTeachersModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onSuccess={async () => {
          try {
            const data = await getTeachers();
            const mappedTeachers: Teacher[] = data.map((teacher) => ({
              id: teacher.id,
              name: teacher.profile.name,
              email: teacher.profile.email,
              phone: teacher.profile.phone,
              school: `School ID: ${teacher.school}`,
              status: teacher.status,
              joinedDate: teacher.created_at,
              teacher_id: teacher.teacher_id,
            }));
            setTeachers(mappedTeachers);
            if (data.length > 0 && data[0].school) {
              setSchoolId(data[0].school);
            }
          } catch (error) {
            console.error("Error refreshing teachers:", error);
          }
        }}
      />
    </DashboardLayout>
  );
}

