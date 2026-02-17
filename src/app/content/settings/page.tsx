"use client";

import React from "react";
import { changePassword } from "@/lib/api/content/auth";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  push: boolean;
  assignmentReminders: boolean;
  deadlineAlerts: boolean;
  systemUpdates: boolean;
  moderationNotifications: boolean;
};

export default function SettingsPage() {
  const [user, setUser] = React.useState<{ name: string; email: string; phone: string; gender: string; role: string } | null>(null);
  const [passwordData, setPasswordData] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = React.useState<Record<string, string>>({});
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordFormError, setPasswordFormError] = React.useState<string | null>(null);
  const [notifications, setNotifications] = React.useState<NotificationPreferences>({
    email: false,
    sms: false,
    push: false,
    assignmentReminders: false,
    deadlineAlerts: false,
    systemUpdates: false,
    moderationNotifications: false,
  });
  const [showPasswordSuccess, setShowPasswordSuccess] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser({
            name: userData.name || "User",
            email: userData.email || "",
            phone: userData.phone || "",
            gender: userData.gender || "",
            role: userData.role === "CONTENTVALIDATOR" ? "Content Validator" : "Content Creator",
          });
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
  }, []);

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};

    if (!passwordData.currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = "New password must be different from current password";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    setShowPasswordSuccess(false);
    setPasswordFormError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      if (!token) {
        throw new Error("Missing authentication token. Please sign in again.");
      }

      const response = await changePassword(
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        },
        token,
      );

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});
      setShowPasswordSuccess(true);
      showSuccessToast(response.detail || "Password changed successfully.");

      setTimeout(() => {
        setShowPasswordSuccess(false);
      }, 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to change password. Please try again.";
      setPasswordFormError(message);
      showErrorToast(message);
    } finally {
      setIsChangingPassword(false);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
              <p className="mt-1 text-sm text-gray-500">Your account details (read-only)</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={user?.name || ""}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={user?.phone || ""}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <input
                  type="text"
                  value={user?.gender || ""}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  value={user?.role || ""}
                  disabled
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
              <p className="mt-1 text-sm text-gray-500">Update your password to keep your account secure</p>
            </div>
            {showPasswordSuccess ? (
              <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p className="text-sm font-medium text-emerald-800">Password changed successfully!</p>
                </div>
              </div>
            ) : null}
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 ${
                    passwordErrors.currentPassword ? "border-rose-400" : "border-gray-300"
                  }`}
                  placeholder="Enter your current password"
                />
                {passwordErrors.currentPassword ? (
                  <p className="mt-1 text-xs text-rose-600">{passwordErrors.currentPassword}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 ${
                    passwordErrors.newPassword ? "border-rose-400" : "border-gray-300"
                  }`}
                  placeholder="Enter your new password"
                />
                {passwordErrors.newPassword ? (
                  <p className="mt-1 text-xs text-rose-600">{passwordErrors.newPassword}</p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={`mt-1 w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 ${
                    passwordErrors.confirmPassword ? "border-rose-400" : "border-gray-300"
                  }`}
                  placeholder="Confirm your new password"
                />
                {passwordErrors.confirmPassword ? (
                  <p className="mt-1 text-xs text-rose-600">{passwordErrors.confirmPassword}</p>
                ) : null}
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                >
                  {isChangingPassword ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Changing...
                    </span>
                  ) : (
                    "Change Password"
                  )}
                </button>
              </div>
              {passwordFormError ? <p className="text-right text-xs text-rose-600">{passwordFormError}</p> : null}
            </form>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
              <p className="mt-1 text-sm text-gray-500">Choose how you want to receive notifications</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="email-notifications" className="text-sm font-medium text-gray-900">
                    Email Notifications
                  </label>
                  <p className="text-xs text-gray-500">Receive notifications via email</p>
                </div>
                <button
                  type="button"
                  disabled={true}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-gray-200 opacity-60"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-0 rounded-full bg-white shadow ring-0" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="sms-notifications" className="text-sm font-medium text-gray-900">
                    SMS Notifications
                  </label>
                  <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                </div>
                <button
                  type="button"
                  disabled={true}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-gray-200 opacity-60"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-0 rounded-full bg-white shadow ring-0" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <label htmlFor="push-notifications" className="text-sm font-medium text-gray-900">
                    Push Notifications
                  </label>
                  <p className="text-xs text-gray-500">Receive browser push notifications</p>
                </div>
                <button
                  type="button"
                  disabled={true}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-gray-200 opacity-60"
                >
                  <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-0 rounded-full bg-white shadow ring-0" />
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Notification Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900">Assignment Reminders</label>
                      <p className="text-xs text-gray-500">Get reminded about upcoming assignments</p>
                    </div>
                    <button
                      type="button"
                      disabled={true}
                      className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-gray-200 opacity-60"
                    >
                      <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-0 rounded-full bg-white shadow ring-0" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900">Deadline Alerts</label>
                      <p className="text-xs text-gray-500">Receive alerts for approaching deadlines</p>
                    </div>
                    <button
                      type="button"
                      disabled={true}
                      className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-gray-200 opacity-60"
                    >
                      <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-0 rounded-full bg-white shadow ring-0" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900">System Updates</label>
                      <p className="text-xs text-gray-500">Notifications about system changes</p>
                    </div>
                    <button
                      type="button"
                      disabled={true}
                      className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-gray-200 opacity-60"
                    >
                      <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-0 rounded-full bg-white shadow ring-0" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-900">Moderation Notifications</label>
                      <p className="text-xs text-gray-500">Updates on content moderation status</p>
                    </div>
                    <button
                      type="button"
                      disabled={true}
                      className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-gray-200 opacity-60"
                    >
                      <span className="pointer-events-none inline-block h-5 w-5 transform translate-x-0 rounded-full bg-white shadow ring-0" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
