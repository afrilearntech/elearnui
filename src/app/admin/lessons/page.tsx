"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/admin/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import Image from "@/components/images/SafeImage";
import {
  Lesson,
  LessonStatus,
  LessonType,
  getLessons,
  getSubject,
  getTopic,
} from "@/lib/api/admin/lessons";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { moderateContent } from "@/lib/api/admin/moderate";
import { ApiClientError } from "@/lib/api/client";

type FilterStatus = "All" | LessonStatus;

export default function LessonsPage() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [subjectNames, setSubjectNames] = useState<Record<number, string>>({});
  const [topicNames, setTopicNames] = useState<Record<number, string>>({});
  const [approvingLessonId, setApprovingLessonId] = useState<number | null>(null);
  const [rejectingLessonId, setRejectingLessonId] = useState<number | null>(null);
  const pageSize = 10;

  const statusOptions: FilterStatus[] = [
    "All",
    "APPROVED",
    "PENDING",
    "REJECTED",
    "REVIEW_REQUESTED",
    "DRAFT",
  ];

  useEffect(() => {
    fetchLessons();
  }, []);

  // Fetch subject and topic names once per ID
  useEffect(() => {
    const fetchMetadata = async () => {
      const subjectIds = Array.from(
        new Set(lessons.map((l) => l.subject).filter((id) => !(id in subjectNames)))
      );
      const topicIds = Array.from(
        new Set(lessons.map((l) => l.topic).filter((id) => !(id in topicNames)))
      );

      try {
        const subjectPromises = subjectIds.map((id) =>
          getSubject(id)
            .then((subject) => ({ id, name: subject.name }))
            .catch(() => ({ id, name: `Subject ${id}` }))
        );
        const topicPromises = topicIds.map((id) =>
          getTopic(id)
            .then((topic) => ({ id, name: topic.name }))
            .catch(() => ({ id, name: `Topic ${id}` }))
        );

        const [subjectResults, topicResults] = await Promise.all([
          Promise.all(subjectPromises),
          Promise.all(topicPromises),
        ]);

        if (subjectResults.length > 0) {
          setSubjectNames((prev) => {
            const updated = { ...prev };
            subjectResults.forEach(({ id, name }) => {
              updated[id] = name;
            });
            return updated;
          });
        }

        if (topicResults.length > 0) {
          setTopicNames((prev) => {
            const updated = { ...prev };
            topicResults.forEach(({ id, name }) => {
              updated[id] = name;
            });
            return updated;
          });
        }
      } catch {
        // Errors already handled per-request; avoid spamming toasts
      }
    };

    if (lessons.length > 0) {
      fetchMetadata();
    }
  }, [lessons, subjectNames, topicNames]);

  const types = useMemo(() => {
    const uniqueTypes = Array.from(new Set(lessons.map((l) => l.type))).sort();
    return ["All", ...uniqueTypes];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch =
        search.trim().length === 0 ||
        lesson.title.toLowerCase().includes(search.toLowerCase()) ||
        lesson.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        selectedStatus === "All" || lesson.status === selectedStatus;

      const matchesType = selectedType === "All" || lesson.type === selectedType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [lessons, search, selectedStatus, selectedType]);

  const totalPages = Math.max(1, Math.ceil(filteredLessons.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedLessons = filteredLessons.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, selectedStatus, selectedType]);

  const handleViewClick = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedLesson(null);
  };

  const getStatusBadge = (status: LessonStatus) => {
    if (status === "APPROVED") {
      return "bg-emerald-100 text-emerald-700";
    }
    if (status === "PENDING") {
      return "bg-yellow-100 text-yellow-700";
    }
    if (status === "REJECTED") {
      return "bg-red-100 text-red-700";
    }
    if (status === "REVIEW_REQUESTED") {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-gray-100 text-gray-600";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatType = (type: LessonType) => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const getSubjectName = (id: number) => subjectNames[id] || `Subject ${id}`;
  const getTopicName = (id: number) => topicNames[id] || `Topic ${id}`;

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      const data = await getLessons();
      setLessons(data);
    } catch (error: any) {
      showErrorToast(error.message || "Failed to load lessons. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveLesson = async (lessonId: number) => {
    try {
      setApprovingLessonId(lessonId);
      await moderateContent({
        model: "lesson",
        id: lessonId,
        action: "approve",
      });
      showSuccessToast("Lesson approved successfully!");
      fetchLessons();
    } catch (error) {
      console.error("Error approving lesson:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to approve lesson");
      } else {
        showErrorToast("An unexpected error occurred");
      }
    } finally {
      setApprovingLessonId(null);
    }
  };

  const handleRejectLesson = async (lessonId: number) => {
    try {
      setRejectingLessonId(lessonId);
      await moderateContent({
        model: "lesson",
        id: lessonId,
        action: "reject",
      });
      showSuccessToast("Lesson rejected successfully!");
      fetchLessons();
    } catch (error) {
      console.error("Error rejecting lesson:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to reject lesson");
      } else {
        showErrorToast("An unexpected error occurred");
      }
    } finally {
      setRejectingLessonId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lessons Management</h1>
            <p className="text-gray-600 mt-1">
              View lessons with their subjects and topics
            </p>
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
                  placeholder="search Lesson title, description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto">
              <div className="relative sm:w-48">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as FilterStatus)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "All" ? "All Status" : status}
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
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
                >
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type === "All" ? "All Types" : formatType(type as LessonType)}
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
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <p className="text-gray-500 text-sm mt-3">Loading lessons...</p>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon="solar:book-bookmark-bold" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No lessons found</p>
              <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-emerald-50">
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Lesson
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden md:table-cell">
                          Subject
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden lg:table-cell">
                          Topic
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden xl:table-cell">
                          Created At
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagedLessons.map((lesson) => (
                        <tr key={lesson.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4">
                            <div className="flex items-center gap-3">
                              {lesson.thumbnail ? (
                                <div className="relative h-10 w-10 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                  <Image
                                    src={lesson.thumbnail}
                                    alt={lesson.title}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                  <Icon
                                    icon={
                                      lesson.type === "VIDEO"
                                        ? "solar:play-circle-bold"
                                        : "solar:document-text-bold"
                                    }
                                    className="w-5 h-5 text-emerald-600"
                                  />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-xs">
                                  {lesson.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden md:table-cell">
                            {getSubjectName(lesson.subject)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                            {getTopicName(lesson.topic)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-700">
                            {formatType(lesson.type)}
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                lesson.status
                              )}`}
                            >
                              {lesson.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 hidden xl:table-cell">
                            {formatDate(lesson.created_at)}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {lesson.status === "PENDING" && (
                                <>
                                  <button
                                    onClick={() => handleApproveLesson(lesson.id)}
                                    disabled={approvingLessonId === lesson.id || rejectingLessonId === lesson.id}
                                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {approvingLessonId === lesson.id ? (
                                      <>
                                        <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                                        Approving...
                                      </>
                                    ) : (
                                      <>
                                        <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                                        Approve
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleRejectLesson(lesson.id)}
                                    disabled={approvingLessonId === lesson.id || rejectingLessonId === lesson.id}
                                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {rejectingLessonId === lesson.id ? (
                                      <>
                                        <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                                        Rejecting...
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
                              onClick={() => handleViewClick(lesson)}
                              className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600 order-2 sm:order-1">
                    Showing{" "}
                    <span className="font-medium">
                      {start + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(start + pageSize, filteredLessons.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium">
                      {filteredLessons.length}
                    </span>{" "}
                    lessons
                  </div>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      <Icon icon="solar:alt-arrow-left-bold" className="w-4 h-4" />
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
                          className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors min-w-[40px] ${
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
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {totalPages - 1}
                        </button>
                        <button
                          onClick={() => setPage(totalPages)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isViewModalOpen && selectedLesson && (
        <LessonViewModal
          lesson={selectedLesson}
          subjectName={getSubjectName(selectedLesson.subject)}
          topicName={getTopicName(selectedLesson.topic)}
          onClose={closeViewModal}
          onApprove={handleApproveLesson}
          onReject={handleRejectLesson}
          isApproving={approvingLessonId === selectedLesson.id}
          isRejecting={rejectingLessonId === selectedLesson.id}
        />
      )}
    </DashboardLayout>
  );
}

function LessonViewModal({
  lesson,
  subjectName,
  topicName,
  onClose,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
}: {
  lesson: Lesson;
  subjectName: string;
  topicName: string;
  onClose: () => void;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}) {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: LessonStatus) => {
    if (status === "APPROVED") {
      return "bg-emerald-100 text-emerald-700";
    }
    if (status === "PENDING") {
      return "bg-yellow-100 text-yellow-700";
    }
    if (status === "REJECTED") {
      return "bg-red-100 text-red-700";
    }
    if (status === "REVIEW_REQUESTED") {
      return "bg-blue-100 text-blue-700";
    }
    return "bg-gray-100 text-gray-600";
  };

  const formatType = (type: LessonType) => {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[55]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold text-gray-900">Lesson Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {lesson.thumbnail ? (
                <div className="relative h-28 w-28 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={lesson.thumbnail}
                    alt={lesson.title}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-28 w-28 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Icon
                    icon={
                      lesson.type === "VIDEO"
                        ? "solar:play-circle-bold"
                        : "solar:document-text-bold"
                    }
                    className="w-10 h-10 text-emerald-600"
                  />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-500">Lesson Title</label>
                  <p className="mt-1 text-base text-gray-900 font-semibold">{lesson.title}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Subject</label>
                    <p className="mt-1 text-base text-gray-900">{subjectName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Topic</label>
                    <p className="mt-1 text-base text-gray-900">{topicName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="mt-1 text-base text-gray-900">{formatType(lesson.type)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                          lesson.status
                        )}`}
                      >
                        {lesson.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="mt-1 text-sm text-gray-800 whitespace-pre-line">
                {lesson.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Duration</label>
                <p className="mt-1 text-sm text-gray-900">
                  {lesson.duration_minutes} minutes
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created By (ID)</label>
                <p className="mt-1 text-sm text-gray-900">
                  {lesson.created_by}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Resource</label>
              <div className="mt-1">
                <a
                  href={lesson.resource}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
                >
                  <Icon icon="solar:link-bold" className="w-4 h-4" />
                  Open Resource
                </a>
              </div>
            </div>

            {lesson.moderation_comment && (
              <div>
                <label className="text-sm font-medium text-gray-500">Moderation Comment</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700">{lesson.moderation_comment}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Created At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateTime(lesson.created_at)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatDateTime(lesson.updated_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              {lesson.status === "PENDING" && onApprove && onReject && (
                <>
                  <button
                    onClick={() => onApprove(lesson.id)}
                    disabled={isApproving || isRejecting}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isApproving ? (
                      <>
                        <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onReject(lesson.id)}
                    disabled={isApproving || isRejecting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRejecting ? (
                      <>
                        <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                        Rejecting...
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
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


