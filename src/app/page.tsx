'use client';

import { useEffect } from 'react';
import Image from '@/components/images/SafeImage';
import Link from 'next/link';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function Home() {
  const { isEnabled, announce, speakWelcomeMessage } = useAccessibility();

  // Auto-announce page content when accessibility is enabled
  useEffect(() => {
    if (!isEnabled) return;

    const timer = setTimeout(() => {
      // Detect Safari on macOS
      const isSafariMac = typeof window !== 'undefined' && 
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent) &&
        navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      
      const tabInstruction = isSafariMac 
        ? 'Press Option and Tab together, or enable Tab navigation in Safari preferences: Safari menu, Preferences, Advanced, then check "Press Tab to highlight each item on a webpage".'
        : 'Press Tab to navigate between options, Enter to select.';
      
      const message = 
        'Welcome to Liberia eLearn. Your gateway to quality education. ' +
        'Use the Sign in to your account button to select your role and enter your credentials. ' +
        tabInstruction;
      
      announce(message, 'polite');
    }, 800);

    return () => clearTimeout(timer);
  }, [isEnabled, announce]);
  // Helper: Focus first interactive element on mount (for Safari compatibility)
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Try to focus first link if nothing is focused
      if (document.activeElement === document.body || !document.activeElement) {
        const firstLink = document.querySelector<HTMLElement>('a[tabindex="0"]');
        if (firstLink) {
          // Don't auto-focus, but ensure it's focusable
          // Safari needs explicit tabIndex to recognize elements
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main 
      id="main-content" 
      role="main" 
      className="min-h-screen bg-linear-to-r from-[#EFF6FF] to-[#F0FDF4] flex items-center justify-center p-4"
      aria-label="Homepage - Welcome to Liberia eLearn"
    >
      <div className="w-full max-w-[742px] min-h-[632px] bg-white rounded-2xl shadow-xl p-4 sm:p-8 text-center">
        <div className="mb-6">
          <Image
            src="/moe.png"
            alt="Ministry of Education Logo"
            width={120}
            height={120}
            className="mx-auto rounded-full"
            priority
          />
        </div>
        
        <h1 
          id="page-title"
          className="text-xl sm:text-[30px] font-bold text-[#1F2937] mb-4" 
          style={{ fontFamily: 'Andika, sans-serif' }}
        >
          Welcome to Liberia eLearn!
        </h1>
        
        <p className="text-sm sm:text-[15px] text-[#4B5563] mb-8 leading-relaxed px-4 sm:pl-[95px] sm:pr-[100px] mt-[21px]" style={{ fontFamily: 'Andika, sans-serif' }}>
          Your gateway to quality education. Access courses, connect with teachers, and unlock your potential with our comprehensive learning platform.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-8 justify-center">
          <div className="flex flex-row items-center gap-3">
            <Image
              src="/re1.png"
              alt="Interactive Courses Icon"
              width={19}
              height={24}
              className="w-[19px] h-6"
            />
            <div className="text-center">
              <div className="text-[13px] text-[#374151]" style={{ fontFamily: 'Andika, sans-serif' }}>Interactive Courses</div>
            </div>
          </div>
          
          <div className="flex flex-row items-center gap-3">
            <Image
              src="/re2.png"
              alt="Expert Teachers Icon"
              width={19}
              height={24}
              className="w-[19px] h-6"
            />
            <div className="text-center">
              <div className="text-[13px] text-[#374151]" style={{ fontFamily: 'Andika, sans-serif' }}>Expert Teachers</div>
            </div>
          </div>
          
          <div className="flex flex-row items-center gap-3">
            <Image
              src="/re3.png"
              alt="Certified Learning Icon"
              width={19}
              height={24}
              className="w-[19px] h-6"
            />
            <div className="text-center">
              <div className="text-[13px] text-[#374151]" style={{ fontFamily: 'Andika, sans-serif' }}>Certified Learning</div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center mt-8 sm:mt-20">
          <Link 
            href="/sign-in"
            tabIndex={0}
            className="w-full max-w-[305px] h-[50px] bg-linear-to-r from-[#1E40AF] to-[#059669] text-white font-semibold px-6 rounded-full flex items-center justify-center gap-3 hover:from-[#1E3A8A] hover:to-[#047857] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Sign in to your Liberia eLearn account"
            onClick={() => {
              if (isEnabled) {
                announce('Opening sign in. You will be asked to select your role and enter your credentials.', 'polite');
              }
            }}
            onFocus={() => {
              if (isEnabled) {
                announce('Sign in to your account button. Press Enter to continue.', 'polite');
              }
            }}
          >
            Sign in to your account
          </Link>
        </div>
      </div>
    </main>
  );
}
