"use client";

import { GradeOverview } from "@/lib/api/parent-teacher/parent";

interface GradesOverviewProps {
  childId: string;
  childName: string;
  grades: GradeOverview[];
}

const getStatusFromRemark = (remark: string): "excellent" | "good" | "needs-improvement" => {
  const lowerRemark = remark.toLowerCase();
  if (lowerRemark.includes("excellent") || lowerRemark.includes("outstanding") || lowerRemark.includes("distinction")) {
    return "excellent";
  }
  if (lowerRemark.includes("good") || lowerRemark.includes("pass") || lowerRemark.includes("satisfactory")) {
    return "good";
  }
  return "needs-improvement";
};

const getStatusColor = (status: "excellent" | "good" | "needs-improvement") => {
  switch (status) {
    case "excellent":
      return "bg-green-100 text-green-800 border-green-200";
    case "good":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "needs-improvement":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getGradeColor = (grade: string) => {
  const upperGrade = grade.toUpperCase();
  if (upperGrade.startsWith("A")) return "text-green-600";
  if (upperGrade.startsWith("B")) return "text-blue-600";
  if (upperGrade.startsWith("C")) return "text-yellow-600";
  if (upperGrade.startsWith("D")) return "text-orange-600";
  return "text-red-600";
};

const calculatePercentage = (score: number): number => {
  return Math.min(100, Math.max(0, score));
};

export default function GradesOverview({ childId, childName, grades }: GradesOverviewProps) {
  if (grades.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Grades Overview
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No grades available for {childName} yet.</p>
        </div>
      </div>
    );
  }

  const averageScore = Math.round(
    grades.reduce((sum, g) => sum + g.overall_score, 0) / grades.length
  );
  const averagePercentage = calculatePercentage(averageScore);
  const averageGrade = averagePercentage >= 90 ? "A" : averagePercentage >= 80 ? "B" : averagePercentage >= 70 ? "C" : averagePercentage >= 60 ? "D" : "F";

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">
          Grades Overview
        </h3>
        <div className="text-right">
          <p className="text-xs text-gray-600">
            Overall Average
          </p>
          <p className={`text-xl font-bold ${getGradeColor(averageGrade)}`}>
            {averageGrade} ({averagePercentage}%)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {grades.map((grade, index) => {
          const percentage = calculatePercentage(grade.overall_score);
          const status = getStatusFromRemark(grade.score_remark);
          
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">
                  {grade.subject}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${getGradeColor(grade.score_grade)}`}>
                    {grade.score_grade}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(status)}`}
                  >
                    {grade.score_remark}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    percentage >= 90
                      ? "bg-green-500"
                      : percentage >= 80
                      ? "bg-blue-500"
                      : percentage >= 70
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  Score: {grade.overall_score}
                </p>
                <p className="text-xs text-gray-600">
                  {percentage}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

