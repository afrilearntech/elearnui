"use client";

import Image from "next/image";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type NavbarProps = {
  rightContent?: React.ReactNode;
  onMenuClick?: () => void;
  userRole?: string;
};

export default function Navbar({ rightContent, onMenuClick, userRole }: NavbarProps) {
  const pathname = usePathname();
  const isValidator = userRole?.toLowerCase().includes("validator");

  const currentTitle = React.useMemo(() => {
    if (!pathname) return "";
    if (pathname.startsWith("/content/dashboard")) return "Dashboard";
    if (pathname.startsWith("/subjects")) return "Subject";
    if (pathname.startsWith("/lessons")) return "Lessons";
    if (pathname.startsWith("/settings")) return "Settings";
    return "";
  }, [pathname]);
  return (
    <header className="fixed top-0 left-0 z-50 h-16 w-full border-b border-black/5 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8 sm:pl-64">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-4 min-w-0 flex-shrink">
          <div className="flex items-center gap-3 min-w-0">
            <Image src="/img/moe.png" alt="Ministry of Education" width={44} height={44} className="rounded-sm flex-shrink-0" />
            <div className="leading-tight min-w-0">
              <div className="text-[18px] font-semibold text-[#111827] truncate">Ministry of Education</div>
              <div className="text-[14px] text-[#6B7280] truncate">Liberia eLearning Platform</div>
            </div>
          </div>
          {currentTitle ? (
            <h1 className="hidden lg:block text-2xl font-semibold text-[#111827] ml-4">{currentTitle}</h1>
          ) : null}
        </div>

        {/* Center: Search bar - hidden on mobile */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 text-sm"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {!isValidator && pathname.startsWith("/subjects") ? (
            <Link href="/subjects/create" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create Subject
            </Link>
          ) : null}
          {!isValidator && pathname.startsWith("/lessons") ? (
            <Link href="/lessons/create" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create Lesson
            </Link>
          ) : null}
          {/* Bell icon - hidden on mobile */}
          <button
            type="button"
            aria-label="Notifications"
            className="hidden md:relative inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">19</span>
          </button>
          {/* Mobile menu button */}
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 sm:hidden"
            onClick={onMenuClick}
          >
            {/* simple hamburger icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="hidden sm:flex items-center gap-3">{rightContent}</div>
        </div>
      </div>
    </header>
  );
}


