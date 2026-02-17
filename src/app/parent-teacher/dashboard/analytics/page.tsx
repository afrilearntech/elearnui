"use client";

import { useMemo, useState, useEffect } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import TimeSpentAnalytics from "@/components/parent-teacher/dashboard/TimeSpentAnalytics";
import { getMyChildren, MyChild } from "@/lib/api/parent-teacher/parent";
import { getParentAnalytics, ParentAnalyticsResponse } from "@/lib/api/parent-teacher/parent";
import { showErrorToast } from "@/lib/toast";

export default function AnalyticsPage() {
  const [children, setChildren] = useState<MyChild[]>([]);
  const [analytics, setAnalytics] = useState<ParentAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string>("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [childrenData, analyticsData] = await Promise.all([
          getMyChildren(),
          getParentAnalytics(),
        ]);
        setChildren(childrenData);
        setAnalytics(analyticsData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        showErrorToast("Failed to load analytics data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const childId = selectedChildId === "All" ? null : selectedChildId;
        const data = await getParentAnalytics(childId);
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
        showErrorToast("Failed to load analytics data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedChildId]);

  const selectedChild =
    selectedChildId === "All"
      ? null
      : children.find((child) => child.id.toString() === selectedChildId) || null;

  const handleExportReport = () => {
    if (!analytics) return;

    const headers = [
      "Child Name",
      "Grade Level",
      "School",
      "Total Assessments",
      "Completed Assessments",
      "Average Score (%)",
      "Total Subjects Touched",
      "Estimated Total Hours",
    ];

    const rows = children.map((child) => {
      return [
        child.name,
        child.grade,
        child.school,
        analytics.summarycards.total_assessments.toString(),
        analytics.summarycards.total_completed_assessments.toString(),
        analytics.summarycards.overall_average_score.toString(),
        analytics.summarycards.total_subjects_touched.toString(),
        analytics.summarycards.estimated_total_hours.toString(),
      ];
    });

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        )
        .join("\n") + "\n";

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `child-performance-report-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Get insights into your children&apos;s learning engagement
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Analytics Summary
                </h2>
                <p className="text-sm text-gray-600">
                  Select a child to review their overall performance and learning analytics.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
                >
                  <option value="All">All Children</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id.toString()}>
                      {child.name} ({child.grade})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleExportReport}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
                >
                  Export Report (CSV)
                </button>
              </div>
            </div>
          </div>

          {analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                  Total Assessments
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-900">
                  {analytics.summarycards.total_assessments}
                </p>
                <p className="mt-1 text-xs text-emerald-800">
                  Across all tracked subjects
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">
                  Completed
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-900">
                  {analytics.summarycards.total_completed_assessments}
                </p>
                <p className="mt-1 text-xs text-blue-800">
                  Successfully submitted assessments
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                  Average Score
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-900">
                  {analytics.summarycards.overall_average_score}%
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Overall performance
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">
                  Subjects Touched
                </p>
                <p className="mt-2 text-2xl font-bold text-purple-900">
                  {analytics.summarycards.total_subjects_touched}
                </p>
                <p className="mt-1 text-xs text-purple-800">
                  Different subjects studied
                </p>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                <p className="text-xs font-medium text-indigo-700 uppercase tracking-wide">
                  Total Hours
                </p>
                <p className="mt-2 text-2xl font-bold text-indigo-900">
                  {analytics.summarycards.estimated_total_hours}
                </p>
                <p className="mt-1 text-xs text-indigo-800">
                  Estimated time spent
                </p>
              </div>
            </div>
          )}

          {selectedChild && (
            <div className="mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900">
                  {selectedChild.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedChild.grade} • {selectedChild.school}
                </p>
              </div>
            </div>
          )}

          {analytics && analytics.estimated_time_spent && analytics.estimated_time_spent.length > 0 && (
            <TimeSpentAnalytics 
              childId={selectedChild?.id.toString() ?? "all"}
              timeSpentData={analytics.estimated_time_spent}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


