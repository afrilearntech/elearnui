"use client";

import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/admin/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";

type ContentManagerRole = "Creator" | "Validator";
type Status = "Creator" | "Inactive";

type ContentManager = {
  id: string;
  name: string;
  email: string;
  role: ContentManagerRole;
  status: Status;
  avatar?: string;
};

const mockContentManagers: ContentManager[] = [
  { id: "1", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Creator", status: "Creator" },
  { id: "2", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Validator", status: "Inactive" },
  { id: "3", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Validator", status: "Creator" },
  { id: "4", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Validator", status: "Inactive" },
  { id: "5", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Creator", status: "Inactive" },
  { id: "6", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Creator", status: "Inactive" },
  { id: "7", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Validator", status: "Creator" },
  { id: "8", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Creator", status: "Creator" },
  { id: "9", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Validator", status: "Inactive" },
  { id: "10", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Creator", status: "Inactive" },
  { id: "11", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Validator", status: "Creator" },
  { id: "12", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Creator", status: "Inactive" },
  { id: "13", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Validator", status: "Creator" },
  { id: "14", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Creator", status: "Inactive" },
  { id: "15", name: "Bertha Jones", email: "bjones566@gmail.com", role: "Validator", status: "Inactive" },
];

export default function ContentManagersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedManager, setSelectedManager] = useState<ContentManager | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionButtonRef, setActionButtonRef] = useState<HTMLButtonElement | null>(null);
  const pageSize = 10;

  const filteredManagers = useMemo(() => {
    return mockContentManagers.filter((manager) => {
      const matchesSearch =
        search.trim().length === 0 ||
        manager.name.toLowerCase().includes(search.toLowerCase()) ||
        manager.email.toLowerCase().includes(search.toLowerCase()) ||
        manager.role.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredManagers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedManagers = filteredManagers.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleActionClick = (manager: ContentManager, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setActionButtonRef(event.currentTarget);
    setSelectedManager(manager);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedManager(null);
    setActionButtonRef(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen && actionButtonRef && !actionButtonRef.contains(event.target as Node)) {
        const modal = document.getElementById("content-manager-action-dropdown");
        if (modal && !modal.contains(event.target as Node)) {
          closeModal();
        }
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isModalOpen, actionButtonRef]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Managers</h1>
            <p className="text-gray-600 mt-1">Manage content creators and validators</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              href="/content-managers/create-validator"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-white shadow hover:bg-emerald-600 transition-colors text-sm font-medium sm:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Validator
            </Link>
            <Link
              href="/content-managers/create-creator"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors text-sm font-medium sm:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Creator
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Icon
                icon="solar:magnifer-bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search name, role, skill.."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Icon icon="solar:filter-bold" className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter</span>
            </button>
          </div>

          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Content Creators</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagedManagers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                      No content managers found
                    </td>
                  </tr>
                ) : (
                  pagedManagers.map((manager) => (
                    <tr key={manager.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {manager.avatar ? (
                              <Image
                                src={manager.avatar}
                                alt={manager.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <span className="text-gray-600 font-semibold text-sm">
                                {manager.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">{manager.name}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700 truncate block max-w-[200px]">{manager.email}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            manager.role === "Creator"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-purple-50 text-purple-600"
                          }`}
                        >
                          {manager.role}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            manager.status === "Creator"
                              ? "text-emerald-600"
                              : "text-gray-500"
                          }`}
                        >
                          {manager.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap relative">
                        <button
                          onClick={(e) => handleActionClick(manager, e)}
                          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                        >
                          <Icon icon="solar:menu-dots-bold" className="w-5 h-5 text-gray-600" />
                        </button>
                        {isModalOpen && selectedManager?.id === manager.id && actionButtonRef && (
                          <ContentManagerActionDropdown
                            manager={selectedManager}
                            onClose={closeModal}
                            buttonRef={actionButtonRef}
                          />
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700 text-center sm:text-left">
                Showing {start + 1} to {Math.min(start + pageSize, filteredManagers.length)} of {filteredManagers.length} managers
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 10) {
                    pageNum = i + 1;
                  } else if (currentPage <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 4) {
                    pageNum = totalPages - 9 + i;
                  } else {
                    pageNum = currentPage - 4 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 10 && currentPage < totalPages - 4 && (
                  <>
                    <span className="px-2 text-gray-500">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ContentManagerActionDropdown({
  manager,
  onClose,
  buttonRef,
}: {
  manager: ContentManager;
  onClose: () => void;
  buttonRef: HTMLButtonElement;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef) {
        const rect = buttonRef.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4,
          left: rect.right - 200,
        });
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [buttonRef]);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        id="content-manager-action-dropdown"
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-2 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-900 truncate">{manager.name}</p>
          <p className="text-xs text-gray-500 truncate">{manager.email}</p>
        </div>
        <div className="py-1">
          <button
            onClick={onClose}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Icon icon="solar:user-id-bold" className="w-4 h-4 text-gray-600" />
            <span>View Account</span>
          </button>
          <button
            onClick={onClose}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Icon icon="solar:pen-bold" className="w-4 h-4 text-gray-600" />
            <span>Edit Account</span>
          </button>
          <button
            onClick={onClose}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Icon icon="solar:forbidden-circle-bold" className="w-4 h-4 text-gray-600" />
            <span>Disable Account</span>
          </button>
          <button
            onClick={onClose}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
          >
            <Icon icon="solar:minus-circle-bold" className="w-4 h-4" />
            <span>Remove Account</span>
          </button>
        </div>
      </div>
    </>
  );
}

