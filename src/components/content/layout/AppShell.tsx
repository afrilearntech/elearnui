"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/content/layout/Navbar";
import Sidebar from "@/components/content/layout/Sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("Content Creator");
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname?.startsWith("/content/sign-in");

  useEffect(() => {
    if (typeof window !== "undefined" && !isAuthPage) {
      const userStr = localStorage.getItem("user");
      const token = localStorage.getItem("auth_token");
      
      if (!token || !userStr) {
        router.push("/content/sign-in");
        return;
      }

      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || "");
        setUserRole(user.role === "CONTENTVALIDATOR" ? "Content Validator" : "Content Creator");
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, [isAuthPage, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar onMenuClick={() => setMobileSidebarOpen(true)} userRole={userRole} />
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} userName={userName} userRole={userRole} />
      <div className="min-h-screen bg-gray-50 sm:pl-64 pt-16">
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </>
  );
}
