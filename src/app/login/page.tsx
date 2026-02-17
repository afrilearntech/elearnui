'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { studentLogin } from '@/lib/api/auth';
import { ApiClientError } from '@/lib/api/client';
import Spinner from '@/components/ui/Spinner';
import { showSuccessToast, showErrorToast, formatErrorMessage } from '@/lib/toast';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function LoginPage() {
  const { isEnabled, announce, playSound, speak } = useAccessibility();
  const identifierInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  // Auto-focus first input and announce page content when accessibility is enabled
  useEffect(() => {
    if (!isEnabled) return;

    const timer = setTimeout(() => {
      // Auto-focus the first input field for better UX
      if (identifierInputRef.current) {
        identifierInputRef.current.focus();
      }
      
      // Clear, concise page announcement
      const message = 
        'Student login page. ' +
        'Email or username field is now focused and ready for input. ' +
        'Type your email address or username. You will hear each character as you type. ' +
        'Press Tab when done to move to password field.';
      
      // Use both speak and announce for maximum compatibility
      speak(message, true);
      announce(message, 'assertive');
    }, 1000);

    return () => clearTimeout(timer);
  }, [isEnabled, speak, announce]);

  // Cleanup typing timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  // Ref to track last announced character count (to avoid announcing on every keystroke)
  const lastAnnouncedLengthRef = useRef<{ identifier: number; password: number }>({
    identifier: 0,
    password: 0
  });
  
  // Debounce timer for typing announcements (to avoid too many rapid announcements)
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    
    // Announce what user is typing for better UX (with debouncing)
    if (isEnabled && value.length > 0) {
      // Clear previous timer
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      
      // Debounce announcements to avoid too many rapid speech
      typingTimerRef.current = setTimeout(() => {
        if (name === 'identifier') {
          // Announce the last character typed (for email/username)
          if (value.length > lastAnnouncedLengthRef.current.identifier) {
            const lastChar = value[value.length - 1];
            // Only announce if it's a visible character
            if (lastChar && lastChar.trim() && lastChar !== ' ') {
              speak(lastChar, false); // Don't interrupt, queue it
            }
            lastAnnouncedLengthRef.current.identifier = value.length;
          } else if (value.length < lastAnnouncedLengthRef.current.identifier) {
            // User deleted a character
            speak('deleted', false);
            lastAnnouncedLengthRef.current.identifier = value.length;
          }
        } else if (name === 'password') {
          // For password, announce "dot" for security (not actual characters)
          if (value.length > lastAnnouncedLengthRef.current.password) {
            speak('dot', false); // Announce "dot" for password character
            lastAnnouncedLengthRef.current.password = value.length;
          } else if (value.length < lastAnnouncedLengthRef.current.password) {
            // User deleted a character
            speak('deleted', false);
            lastAnnouncedLengthRef.current.password = value.length;
          }
        }
      }, 100); // Small delay to batch rapid typing
    } else if (isEnabled && value.length === 0) {
      // Field cleared
      lastAnnouncedLengthRef.current[name as 'identifier' | 'password'] = 0;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email address or username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      const response = await studentLogin({
        identifier: formData.identifier,
        password: formData.password,
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        if (response.student) {
          const gradeMatch = response.student.grade.match(/\d+/);
          const gradeNumber = gradeMatch ? parseInt(gradeMatch[0]) : null;
          
          // Store student ID for lesson tracking
          localStorage.setItem('student_id', response.student.id.toString());
          
          if (gradeNumber) {
            localStorage.setItem('user_grade', gradeNumber.toString());
            
            const user = { ...response.user, grade: gradeNumber };
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      }

      showSuccessToast('🎉 Login successful! Redirecting...');
      
      // Announce success
      if (isEnabled) {
        speak('Login successful! You will be redirected to your dashboard shortly.', true);
        playSound('success');
      }
      
      setTimeout(() => {
        let gradeNumber: number | null = null;
        
        if (response.student?.grade) {
          const gradeMatch = response.student.grade.match(/\d+/);
          gradeNumber = gradeMatch ? parseInt(gradeMatch[0]) : null;
        }
        
        if (!gradeNumber) {
          const storedGrade = localStorage.getItem('user_grade');
          if (storedGrade) {
            gradeNumber = parseInt(storedGrade);
          }
        }
        
        if (gradeNumber && gradeNumber >= 1 && gradeNumber <= 3) {
          router.push('/dashboard/elementary');
        } else {
          router.push('/dashboard');
        }
      }, 1500);
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        if (error.status === 403) {
          showErrorToast(
            'Your account is pending approval. Please wait for your account to be approved before logging in. You will be notified once your account is ready.',
            { duration: 6000 }
          );
          setErrors({
            general: 'Account pending approval. Please wait for approval before logging in.'
          });
        } else if (error.errors) {
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
          const friendlyMessage = formatErrorMessage(error.message || 'Invalid credentials. Please try again.');
          showErrorToast(friendlyMessage);
          if (isEnabled) {
            speak(`Login failed. ${friendlyMessage}. Please check your email and password and try again.`, true);
            playSound('error');
            // Refocus on the identifier field if there's an error
            setTimeout(() => {
              if (identifierInputRef.current) {
                identifierInputRef.current.focus();
              }
            }, 500);
          }
        }
      } else {
        showErrorToast('An unexpected error occurred. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main 
      id="main-content" 
      role="main" 
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      aria-label="Student Login Page"
    >
      <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-linear-to-r from-[#1E40AF] to-[#059669] p-6 text-white text-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Andika, sans-serif' }}>
            Student
          </h1>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Welcome message and logo */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
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
            <h2 
              id="page-title"
              className="text-2xl font-bold text-gray-900" 
              style={{ fontFamily: 'Andika, sans-serif' }}
            >
              Account Login
            </h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email/Username Field */}
            <div>
              <label 
                htmlFor="identifier-input"
                className="block text-sm font-medium text-gray-700 mb-2" 
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                Email Address or Username
              </label>
              <input
                id="identifier-input"
                ref={identifierInputRef}
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                placeholder="Email Address or Username"
                aria-label="Email Address or Username. Type your email address or username here."
                aria-describedby={errors.identifier ? 'identifier-error' : 'identifier-help'}
                aria-required="true"
                aria-invalid={!!errors.identifier}
                className={`w-full h-[50px] px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.identifier ? 'border-red-500' : 'border-gray-300'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
                onFocus={() => {
                  if (isEnabled) {
                    const currentValue = formData.identifier;
                    playSound('navigation');
                    
                    // Clear any pending typing announcements
                    if (typingTimerRef.current) {
                      clearTimeout(typingTimerRef.current);
                    }
                    
                    // Immediate, clear announcement when input is focused
                    let message: string;
                    if (currentValue && currentValue.trim()) {
                      message = `Email or username field focused. Current value: ${currentValue}. Continue typing or press Tab to move to password field.`;
                    } else {
                      message = 'Email or username field focused. Type your email address or username here. You will hear each character as you type. Press Tab when done to move to password field.';
                    }
                    
                    // Use speak with interrupt to ensure it's heard immediately
                    speak(message, true);
                    
                    // Also update live region for screen readers
                    announce(message, 'assertive');
                    
                    // Reset announcement counter when focusing
                    lastAnnouncedLengthRef.current.identifier = currentValue.length;
                  }
                }}
                onBlur={() => {
                  // When leaving the field, announce what was entered (actual value)
                  if (isEnabled && formData.identifier.length > 0) {
                    const enteredValue = formData.identifier.trim();
                    if (enteredValue) {
                      speak(`You typed: ${enteredValue}. Moving to password field.`, false);
                    }
                  }
                }}
              />
              <div id="identifier-help" className="sr-only">
                Enter your email address or username that you used to create your account.
              </div>
              {errors.identifier && (
                <p 
                  id="identifier-error"
                  className="mt-1 text-sm text-red-600" 
                  style={{ fontFamily: 'Andika, sans-serif' }}
                  role="alert"
                  aria-live="polite"
                >
                  {errors.identifier}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password-input"
                className="block text-sm font-medium text-gray-700 mb-2" 
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  autoComplete="off"
                  aria-label="Password. Type your password here. Your password will be hidden for security."
                  aria-describedby={errors.password ? 'password-error' : 'password-help'}
                  aria-required="true"
                  aria-invalid={!!errors.password}
                  className={`w-full h-[50px] px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  style={{ fontFamily: 'Andika, sans-serif' }}
                  onFocus={() => {
                    if (isEnabled) {
                      const currentValue = formData.password;
                      playSound('navigation');
                      
                      // Clear any pending typing announcements
                      if (typingTimerRef.current) {
                        clearTimeout(typingTimerRef.current);
                      }
                      
                      // Immediate, clear announcement when password field is focused
                      let message: string;
                      if (currentValue && currentValue.length > 0) {
                        message = `Password field focused. ${currentValue.length} character${currentValue.length > 1 ? 's' : ''} already entered. Continue typing your password. You will hear a dot for each character you type. Press Tab when done to move to login button.`;
                      } else {
                        message = 'Password field focused. Type your password here. You will hear a dot for each character you type for security. Press Tab when done to move to login button.';
                      }
                      
                      // Use speak with interrupt to ensure it's heard immediately
                      speak(message, true);
                      
                      // Also update live region for screen readers
                      announce(message, 'assertive');
                      
                      // Reset announcement counter when focusing
                      lastAnnouncedLengthRef.current.password = currentValue.length;
                    }
                  }}
                  onBlur={() => {
                    // When leaving the field, announce summary (not actual password)
                    if (isEnabled && formData.password.length > 0) {
                      const charCount = formData.password.length;
                      speak(`Password field completed with ${charCount} character${charCount > 1 ? 's' : ''}.`, false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword);
                    if (isEnabled) {
                      announce(showPassword ? 'Password hidden. Click again to show password.' : 'Password visible. Click again to hide password.', 'polite');
                      playSound('click');
                    }
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password. Click to hide your password.' : 'Show password. Click to show your password.'}
                  aria-pressed={showPassword}
                >
                  <Icon 
                    icon={showPassword ? 'material-symbols:visibility-off' : 'material-symbols:visibility'} 
                    className="w-5 h-5"
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div id="password-help" className="sr-only">
                Enter your account password. Your password will be hidden as you type for security.
              </div>
              {errors.password && (
                <p 
                  id="password-error"
                  className="mt-1 text-sm text-red-600" 
                  style={{ fontFamily: 'Andika, sans-serif' }}
                  role="alert"
                  aria-live="polite"
                >
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link 
                href="/forgot-password" 
                className="text-sm text-gray-600 hover:text-blue-600" 
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              aria-label={isLoading ? 'Logging in. Please wait.' : 'Login button. Click to log in with your credentials, or press Enter.'}
              aria-busy={isLoading}
              className="w-full h-[50px] bg-linear-to-r from-[#059669] to-[#059669] text-white font-semibold rounded-lg flex items-center justify-center gap-3 hover:from-[#047857] hover:to-[#047857] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Andika, sans-serif' }}
              onFocus={() => {
                if (isEnabled && !isLoading) {
                  const message = 'Login button focused. Click to log in with your email and password, or press Enter.';
                  speak(message, true);
                  announce(message, 'assertive');
                  playSound('navigation');
                }
              }}
              onClick={() => {
                if (isEnabled && !isLoading) {
                  playSound('click');
                }
              }}
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" className="text-white" aria-hidden="true" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-base text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
              No account?{' '}
              <Link 
                href="/profile-setup" 
                className="text-lg font-semibold text-blue-600 hover:text-blue-700 underline"
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                Signup
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

