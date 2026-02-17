"use client";

import { FormEvent, useState } from "react";

interface LinkChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (data: { student_id: number; student_email: string; student_phone: string }) => void;
}

export default function LinkChildModal({ isOpen, onClose, onLink }: LinkChildModalProps) {
  const [formData, setFormData] = useState({
    student_id: "",
    student_email: "",
    student_phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.student_id.trim()) newErrors.student_id = "Student ID is required";
    if (!formData.student_email.trim()) newErrors.student_email = "Student email is required";
    if (!formData.student_phone.trim()) newErrors.student_phone = "Student phone is required";
    
    // Email validation
    if (formData.student_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.student_email)) {
      newErrors.student_email = "Please enter a valid email address";
    }
    
    // Phone validation (basic)
    if (formData.student_phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(formData.student_phone)) {
      newErrors.student_phone = "Please enter a valid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const studentIdNum = parseInt(formData.student_id, 10);
      if (isNaN(studentIdNum)) {
        setErrors({ student_id: "Student ID must be a valid number" });
        setIsSubmitting(false);
        return;
      }
      
      onLink({
        student_id: studentIdNum,
        student_email: formData.student_email.trim(),
        student_phone: formData.student_phone.trim(),
      });
      setFormData({ student_id: "", student_email: "", student_phone: "" });
      setErrors({});
    } catch (error) {
      console.error("Error linking child:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Poppins, sans-serif" }}>
              Link Your Child
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              Student ID
            </label>
            <input
              type="number"
              name="student_id"
              value={formData.student_id}
              onChange={handleChange}
              placeholder="Enter student ID (number)"
              className={`w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] ${
                errors.student_id ? "border-red-500" : "border-gray-300"
              }`}
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            {errors.student_id && (
              <p className="mt-1 text-sm text-red-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                {errors.student_id}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              Student Email
            </label>
            <input
              type="email"
              name="student_email"
              value={formData.student_email}
              onChange={handleChange}
              placeholder="Enter student email"
              className={`w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] ${
                errors.student_email ? "border-red-500" : "border-gray-300"
              }`}
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            {errors.student_email && (
              <p className="mt-1 text-sm text-red-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                {errors.student_email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              Student Phone
            </label>
            <input
              type="tel"
              name="student_phone"
              value={formData.student_phone}
              onChange={handleChange}
              placeholder="Enter student phone number"
              className={`w-full h-12 px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669] ${
                errors.student_phone ? "border-red-500" : "border-gray-300"
              }`}
              style={{ fontFamily: "Poppins, sans-serif" }}
            />
            {errors.student_phone && (
              <p className="mt-1 text-sm text-red-600" style={{ fontFamily: "Poppins, sans-serif" }}>
                {errors.student_phone}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 px-4 bg-gradient-to-r from-[#059669] to-[#047857] text-white font-semibold rounded-lg hover:from-[#047857] hover:to-[#065f46] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {isSubmitting ? "Linking..." : "Link Child"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

