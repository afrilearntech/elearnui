"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import DashboardLayout from "@/components/admin/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getAdminUsers, AdminUser } from "@/lib/api/admin/users";
import { showErrorToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";
import UserDetailsModal from "@/components/admin/users/UserDetailsModal";
import UserTypeSelectionModal from "@/components/admin/users/UserTypeSelectionModal";
import AddUserModal from "@/components/admin/users/AddUserModal";

type UserRoleTab = "All" | "Students" | "Parents" | "Teachers" | "Content Managers" | "Admins";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  avatar?: string;
  // Full user data for modal
  fullData?: AdminUser;
};

function UsersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRoleTab>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [actionButtonRef, setActionButtonRef] = useState<HTMLButtonElement | null>(null);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<"Student" | "Teacher" | "Content Manager" | null>(null);
  const [addUserTab, setAddUserTab] = useState<"single" | "bulk">("single");
  const pageSize = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["All", "Students", "Parents", "Teachers", "Content Managers", "Admins"].includes(tabParam)) {
      setSelectedRole(tabParam as UserRoleTab);
    } else if (!tabParam) {
      setSelectedRole("All");
    }
  }, [searchParams]);

  useEffect(() => {
    const handleOpenUserTypeModal = () => {
      setShowUserTypeModal(true);
    };

    const handleOpenAddUserModal = (event: CustomEvent) => {
      const { type, tab } = event.detail || {};
      if (type === "Student" || type === "Teacher" || type === "Content Manager") {
        setSelectedUserType(type);
        setAddUserTab(tab || "single");
        setShowAddUserModal(true);
      }
    };

    window.addEventListener("openUserTypeModal" as any, handleOpenUserTypeModal);
    window.addEventListener("openAddUserModal" as any, handleOpenAddUserModal);

    return () => {
      window.removeEventListener("openUserTypeModal" as any, handleOpenUserTypeModal);
      window.removeEventListener("openAddUserModal" as any, handleOpenAddUserModal);
    };
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminUsers();
      const mappedUsers: User[] = data.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "N/A",
        fullData: user,
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to load users. Please try again.");
      } else {
        showErrorToast("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      let matchesRole = true;
      if (selectedRole !== "All") {
        const roleUpper = user.role.toUpperCase();
        if (selectedRole === "Students") {
          matchesRole = roleUpper === "STUDENT";
        } else if (selectedRole === "Parents") {
          matchesRole = roleUpper === "PARENT";
        } else if (selectedRole === "Teachers") {
          matchesRole = roleUpper === "TEACHER";
        } else if (selectedRole === "Content Managers") {
          matchesRole = roleUpper === "CONTENT_CREATOR" || roleUpper === "CONTENT CREATOR" || roleUpper.includes("CREATOR") || roleUpper.includes("VALIDATOR");
        } else if (selectedRole === "Admins") {
          matchesRole = roleUpper === "ADMIN" || roleUpper === "ADMINISTRATOR";
        }
      }
      const matchesSearch =
        search.trim().length === 0 ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.phone.toLowerCase().includes(search.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [users, selectedRole, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pagedUsers = filteredUsers.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [selectedRole, search]);

  const handleActionClick = (user: User, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setActionButtonRef(event.currentTarget);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setActionButtonRef(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen && actionButtonRef && !actionButtonRef.contains(event.target as Node)) {
        const modal = document.getElementById("user-action-dropdown");
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

  const roleTabs: UserRoleTab[] = ["All", "Students", "Parents", "Teachers", "Content Managers", "Admins"];

  const getRoleDisplay = (role: string): string => {
    const roleUpper = role.toUpperCase();
    if (roleUpper === "CONTENT_CREATOR" || roleUpper.includes("CREATOR")) return "Content Creator";
    if (roleUpper === "STUDENT") return "Student";
    if (roleUpper === "PARENT") return "Parent";
    if (roleUpper === "TEACHER") return "Teacher";
    if (roleUpper === "ADMIN" || roleUpper === "ADMINISTRATOR") return "Admin";
    return role;
  };

  const getAddButtonText = (): string => {
    switch (selectedRole) {
      case "Students":
        return "Add New Student";
      case "Teachers":
        return "Add New Teacher";
      case "Content Managers":
        return "Add New Content Manager";
      case "All":
      default:
        return "Add New User";
    }
  };

  const canCreateUser = (): boolean => {
    return selectedRole === "All" || selectedRole === "Students" || selectedRole === "Teachers" || selectedRole === "Content Managers";
  };

  const handleAddButtonClick = () => {
    if (selectedRole === "All") {
      setShowUserTypeModal(true);
    } else {
      const typeMap: Record<string, "Student" | "Teacher" | "Content Manager"> = {
        "Students": "Student",
        "Teachers": "Teacher",
        "Content Managers": "Content Manager"
      };
      const mappedType = typeMap[selectedRole];
      if (mappedType) {
        setSelectedUserType(mappedType);
        setAddUserTab("single");
        setShowAddUserModal(true);
      }
    }
  };

  const handleUserTypeSelect = (type: "Student" | "Teacher" | "Content Manager") => {
    setSelectedUserType(type);
    setShowUserTypeModal(false);
    setAddUserTab("single");
    setShowAddUserModal(true);
  };

  const handleViewDetails = (user: User) => {
    if (isModalOpen) {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
    setIsModalOpen(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600 mt-1">Manage all platform users</p>
          </div>
          {canCreateUser() && (
            <button
              type="button"
              onClick={handleAddButtonClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white shadow hover:bg-emerald-700 transition-colors sm:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
              {getAddButtonText()}
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {roleTabs.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    const params = new URLSearchParams(searchParams.toString());
                    if (role === "All") {
                      params.delete("tab");
                    } else {
                      params.set("tab", role);
                    }
                    router.push(`/admin/users?${params.toString()}`);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedRole === role
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Icon
                icon="solar:magnifer-bold"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search name"
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Icon icon="solar:loading-bold" className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : (
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
                      Phone Number
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    pagedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {user.avatar ? (
                                <Image
                                  src={user.avatar}
                                  alt={user.name}
                                  width={40}
                                  height={40}
                                  className="rounded-full"
                                />
                              ) : (
                                <span className="text-gray-600 font-semibold text-sm">
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 truncate">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700 truncate block max-w-[200px]">{user.email}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-emerald-600 underline font-medium">
                            {getRoleDisplay(user.role)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">{user.phone}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap relative">
                          <button
                            onClick={(e) => handleActionClick(user, e)}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                          >
                            <Icon icon="solar:menu-dots-bold" className="w-5 h-5 text-gray-600" />
                          </button>
                          {isModalOpen && selectedUser?.id === user.id && actionButtonRef && (
                            <UserActionDropdown
                              user={selectedUser}
                              onClose={closeModal}
                              buttonRef={actionButtonRef}
                              onViewDetails={() => handleViewDetails(selectedUser)}
                            />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700 text-center sm:text-left">
                Showing {start + 1} to {Math.min(start + pageSize, filteredUsers.length)} of {filteredUsers.length} users
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

      {/* User Details Modal */}
      {isDetailsModalOpen && selectedUser && selectedUser.fullData && (
        <UserDetailsModal
          user={selectedUser.fullData}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showUserTypeModal && (
        <UserTypeSelectionModal
          onSelect={handleUserTypeSelect}
          onClose={() => setShowUserTypeModal(false)}
        />
      )}

      {showAddUserModal && selectedUserType && (
        <AddUserModal
          key={`${selectedUserType}-${addUserTab}`}
          userType={selectedUserType}
          activeTab={addUserTab}
          onTabChange={setAddUserTab}
          onClose={() => {
            setShowAddUserModal(false);
            setSelectedUserType(null);
            setAddUserTab("single");
          }}
          onSuccess={() => {
            fetchUsers();
          }}
        />
      )}
    </DashboardLayout>
  );
}

function UserActionDropdown({
  user,
  onClose,
  buttonRef,
  onViewDetails,
}: {
  user: User;
  onClose: () => void;
  buttonRef: HTMLButtonElement;
  onViewDetails?: () => void;
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
        id="user-action-dropdown"
        className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[200px]"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
      <div className="py-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onViewDetails) {
              onViewDetails();
            }
            onClose();
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

export default function UsersPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Icon icon="solar:loading-bold" className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <UsersPageContent />
    </Suspense>
  );
}

