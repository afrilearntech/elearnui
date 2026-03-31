"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { getTeacherDashboard } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast } from "@/lib/toast";
import { ptQueryKeys } from "@/lib/parent-teacher/queryKeys";
import { PortalDashboardSkeleton } from "@/components/parent-teacher/PortalDataSkeleton";


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
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function TeacherDashboardPage() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ptQueryKeys.teacherDashboard,
    queryFn: getTeacherDashboard,
  });

  useEffect(() => {
    if (!isError) return;
    console.error("Error fetching dashboard:", error);
    showErrorToast("Failed to load dashboard data. Please try again.");
  }, [isError, error]);

  if (isPending && !data) {
    return (
      <DashboardLayout>
        <PortalDashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-gray-600">Unable to load dashboard data.</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { summarycards, top_performers, pending_submissions, upcoming_deadlines } = data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Manage your classes, students, and assignments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Total Students
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {summarycards.total_students}
                </p>
                <p className="text-xs text-gray-500 mt-1">In your class</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon="solar:users-group-two-rounded-bold" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Class Average
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-2">
                  {summarycards.class_average.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Overall performance</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Icon icon="solar:chart-bold" className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Pending Review
                </p>
                <p className="text-2xl font-bold text-amber-600 mt-2">
                  {summarycards.pending_review}
                </p>
                <p className="text-xs text-gray-500 mt-1">Submissions to grade</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Icon icon="solar:file-check-bold" className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {summarycards.completion_rate}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Grading progress</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon icon="solar:check-circle-bold" className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <Link
                href="/dashboard/teacher/assessments"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon icon="solar:add-circle-bold" className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-900">Create Assessment</span>
                </div>
                <Icon icon="solar:arrow-right-bold" className="w-5 h-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard/teacher/submissions"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon icon="solar:file-check-bold" className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-gray-900">Review Submissions</span>
                </div>
                <Icon icon="solar:arrow-right-bold" className="w-5 h-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard/teacher/grades"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon icon="solar:diploma-verified-bold" className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">View Student Grades</span>
                </div>
                <Icon icon="solar:arrow-right-bold" className="w-5 h-5 text-gray-400" />
              </Link>
              <Link
                href="/dashboard/teacher/class"
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon icon="solar:users-group-two-rounded-bold" className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Manage Class</span>
                </div>
                <Icon icon="solar:arrow-right-bold" className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Performers</h2>
              <Link
                href="/dashboard/teacher/analytics"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {top_performers.length > 0 ? (
                top_performers.map((student, index) => (
                  <div
                    key={`${student.student_id}-${index}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : index === 1
                            ? "bg-gray-100 text-gray-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{student.student_name}</p>
                        <p className="text-xs text-gray-500">
                          {student.improvement > 0 ? "+" : ""}
                          {student.improvement.toFixed(1)}% improvement
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">
                        {student.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No top performers data available
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Pending Submissions</h2>
              <Link
                href="/dashboard/teacher/submissions?status=Pending Review"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {pending_submissions.length > 0 ? (
                pending_submissions.map((submission, index) => (
                  <div
                    key={`${submission.student_id}-${submission.assessment_title}-${index}`}
                    className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {submission.student_name}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {submission.assessment_title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {submission.subject || "N/A"} • {formatDateTime(submission.submitted_at)}
                      </p>
                    </div>
                    <Link
                      href="/dashboard/teacher/submissions"
                      className="ml-3 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Grade
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No pending submissions
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
              <Link
                href="/dashboard/teacher/assessments"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {upcoming_deadlines.length > 0 ? (
                upcoming_deadlines.map((deadline, index) => {
                  const daysUntil = deadline.days_left;
                  return (
                    <div
                      key={`${deadline.assessment_title}-${deadline.due_at}-${index}`}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {deadline.assessment_title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">{deadline.subject || "N/A"}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            daysUntil <= 1
                              ? "bg-red-100 text-red-800"
                              : daysUntil <= 3
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {daysUntil === 0
                            ? "Due Today"
                            : daysUntil === 1
                            ? "Due Tomorrow"
                            : `${daysUntil} days left`}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Submissions: {deadline.submissions_done}/{deadline.submissions_expected}</span>
                          <span>{deadline.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${deadline.completion_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Due: {formatDate(deadline.due_at)}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No upcoming deadlines
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

