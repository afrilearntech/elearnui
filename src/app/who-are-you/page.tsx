'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { setUserRole } from '@/lib/api/auth';
import { ApiClientError } from '@/lib/api/client';
import Spinner from '@/components/ui/Spinner';
import { showSuccessToast, showErrorToast, formatErrorMessage } from '@/lib/toast';

export default function WhoAreYou() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

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

  const roles = [
    {
      id: 'student',
      icon: 'material-symbols:school',
      title: 'Student',
      description: "I'm here to learn and grow"
    },
    {
      id: 'teacher',
      icon: 'material-symbols:computer',
      title: 'Teacher',
      description: "I'm here to teach and inspire"
    },
    {
      id: 'parent',
      icon: 'material-symbols:family-restroom',
      title: 'Parent',
      description: "I'm here to support my child's learning"
    }
  ];

  const handleContinue = async () => {
    if (!token) {
      showErrorToast('Authentication required. Please complete profile setup first.');
      router.push('/profile-setup');
      return;
    }

    setIsLoading(true);

    try {
      await setUserRole({ role: selectedRole }, token);
      
      showSuccessToast('🎉 Role set successfully! Redirecting...');
      
      setTimeout(() => {
        // If parent, redirect to link child page, otherwise continue with normal flow
        if (selectedRole === 'parent') {
          router.push('/link-child');
        } else {
        router.push('/tell-us-about-yourself');
        }
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        const errorMsg = error.message?.toLowerCase() || '';
        if (error.status === 401 || error.status === 403 || errorMsg.includes('invalid token') || errorMsg.includes('authentication')) {
          setTimeout(() => {
            router.push('/tell-us-about-yourself');
          }, 500);
        } else {
          const friendlyMessage = formatErrorMessage(error.message || 'Failed to set user role');
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
      <div className="w-full max-w-[742px] min-h-[811px] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-linear-to-r from-[#1E40AF] to-[#059669] p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 border border-[#E5E7EB] rounded-full flex items-center justify-center">
                <Icon icon="material-symbols:person" className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Who are you?
                </h1>
                <p className="text-sm opacity-90" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Step 2 of 3 - Help us personalize your experience
                </p>
              </div>
            </div>
            <div className="text-sm font-semibold" style={{ fontFamily: 'Andika, sans-serif' }}>
              67%
            </div>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full w-2/3"></div>
          </div>
        </div>

        <div className="p-6 sm:p-[73px] pr-[68px] pt-[72px] space-y-6">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                selectedRole === role.id
                  ? 'border-2 bg-linear-to-r from-blue-50 to-green-50'
                  : 'border border-gray-200 bg-white hover:border-gray-300'
              }`}
              style={{
                borderImage: selectedRole === role.id ? 'linear-gradient(to right, #1E40AF, #059669) 1' : undefined
              }}
            >
              <div className="flex flex-row items-center text-left space-y-0 space-x-4">
                <Icon 
                  icon={role.icon} 
                  className={`w-12 h-12 flex-shrink-0 ${selectedRole === role.id ? 'text-blue-600' : 'text-gray-600'}`} 
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {role.title}
                  </h3>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {role.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-[90px]">
              <button
              onClick={handleContinue}
              disabled={isLoading || !token}
              className="w-full bg-linear-to-r from-[#1E40AF] to-[#059669] text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:from-[#1E3A8A] hover:to-[#047857] transition-all duration-200 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
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
          </div>
        </div>
      </div>
    </div>
  );
}
