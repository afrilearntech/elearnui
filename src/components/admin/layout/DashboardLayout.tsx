"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  onAddStudent?: () => void;
  onAddTeacher?: () => void;
  onAddParent?: () => void;
  onLinkStudent?: () => void;
  onAddSchool?: () => void;
  onAddCounty?: () => void;
  onAddDistrict?: () => void;
  onAssignSubjectToTeacher?: () => void;
}

export default function DashboardLayout({ children, onAddStudent, onAddTeacher, onAddParent, onLinkStudent, onAddSchool, onAddCounty, onAddDistrict, onAssignSubjectToTeacher }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Administration");
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/admin/sign-in");

  useEffect(() => {
    if (typeof window !== "undefined" && !isAuthPage) {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("auth_token");
      
      if (!token || !userStr) {
        window.location.href = "/admin/sign-in";
        return;
      }

      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || "Admin");
        setUserRole(user.role === "ADMIN" ? "Administration" : "Administration");
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, [isAuthPage]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={
        <header className="fixed top-0 left-0 z-50 h-16 w-full border-b border-black/5 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/60">
          <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8 sm:pl-64">
            <div className="flex items-center gap-4 min-w-0 flex-shrink">
              <div className="h-11 w-11 bg-gray-200 rounded-sm animate-pulse" />
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </header>
      }>
        <Navbar onMenuClick={() => setMobileSidebarOpen(true)} userRole={userRole} onAddStudent={onAddStudent} onAddTeacher={onAddTeacher} onAddParent={onAddParent} onLinkStudent={onLinkStudent} onAddSchool={onAddSchool} onAddCounty={onAddCounty} onAddDistrict={onAddDistrict} onAssignSubjectToTeacher={onAssignSubjectToTeacher} />
      </Suspense>
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} userName={userName} userRole={userRole} />
      <div className="min-h-screen bg-gray-50 sm:pl-64 pt-16">
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </>
  );
}
