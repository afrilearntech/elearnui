'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { linkChild } from '@/lib/api/auth';
import { ApiClientError } from '@/lib/api/client';
import Spinner from '@/components/ui/Spinner';
import { showSuccessToast, showErrorToast, formatErrorMessage } from '@/lib/toast';

export default function LinkChildPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    student_id: '',
    student_email: '',
    student_phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('auth_token');
      if (!authToken) {
        router.push('/profile-setup');
        return;
      }
      setToken(authToken);
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // All three fields are required
    if (!formData.student_id.trim()) {
      newErrors.student_id = 'Student ID is required';
    }

    if (!formData.student_email.trim()) {
      newErrors.student_email = 'Student email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.student_email.trim())) {
      newErrors.student_email = 'Please enter a valid email address';
    }

    if (!formData.student_phone.trim()) {
      newErrors.student_phone = 'Student phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!token) {
      showErrorToast('Authentication required. Please complete profile setup first.');
      router.push('/profile-setup');
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // All three fields are required
      const payload = {
        student_id: formData.student_id.trim(),
        student_email: formData.student_email.trim(),
        student_phone: formData.student_phone.trim()
      };

      await linkChild(payload, token);
      
      showSuccessToast('🎉 Child linked successfully! Redirecting to your dashboard...');
      
      setTimeout(() => {
        router.push('/parent-teacher/dashboard');
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
            showErrorToast(
              errorCount === 1 
                ? 'Please check the highlighted field and try again.'
                : `Please check the ${errorCount} highlighted fields and try again.`
            );
          }
        } else {
          const friendlyMessage = formatErrorMessage(error.message || 'Failed to link child. Please try again.');
          showErrorToast(friendlyMessage);
        }
      } else {
        showErrorToast('An unexpected error occurred. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-r from-[#EFF6FF] to-[#F0FDF4] flex items-center justify-center p-4">
      <div className="w-full max-w-[742px] min-h-[811px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="bg-linear-to-r from-[#1E40AF] to-[#059669] p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-white/20 border border-[#E5E7EB] rounded-full flex items-center justify-center">
                <Icon icon="material-symbols:family-restroom" className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Link Your Child
                </h1>
                <p className="text-sm opacity-90" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Connect your child's account to get started
                </p>
              </div>
            </div>
            
            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.push('/who-are-you')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 border border-white/30 hover:border-white/50"
              style={{ fontFamily: 'Andika, sans-serif' }}
              aria-label="Go back"
            >
              <Icon icon="mdi:arrow-left" className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white hidden sm:inline">Back</span>
            </button>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full w-full"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-[73px] sm:pr-[68px] pt-[72px] pb-8 space-y-6 flex-1 overflow-y-auto">
          <div>
            <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: 'Andika, sans-serif' }}>
              Please provide all the following information to link your child's account:
            </p>
            
            {/* Student ID Field */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="material-symbols:badge" className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Student ID <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleInputChange}
                placeholder="Enter student ID"
                className={`w-full h-[57px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.student_id ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              />
              {errors.student_id && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                  {errors.student_id}
                </p>
              )}
            </div>

            {/* Student Email Field */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="material-symbols:mail" className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Student Email <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="email"
                name="student_email"
                value={formData.student_email}
                onChange={handleInputChange}
                placeholder="Enter student email address"
                className={`w-full h-[57px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${
                  errors.student_email ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              />
              {errors.student_email && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                  {errors.student_email}
                </p>
              )}
            </div>

            {/* Student Phone Field */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Icon icon="material-symbols:phone" className="w-4 h-4 text-gray-600" />
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Student Phone Number <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                type="tel"
                name="student_phone"
                value={formData.student_phone}
                onChange={handleInputChange}
                placeholder="Enter student phone number"
                className={`w-full h-[57px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.student_phone ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              />
              {errors.student_phone && (
                <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                  {errors.student_phone}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full bg-linear-to-r from-[#1E40AF] to-[#059669] text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:from-[#1E3A8A] hover:to-[#047857] transition-all duration-200 shadow-lg mt-8 mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Andika, sans-serif' }}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="text-white" />
                <span>Linking...</span>
              </>
            ) : (
              'Link Child & Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
