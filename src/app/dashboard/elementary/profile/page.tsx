'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { changePassword, ChangePasswordRequest } from '@/lib/api/auth';
import { showErrorToast, showSuccessToast, formatErrorMessage } from '@/lib/toast';
import { ApiClientError } from '@/lib/api/client';
import Spinner from '@/components/ui/Spinner';

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

export default function ElementaryProfilePage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
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
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
        showErrorToast('Failed to load user data.');
      }
    }
    setIsLoading(false);
  }, [router]);

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

    const token = localStorage.getItem('auth_token');
    if (!token) {
      showErrorToast('Authentication required. Please log in again.');
      router.push('/login');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.confirm_password,
      }, token);

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

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
            User data not found. Please log in again.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-[#059669] text-white rounded-lg hover:bg-[#047857] transition-colors"
            style={{ fontFamily: 'Andika, sans-serif' }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ElementaryNavbar onMenuToggle={handleMenuToggle} />
      
      <div className="flex">
        <ElementarySidebar 
          activeItem="profile" 
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={handleMenuClose}
        />
        
        <main className="flex-1 bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px] overflow-x-hidden">
          <div className="p-4 lg:p-8 max-w-full">
            {/* Page Header */}
            <div className="bg-white/60 rounded-2xl shadow-lg p-6 sm:p-8 mt-8 sm:mx-8 mx-4 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                My Profile 👤
              </h1>
              <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                View and manage your account information
              </p>
            </div>

            <div className="sm:mx-8 mx-4 space-y-6">
              {/* Profile Header Card */}
              <div className="bg-white/60 rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-linear-to-r from-[#3AB0FF] to-[#00D68F] p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30">
                      <Icon icon="material-symbols:person" className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {user.name || 'Student'}
                      </h2>
                      <p className="text-white/90 text-sm sm:text-base mb-3" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {user.email || 'N/A'}
                      </p>
                      <div className="inline-flex items-center rounded-full px-4 py-2 bg-white/20 backdrop-blur-sm">
                        <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Andika, sans-serif' }}>
                          Student
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                      <Icon icon="material-symbols:person" className="w-5 h-5 text-[#3AB0FF]" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                          Email Address
                        </p>
                        <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                          {user.email || "N/A"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                          Phone Number
                        </p>
                        <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                          {user.phone || "N/A"}
                        </p>
                      </div>
                      {user.dob && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                            Date of Birth
                          </p>
                          <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                            {formatDate(user.dob)}
                          </p>
                        </div>
                      )}
                      {user.gender && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                            Gender
                          </p>
                          <p className="text-sm font-semibold text-gray-900 capitalize" style={{ fontFamily: 'Andika, sans-serif' }}>
                            {user.gender || "N/A"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Status */}
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                      <Icon icon="material-symbols:shield-check" className="w-5 h-5 text-[#00D68F]" />
                      Account Status
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                          Account Status
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          user.is_active !== false
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}>
                          {user.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-medium text-gray-600 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                          User ID
                        </p>
                        <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                          #{user.id || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Change Password Section */}
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                        <Icon icon="material-symbols:lock" className="w-5 h-5 text-[#3AB0FF]" />
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
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-[#3AB0FF] to-[#00D68F] rounded-lg hover:opacity-90 transition-all duration-200"
                        style={{ fontFamily: 'Andika, sans-serif' }}
                      >
                        <Icon icon={showPasswordForm ? "material-symbols:close" : "material-symbols:edit"} className="w-4 h-4" />
                        {showPasswordForm ? "Cancel" : "Change Password"}
                      </button>
                    </div>

                    {showPasswordForm && (
                      <form onSubmit={handlePasswordSubmit} className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                            Current Password <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="password"
                            name="current_password"
                            value={passwordData.current_password}
                            onChange={handlePasswordChange}
                            className={`w-full h-12 rounded-lg border px-4 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3AB0FF] ${
                              passwordErrors.current_password ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="Enter your current password"
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          />
                          {passwordErrors.current_password && (
                            <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                              {passwordErrors.current_password}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                            New Password <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="password"
                            name="new_password"
                            value={passwordData.new_password}
                            onChange={handlePasswordChange}
                            className={`w-full h-12 rounded-lg border px-4 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3AB0FF] ${
                              passwordErrors.new_password ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="Enter your new password (min. 8 characters)"
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          />
                          {passwordErrors.new_password && (
                            <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                              {passwordErrors.new_password}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-800 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                            Confirm New Password <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="password"
                            name="confirm_password"
                            value={passwordData.confirm_password}
                            onChange={handlePasswordChange}
                            className={`w-full h-12 rounded-lg border px-4 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#3AB0FF] ${
                              passwordErrors.confirm_password ? "border-red-500" : "border-gray-300"
                            }`}
                            placeholder="Confirm your new password"
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          />
                          {passwordErrors.confirm_password && (
                            <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                              {passwordErrors.confirm_password}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
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
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white bg-linear-to-r from-[#3AB0FF] to-[#00D68F] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          >
                            {isChangingPassword ? (
                              <>
                                <Spinner size="sm" className="text-white" />
                                <span>Changing...</span>
                              </>
                            ) : (
                              <>
                                <Icon icon="material-symbols:check-circle" className="w-4 h-4" />
                                <span>Change Password</span>
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
          </div>
        </main>
      </div>
    </div>
  );
}
