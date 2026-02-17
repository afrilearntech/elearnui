"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/admin/layout/DashboardLayout";
import MetricCard from "@/components/admin/dashboard/MetricCard";
import LessonsChart from "@/components/admin/dashboard/LessonsChart";
import HighLearners from "@/components/admin/dashboard/HighLearners";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import { getDashboardData, DashboardData } from "@/lib/api/admin/dashboard";
import { showErrorToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";
import { Icon } from "@iconify/react";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const data = await getDashboardData();
      // API returns an array, take the first item, or handle if it's a single object
      if (Array.isArray(data) && data.length > 0) {
        setDashboardData(data[0]);
      } else if (data && !Array.isArray(data)) {
        // Handle case where API returns a single object instead of array
        setDashboardData(data as DashboardData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to load dashboard data. Please try again.");
      } else {
        showErrorToast("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getChangeType = (changePct: number): "increase" | "decrease" => {
    return changePct >= 0 ? "increase" : "decrease";
  };

  const metrics = dashboardData
    ? [
        {
          title: "Total Schools",
          value: dashboardData.summary_cards.schools.count,
          change: Math.abs(dashboardData.summary_cards.schools.change_pct),
          changeType: getChangeType(dashboardData.summary_cards.schools.change_pct),
        },
        {
          title: "Total Districts",
          value: dashboardData.summary_cards.districts.count,
          change: Math.abs(dashboardData.summary_cards.districts.change_pct),
          changeType: getChangeType(dashboardData.summary_cards.districts.change_pct),
        },
        {
          title: "Total Teachers",
          value: dashboardData.summary_cards.teachers.count,
          change: Math.abs(dashboardData.summary_cards.teachers.change_pct),
          changeType: getChangeType(dashboardData.summary_cards.teachers.change_pct),
        },
        {
          title: "Total Parents",
          value: dashboardData.summary_cards.parents.count,
          change: Math.abs(dashboardData.summary_cards.parents.change_pct),
          changeType: getChangeType(dashboardData.summary_cards.parents.change_pct),
        },
  {
    title: "Total Content Creators",
          value: dashboardData.summary_cards.content_creators.count,
          change: Math.abs(dashboardData.summary_cards.content_creators.change_pct),
          changeType: getChangeType(dashboardData.summary_cards.content_creators.change_pct),
  },
  {
    title: "Total Content Validators",
          value: dashboardData.summary_cards.content_validators.count,
          change: Math.abs(dashboardData.summary_cards.content_validators.change_pct),
          changeType: getChangeType(dashboardData.summary_cards.content_validators.change_pct),
  },
  {
    title: "Approved Subjects",
          value: dashboardData.summary_cards.approved_subjects.count,
          change: Math.abs(dashboardData.summary_cards.approved_subjects.change_pct),
          changeType: getChangeType(dashboardData.summary_cards.approved_subjects.change_pct),
  },
  {
    title: "Lessons Pending Approval",
          value: dashboardData.summary_cards.lessons_pending_approval.count,
          change: Math.abs(dashboardData.summary_cards.lessons_pending_approval.change_pct),
          changeType: getChangeType(dashboardData.summary_cards.lessons_pending_approval.change_pct),
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, Admin
          </h1>
          <p className="text-gray-600">
            Here is a summary of your platform activity.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Icon icon="solar:loading-bold" className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              changeType={metric.changeType}
            />
          ))}
        </div>

            {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LessonsChart
                data={dashboardData?.lessons_chart?.points || []}
                granularity={dashboardData?.lessons_chart?.granularity || "month"}
              />
              <HighLearners learners={dashboardData?.high_learners || []} />
        </div>

            {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity />
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

