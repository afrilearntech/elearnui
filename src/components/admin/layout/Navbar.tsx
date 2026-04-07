"use client";

import Image from "@/components/images/SafeImage";
import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@iconify/react";

type NavbarProps = {
  rightContent?: React.ReactNode;
  onMenuClick?: () => void;
  userRole?: string;
  onAddStudent?: () => void;
  onAddTeacher?: () => void;
  onAddParent?: () => void;
  onLinkStudent?: () => void;
  onAddSchool?: () => void;
  onAddCounty?: () => void;
  onAddDistrict?: () => void;
  onAssignSubjectToTeacher?: () => void;
};

export default function Navbar({ rightContent, onMenuClick, userRole, onAddStudent, onAddTeacher, onAddParent, onLinkStudent, onAddSchool, onAddCounty, onAddDistrict, onAssignSubjectToTeacher }: NavbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const showAddUserButton = pathname?.startsWith("/users");
  const showContentManagerButtons = pathname?.startsWith("/content-managers");
  const showAddStudentButton = pathname?.startsWith("/students");
  const showAddTeacherButton = pathname?.startsWith("/teachers");
  const showParentButtons = pathname?.startsWith("/parents");
  const showAddSchoolButton = pathname?.startsWith("/schools");
  const showAddCountyButton = pathname?.startsWith("/county");
  const showAddDistrictButton = pathname?.startsWith("/district");
  const showAssignSubjectButton = pathname?.startsWith("/subjects");

  // Get the selected tab from URL for users page
  const usersTab = showAddUserButton ? searchParams?.get("tab") : null;
  
  const getAddUserButtonText = (): string => {
    if (!usersTab || usersTab === "All") return "Add New User";
    switch (usersTab) {
      case "Students":
        return "Add New Student";
      case "Teachers":
        return "Add New Teacher";
      case "Content Managers":
        return "Add New Content Manager";
      default:
        return "Add New User";
    }
  };

  const canCreateUser = (): boolean => {
    return usersTab === "All" || usersTab === "Students" || usersTab === "Teachers" || usersTab === "Content Managers";
  };

  const shouldShowAddUserButton = showAddUserButton && canCreateUser();

  const currentTitle = React.useMemo(() => {
    if (!pathname) return "";
    if (pathname.startsWith("/admin/dashboard")) return "Dashboard";
    if (pathname.startsWith("/users")) return "Users";
    if (pathname.startsWith("/content-managers")) return "Content Managers";
    if (pathname.startsWith("/students")) return "Students";
    if (pathname.startsWith("/teachers")) return "Teachers";
    if (pathname.startsWith("/parents")) return "Parents Management";
    if (pathname.startsWith("/schools")) return "Schools Management";
    if (pathname.startsWith("/county")) return "County";
    if (pathname.startsWith("/district")) return "District Management";
    if (pathname.startsWith("/subjects")) return "Subjects Management";
    if (pathname.startsWith("/report")) return "Report";
    return "";
  }, [pathname]);

  return (
    <header className="fixed top-0 left-0 z-50 h-16 w-full border-b border-black/5 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/60">
      <div className="flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8 sm:pl-64">
        <div className="flex items-center gap-4 min-w-0 flex-shrink">
          <div className="flex items-center gap-3 min-w-0">
            <Image src="/moe.png" alt="Ministry of Education" width={44} height={44} className="rounded-sm flex-shrink-0" />
            <div className="leading-tight min-w-0">
              <div className="text-[18px] font-semibold text-[#111827] truncate">Ministry of Education</div>
              <div className="text-[14px] text-[#6B7280] truncate">Liberia eLearning Platform</div>
            </div>
          </div>
          {currentTitle ? (
            <h1 className="hidden lg:block text-2xl font-semibold text-[#111827] ml-4">{currentTitle}</h1>
          ) : null}
        </div>

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

        <div className="flex items-center gap-3 flex-shrink-0">
          {shouldShowAddUserButton && (
            <button
              onClick={() => {
                if (usersTab === "All" || !usersTab) {
                  window.dispatchEvent(new CustomEvent("openUserTypeModal"));
                } else {
                  const typeMap: Record<string, "Student" | "Teacher" | "Content Manager"> = {
                    "Students": "Student",
                    "Teachers": "Teacher",
                    "Content Managers": "Content Manager"
                  };
                  window.dispatchEvent(new CustomEvent("openAddUserModal", { 
                    detail: { type: typeMap[usersTab] || "Student", tab: "single" }
                  }));
                }
              }}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {getAddUserButtonText()}
            </button>
          )}
          {showContentManagerButtons && (
            <>
              <Link
                href="/content-managers/create-validator"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-white shadow hover:bg-emerald-600 transition-colors text-sm font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Content Validator
              </Link>
              <Link
                href="/content-managers/create-creator"
                className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors text-sm font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Content Creator
              </Link>
            </>
          )}
          {showAddStudentButton && onAddStudent && (
            <button
              onClick={onAddStudent}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Student
            </button>
          )}
          {showAddTeacherButton && onAddTeacher && (
            <button
              onClick={onAddTeacher}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Teacher
            </button>
          )}
          {showParentButtons && onLinkStudent && (
            <button
              onClick={onLinkStudent}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-white shadow hover:bg-emerald-600 transition-colors"
            >
              <Icon icon="solar:link-bold" className="w-5 h-5" />
              Link Student
            </button>
          )}
          {showParentButtons && onAddParent && (
            <button
              onClick={onAddParent}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
              Add Parent
            </button>
          )}
          {showAddSchoolButton && onAddSchool && (
            <button
              onClick={onAddSchool}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
              Add School
            </button>
          )}
          {showAddCountyButton && onAddCounty && (
            <button
              onClick={onAddCounty}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
              Add County
            </button>
          )}
          {showAddDistrictButton && onAddDistrict && (
            <button
              onClick={onAddDistrict}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
              Add District
            </button>
          )}
          {showAssignSubjectButton && onAssignSubjectToTeacher && (
            <button
              onClick={onAssignSubjectToTeacher}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Icon icon="solar:user-check-rounded-bold" className="w-5 h-5" />
              Assign Subject to Teacher
            </button>
          )}
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
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 sm:hidden"
            onClick={onMenuClick}
          >
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

