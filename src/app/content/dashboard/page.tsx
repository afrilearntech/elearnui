"use client";

import React, { useEffect, useState } from "react";
import { getDashboardStats, DashboardStats } from "@/lib/api/content/dashboard";
import KPICard from "@/components/content/dashboard/KPICard";
import LessonsChart from "@/components/content/dashboard/LessonsChart";
import PerformanceGauge from "@/components/content/dashboard/PerformanceGauge";

async function notifyError(message: string) {
  if (typeof window !== "undefined") {
    const { showErrorToast } = await import("@/lib/toast");
    showErrorToast(message);
  } else {
    console.error(message);
  }
}

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string>("CONTENTCREATOR");
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role || "CONTENTCREATOR");
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const token = localStorage.getItem("auth_token");
        if (!token) {
          setLoadError("Missing authentication token. Please sign in again.");
          return;
        }

        const data = await getDashboardStats(token);
        if (!isMounted) return;

        setDashboardData(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load dashboard data.";
        setLoadError(message);
        await notifyError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [userRole]);

  const isValidator = userRole === "CONTENTVALIDATOR";

  const kpiData = [
    {
      title: "Total Contents",
      value: dashboardData ? dashboardData.overall.total.toString() : "0",
    },
    {
      title: "Approved",
      value: dashboardData ? dashboardData.overall.approved.toString() : "0",
    },
    {
      title: "Rejected",
      value: dashboardData ? dashboardData.overall.rejected.toString() : "0",
    },
    {
      title: isValidator ? "Pending Approvals" : "Reviews Requested",
      value: dashboardData ? dashboardData.overall.review_requested.toString() : "0",
    },
  ];

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading dashboard data...</p>
        </div>
      ) : loadError ? (
        <div className="text-center py-12">
          <p className="text-rose-600">{loadError}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiData.map((kpi, index) => (
              <KPICard key={index} title={kpi.title} value={kpi.value} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lessons Performance Chart - Takes 2 columns */}
            <div className="lg:col-span-2">
              <LessonsChart />
            </div>

            {/* Overall Performance Gauge - Takes 1 column */}
            <div className="lg:col-span-1">
              <PerformanceGauge />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
