'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { profileSetup } from '@/lib/api/auth';
import { ApiClientError } from '@/lib/api/client';
import Spinner from '@/components/ui/Spinner';
import { showSuccessToast, showErrorToast, formatErrorMessage } from '@/lib/toast';

export default function ProfileSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

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

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await profileSetup({
        email: formData.email,
        phone: formData.phone,
        name: formData.fullName,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });

      if (!response || !response.token) {
        throw new Error('Authentication token not received. Please try again.');
      }

      const token = response.token;
      if (typeof token !== 'string' || token.trim() === '') {
        throw new Error('Invalid token received. Please try again.');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token.trim());
        
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }
      }

      showSuccessToast('🎉 Profile setup successful! Redirecting to next step...');
      
      setTimeout(() => {
        router.push('/who-are-you');
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        if (error.errors) {
          const fieldErrors: Record<string, string> = {};
          Object.keys(error.errors).forEach((key) => {
            const errorMessages = error.errors![key];
            if (errorMessages && errorMessages.length > 0) {
              const formFieldName = key === 'confirm_password' ? 'confirmPassword' : key;
              fieldErrors[formFieldName] = errorMessages[0];
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
          const friendlyMessage = formatErrorMessage(error.message || 'An error occurred during profile setup');
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
      <div className="w-full max-w-[742px] h-[811px] sm:h-[811px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="bg-linear-to-r from-[#1E40AF] to-[#059669] p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-white/20 border border-[#E5E7EB] rounded-full flex items-center justify-center">
                <Icon icon="material-symbols:person" className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Profile Setup
                </h1>
                <p className="text-sm opacity-90" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Step 1 of 3 - Secure your account
                </p>
              </div>
            </div>
            
            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.push('/sign-in')}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 border border-white/30 hover:border-white/50"
              style={{ fontFamily: 'Andika, sans-serif' }}
              aria-label="Go back to sign in"
            >
              <Icon icon="mdi:arrow-left" className="w-5 h-5 text-white" />
              <span className="text-sm font-medium text-white hidden sm:inline">Back</span>
            </button>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full w-1/3"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-[73px] sm:pr-[68px] pt-[72px] pb-8 space-y-6 flex-1 overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:person" className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                Full Name
              </label>
            </div>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className={`w-full sm:w-[601px] h-[57px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ fontFamily: 'Andika, sans-serif' }}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                {errors.fullName}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:mail" className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                Email address
              </label>
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              placeholder="Enter your email address"
              onChange={handleInputChange}
              className={`w-full sm:w-[601px] h-[57px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ fontFamily: 'Andika, sans-serif' }}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:phone" className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                Phone Number
              </label>
            </div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              placeholder="Enter your phone number"
              onChange={handleInputChange}
              className={`w-full sm:w-[601px] h-[57px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ fontFamily: 'Andika, sans-serif' }}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                {errors.phone}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:lock" className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                Password
              </label>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Set a password"
              autoComplete="off"
              className={`w-full sm:w-[601px] h-[57px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ fontFamily: 'Andika, sans-serif' }}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                {errors.password}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:lock" className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                Confirm Password
              </label>
            </div>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your password"
              autoComplete="off"
              className={`w-full sm:w-[601px] h-[57px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              style={{ fontFamily: 'Andika, sans-serif' }}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-linear-to-r from-[#1E40AF] to-[#059669] text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:from-[#1E3A8A] hover:to-[#047857] transition-all duration-200 shadow-lg mt-8 mb-4 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Andika, sans-serif' }}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="text-white" />
                <span>Processing...</span>
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
