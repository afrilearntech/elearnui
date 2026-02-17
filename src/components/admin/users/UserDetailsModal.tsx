"use client";

import { Icon } from "@iconify/react";
import { AdminUser } from "@/lib/api/admin/users";

interface UserDetailsModalProps {
  user: AdminUser;
  onClose: () => void;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getRoleDisplay = (role: string): string => {
  const roleUpper = role.toUpperCase();
  if (roleUpper === "CONTENT_CREATOR" || roleUpper.includes("CREATOR")) return "Content Creator";
  if (roleUpper === "STUDENT") return "Student";
  if (roleUpper === "PARENT") return "Parent";
  if (roleUpper === "TEACHER") return "Teacher";
  if (roleUpper === "ADMIN" || roleUpper === "ADMINISTRATOR") return "Admin";
  return role;
};

export default function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                Complete information about {user.name}
              </p>
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
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-emerald-200 rounded-full flex items-center justify-center">
                <Icon icon="solar:user-bold" className="w-10 h-10 text-emerald-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    user.role.toUpperCase() === "ADMIN" || user.role.toUpperCase() === "ADMINISTRATOR"
                      ? "bg-red-100 text-red-800"
                      : user.role.toUpperCase() === "TEACHER"
                      ? "bg-blue-100 text-blue-800"
                      : user.role.toUpperCase() === "PARENT"
                      ? "bg-purple-100 text-purple-800"
                      : user.role.toUpperCase().includes("CREATOR")
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {getRoleDisplay(user.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon icon="solar:user-id-bold" className="w-5 h-5 text-emerald-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">User ID</p>
                <p className="text-sm font-semibold text-gray-900">#{user.id}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Email Address</p>
                <p className="text-sm font-semibold text-gray-900">{user.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Phone Number</p>
                <p className="text-sm font-semibold text-gray-900">{user.phone || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Date of Birth</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(user.dob)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Gender</p>
                <p className="text-sm font-semibold text-gray-900">{user.gender || "N/A"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Role</p>
                <p className="text-sm font-semibold text-gray-900">{getRoleDisplay(user.role)}</p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon icon="solar:shield-check-bold" className="w-5 h-5 text-purple-600" />
              Account Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Account Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  user.is_active
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}>
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Email Verified</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  user.email_verified
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}>
                  {user.email_verified ? "Verified" : "Not Verified"}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Phone Verified</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  user.phone_verified
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                }`}>
                  {user.phone_verified ? "Verified" : "Not Verified"}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Staff Member</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  user.is_staff
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-800 border border-gray-200"
                }`}>
                  {user.is_staff ? "Yes" : "No"}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Superuser</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  user.is_superuser
                    ? "bg-purple-100 text-purple-800 border border-purple-200"
                    : "bg-gray-100 text-gray-800 border border-gray-200"
                }`}>
                  {user.is_superuser ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Account Dates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Icon icon="solar:calendar-bold" className="w-5 h-5 text-gray-600" />
              Account Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Account Created</p>
                <p className="text-sm font-semibold text-gray-900">{formatDateTime(user.created_at)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Last Updated</p>
                <p className="text-sm font-semibold text-gray-900">{formatDateTime(user.updated_at)}</p>
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

