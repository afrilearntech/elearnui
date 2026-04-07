"use client";

import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/admin/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import Image from "@/components/images/SafeImage";
import { getAdminParents, AdminParent } from "@/lib/api/admin/users";
import { showErrorToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

type ParentStatus = "ACTIVE" | "INACTIVE" | "PENDING";

type Parent = {
  id: string;
  name: string;
  email: string;
  linkedStudents: number;
  dateJoined: string;
  status: ParentStatus;
  district?: string;
  avatar?: string;
};

const getUniqueStatuses = (parents: Parent[]): string[] => {
  const statusSet = new Set<string>(["All"]);
  parents.forEach((parent) => {
    if (parent.status) {
      statusSet.add(parent.status);
    }
  });
  return Array.from(statusSet).sort();
};

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionButtonRef, setActionButtonRef] = useState<HTMLButtonElement | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedParentForDetails, setSelectedParentForDetails] = useState<Parent | null>(null);
  const pageSize = 10;

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      setIsLoading(true);
      const data = await getAdminParents();
      const mappedParents: Parent[] = data.map((parent, index) => ({
        id: `parent-${index}`, 
        name: parent.name,
        email: parent.email,
        linkedStudents: parent.linked_students ? parseInt(parent.linked_students) || 0 : 0,
        dateJoined: new Date(parent.date_joined).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        status: mapStatus(parent.status),
        avatar: undefined,
      }));
      setParents(mappedParents);
    } catch (error) {
      console.error("Error fetching parents:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to fetch parents");
      } else {
        showErrorToast("An unexpected error occurred while fetching parents");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const mapStatus = (status: string): ParentStatus => {
    const upperStatus = status.toUpperCase();
    if (upperStatus === "ACTIVE") {
      return "ACTIVE";
    }
    if (upperStatus === "PENDING") {
      return "PENDING";
    }
    return "INACTIVE";
  };

  const filteredParents = useMemo(() => {
    return parents.filter((parent) => {
      const matchesSearch =
        search.trim().length === 0 ||
        parent.name.toLowerCase().includes(search.toLowerCase()) ||
        parent.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = selectedStatus === "All" || parent.status === selectedStatus;
      const matchesDistrict = selectedDistrict === "All"; // District filtering removed since API doesn't provide it
      return matchesSearch && matchesStatus && matchesDistrict;
    });
  }, [parents, search, selectedStatus, selectedDistrict]);

  const statusOptions = useMemo(() => getUniqueStatuses(parents), [parents]);

  const totalPages = Math.max(1, Math.ceil(filteredParents.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedParents = filteredParents.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, selectedStatus, selectedDistrict]);

  const handleActionClick = (parent: Parent, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setSelectedParent(parent);
    setIsModalOpen(true);
    setActionButtonRef(event.currentTarget);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedParent(null);
    setActionButtonRef(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen && actionButtonRef && !actionButtonRef.contains(event.target as Node)) {
        const modal = document.getElementById("parent-action-dropdown");
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

  const getStatusBadge = (status: ParentStatus) => {
    if (status === "ACTIVE") {
      return "bg-emerald-100 text-emerald-700";
    }
    if (status === "PENDING") {
      return "bg-yellow-100 text-yellow-700";
    }
    return "bg-gray-100 text-gray-600";
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parents Management</h1>
            <p className="text-gray-600 mt-1">Manage all parents</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Icon
                  icon="solar:magnifer-bold"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
                />
                <input
                  type="text"
                  placeholder="search Name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 sm:w-auto">
              <div className="relative sm:w-48">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-white appearance-none cursor-pointer"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "All" ? "All Status" : status}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="solar:alt-arrow-down-bold"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center gap-2">
                <Icon icon="solar:loading-bold" className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="text-gray-500">Loading parents...</span>
              </div>
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon="solar:users-group-two-rounded-bold-duotone" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No parents found</p>
              <p className="text-gray-400 text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-emerald-50">
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Name</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Email</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden md:table-cell">Linked Student(s)</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden lg:table-cell">Date Joined</th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">Status</th>
                        <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pagedParents.map((parent) => (
                        <tr key={parent.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {parent.avatar ? (
                                <Image
                                  src={parent.avatar}
                                  alt={parent.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-semibold text-emerald-700">{getInitials(parent.name)}</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">{parent.name}</div>
                                <div className="text-xs text-gray-500 md:hidden">{parent.linkedStudents} Student(s)</div>
                                <div className="text-xs text-gray-500 lg:hidden">{parent.dateJoined}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 truncate max-w-[200px]">{parent.email}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell">
                            {parent.linkedStudents > 0 ? (
                              `${parent.linkedStudents} Student${parent.linkedStudents !== 1 ? "s" : ""}`
                            ) : (
                              <span className="text-gray-400">No students linked</span>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                            {parent.dateJoined}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(parent.status)}`}>
                              {parent.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => handleActionClick(parent, e)}
                              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors ml-auto"
                              aria-label="More options"
                            >
                              <Icon icon="solar:menu-dots-bold" className="w-5 h-5 text-gray-600" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600 order-2 sm:order-1">
                    Showing <span className="font-medium">{start + 1}</span> to <span className="font-medium">{Math.min(start + pageSize, filteredParents.length)}</span> of <span className="font-medium">{filteredParents.length}</span> parents
                  </div>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Previous page"
                    >
                      <Icon icon="solar:alt-arrow-left-bold" className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors min-w-[40px] ${
                            currentPage === pageNum
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => setPage(totalPages - 1)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {totalPages - 1}
                        </button>
                        <button
                          onClick={() => setPage(totalPages)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Next page"
                    >
                      <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isModalOpen && selectedParent && actionButtonRef && (
        <ParentActionDropdown
          parent={selectedParent}
          onClose={closeModal}
          buttonRef={actionButtonRef}
          onViewDetails={(parent) => {
            setSelectedParentForDetails(parent);
            setShowDetailsModal(true);
            closeModal();
          }}
        />
      )}

      {showDetailsModal && selectedParentForDetails && (
        <ParentDetailsModal
          parent={selectedParentForDetails}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedParentForDetails(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

function ParentDetailsModal({
  parent,
  onClose,
}: {
  parent: Parent;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-black/50 backdrop-blur-sm fixed inset-0" onClick={onClose} />
      <div className="relative z-50 bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Parent Details</h2>
              <p className="text-sm text-gray-600 mt-1">Complete information about {parent.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-purple-200 rounded-full flex items-center justify-center">
                <Icon icon="solar:user-bold" className="w-10 h-10 text-purple-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{parent.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{parent.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    parent.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800"
                      : parent.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {parent.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon icon="solar:user-id-bold" className="w-5 h-5 text-purple-600" />
              Parent Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Parent ID</p>
                <p className="text-sm font-semibold text-gray-900">#{parent.id}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Email Address</p>
                <p className="text-sm font-semibold text-gray-900">{parent.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Linked Students</p>
                <p className="text-sm font-semibold text-gray-900">{parent.linkedStudents}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Date Joined</p>
                <p className="text-sm font-semibold text-gray-900">{parent.dateJoined}</p>
              </div>
              {parent.district && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-medium text-gray-600 mb-1">District</p>
                  <p className="text-sm font-semibold text-gray-900">{parent.district}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  parent.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : parent.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {parent.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ParentActionDropdown({
  parent,
  onClose,
  buttonRef,
  onViewDetails,
}: {
  parent: Parent;
  onClose: () => void;
  buttonRef: HTMLButtonElement;
  onViewDetails: (parent: Parent) => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      if (buttonRef) {
        const rect = buttonRef.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const dropdownWidth = 200;
        let left = rect.right - dropdownWidth;
        
        if (left < 8) {
          left = 8;
        } else if (left + dropdownWidth > viewportWidth - 8) {
          left = viewportWidth - dropdownWidth - 8;
        }
        
        setPosition({
          top: rect.bottom + 4,
          left: left,
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
        id="parent-action-dropdown"
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] max-w-[250px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-2 border-b border-gray-200">
          <p className="text-sm font-semibold text-gray-900 truncate">{parent.name}</p>
          <p className="text-xs text-gray-500 truncate">{parent.email}</p>
        </div>
        <div className="py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(parent);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Icon icon="solar:eye-bold" className="w-4 h-4 text-gray-600" />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </>
  );
}

