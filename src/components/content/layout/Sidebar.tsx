"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

type NavItem = {
  href: string;
  label: string;
  iconSrc: string;
  match?: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  { href: "/content/dashboard", label: "Dashboard", iconSrc: "/img/icons/dash-icon.png" },
  { href: "/content/subjects", label: "Subjects", iconSrc: "/img/icons/subject-icon.png" },
  { href: "/content/assessments", label: "Assessment", iconSrc: "/img/icons/subject-icon.png" },
  { href: "/content/lessons", label: "Lessons", iconSrc: "/img/icons/lessons.png" },
  { href: "/content/games", label: "Games", iconSrc: "/img/icons/subject-icon.png" },
  { href: "/content/teachers", label: "Teachers", iconSrc: "/img/icons/subject-icon.png" },
  { href: "/content/settings", label: "Settings", iconSrc: "/img/icons/settings.png" },
];

const creatorVisibleRoutes = new Set(["/content/dashboard", "/content/subjects", "/content/lessons", "/content/games", "/content/settings"]);

function isActivePath(pathname: string, href: string) {
  if (href === "/content/dashboard") return pathname.startsWith("/content/dashboard") || pathname === "/content";
  return pathname.startsWith(href);
}

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  userName?: string;
  userRole?: string;
};

export default function Sidebar({ mobileOpen = false, onClose, userName = "Bertha Jones", userRole = "Content Creator" }: SidebarProps) {
  const pathname = usePathname();
  const isValidator = userRole === "Content Validator";
  const filteredNavItems = isValidator ? navItems : navItems.filter((item) => creatorVisibleRoutes.has(item.href));

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 shrink-0 border-r border-black/5 bg-white/95 pt-4 sm:block">
      <nav className="flex h-full flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pt-24 pb-4">
          <ul className="px-3 py-2 space-y-[15px]">
          {filteredNavItems.map((item) => {
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
                    <Image src={item.iconSrc} alt="" width={24} height={24} />
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
            {/* User Info Card */}
            <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-4">
              <div className="font-semibold text-gray-900 text-sm mb-2">{userName}</div>
              <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {userRole}
              </div>
            </div>
            {/* Logout Button */}
            <button 
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("user");
                  window.location.href = "/content/sign-in";
                }
              }}
              className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 w-[220px] h-[50px] mx-auto"
            >
              <Image src="/img/icons/logout.png" alt="" width={16} height={16} />
              Logout
            </button>
          </div>
      </nav>
    </aside>
      {/* Mobile sidebar drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex sm:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <div className="relative h-full w-64 bg-white border-r border-black/5 pt-4 shadow-xl overflow-hidden">
            <nav className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto pt-6 pb-4">
                <ul className="px-3 py-2 space-y-[15px]">
                {filteredNavItems.map((item) => {
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
                        <Image src={item.iconSrc} alt="" width={24} height={24} />
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
                {/* User Info Card */}
                <div className="rounded-lg bg-white border border-gray-200 shadow-sm p-4">
                  <div className="font-semibold text-gray-900 text-sm mb-2">{userName}</div>
                  <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {userRole}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("auth_token");
                      localStorage.removeItem("user");
                      window.location.href = "/content/sign-in";
                    }
                    if (onClose) {
                      onClose();
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700 w-[220px] h-[50px] mx-auto"
                >
                  <Image src="/img/icons/logout.png" alt="" width={16} height={16} />
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


