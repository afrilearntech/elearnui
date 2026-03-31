"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import {
  getParentLeaderboard,
  ParentLeaderboardChildEntry,
  ParentLeaderboardTimeframe,
} from "@/lib/api/parent-teacher/parent";
import { showErrorToast } from "@/lib/toast";

const TIMEFRAMES: { value: ParentLeaderboardTimeframe; label: string; hint: string }[] = [
  { value: "this_week", label: "This week", hint: "Last 7 days momentum" },
  { value: "this_month", label: "This month", hint: "Monthly standings" },
  { value: "all_time", label: "All time", hint: "Overall ranking" },
];

function rankAccent(rank: number): { ring: string; badge: string; icon?: string } {
  if (rank === 1) {
    return {
      ring: "ring-amber-400/60",
      badge: "bg-gradient-to-br from-amber-400 to-amber-600 text-white",
      icon: "solar:cup-star-bold",
    };
  }
  if (rank === 2) {
    return {
      ring: "ring-slate-300",
      badge: "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
      icon: "solar:medal-ribbon-star-bold",
    };
  }
  if (rank === 3) {
    return {
      ring: "ring-orange-300/80",
      badge: "bg-gradient-to-br from-orange-300 to-orange-600 text-white",
      icon: "solar:medal-ribbon-bold",
    };
  }
  return {
    ring: "ring-emerald-200/80",
    badge: "bg-emerald-600 text-white",
  };
}

function scopeSummary(entry: ParentLeaderboardChildEntry): string {
  const { scope } = entry;
  const parts: string[] = [];
  if (scope.school_name) parts.push(scope.school_name);
  if (scope.grades?.length) {
    parts.push(scope.grades.join(" · "));
  } else if (scope.grade) {
    parts.push(scope.grade);
  }
  if (scope.kind) parts.push(scope.kind.replace(/_/g, " "));
  return parts.length ? parts.join(" · ") : "School leaderboard";
}

export default function ParentLeaderboardPage() {
  const [timeframe, setTimeframe] = useState<ParentLeaderboardTimeframe>("all_time");
  const [data, setData] = useState<ParentLeaderboardChildEntry[] | null>(null);
  const [resolvedTimeframe, setResolvedTimeframe] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (tf: ParentLeaderboardTimeframe) => {
    try {
      setIsLoading(true);
      const res = await getParentLeaderboard(tf);
      setData(res.children ?? []);
      setResolvedTimeframe(res.timeframe || tf);
    } catch (e) {
      console.error(e);
      showErrorToast("Could not load leaderboard. Please try again.");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load(timeframe);
  }, [timeframe, load]);

  const summary = useMemo(() => {
    if (!data?.length) {
      return { totalPoints: 0, bestRank: null as number | null, bestStreak: 0 };
    }
    const positiveRanks = data.map((c) => c.rank).filter((r) => r > 0);
    return {
      totalPoints: data.reduce((s, c) => s + (c.points || 0), 0),
      bestRank: positiveRanks.length > 0 ? Math.min(...positiveRanks) : null,
      bestStreak: Math.max(0, ...data.map((c) => c.current_login_streak || 0)),
    };
  }, [data]);

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white shadow-xl shadow-emerald-900/10">
          <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_30%_20%,white,transparent_55%)] pointer-events-none" />
          <div className="relative p-6 sm:p-10">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-xl">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/95 backdrop-blur-sm">
                  <Icon icon="solar:cup-star-bold" className="w-4 h-4" />
                  Family leaderboard
                </p>
                <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">How your children rank</h1>
                <p className="mt-3 text-base text-white/90 leading-relaxed">
                  Compare points and login streaks with classmates in the same school scope. Switch the window to see
                  weekly progress, monthly standings, or lifetime totals.
                </p>
              </div>
              {!isLoading && data && data.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full lg:w-auto lg:min-w-[320px]">
                  <div className="rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 p-4 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">Combined points</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">{summary.totalPoints.toLocaleString()}</p>
                  </div>
                  <div className="rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 p-4 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">Best rank</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">
                      {summary.bestRank != null ? `#${summary.bestRank}` : "—"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 p-4 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/75">Top streak</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">{summary.bestStreak}d</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8" role="tablist" aria-label="Leaderboard time window">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-3">Time window</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {TIMEFRAMES.map((t) => {
                  const selected = timeframe === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setTimeframe(t.value)}
                      className={
                        "flex-1 text-left rounded-2xl px-4 py-3 transition-all border " +
                        (selected
                          ? "bg-white text-emerald-900 border-white shadow-lg scale-[1.02]"
                          : "bg-white/10 text-white border-white/25 hover:bg-white/20")
                      }
                    >
                      <span className="block font-semibold">{t.label}</span>
                      <span className={"block text-xs mt-0.5 " + (selected ? "text-emerald-700/80" : "text-white/75")}>
                        {t.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[280px] rounded-2xl border border-gray-200 bg-white">
            <Icon icon="solar:loading-bold" className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
            <p className="text-gray-600 text-sm">Loading leaderboard…</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/80 p-12 text-center">
            <div className="inline-flex rounded-full bg-emerald-100 p-4 mb-4">
              <Icon icon="solar:users-group-rounded-bold" className="w-10 h-10 text-emerald-700" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">No leaderboard data yet</h2>
            <p className="mt-2 text-gray-600 max-w-md mx-auto text-sm">
              Link your children from the dashboard to see their ranks, points, and how they compare in their school
              group.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {resolvedTimeframe ? (
              <p className="text-sm text-gray-500 text-center sm:text-left">
                Showing <span className="font-medium text-gray-800">{resolvedTimeframe.replace(/_/g, " ")}</span>{" "}
                results from the server.
              </p>
            ) : null}

            {data.map((entry) => (
              <ChildLeaderboardCard key={entry.child.student_db_id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function ChildLeaderboardCard({ entry }: { entry: ParentLeaderboardChildEntry }) {
  const { child, rank, total_students, points, current_login_streak, leaderboard_context } = entry;
  const accent = rankAccent(rank);

  return (
    <article
      className={
        "rounded-3xl border border-gray-200/90 bg-white shadow-sm overflow-hidden ring-2 ring-offset-2 ring-offset-gray-50 " +
        accent.ring
      }
    >
      <div className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          <div
            className={
              "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold shadow-md " +
              accent.badge
            }
          >
            <div className="flex flex-col items-center justify-center leading-none">
              {accent.icon ? <Icon icon={accent.icon} className="w-9 h-9 mb-1" /> : null}
              <span className="tabular-nums text-lg font-extrabold">#{rank}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 gap-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{child.student_name}</h2>
              <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
                {child.grade}
              </span>
              {child.student_id ? (
                <span className="text-xs text-gray-500 font-mono">{child.student_id}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{scopeSummary(entry)}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5">
                <Icon icon="solar:ranking-bold" className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-500 tracking-wide">Rank</p>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">
                    {rank > 0 ? `#${rank}` : "—"}
                    {total_students > 0 ? (
                      <span className="text-sm font-normal text-gray-500"> of {total_students}</span>
                    ) : null}
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5">
                <Icon icon="solar:star-bold" className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-500 tracking-wide">Points</p>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">{(points ?? 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-4 py-2.5">
                <Icon icon="solar:fire-bold" className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-[11px] font-semibold uppercase text-gray-500 tracking-wide">Streak</p>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">{current_login_streak ?? 0} days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {leaderboard_context && leaderboard_context.length > 0 ? (
        <div className="border-t border-gray-100 bg-gray-50/80">
          <div className="px-6 sm:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900 inline-flex items-center gap-2">
              <Icon icon="solar:list-bold" className="w-5 h-5 text-gray-500" />
              Leaderboard context
            </h3>
            <span className="text-xs text-gray-500">Peers in the same ranking scope</span>
          </div>
          <div className="overflow-x-auto px-4 sm:px-6 pb-6">
            <table className="w-full min-w-[640px] text-sm border-collapse">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-200">
                  <th className="pb-3 pl-2 pr-2 w-14">#</th>
                  <th className="pb-3 px-2">Student</th>
                  <th className="pb-3 px-2">Grade</th>
                  <th className="pb-3 px-2 text-right">Points</th>
                  <th className="pb-3 px-2 text-right">Streak</th>
                  <th className="pb-3 pl-2 pr-2">School</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard_context.map((row) => {
                  const isMine = row.student_db_id === child.student_db_id;
                  return (
                    <tr
                      key={`${row.student_db_id}-${row.rank}`}
                      className={
                        "border-b border-gray-100 last:border-0 transition-colors " +
                        (isMine ? "bg-emerald-50/90 font-medium" : "hover:bg-white")
                      }
                    >
                      <td className="py-3 pl-2 pr-2 tabular-nums text-gray-600">{row.rank}</td>
                      <td className="py-3 px-2">
                        <span className={isMine ? "text-emerald-900" : "text-gray-900"}>{row.student_name}</span>
                        {isMine ? (
                          <span className="ml-2 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Your child
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 px-2 text-gray-600">{row.grade}</td>
                      <td className="py-3 px-2 text-right tabular-nums text-gray-900">{(row.points ?? 0).toLocaleString()}</td>
                      <td className="py-3 px-2 text-right tabular-nums text-gray-600">{row.current_login_streak ?? 0}</td>
                      <td className="py-3 pl-2 pr-2 text-gray-600 truncate max-w-[180px]" title={row.school_name}>
                        {row.school_name}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </article>
  );
}
