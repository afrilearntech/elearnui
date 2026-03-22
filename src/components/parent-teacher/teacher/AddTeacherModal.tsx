"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { createTeacher, createHeadTeacherTeacher } from "@/lib/api/parent-teacher/teacher";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schoolId: number | null;
  roleMode?: "teacher" | "headteacher";
}

const GENDER_OPTIONS = ["MALE", "FEMALE"];

export default function AddTeacherModal({
  isOpen,
  onClose,
  onSuccess,
  schoolId,
  roleMode = "teacher",
}: AddTeacherModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    dob: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      gender: "",
      dob: "",
    });
    setErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    } else {
      const dob = new Date(formData.dob);
      const today = new Date();
      if (dob >= today) {
        newErrors.dob = "Date of birth must be in the past";
      }
    }

    if (!schoolId) {
      newErrors.school = "School information is missing";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!schoolId) {
      showErrorToast("School information is missing. Please contact support.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        gender: formData.gender,
        dob: formData.dob,
        school_id: schoolId,
        ...(roleMode === "headteacher" ? { status: "APPROVED" } : {}),
      };

      console.log('Sending payload:', payload);

      if (roleMode === "headteacher") {
        await createHeadTeacherTeacher(payload);
      } else {
        await createTeacher(payload);
      }

      showSuccessToast("Teacher added successfully!");
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating teacher:', error);
      
      if (error instanceof ApiClientError) {
        if (error.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(error.errors).forEach(([field, messages]) => {
            fieldErrors[field] = Array.isArray(messages) ? messages.join(', ') : messages;
          });
          setErrors(fieldErrors);
          
          const errorMessage = error.message || "Please check the form for errors.";
          showErrorToast(errorMessage);
        } else {
          showErrorToast(error.message || "Unable to add teacher.");
        }
      } else {
        const message = error instanceof Error ? error.message : "Unable to add teacher.";
        showErrorToast(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add Teacher</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Full Name<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter teacher's full name"
              className={`w-full h-11 rounded-lg border px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Email<span className="text-red-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="teacher@example.com"
                className={`w-full h-11 rounded-lg border px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Phone<span className="text-red-600">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1234567890"
                className={`w-full h-11 rounded-lg border px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Gender and Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Gender<span className="text-red-600">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={`w-full h-11 rounded-lg border px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                  errors.gender ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">
                Date of Birth<span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                max={today}
                className={`w-full h-11 rounded-lg border px-4 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 ${
                  errors.dob ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.dob && (
                <p className="mt-1 text-sm text-red-600">{errors.dob}</p>
              )}
            </div>
          </div>

          {errors.school && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.school}</p>
            </div>
          )}

          <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-6 -mb-6 -mx-6 px-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Icon icon="solar:loading-bold" className="w-4 h-4 animate-spin" />
                  Adding...
                </span>
              ) : (
                "Add Teacher"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

