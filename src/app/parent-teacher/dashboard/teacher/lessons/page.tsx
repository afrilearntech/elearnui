"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { getTeacherLessons, TeacherLesson, getTeacherSubjects, TeacherSubject } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast } from "@/lib/toast";
import CreateLessonModal from "@/components/parent-teacher/teacher/CreateLessonModal";

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

export default function LessonsPage() {
  const [lessons, setLessons] = useState<TeacherLesson[]>([]);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState<string>("All");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedLesson, setSelectedLesson] = useState<TeacherLesson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setIsLoading(true);
        const [lessonsData, subjectsData] = await Promise.all([
          getTeacherLessons(),
          getTeacherSubjects(),
        ]);
        setLessons(lessonsData);
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error fetching lessons:", error);
        showErrorToast("Failed to load lessons. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessons();
  }, []);

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
        grade: matchedSubject?.grade || "Unassigned Grade",
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
    // Refresh lessons list
    try {
      const data = await getTeacherLessons();
      setLessons(data);
      const subjectsData = await getTeacherSubjects();
      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error refreshing lessons:", error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lessons...</p>
          </div>
        </div>
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
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Lesson</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Subject</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Grade</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Duration</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Created</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Actions</th>
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
                            <div>
                              <p className="font-semibold text-gray-900">{lesson.title}</p>
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
                          <span className="text-sm font-medium text-gray-800">{lesson.subjectName}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getGradeColor(lesson.grade)}`}>
                            {lesson.grade}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(lesson.status)}`}>
                            {lesson.status}
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
                          <div className="flex justify-end">
                            <button
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
    </DashboardLayout>
  );
}

