"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@iconify/react";
import { getTeachers, TeacherRecord, assignSubjectsToTeacher } from "@/lib/api/content/teachers";
import { getSubjects, SubjectRecord } from "@/lib/api/content/subjects";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

interface AssignSubjectToTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AssignSubjectToTeacherModal({
  isOpen,
  onClose,
  onSuccess,
}: AssignSubjectToTeacherModalProps) {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<number>>(new Set());
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
      fetchSubjects();
      // Reset form
      setSelectedTeacherId(null);
      setSelectedSubjectIds(new Set());
      setTeacherSearch("");
      setSubjectSearch("");
      setShowTeacherDropdown(false);
      setShowSubjectDropdown(false);
    }
  }, [isOpen]);

  const fetchTeachers = async () => {
    try {
      setIsLoadingTeachers(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        showErrorToast("Authentication token is missing. Please sign in again.");
        return;
      }
      const data = await getTeachers(token);
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      showErrorToast("Failed to load teachers. Please try again.");
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      setIsLoadingSubjects(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        showErrorToast("Authentication token is missing. Please sign in again.");
        return;
      }
      const data = await getSubjects(token);
      // Only show APPROVED/VALIDATED subjects
      const approvedSubjects = data.filter((s) => s.status === "APPROVED" || s.status === "VALIDATED");
      setSubjects(approvedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      showErrorToast("Failed to load subjects. Please try again.");
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    if (!teacherSearch.trim()) return teachers;
    const searchLower = teacherSearch.toLowerCase();
    return teachers.filter(
      (teacher) =>
        teacher.profile.name.toLowerCase().includes(searchLower) ||
        teacher.profile.email.toLowerCase().includes(searchLower) ||
        teacher.profile.phone.toLowerCase().includes(searchLower)
    );
  }, [teachers, teacherSearch]);

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects;
    const searchLower = subjectSearch.toLowerCase();
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(searchLower) ||
        subject.description.toLowerCase().includes(searchLower) ||
        subject.grade.toLowerCase().includes(searchLower)
    );
  }, [subjects, subjectSearch]);

  const selectedTeacher = useMemo(() => {
    if (!selectedTeacherId) return null;
    return teachers.find((t) => t.id === selectedTeacherId) || null;
  }, [teachers, selectedTeacherId]);

  const handleTeacherSelect = (teacher: TeacherRecord) => {
    setSelectedTeacherId(teacher.id);
    setTeacherSearch("");
    setShowTeacherDropdown(false);
  };

  const handleSubjectToggle = (subjectId: number) => {
    setSelectedSubjectIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId);
      } else {
        newSet.add(subjectId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!selectedTeacherId) {
      showErrorToast("Please select a teacher");
      return;
    }

    if (selectedSubjectIds.size === 0) {
      showErrorToast("Please select at least one subject");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        showErrorToast("Authentication token is missing. Please sign in again.");
        return;
      }
      await assignSubjectsToTeacher(
        {
          teacher_id: selectedTeacherId,
          subject_ids: Array.from(selectedSubjectIds),
        },
        token
      );
      showSuccessToast("Subjects assigned to teacher successfully!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error assigning subjects:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to assign subjects");
      } else {
        showErrorToast("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-black/50 backdrop-blur-sm fixed inset-0" onClick={onClose} />
      <div
        className="relative z-50 bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 sm:px-8 py-5 sm:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Icon icon="solar:user-check-rounded-bold" className="w-7 h-7 text-gray-700" />
                Assign Subjects to Teacher
              </h2>
              <p className="text-sm sm:text-base text-gray-600 mt-2">Select a teacher and assign multiple subjects to them</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close modal"
            >
              <Icon icon="solar:close-circle-bold" className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Teacher Selection - Left Column */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Icon icon="solar:user-bold" className="w-5 h-5 text-gray-700" />
                  Select Teacher <span className="text-red-500">*</span>
                </label>
                
                {/* Search Input */}
                <div className="relative mb-3">
                  <Icon
                    icon="solar:magnifer-bold"
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
                  />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={teacherSearch}
                    onChange={(e) => {
                      setTeacherSearch(e.target.value);
                      setShowTeacherDropdown(true);
                    }}
                    onFocus={() => setShowTeacherDropdown(true)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 bg-white placeholder:text-gray-400 text-sm sm:text-base"
                  />
                </div>

                {/* Selected Teacher Display */}
                {selectedTeacher && (
                  <div className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-300 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-gray-700" />
                          <p className="text-sm font-bold text-gray-900">{selectedTeacher.profile.name}</p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{selectedTeacher.profile.email}</p>
                        {selectedTeacher.profile.phone && (
                          <p className="text-xs text-gray-500 mt-1">Phone: {selectedTeacher.profile.phone}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTeacherId(null);
                          setSelectedSubjectIds(new Set());
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Clear selection"
                      >
                        <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
                    className={`w-full px-4 py-3.5 text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white text-gray-900 flex items-center justify-between transition-all ${
                      selectedTeacherId ? "border-gray-400 bg-gray-50" : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <span className={selectedTeacherId ? "text-gray-900 font-medium" : "text-gray-400"}>
                      {selectedTeacher
                        ? `${selectedTeacher.profile.name}`
                        : "Click to select a teacher..."}
                    </span>
                    <Icon
                      icon="solar:alt-arrow-down-bold"
                      className={`w-5 h-5 text-gray-400 transition-transform ${showTeacherDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showTeacherDropdown && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowTeacherDropdown(false)}
                      />
                      <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                        {isLoadingTeachers ? (
                          <div className="p-6 text-center text-gray-500">
                            <Icon icon="solar:loading-bold" className="w-6 h-6 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Loading teachers...</p>
                          </div>
                        ) : filteredTeachers.length === 0 ? (
                          <div className="p-6 text-center text-gray-500">
                            <Icon icon="solar:user-cross-rounded-bold" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No teachers found</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {filteredTeachers.map((teacher) => (
                              <button
                                key={teacher.id}
                                type="button"
                                onClick={() => handleTeacherSelect(teacher)}
                                className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors ${
                                  selectedTeacherId === teacher.id ? "bg-gray-50 border-l-4 border-gray-400" : ""
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="text-sm font-bold text-gray-900 truncate">
                                        {teacher.profile.name}
                                      </p>
                                      {selectedTeacherId === teacher.id && (
                                        <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-gray-700 flex-shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 truncate">{teacher.profile.email}</p>
                                    {teacher.profile.phone && (
                                      <p className="text-xs text-gray-500 mt-1">Phone: {teacher.profile.phone}</p>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Subject Selection - Right Column */}
            {selectedTeacherId ? (
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <label className="block text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Icon icon="solar:book-2-bold" className="w-5 h-5 text-gray-700" />
                    Select Subjects <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-600 ml-auto">
                      (Multiple selection)
                    </span>
                  </label>
                  
                  {/* Search Input */}
                  <div className="relative mb-3">
                    <Icon
                      icon="solar:magnifer-bold"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
                    />
                    <input
                      type="text"
                      placeholder="Search by name, description, or grade..."
                      value={subjectSearch}
                      onChange={(e) => {
                        setSubjectSearch(e.target.value);
                        setShowSubjectDropdown(true);
                      }}
                      onFocus={() => setShowSubjectDropdown(true)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-gray-900 bg-white placeholder:text-gray-400 text-sm sm:text-base"
                    />
                  </div>

                  {/* Selection Summary */}
                  {selectedSubjectIds.size > 0 && (
                    <div className="mb-3 p-4 bg-gray-50 rounded-lg border border-gray-300 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-gray-700" />
                          {selectedSubjectIds.size} subject{selectedSubjectIds.size !== 1 ? "s" : ""} selected
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedSubjectIds(new Set())}
                          className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {Array.from(selectedSubjectIds).slice(0, 5).map((subjectId) => {
                          const subject = subjects.find((s) => s.id === subjectId);
                          if (!subject) return null;
                          return (
                            <span
                              key={subjectId}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-900"
                            >
                              {subject.name}
                              <button
                                type="button"
                                onClick={() => handleSubjectToggle(subjectId)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                              </button>
                            </span>
                          );
                        })}
                        {selectedSubjectIds.size > 5 && (
                          <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 border border-gray-400 rounded-md text-xs font-medium text-gray-900">
                            +{selectedSubjectIds.size - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Multi-Select Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
                      className={`w-full px-4 py-3.5 text-left border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 bg-white text-gray-900 flex items-center justify-between transition-all min-h-[52px] ${
                        selectedSubjectIds.size > 0 ? "border-gray-400 bg-gray-50" : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <span className={selectedSubjectIds.size > 0 ? "text-gray-900 font-medium" : "text-gray-400"}>
                        {selectedSubjectIds.size > 0
                          ? `${selectedSubjectIds.size} subject${selectedSubjectIds.size !== 1 ? "s" : ""} selected`
                          : "Click to select subjects..."}
                      </span>
                      <Icon
                        icon="solar:alt-arrow-down-bold"
                        className={`w-5 h-5 text-gray-400 transition-transform ${showSubjectDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    {showSubjectDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowSubjectDropdown(false)}
                        />
                        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                          {isLoadingSubjects ? (
                            <div className="p-6 text-center text-gray-500">
                              <Icon icon="solar:loading-bold" className="w-6 h-6 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Loading subjects...</p>
                            </div>
                          ) : filteredSubjects.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                              <Icon icon="solar:book-2-bold" className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">No subjects found</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {filteredSubjects.map((subject) => {
                                const isSelected = selectedSubjectIds.has(subject.id);
                                return (
                                  <button
                                    key={subject.id}
                                    type="button"
                                    onClick={() => handleSubjectToggle(subject.id)}
                                    className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors ${
                                      isSelected ? "bg-gray-50 border-l-4 border-gray-400" : ""
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <p className="text-sm font-bold text-gray-900">{subject.name}</p>
                                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md font-medium">
                                            {subject.grade}
                                          </span>
                                          {isSelected && (
                                            <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-gray-700 flex-shrink-0" />
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{subject.description}</p>
                                      </div>
                                      <div className="flex-shrink-0">
                                        {isSelected ? (
                                          <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                                            <Icon icon="solar:check-bold" className="w-4 h-4 text-white" />
                                          </div>
                                        ) : (
                                          <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[300px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Icon icon="solar:info-circle-bold" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">Please select a teacher first</p>
                  <p className="text-xs text-gray-500 mt-1">Then you can assign subjects to them</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 sm:px-8 py-5 sm:py-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              {selectedTeacherId && selectedSubjectIds.size > 0 && (
                <p className="font-medium">
                  Ready to assign <span className="text-gray-900 font-bold">{selectedSubjectIds.size}</span> subject{selectedSubjectIds.size !== 1 ? "s" : ""} to <span className="text-gray-900 font-bold">{selectedTeacher?.profile.name}</span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedTeacherId || selectedSubjectIds.size === 0}
                className="px-6 py-3 text-sm font-semibold text-white bg-gray-800 rounded-lg hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Icon icon="solar:loading-bold" className="w-5 h-5 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
                    Assign {selectedSubjectIds.size > 0 ? `${selectedSubjectIds.size} ` : ""}Subject{selectedSubjectIds.size !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
