"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { contentLogin } from "@/lib/api/content/auth";
import { ApiClientError } from "@/lib/api/client";
import { showSuccessToast, showErrorToast, formatErrorMessage } from "@/lib/toast";

const roles = [
  {
    id: "validator",
    title: "Content Validator",
    description: "Review and approve uploaded subjects before publication.",
  },
  {
    id: "creator",
    title: "Content Creator",
    description: "Upload and manage learning materials and quizzes for all grade levels.",
  },
] as const;

type RoleId = (typeof roles)[number]["id"];

export default function ContentLoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleId>("validator");
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier = "Email address or username is required";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      const response = await contentLogin({
        identifier: formData.identifier,
        password: formData.password,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      showSuccessToast("🎉 Login successful! Redirecting...");
      
      setTimeout(() => {
        router.push("/content/dashboard");
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        if (error.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.keys(error.errors).forEach((key) => {
            const errorMessages = error.errors![key];
            if (errorMessages && errorMessages.length > 0) {
              fieldErrors[key] = errorMessages[0];
            }
          });
          setErrors(fieldErrors);
          
          const errorCount = Object.keys(fieldErrors).length;
          if (errorCount > 0) {
            const firstError = Object.values(fieldErrors)[0];
            showErrorToast(formatErrorMessage(firstError));
          } else {
            showErrorToast(formatErrorMessage(error.message));
          }
        } else {
          setErrors({
            identifier: error.message.includes("identifier") || error.message.includes("email") || error.message.includes("username") ? formatErrorMessage(error.message) : undefined,
            password: error.message.includes("password") ? formatErrorMessage(error.message) : undefined,
          });
          showErrorToast(formatErrorMessage(error.message));
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        showErrorToast(formatErrorMessage(errorMessage));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-linear-to-r from-[#1E40AF] to-[#059669] p-6 text-white text-center">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {roles.find((role) => role.id === selectedRole)?.title}
          </h1>
          <p
            className="text-sm mt-1 text-white/80"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Choose a role to continue
          </p>
        </div>

        <div className="px-6 sm:px-8 pt-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {roles.map((role) => {
              const isSelected = role.id === selectedRole;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                    isSelected
                      ? "border-[#059669] bg-[#ECFDF5] shadow-md"
                      : "border-gray-200 bg-white hover:border-[#059669]"
                  }`}
                >
                  <p
                    className="text-sm font-semibold text-gray-900"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {role.title}
                  </p>
                  <p
                    className="text-xs text-gray-500 mt-1 leading-snug"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {role.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Email Address or Username
              </label>
              <input
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                placeholder="Email Address or Username"
                className={`w-full h-[50px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                  errors.identifier ? "border-red-500" : "border-gray-300"
                }`}
                style={{ fontFamily: "Poppins, sans-serif", color: "#111827" }}
              />
              {errors.identifier && (
                <p
                  className="mt-1 text-sm text-red-600"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {errors.identifier}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  autoComplete="off"
                  className={`w-full h-[50px] px-4 py-3 pr-20 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  style={{ fontFamily: "Poppins, sans-serif", color: "#111827" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#059669]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p
                  className="mt-1 text-sm text-red-600"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-gray-600 hover:text-blue-600"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] bg-linear-to-r from-[#059669] to-[#059669] text-white font-semibold rounded-lg flex items-center justify-center gap-3 hover:from-[#047857] hover:to-[#047857] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

