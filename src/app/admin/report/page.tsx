"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/admin/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { getSystemReports, SystemReport, ReportFilter, FlattenedSystemReport } from "@/lib/api/admin/reports";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

export default function ReportPage() {
  const [reports, setReports] = useState<FlattenedSystemReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedYear, setSelectedYear] = useState<number>(0);

  // Fetch all reports on initial load
  useEffect(() => {
    fetchReports();
  }, []);

  // Fetch reports when filters change (only if both are selected)
  useEffect(() => {
    if (selectedMonth > 0 && selectedYear > 0) {
    fetchReports();
    }
  }, [selectedMonth, selectedYear]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      // Only apply filters if both month and year are selected
      const filter: ReportFilter | undefined = 
        selectedMonth > 0 && selectedYear > 0
          ? {
              month: selectedMonth,
              year: selectedYear,
            }
          : undefined;
      
      const data = await getSystemReports(filter);
      
      if (!data || data.length === 0) {
        setReports([]);
        return;
      }
      
      // Flatten the response structure for easier display
      const flattenedReports: FlattenedSystemReport[] = data.map((report) => {
        const detailed = report.detailed && report.detailed.length > 0 
          ? report.detailed[0] 
          : {
              period: report.period,
              users: 0,
              students: 0,
              teachers: 0,
              parents: 0,
              schools: 0,
              subjects: 0,
              lessons: 0,
              submissions_total: 0,
              submissions_graded: 0,
            };

        return {
          period: report.period,
          total_users: report.summary?.total_users || 0,
          total_students: report.summary?.total_students || 0,
          total_teachers: report.summary?.total_teachers || 0,
          total_parents: detailed.parents || 0,
          total_schools: report.summary?.total_schools || 0,
          total_subjects: detailed.subjects || 0,
          total_lessons: detailed.lessons || 0,
          total_submissions: detailed.submissions_total || 0,
          graded_submissions: detailed.submissions_graded || 0,
          content_creators: report.content_stats?.content_creators || 0,
          content_validators: report.content_stats?.content_validators || 0,
          approved_subjects: report.content_stats?.approved_subjects || 0,
          pending_subjects: report.content_stats?.pending_subjects || 0,
          approved_lessons: report.content_stats?.approved_lessons || 0,
          pending_lessons: report.content_stats?.pending_lessons || 0,
          total_games: report.content_stats?.total_games || 0,
          new_users: report.activity_stats?.new_users || 0,
          new_students: report.activity_stats?.new_students || 0,
          new_teachers: report.activity_stats?.new_teachers || 0,
          new_parents: report.activity_stats?.new_parents || 0,
          active_users: report.activity_stats?.active_users || 0,
          total_assessments: report.activity_stats?.total_assessments || 0,
          pending_submissions: report.activity_stats?.pending_submissions || 0,
        };
      });

      setReports(flattenedReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to load reports. Please try again.");
      } else {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
        console.error("Full error:", error);
        showErrorToast(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Reports</h1>
            <p className="text-gray-600 mt-1">
              View comprehensive system reports
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Reports</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month <span className="text-gray-500">(1-12)</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => {
                  const month = parseInt(e.target.value);
                  setSelectedMonth(month);
                  if (month === 0) {
                    setSelectedYear(0);
                  }
                }}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="0">All Months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })} ({month})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                type="number"
                value={selectedYear || ""}
                onChange={(e) => {
                  const year = parseInt(e.target.value) || 0;
                  setSelectedYear(year);
                  // If year is cleared, also clear month to show all reports
                  if (year === 0) {
                    setSelectedMonth(0);
                  }
                }}
                min="2020"
                max={new Date().getFullYear() + 1}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="All Years (leave empty for all)"
              />
            </div>
            {(selectedMonth > 0 || selectedYear > 0) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedMonth(0);
                    setSelectedYear(0);
                  }}
                  className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reports Summary Cards */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatNumber(reports[0]?.total_users || 0)}
                  </p>
                </div>
                <div className="bg-blue-200 rounded-lg p-3">
                  <Icon icon="solar:users-group-two-rounded-bold" className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Total Students</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatNumber(reports[0]?.total_students || 0)}
                  </p>
                </div>
                <div className="bg-green-200 rounded-lg p-3">
                  <Icon icon="solar:book-bookmark-bold" className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-700 mb-1">Total Teachers</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatNumber(reports[0]?.total_teachers || 0)}
                  </p>
                </div>
                <div className="bg-purple-200 rounded-lg p-3">
                  <Icon icon="solar:users-group-rounded-bold" className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-amber-700 mb-1">Total Schools</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {formatNumber(reports[0]?.total_schools || 0)}
                  </p>
                </div>
                <div className="bg-amber-200 rounded-lg p-3">
                  <Icon icon="solar:buildings-2-bold" className="w-6 h-6 text-amber-700" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Detailed Reports</h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Icon icon="solar:loading-bold" className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading reports...</p>
              </div>
            </div>
          ) : reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Students
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teachers
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parents
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schools
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lessons
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submissions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.period}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatNumber(report.total_users)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatNumber(report.total_students)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatNumber(report.total_teachers)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatNumber(report.total_parents)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatNumber(report.total_schools)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatNumber(report.total_subjects)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatNumber(report.total_lessons)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex flex-col">
                          <span className="font-medium">{formatNumber(report.total_submissions)}</span>
                          <span className="text-xs text-gray-500">
                            {formatNumber(report.graded_submissions)} graded
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Icon icon="solar:document-text-bold" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">
                No reports found for the selected period. Please try a different filter.
              </p>
            </div>
          )}
        </div>

        {/* Additional Statistics */}
        {reports.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="solar:chart-2-bold" className="w-5 h-5 text-emerald-600" />
                Content Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Content Creators</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatNumber(reports[0]?.content_creators || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Content Validators</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatNumber(reports[0]?.content_validators || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Approved Subjects</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatNumber(reports[0]?.approved_subjects || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Pending Subjects</span>
                  <span className="text-sm font-bold text-amber-600">
                    {formatNumber(reports[0]?.pending_subjects || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Approved Lessons</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatNumber(reports[0]?.approved_lessons || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Pending Lessons</span>
                  <span className="text-sm font-bold text-amber-600">
                    {formatNumber(reports[0]?.pending_lessons || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total Games</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatNumber(reports[0]?.total_games || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="solar:graph-up-bold" className="w-5 h-5 text-blue-600" />
                Activity Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">New Users</span>
                  <span className="text-sm font-bold text-blue-600">
                    {formatNumber(reports[0]?.new_users || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">New Students</span>
                  <span className="text-sm font-bold text-green-600">
                    {formatNumber(reports[0]?.new_students || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">New Teachers</span>
                  <span className="text-sm font-bold text-purple-600">
                    {formatNumber(reports[0]?.new_teachers || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">New Parents</span>
                  <span className="text-sm font-bold text-indigo-600">
                    {formatNumber(reports[0]?.new_parents || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Active Users</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {formatNumber(reports[0]?.active_users || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Total Assessments</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatNumber(reports[0]?.total_assessments || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Pending Submissions</span>
                  <span className="text-sm font-bold text-amber-600">
                    {formatNumber(reports[0]?.pending_submissions || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

