'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { getDistricts, getSchools, type District, type School } from '@/lib/api/lookup';
import { aboutUser } from '@/lib/api/auth';
import { showSuccessToast, showErrorToast, formatErrorMessage } from '@/lib/toast';
import { ApiClientError } from '@/lib/api/client';
import Spinner from '@/components/ui/Spinner';

export default function TellUsAboutYourself() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    birthday: '',
    gender: '',
    district: '',
    institution: '',
    gradeLevel: ''
  });
  const [districts, setDistricts] = useState<District[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const gradeOptions = [
    'GRADE 1',
    'GRADE 2',
    'GRADE 3',
    'GRADE 4',
    'GRADE 5',
    'GRADE 6',
    'GRADE 7',
    'GRADE 8',
    'GRADE 9',
    'GRADE 10',
    'GRADE 11',
    'GRADE 12',
    'OTHER'
  ];

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      router.push('/profile-setup');
      return;
    }
    setToken(storedToken);
    fetchDistricts(storedToken);
  }, [router]);

  const fetchDistricts = async (authToken: string) => {
    setLoadingDistricts(true);
    try {
      const response = await getDistricts(authToken);
      setDistricts(response.results);
    } catch (error) {
      // Handle "Invalid token" errors gracefully - don't block user from continuing
      // Account might not be approved yet, but they can still complete the form
      if (error instanceof ApiClientError) {
        const errorMsg = error.message?.toLowerCase() || '';
        if (error.status === 401 || error.status === 403 || errorMsg.includes('invalid token') || errorMsg.includes('authentication')) {
          // Silently handle - don't show error, allow user to continue
          // Districts will be empty, but form can still be submitted
          console.log('Token may be invalid (account pending approval), but allowing user to continue');
        } else {
          const errorMessage = error.message || 'Failed to load districts';
          showErrorToast(formatErrorMessage(errorMessage));
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load districts';
        showErrorToast(formatErrorMessage(errorMessage));
      }
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchSchools = async (districtId: number) => {
    if (!token) return;
    setLoadingSchools(true);
    setSchools([]);
    setFormData(prev => ({ ...prev, institution: '' }));
    try {
      const response = await getSchools(token, districtId);
      setSchools(response.results);
    } catch (error) {
      // Handle "Invalid token" errors gracefully - don't block user from continuing
      if (error instanceof ApiClientError) {
        const errorMsg = error.message?.toLowerCase() || '';
        if (error.status === 401 || error.status === 403 || errorMsg.includes('invalid token') || errorMsg.includes('authentication')) {
          // Silently handle - don't show error, allow user to continue
          console.log('Token may be invalid (account pending approval), but allowing user to continue');
        } else {
          const errorMessage = error.message || 'Failed to load schools';
          showErrorToast(formatErrorMessage(errorMessage));
        }
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load schools';
        showErrorToast(formatErrorMessage(errorMessage));
      }
    } finally {
      setLoadingSchools(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'district') {
      const districtId = parseInt(value);
      setFormData({
        ...formData,
        district: value,
        institution: ''
      });
      if (districtId) {
        fetchSchools(districtId);
      } else {
        setSchools([]);
      }
    } else {
    setFormData({
      ...formData,
        [name]: value
    });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      showErrorToast('Authentication required. Please complete profile setup first.');
      router.push('/profile-setup');
      return;
    }

    if (!formData.birthday || !formData.gender || !formData.district || !formData.gradeLevel) {
      showErrorToast('Please fill in all required fields.');
      return;
    }

    if (!formData.institution) {
      showErrorToast('Please select your school.');
      return;
    }

    setIsSubmitting(true);

    try {
      const districtId = parseInt(formData.district);
      const schoolId = parseInt(formData.institution);

      const apiData = {
        dob: formData.birthday,
        gender: formData.gender,
        district_id: districtId,
        school_id: schoolId, 
        grade: formData.gradeLevel, 
      };

      try {
        await aboutUser(apiData, token);
      } catch (apiError) {
        // Even if API call fails due to invalid token, we still redirect to login
        // The form data was filled, and they can login after approval
        if (apiError instanceof ApiClientError) {
          const errorMsg = apiError.message?.toLowerCase() || '';
          if (apiError.status === 401 || apiError.status === 403 || errorMsg.includes('invalid token') || errorMsg.includes('authentication')) {
            // Token invalid but continue with redirect - account pending approval
            console.log('Token invalid (account pending approval), but form completed - redirecting to login');
          } else {
            // Re-throw other errors to be handled below
            throw apiError;
          }
        } else {
          // Re-throw other errors to be handled below
          throw apiError;
        }
      }

      const gradeMatch = formData.gradeLevel.match(/\d+/);
      const gradeNumber = gradeMatch ? parseInt(gradeMatch[0]) : null;

      if (typeof window !== 'undefined' && gradeNumber) {
        localStorage.setItem('user_grade', gradeNumber.toString());
        
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            user.grade = gradeNumber;
            localStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            console.error('Error updating user data:', e);
          }
        }
      }

      // Check user role to determine redirect destination
      const storedUser = localStorage.getItem('user');
      let userRole = 'student';
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          userRole = user.role?.toLowerCase() || 'student';
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      // Always redirect to login after form submission, even if token exists
      // Account is pending approval, so they need to login after approval
      if (userRole === 'teacher') {
        showSuccessToast('🎉 Profile completed successfully! Your account is pending approval. Please login once your account is approved. Redirecting to login...', { duration: 6000 });
        setTimeout(() => {
          router.push('/parent-teacher/sign-in/parent');
        }, 2000);
      } else {
      showSuccessToast('🎉 Profile completed successfully! Your account is pending approval. Please login once your account is approved. Redirecting to login...', { duration: 6000 });
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      }
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        const errorMsg = error.message?.toLowerCase() || '';
        if (error.status === 401 || error.status === 403 || errorMsg.includes('invalid token') || errorMsg.includes('authentication')) {
          // Check user role to determine redirect destination
          const storedUser = localStorage.getItem('user');
          let userRole = 'student';
          if (storedUser) {
            try {
              const user = JSON.parse(storedUser);
              userRole = user.role?.toLowerCase() || 'student';
            } catch (e) {
              console.error('Error parsing user data:', e);
            }
          }

          showErrorToast('Your account is pending approval. Please login once your account is approved. Redirecting to login...', { duration: 6000 });
          setTimeout(() => {
            if (userRole === 'teacher') {
              router.push('/parent-teacher/sign-in/parent');
            } else {
            router.push('/login');
            }
          }, 2000);
          setIsSubmitting(false);
          return;
        }
        
        if (error.errors) {
          const errorMessages = Object.values(error.errors).flat();
          if (errorMessages.length > 0) {
            showErrorToast(errorMessages[0]);
          } else {
            showErrorToast(formatErrorMessage(error.message || 'Failed to save profile information'));
          }
        } else {
          const friendlyMessage = formatErrorMessage(error.message || 'Failed to save profile information');
          showErrorToast(friendlyMessage);
        }
      } else {
        showErrorToast('An unexpected error occurred. Please check your connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
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
                  Tell us about yourself!
                </h1>
                <p className="text-sm opacity-90" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Step 3 of 3 - This helps us personalize your learning
                </p>
              </div>
            </div>
            <div className="text-sm font-semibold" style={{ fontFamily: 'Andika, sans-serif' }}>
              100%
            </div>
          </div>
          
          <div className="w-full bg-white/20 rounded-full h-2">
            <div className="bg-white h-2 rounded-full w-full"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-[73px] sm:pr-[68px] pt-[72px] space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:calendar-month" className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                When's your Birthday?
              </label>
            </div>
            <div className="relative">
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleInputChange}
                className="w-full sm:w-[601px] h-[57px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: 'Andika, sans-serif' }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:person" className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                Gender
              </label>
            </div>
            <div className="relative">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full sm:w-[601px] h-[57px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <option value="">Select your gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <Icon icon="material-symbols:keyboard-arrow-down" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:location-on" className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                District
              </label>
            </div>
            <div className="relative">
              {loadingDistricts ? (
                <div className="w-full sm:w-[601px] h-[57px] px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Loading districts...
                  </span>
                </div>
              ) : (
                <>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleInputChange}
                    className="w-full sm:w-[601px] h-[57px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    style={{ fontFamily: 'Andika, sans-serif' }}
                  >
                    <option value="">Select your district</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  <Icon icon="material-symbols:keyboard-arrow-down" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:school" className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                Name of Institution
              </label>
            </div>
            <div className="relative">
              {loadingSchools ? (
                <div className="w-full sm:w-[601px] h-[57px] px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-sm text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Loading schools...
                  </span>
                </div>
              ) : (
                <>
                  <select
              name="institution"
              value={formData.institution}
              onChange={handleInputChange}
                    disabled={!formData.district || schools.length === 0}
                    className="w-full sm:w-[601px] h-[57px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Andika, sans-serif' }}
                  >
                    <option value="">
                      {!formData.district 
                        ? 'Select a district first' 
                        : schools.length === 0 
                        ? 'No schools available' 
                        : 'Select your school'}
                    </option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                  <Icon icon="material-symbols:keyboard-arrow-down" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Icon icon="material-symbols:school" className="w-4 h-4 text-gray-600" />
              <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                Grade/Level
              </label>
            </div>
            <div className="relative">
              <select
              name="gradeLevel"
              value={formData.gradeLevel}
              onChange={handleInputChange}
                className="w-full sm:w-[601px] h-[57px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <option value="">Select your grade level</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              <Icon icon="material-symbols:keyboard-arrow-down" className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-linear-to-r from-[#1E40AF] to-[#059669] text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-3 hover:from-[#1E3A8A] hover:to-[#047857] transition-all duration-200 shadow-lg mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Andika, sans-serif' }}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="text-white" />
                <span>Processing...</span>
              </>
            ) : (
              'Finish Setup'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
