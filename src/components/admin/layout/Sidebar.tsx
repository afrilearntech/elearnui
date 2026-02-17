"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "solar:widget-5-bold" },
  { href: "/admin/users", label: "Users", icon: "solar:users-group-two-rounded-bold" },
  { href: "/admin/content-managers", label: "Content Managers", icon: "solar:user-bold" },
  { href: "/admin/students", label: "Students", icon: "solar:book-bookmark-bold" },
  { href: "/admin/teachers", label: "Teachers", icon: "solar:users-group-rounded-bold" },
  { href: "/admin/parents", label: "Parents", icon: "solar:users-group-two-rounded-bold-duotone" },
  { href: "/admin/subjects", label: "Subjects", icon: "solar:book-2-bold" },
  { href: "/admin/lessons", label: "Lessons", icon: "solar:play-circle-bold" },
  { href: "/admin/games", label: "Games", icon: "solar:gamepad-old-bold" },
  { href: "/admin/schools", label: "Schools", icon: "solar:buildings-2-bold" },
  { href: "/admin/county", label: "County", icon: "solar:map-point-bold" },
  { href: "/admin/district", label: "District", icon: "solar:buildings-bold" },
  { href: "/admin/report", label: "Report", icon: "solar:document-text-bold" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin/dashboard") return pathname.startsWith("/admin/dashboard");
  return pathname.startsWith(href);
}

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  userName?: string;
  userRole?: string;
};

export default function Sidebar({ mobileOpen = false, onClose, userName = "Admin", userRole = "Administration" }: SidebarProps) {
  const pathname = usePathname();

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
              href="/admin/profile"
              className="rounded-lg bg-white border border-gray-200 shadow-sm p-4 hover:bg-gray-50 transition-colors block"
            >
              <div className="font-semibold text-gray-900 text-sm mb-2">{userName}</div>
              <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {userRole}
              </div>
            </Link>
            <button 
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("user");
                  window.location.href = "/admin/sign-in";
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
                  href="/admin/profile"
                  onClick={onClose}
                  className="rounded-lg bg-white border border-gray-200 shadow-sm p-4 hover:bg-gray-50 transition-colors block"
                >
                  <div className="font-semibold text-gray-900 text-sm mb-2">{userName}</div>
                  <div className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {userRole}
                  </div>
                </Link>
                <button 
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("auth_token");
                      localStorage.removeItem("user");
                      window.location.href = "/admin/sign-in";
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
