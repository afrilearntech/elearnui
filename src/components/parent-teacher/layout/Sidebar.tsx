"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { showSuccessToast } from "@/lib/toast";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const parentNavItems: NavItem[] = [
  { href: "/parent-teacher/dashboard", label: "Dashboard", icon: "solar:widget-5-bold" },
  { href: "/parent-teacher/dashboard/children", label: "My Children", icon: "solar:users-group-two-rounded-bold" },
  { href: "/parent-teacher/dashboard/grades", label: "Grades", icon: "solar:diploma-verified-bold" },
  { href: "/parent-teacher/dashboard/assessments", label: "General Assessment", icon: "solar:document-text-bold" },
  { href: "/parent-teacher/dashboard/submissions", label: "Submissions", icon: "solar:file-check-bold" },
  { href: "/parent-teacher/dashboard/analytics", label: "Analytics", icon: "solar:chart-2-bold" },
];

const teacherNavItems: NavItem[] = [
  { href: "/parent-teacher/dashboard/teacher", label: "Dashboard", icon: "solar:widget-5-bold" },
  { href: "/parent-teacher/dashboard/teacher/class", label: "My Class", icon: "solar:users-group-two-rounded-bold" },
  { href: "/parent-teacher/dashboard/teacher/teachers", label: "Teachers", icon: "solar:user-bold" },
  { href: "/parent-teacher/dashboard/teacher/subjects", label: "Subjects", icon: "solar:book-bold" },
  { href: "/parent-teacher/dashboard/teacher/lessons", label: "Lessons", icon: "solar:book-bookmark-bold" },
  { href: "/parent-teacher/dashboard/teacher/assignments", label: "Assignments", icon: "solar:document-add-bold" },
  { href: "/parent-teacher/dashboard/teacher/quizzes", label: "Quizzes", icon: "solar:clipboard-list-bold" },
  { href: "/parent-teacher/dashboard/teacher/assessments", label: "General Assessment", icon: "solar:document-text-bold" },
  { href: "/parent-teacher/dashboard/teacher/grades", label: "Grades", icon: "solar:diploma-verified-bold" },
  { href: "/parent-teacher/dashboard/teacher/submissions", label: "Submissions", icon: "solar:file-check-bold" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/parent-teacher/dashboard") return pathname === "/parent-teacher/dashboard" || pathname === "/parent-teacher";
  if (href === "/dashboard/teacher") return pathname === "/parent-teacher/dashboard/teacher";
  return pathname.startsWith(href);
}

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  userName?: string;
  userRole?: string;
};

export default function Sidebar({ mobileOpen = false, onClose, userName = "Parent", userRole = "Parent" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isTeacher = userRole === "Teacher";
  const navItems = isTeacher ? teacherNavItems : parentNavItems;

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      showSuccessToast("You have been logged out successfully");
      setTimeout(() => {
        router.push("/parent-teacher/sign-in");
      }, 500);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 shrink-0 border-r border-black/5 bg-white/95 pt-4 sm:block">
        <nav className="flex h-full flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pt-24 pb-4">
            <ul className="px-3 py-2 space-y-[15px]">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors " +
                      (active
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")
                    }
                  >
                    <Icon icon={item.icon} className="w-6 h-6" />
                    <span className="text-lg font-medium">{item.label}</span>
                    {active ? (
                      <span className="absolute right-0 top-0 h-full w-1.5 rounded-l bg-emerald-500" />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          </div>

          <div className="mt-auto p-3 space-y-3 flex-shrink-0 border-t border-gray-100 bg-white">
            <Link
              href={isTeacher ? "/parent-teacher/dashboard/teacher/profile" : "/parent-teacher/dashboard/profile"}
              className="rounded-lg bg-white border border-gray-200 shadow-sm p-4 hover:bg-gray-50 transition-colors cursor-pointer block"
            >
              <div className="font-semibold text-gray-900 text-sm mb-2">{userName}</div>
              <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {userRole}
              </div>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 w-[220px] h-[50px] mx-auto transition-colors"
            >
              <Icon icon="solar:logout-2-bold" className="w-5 h-5" />
              Logout
            </button>
          </div>
        </nav>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex sm:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative h-full w-64 bg-white border-r border-black/5 pt-4 shadow-xl overflow-hidden">
            <nav className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto pt-6 pb-4">
                <ul className="px-3 py-2 space-y-[15px]">
                {navItems.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={
                          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors " +
                          (active
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900")
                        }
                      >
                        <Icon icon={item.icon} className="w-6 h-6" />
                        <span className="text-lg font-medium">{item.label}</span>
                        {active ? (
                          <span className="absolute right-0 top-0 h-full w-1.5 rounded-l bg-emerald-500" />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              </div>
              <div className="mt-auto p-3 space-y-3 flex-shrink-0 border-t border-gray-100 bg-white">
                <Link
                  href={isTeacher ? "/parent-teacher/dashboard/teacher/profile" : "/parent-teacher/dashboard/profile"}
                  onClick={onClose}
                  className="rounded-lg bg-white border border-gray-200 shadow-sm p-4 hover:bg-gray-50 transition-colors cursor-pointer block"
                >
                  <div className="font-semibold text-gray-900 text-sm mb-2">{userName}</div>
                  <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {userRole}
                  </div>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 w-[220px] h-[50px] mx-auto transition-colors"
                >
                  <Icon icon="solar:logout-2-bold" className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

