"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loginParent, loginTeacher, ApiClientError } from "@/lib/api/parent-teacher/auth";
import { showSuccessToast, showErrorToast, formatErrorMessage } from "@/lib/toast";

const roles = [
  {
    id: "parent",
    title: "Parent",
    description: "Monitor your child's progress and access learning resources.",
  },
  {
    id: "teacher",
    title: "Teacher",
    description: "Manage your classes, assignments, and student progress.",
  },
] as const;

type RoleId = (typeof roles)[number]["id"];

export default function SignInPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleId>("parent");
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
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
      const credentials = {
        identifier: formData.identifier.trim(),
        password: formData.password,
      };

      let response;
      if (selectedRole === "parent") {
        response = await loginParent(credentials);
      } else {
        response = await loginTeacher(credentials);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
      }

      showSuccessToast(
        `Welcome back, ${response.user.name}! Redirecting to your dashboard...`
      );
      
      const redirectPath = selectedRole === "teacher" ? "/parent-teacher/dashboard/teacher" : "/parent-teacher/dashboard";
      setTimeout(() => {
        router.push(redirectPath);
      }, 500);
    } catch (error: unknown) {
      console.error("Login error:", error);
      
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof ApiClientError) {
        if (error.status === 403) {
          const approvalMessage = "Your account is pending approval. Please wait for your account to be approved before logging in. You will be notified once your account is ready.";
          showErrorToast(approvalMessage, { duration: 6000 });
          setErrors({
            general: "Account pending approval. Please wait for approval before logging in.",
          });
        } else if (error.status === 401 || error.status === 400) {
          errorMessage = error.message || "Invalid credentials. Please check your email/username and password.";
          setErrors({
            general: errorMessage,
          });
          showErrorToast(formatErrorMessage(errorMessage));
        } else if (error.errors) {
          const fieldErrors: typeof errors = {};
          Object.keys(error.errors).forEach((key) => {
            if (key === "identifier" || key === "password") {
              fieldErrors[key] = error.errors![key]?.[0] || "Invalid input";
            }
          });
          errorMessage = fieldErrors.identifier || fieldErrors.password || error.message || errorMessage;
          setErrors({
            ...fieldErrors,
            general: errorMessage,
          });
          showErrorToast(formatErrorMessage(errorMessage));
        } else {
          errorMessage = error.message || errorMessage;
          setErrors({
            general: errorMessage,
          });
          showErrorToast(formatErrorMessage(errorMessage));
        }
      } else if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
        setErrors({
          general: errorMessage,
        });
        showErrorToast(formatErrorMessage(errorMessage));
      } else {
        setErrors({
          general: errorMessage,
        });
        showErrorToast(formatErrorMessage(errorMessage));
      }

      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[550px] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#1E40AF] to-[#059669] p-6 text-white text-center">
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
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Welcome back! Please enter your details
            </p>
            <div className="flex justify-center mb-6">
              <Image
                src="/moe.png"
                alt="Ministry of Education Logo"
                width={80}
                height={80}
                className="rounded-full"
                priority
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              Account Login
            </h2>
          </div>

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
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p
                  className="text-sm text-red-600"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {errors.general}
                </p>
              </div>
            )}
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
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-blue-600"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] bg-gradient-to-r from-[#059669] to-[#059669] text-white font-semibold rounded-lg flex items-center justify-center gap-3 hover:from-[#047857] hover:to-[#047857] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

