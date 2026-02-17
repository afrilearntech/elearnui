"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { Icon } from "@iconify/react";
import { User } from "@/lib/api/parent-teacher/auth";
import { changePassword, ChangePasswordRequest } from "@/lib/api/parent-teacher/auth";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

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

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (e) {
          console.error("Error parsing user data:", e);
          showErrorToast("Failed to load user data.");
        }
      }
      setIsLoading(false);
    }
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.current_password) {
      newErrors.current_password = "Current password is required";
    }

    if (!passwordData.new_password) {
      newErrors.new_password = "New password is required";
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = "Password must be at least 8 characters";
    }

    if (!passwordData.confirm_password) {
      newErrors.confirm_password = "Please confirm your new password";
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    if (passwordData.current_password === passwordData.new_password) {
      newErrors.new_password = "New password must be different from current password";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    try {
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      });

      showSuccessToast("Password changed successfully!");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setShowPasswordForm(false);
      setPasswordErrors({});
    } catch (error) {
      console.error("Error changing password:", error);
      if (error instanceof ApiClientError) {
        if (error.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(error.errors).forEach(([field, messages]) => {
            fieldErrors[field] = Array.isArray(messages) ? messages.join(", ") : String(messages);
          });
          setPasswordErrors(fieldErrors);
        }
        showErrorToast(error.message || "Failed to change password. Please try again.");
      } else {
        showErrorToast("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Icon icon="solar:loading-bold" className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">User data not found. Please log in again.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">View and manage your account information</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-b border-emerald-200 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-emerald-200 rounded-full flex items-center justify-center">
                <Icon icon="solar:user-bold" className="w-10 h-10 text-emerald-700" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                <p className="text-gray-600 mt-1">{user.email}</p>
                <div className="mt-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    user.role === "TEACHER"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}>
                    {user.role === "TEACHER" ? "Teacher" : "Parent"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Icon icon="solar:user-id-bold" className="w-5 h-5 text-emerald-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <p className="text-xs font-medium text-gray-600 mb-1">User ID</p>
                  <p className="text-sm font-semibold text-gray-900">#{user.id}</p>
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

            {/* Change Password Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Icon icon="solar:lock-password-bold" className="w-5 h-5 text-blue-600" />
                  Change Password
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordForm(!showPasswordForm);
                    if (showPasswordForm) {
                      setPasswordData({
                        current_password: "",
                        new_password: "",
                        confirm_password: "",
                      });
                      setPasswordErrors({});
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Icon icon={showPasswordForm ? "solar:close-circle-bold" : "solar:pen-bold"} className="w-4 h-4" />
                  {showPasswordForm ? "Cancel" : "Change Password"}
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordSubmit} className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Current Password <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      className={`w-full h-11 rounded-lg border px-4 text-gray-900 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                        passwordErrors.current_password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your current password"
                    />
                    {passwordErrors.current_password && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.current_password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      New Password <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      className={`w-full h-11 rounded-lg border px-4 text-gray-900 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                        passwordErrors.new_password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter your new password (min. 8 characters)"
                    />
                    {passwordErrors.new_password && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.new_password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Confirm New Password <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      className={`w-full h-11 rounded-lg border px-4 text-gray-900 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                        passwordErrors.confirm_password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Confirm your new password"
                    />
                    {passwordErrors.confirm_password && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirm_password}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          current_password: "",
                          new_password: "",
                          confirm_password: "",
                        });
                        setPasswordErrors({});
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isChangingPassword ? (
                        <>
                          <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                          Change Password
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

