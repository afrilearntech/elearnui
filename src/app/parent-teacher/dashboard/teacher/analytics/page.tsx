"use client";

import { useState, useMemo } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";

interface LeaderboardEntry {
  id: string;
  rank: number;
  studentName: string;
  studentId: string;
  totalAssessments: number;
  averageScore: number;
  totalScore: number;
  maxPossibleScore: number;
  improvement: number;
  topSubject: string;
}

const dummyLeaderboard: LeaderboardEntry[] = [
  {
    id: "1",
    rank: 1,
    studentName: "Emma Johnson",
    studentId: "STU001",
    totalAssessments: 8,
    averageScore: 94.5,
    totalScore: 756,
    maxPossibleScore: 800,
    improvement: 5.2,
    topSubject: "Literacy",
  },
  {
    id: "2",
    rank: 2,
    studentName: "Michael Johnson",
    studentId: "STU002",
    totalAssessments: 7,
    averageScore: 92.3,
    totalScore: 646,
    maxPossibleScore: 700,
    improvement: 3.8,
    topSubject: "Numeracy",
  },
  {
    id: "3",
    rank: 3,
    studentName: "Sarah Williams",
    studentId: "STU003",
    totalAssessments: 8,
    averageScore: 89.1,
    totalScore: 713,
    maxPossibleScore: 800,
    improvement: 2.5,
    topSubject: "Science",
  },
  {
    id: "4",
    rank: 4,
    studentName: "David Brown",
    studentId: "STU004",
    totalAssessments: 6,
    averageScore: 87.8,
    totalScore: 527,
    maxPossibleScore: 600,
    improvement: 4.1,
    topSubject: "Literacy",
  },
  {
    id: "5",
    rank: 5,
    studentName: "Lisa Anderson",
    studentId: "STU005",
    totalAssessments: 7,
    averageScore: 86.4,
    totalScore: 605,
    maxPossibleScore: 700,
    improvement: 1.9,
    topSubject: "Numeracy",
  },
  {
    id: "6",
    rank: 6,
    studentName: "James Wilson",
    studentId: "STU006",
    totalAssessments: 6,
    averageScore: 84.2,
    totalScore: 505,
    maxPossibleScore: 600,
    improvement: 3.2,
    topSubject: "Science",
  },
  {
    id: "7",
    rank: 7,
    studentName: "Olivia Davis",
    studentId: "STU007",
    totalAssessments: 5,
    averageScore: 82.6,
    totalScore: 413,
    maxPossibleScore: 500,
    improvement: 2.8,
    topSubject: "Literacy",
  },
  {
    id: "8",
    rank: 8,
    studentName: "Noah Martinez",
    studentId: "STU008",
    totalAssessments: 6,
    averageScore: 81.3,
    totalScore: 488,
    maxPossibleScore: 600,
    improvement: 1.5,
    topSubject: "Numeracy",
  },
  {
    id: "9",
    rank: 9,
    studentName: "Sophia Garcia",
    studentId: "STU009",
    totalAssessments: 5,
    averageScore: 79.8,
    totalScore: 399,
    maxPossibleScore: 500,
    improvement: 0.8,
    topSubject: "Science",
  },
  {
    id: "10",
    rank: 10,
    studentName: "Lucas Rodriguez",
    studentId: "STU010",
    totalAssessments: 4,
    averageScore: 78.5,
    totalScore: 314,
    maxPossibleScore: 400,
    improvement: 2.1,
    topSubject: "Literacy",
  },
];

const getRankColor = (rank: number) => {
  if (rank === 1) return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (rank === 2) return "bg-gray-100 text-gray-800 border-gray-300";
  if (rank === 3) return "bg-orange-100 text-orange-800 border-orange-300";
  return "bg-blue-50 text-blue-700 border-blue-200";
};

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
};

export default function TeacherAnalyticsPage() {
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(
      new Set(dummyLeaderboard.map((entry) => entry.topSubject))
    ).sort();
    return ["All", ...uniqueSubjects];
  }, []);

  const filteredLeaderboard = useMemo(() => {
    return dummyLeaderboard.filter((entry) => {
      const matchesSearch =
        search.trim().length === 0 ||
        entry.studentName.toLowerCase().includes(search.toLowerCase()) ||
        entry.studentId.toLowerCase().includes(search.toLowerCase());

      const matchesSubject =
        selectedSubject === "All" || entry.topSubject === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  }, [search, selectedSubject]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLeaderboard.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedLeaderboard = filteredLeaderboard.slice(start, start + pageSize);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const averageScore = useMemo(() => {
    if (filteredLeaderboard.length === 0) return 0;
    const sum = filteredLeaderboard.reduce((acc, entry) => acc + entry.averageScore, 0);
    return sum / filteredLeaderboard.length;
  }, [filteredLeaderboard]);

  const totalAssessments = useMemo(() => {
    return filteredLeaderboard.reduce((acc, entry) => acc + entry.totalAssessments, 0);
  }, [filteredLeaderboard]);

  const topPerformers = useMemo(() => {
    return filteredLeaderboard.slice(0, 3);
  }, [filteredLeaderboard]);

  const scoreDistribution = useMemo(() => {
    const ranges = {
      "90-100": 0,
      "80-89": 0,
      "70-79": 0,
      "Below 70": 0,
    };
    filteredLeaderboard.forEach((entry) => {
      if (entry.averageScore >= 90) ranges["90-100"]++;
      else if (entry.averageScore >= 80) ranges["80-89"]++;
      else if (entry.averageScore >= 70) ranges["70-79"]++;
      else ranges["Below 70"]++;
    });
    return ranges;
  }, [filteredLeaderboard]);

  const maxCount = Math.max(...Object.values(scoreDistribution));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Leaderboard</h1>
            <p className="text-gray-600 mt-1">
              Track student performance and view detailed analytics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Average Score
                </p>
                <p className={`text-2xl font-bold mt-2 ${getScoreColor(averageScore)}`}>
                  {averageScore.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Class average</p>
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
                  Total Assessments
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {totalAssessments}
                </p>
                <p className="text-xs text-gray-500 mt-1">Graded assessments</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon="solar:document-text-bold" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Students
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {filteredLeaderboard.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">In leaderboard</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon icon="solar:users-group-two-rounded-bold" className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
            <div className="space-y-3">
              {topPerformers.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${getRankColor(
                        entry.rank
                      )}`}
                    >
                      {entry.rank}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {entry.studentName}
                      </p>
                      <p className="text-xs text-gray-500">{entry.studentId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${getScoreColor(entry.averageScore)}`}>
                      {entry.averageScore.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {entry.totalAssessments} assessments
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h2>
            <div className="space-y-4">
              {Object.entries(scoreDistribution).map(([range, count]) => {
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                const barColor =
                  range === "90-100"
                    ? "bg-green-500"
                    : range === "80-89"
                    ? "bg-blue-500"
                    : range === "70-79"
                    ? "bg-yellow-500"
                    : "bg-red-500";
                return (
                  <div key={range}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{range}%</span>
                      <span className="text-sm text-gray-600">{count} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${barColor} transition-all`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                  placeholder="Search by student name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto">
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white text-sm"
              >
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">Leaderboard</h2>

          {pagedLeaderboard.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <div className="hidden md:grid grid-cols-8 gap-4 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500">
                  <div>Rank</div>
                  <div>Student</div>
                  <div>Student ID</div>
                  <div>Assessments</div>
                  <div>Average Score</div>
                  <div>Total Score</div>
                  <div>Improvement</div>
                  <div>Top Subject</div>
                </div>

                <div className="divide-y divide-gray-200">
                  {pagedLeaderboard.map((entry) => (
                    <div
                      key={entry.id}
                      className="px-4 py-3 flex flex-col gap-2 md:grid md:grid-cols-8 md:items-center md:gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div
                          className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border-2 ${getRankColor(
                            entry.rank
                          )}`}
                        >
                          {entry.rank}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {entry.studentName}
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {entry.studentId} • {entry.totalAssessments} assessments
                        </p>
                      </div>
                      <div className="text-sm text-gray-700 hidden md:block">
                        {entry.studentId}
                      </div>
                      <div className="text-sm font-medium text-gray-900 hidden md:block">
                        {entry.totalAssessments}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold ${getScoreColor(entry.averageScore)}`}
                        >
                          {entry.averageScore.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 md:hidden">
                          {entry.totalScore}/{entry.maxPossibleScore} points
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <p className="text-sm font-medium text-gray-900">
                          {entry.totalScore}/{entry.maxPossibleScore}
                        </p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.improvement > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.improvement > 0 ? "+" : ""}
                          {entry.improvement.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {entry.topSubject}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between flex-col sm:flex-row gap-4">
                <div className="text-sm text-gray-600">
                  Showing {start + 1} to{" "}
                  {Math.min(start + pageSize, filteredLeaderboard.length)} of{" "}
                  {filteredLeaderboard.length} students
                </div>
                {totalPages > 1 && (
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
                )}
              </div>
            </>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-sm">
                No students found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

