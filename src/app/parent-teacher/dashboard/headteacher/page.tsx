"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { getHeadTeacherDashboard } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { ptQueryKeys } from "@/lib/parent-teacher/queryKeys";
import { PortalDashboardSkeleton } from "@/components/parent-teacher/PortalDataSkeleton";

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function HeadTeacherDashboardPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useLayoutEffect(() => {
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

    setAuthReady(true);
  }, [router]);

  const { data: dashboardData, isPending, isError, error } = useQuery({
    queryKey: ptQueryKeys.headTeacherDashboard,
    queryFn: getHeadTeacherDashboard,
    enabled: authReady,
  });

  useEffect(() => {
    if (!isError) return;
    console.error("Error fetching headteacher dashboard:", error);
    showErrorToast("Failed to load headteacher dashboard data. Please try again.");
  }, [isError, error]);

  const cards = useMemo(() => {
    if (!dashboardData) return [];
    return [
      {
        title: "Total Students",
        value: dashboardData.summarycards.total_students.toLocaleString(),
        helper: "Across your school",
        icon: "solar:users-group-two-rounded-bold",
        shell: "from-blue-50 to-sky-50 border-blue-200",
        iconShell: "bg-blue-100 text-blue-700",
      },
      {
        title: "School Average",
        value: `${dashboardData.summarycards.class_average.toFixed(1)}%`,
        helper: "Current academic average",
        icon: "solar:graph-up-bold",
        shell: "from-emerald-50 to-teal-50 border-emerald-200",
        iconShell: "bg-emerald-100 text-emerald-700",
      },
      {
        title: "Pending Review",
        value: dashboardData.summarycards.pending_review.toLocaleString(),
        helper: "Awaiting teacher action",
        icon: "solar:file-check-bold",
        shell: "from-amber-50 to-orange-50 border-amber-200",
        iconShell: "bg-amber-100 text-amber-700",
      },
      {
        title: "Completion Rate",
        value: `${dashboardData.summarycards.completion_rate.toFixed(1)}%`,
        helper: "Submission completion",
        icon: "solar:check-circle-bold",
        shell: "from-violet-50 to-purple-50 border-violet-200",
        iconShell: "bg-violet-100 text-violet-700",
      },
    ];
  }, [dashboardData]);

  if (!authReady || (isPending && !dashboardData)) {
    return (
      <DashboardLayout>
        <PortalDashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (!dashboardData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[420px]">
          <div className="text-center">
            <p className="text-gray-600">Unable to load dashboard data.</p>
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
                <Icon icon="solar:shield-check-bold" className="w-4 h-4" />
                Head Teacher Command Center
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">School Overview Dashboard</h1>
              <p className="text-white/90 mt-2 max-w-2xl">
                Monitor student performance, review pending submissions, and keep school deadlines on track.
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-4 min-w-[220px]">
              <p className="text-xs text-white/80">Attention Needed</p>
              <p className="text-3xl font-bold">{dashboardData.summarycards.pending_review}</p>
              <p className="text-xs text-white/80 mt-1">Items pending review</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <article
              key={card.title}
              className={`rounded-2xl border bg-gradient-to-br ${card.shell} p-5 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{card.helper}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconShell}`}>
                  <Icon icon={card.icon} className="w-6 h-6" />
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">School Students</h2>
              <p className="text-sm text-gray-600 mt-1">View detailed student records, points, and login streak insights.</p>
            </div>
            <Link
              href="/parent-teacher/dashboard/headteacher/students"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Icon icon="solar:users-group-two-rounded-bold" className="w-4 h-4" />
              Open Students
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">School Teachers</h2>
              <p className="text-sm text-gray-600 mt-1">View all teachers in your school and add new teachers one by one or in bulk.</p>
            </div>
            <Link
              href="/parent-teacher/dashboard/headteacher/teachers"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Icon icon="solar:user-bold" className="w-4 h-4" />
              Open Teachers
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Deadlines</h2>
              <Link
                href="/parent-teacher/dashboard/teacher/assessments"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
              >
                Open assessments
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData.upcoming_deadlines.length > 0 ? (
                dashboardData.upcoming_deadlines.map((deadline, index) => (
                  <div key={`${deadline.assessment_title}-${index}`} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{deadline.assessment_title}</p>
                        <p className="text-xs text-gray-600 mt-1">{deadline.subject || "N/A"} • Due {formatDate(deadline.due_at)}</p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          deadline.days_left <= 1
                            ? "bg-red-100 text-red-700"
                            : deadline.days_left <= 3
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {deadline.days_left <= 0 ? "Due Today" : `${deadline.days_left} day${deadline.days_left === 1 ? "" : "s"} left`}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                        <span>{deadline.submissions_done}/{deadline.submissions_expected} submitted</span>
                        <span>{deadline.completion_percentage}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                          style={{ width: `${Math.max(0, Math.min(100, deadline.completion_percentage))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No upcoming deadlines.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Top Performers</h2>
              <Link href="/parent-teacher/dashboard/teacher/analytics" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {dashboardData.top_performers.length > 0 ? (
                dashboardData.top_performers.map((student, index) => (
                  <div key={`${student.student_id}-${index}`} className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{student.student_name}</p>
                          <p className="text-xs text-gray-500">ID: {student.student_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{student.percentage.toFixed(1)}%</p>
                        <p className="text-[11px] text-gray-500">
                          {student.improvement > 0 ? "+" : ""}
                          {student.improvement.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No performer data yet.</p>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Submissions</h2>
            <Link
              href="/parent-teacher/dashboard/teacher/submissions"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Review queue
            </Link>
          </div>
          <div className="space-y-3">
            {dashboardData.pending_submissions.length > 0 ? (
              dashboardData.pending_submissions.map((submission, index) => (
                <div
                  key={`${submission.student_id}-${submission.assessment_title}-${index}`}
                  className="rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{submission.student_name}</p>
                    <p className="text-xs text-gray-600 mt-1">{submission.assessment_title} • {submission.subject || "N/A"}</p>
                    <p className="text-xs text-gray-500 mt-1">Submitted {formatDateTime(submission.submitted_at)} • Due {formatDateTime(submission.due_at)}</p>
                  </div>
                  <Link
                    href="/parent-teacher/dashboard/teacher/submissions"
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
                  >
                    <Icon icon="solar:file-check-bold" className="w-4 h-4" />
                    Review
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">No pending submissions.</p>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

