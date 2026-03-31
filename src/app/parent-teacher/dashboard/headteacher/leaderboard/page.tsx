"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { getHeadTeacherLeaderboard } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast } from "@/lib/toast";
import { ptQueryKeys } from "@/lib/parent-teacher/queryKeys";
import { PortalLoadingOverlay } from "@/components/parent-teacher/PortalDataSkeleton";

const pageSize = 12;

export default function HeadTeacherLeaderboardPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [page, setPage] = useState(1);

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

  const { data: leaderboardData, isPending, isError, error } = useQuery({
    queryKey: ptQueryKeys.headTeacherLeaderboard,
    queryFn: getHeadTeacherLeaderboard,
    enabled: authReady,
  });

  useEffect(() => {
    if (!isError) return;
    console.error("Error fetching headteacher leaderboard:", error);
    showErrorToast("Failed to load leaderboard. Please try again.");
  }, [isError, error]);

  const rows = useMemo(() => leaderboardData?.leaderboard ?? [], [leaderboardData]);

  const grades = useMemo(() => {
    const source = leaderboardData?.scope?.grades?.length
      ? leaderboardData.scope.grades
      : rows.map((row) => row.grade);
    const unique = Array.from(new Set(source.filter(Boolean)));
    return ["All", ...unique];
  }, [leaderboardData, rows]);

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchGrade = selectedGrade === "All" || row.grade === selectedGrade;
      const matchSearch =
        normalized.length === 0 ||
        row.student_name.toLowerCase().includes(normalized) ||
        row.student_id.toLowerCase().includes(normalized) ||
        row.grade.toLowerCase().includes(normalized);
      return matchGrade && matchSearch;
    });
  }, [rows, search, selectedGrade]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedRows = filteredRows.slice(start, start + pageSize);

  const stats = useMemo(() => {
    const topPoints = rows.length > 0 ? Math.max(...rows.map((row) => row.points || 0)) : 0;
    const topStreak = rows.length > 0 ? Math.max(...rows.map((row) => row.current_login_streak || 0)) : 0;
    return {
      totalStudents: leaderboardData?.total_students ?? 0,
      topPoints,
      topStreak,
      gradesCovered: Math.max(0, grades.length - 1),
    };
  }, [rows, leaderboardData, grades]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!authReady || (isPending && !leaderboardData)) {
    return (
      <DashboardLayout>
        <PortalLoadingOverlay label="Loading school leaderboard…" />
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
                <Icon icon="solar:cup-star-bold" className="w-4 h-4" />
                Head Teacher Leaderboard
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">School Performance Ranking</h1>
              <p className="text-white/90 mt-2 max-w-2xl">
                Track student performance by points and streaks across all grades in your school.
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl p-4 min-w-[220px]">
              <p className="text-xs text-white/80">Scope</p>
              <p className="text-lg font-bold">{leaderboardData?.scope?.school_name || "Your School"}</p>
              <p className="text-xs text-white/80 mt-1">
                {leaderboardData?.scope?.timeframe ? `Timeframe: ${leaderboardData.scope.timeframe}` : "Current ranking"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <article className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Students</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalStudents.toLocaleString()}</p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Top Points</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.topPoints.toLocaleString()}</p>
          </article>
          <article className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Highest Streak</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.topStreak} days</p>
          </article>
          <article className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-5 shadow-sm">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Grades Covered</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats.gradesCovered}</p>
          </article>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Icon icon="solar:magnifer-bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by student name, ID, or grade..."
                className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {grades.map((grade) => (
              <button
                key={grade}
                type="button"
                onClick={() => {
                  setSelectedGrade(grade);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedGrade === grade
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {grade === "All" ? "All Grades" : grade}
              </button>
            ))}
          </div>

          {pagedRows.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="hidden md:grid grid-cols-7 gap-4 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500">
                  <div>Rank</div>
                  <div>Student</div>
                  <div>Grade</div>
                  <div>Points</div>
                  <div>Streak</div>
                  <div>District</div>
                  <div>County</div>
                </div>
                <div className="divide-y divide-gray-200">
                  {pagedRows.map((row) => (
                    <div
                      key={`${row.student_db_id}-${row.rank}`}
                      className="px-4 py-3 flex flex-col gap-2 md:grid md:grid-cols-7 md:items-center md:gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                          {row.rank}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{row.student_name}</p>
                        <p className="text-xs text-gray-500">ID: {row.student_id}</p>
                      </div>
                      <div className="text-sm text-gray-700">{row.grade}</div>
                      <div className="text-sm font-semibold text-gray-900">{row.points.toLocaleString()}</div>
                      <div className="text-sm text-orange-700 font-semibold">{row.current_login_streak} days</div>
                      <div className="text-sm text-gray-700">{row.district_name || "N/A"}</div>
                      <div className="text-sm text-gray-700">{row.county_name || "N/A"}</div>
                    </div>
                  ))}
                </div>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between flex-col sm:flex-row gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {start + 1} to {Math.min(start + pageSize, filteredRows.length)} of{" "}
                    {filteredRows.length} students
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
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
              <p className="text-gray-600 text-sm">No leaderboard records found for your current filters.</p>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
