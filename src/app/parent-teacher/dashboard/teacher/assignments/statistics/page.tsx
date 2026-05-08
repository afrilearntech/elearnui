"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import {
  getTeacherAssessmentStatistics,
  AssessmentStatisticsResponse,
} from "@/lib/api/parent-teacher/teacher";
import { showErrorToast } from "@/lib/toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Scope = "lesson" | "general";

function TeacherAssessmentStatisticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssessmentStatisticsResponse | null>(null);

  const scopeParam = (searchParams.get("scope") || "").toLowerCase() as Scope;
  const idParam = Number(searchParams.get("id") || 0);
  const titleParam = searchParams.get("title") || "Assessment";

  useEffect(() => {
    const validScope = scopeParam === "lesson" || scopeParam === "general";
    if (!validScope || !idParam || Number.isNaN(idParam)) {
      setError("Invalid statistics request. Please return and select an assessment again.");
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response =
          scopeParam === "general"
            ? await getTeacherAssessmentStatistics({ general_assessment_id: idParam })
            : await getTeacherAssessmentStatistics({ lesson_assessment_id: idParam });
        setData(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load assessment statistics.";
        setError(message);
        showErrorToast(message);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [scopeParam, idParam]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.chart.labels.map((label, index) => ({
      label,
      count: data.chart.values[index] ?? 0,
    }));
  }, [data]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wide text-indigo-600 uppercase">Assessment Statistics</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{titleParam}</h1>
            <p className="mt-1 text-sm text-gray-600">
              {scopeParam === "general" ? "General assessment" : "Lesson assessment"} #{idParam}
            </p>
          </div>
          <button
            onClick={() => router.push("/parent-teacher/dashboard/teacher/assignments")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Icon icon="solar:alt-arrow-left-outline" className="h-4 w-4" />
            Back to Assessments
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="mt-3 text-sm text-gray-600">Loading statistics...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>
        ) : data ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Submissions", value: data.summary.submissions },
                { label: "Mean", value: data.summary.mean },
                { label: "Median", value: data.summary.median },
                { label: "Mode", value: data.summary.mode },
                { label: "Std. Deviation", value: data.summary.standard_deviation },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Score Range</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{data.summary.range}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Q1 / Q3</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {data.summary.Q1} / {data.summary.Q3}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">Skewness</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{data.summary.skewness_coefficient}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">Distribution of Scores</h2>
                <div className="inline-flex items-center gap-2 text-xs text-gray-600">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                  Learner count per score bin
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fill: "#4B5563", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "#4B5563", fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                      contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB" }}
                      formatter={(value) => [value, "Submissions"]}
                    />
                    <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function StatisticsPageFallback() {
  return (
    <DashboardLayout>
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="mt-3 text-sm text-gray-600">Loading statistics...</p>
      </div>
    </DashboardLayout>
  );
}

export default function TeacherAssessmentStatisticsPage() {
  return (
    <Suspense fallback={<StatisticsPageFallback />}>
      <TeacherAssessmentStatisticsContent />
    </Suspense>
  );
}
