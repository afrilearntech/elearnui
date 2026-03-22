"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import {
  normalizeStoredUserRole,
  readUserRoleFromLocalStorage,
  type DashboardRoleDisplay,
} from "@/lib/parent-teacher/displayRole";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onLinkChild?: () => void;
}

export default function DashboardLayout({ children, onLinkChild }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<DashboardRoleDisplay>(() => {
    if (typeof window === "undefined") return "Parent";
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return "Parent";
      const user = JSON.parse(userStr) as { name?: string; role?: string };
      return normalizeStoredUserRole(user.role);
    } catch {
      return "Parent";
    }
  });
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/parent-teacher/sign-in");

  useEffect(() => {
    if (typeof window !== "undefined" && !isAuthPage) {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("auth_token");
      
      if (!token || !userStr) {
        window.location.href = "/parent-teacher/sign-in";
        return;
      }

      try {
        const user = JSON.parse(userStr) as { name?: string; role?: string };
        setUserName(user.name || "User");
        setUserRole(normalizeStoredUserRole(user.role));
      } catch (e) {
        console.error("Error parsing user data:", e);
        setUserRole(readUserRoleFromLocalStorage());
      }
    }
  }, [isAuthPage]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar onMenuClick={() => setMobileSidebarOpen(true)} userRole={userRole} onLinkChild={onLinkChild} />
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} userName={userName} userRole={userRole} />
      <div className="min-h-screen bg-gray-50 sm:pl-64 pt-16">
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </>
  );
}

