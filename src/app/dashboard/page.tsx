'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import StudentLoadingScreen from '@/components/ui/StudentLoadingScreen';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function Dashboard() {
  const router = useRouter();
  const { isEnabled, announce } = useAccessibility();
  const [user, setUser] = useState<any>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const hasAnnouncedRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/profile-setup');
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    setIsCheckingAccess(false);
  }, [router]);

  useEffect(() => {
    if (!isEnabled || isCheckingAccess || hasAnnouncedRef.current) return;

    const name = user?.name || 'Student';
    announce(
      `Dashboard page. Welcome ${name}. This page is coming soon. Use the quick links to open subjects, games, progress, or assessments.`,
      'polite'
    );
    hasAnnouncedRef.current = true;
  }, [isEnabled, isCheckingAccess, user, announce]);

  if (isCheckingAccess) {
    return <StudentLoadingScreen title="Opening dashboard..." subtitle="Checking your account and getting things ready." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar
        user={{
          name: user?.name || 'Student',
          role: user?.role || 'Student',
          initials: user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST'
        }}
        notifications={3}
        messages={0}
        activeLink="dashboard"
      />

      <main id="main-content" role="main" className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-12 lg:p-16 border border-gray-100">
            {/* Large Icon/Emoji */}
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-blue-100 via-green-100 to-purple-100 rounded-full mb-6">
                <Icon icon="material-symbols:construction" className="w-16 h-16 sm:w-20 sm:h-20 text-blue-600" />
              </div>
            </div>

            {/* Coming Soon Text */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
              Coming Soon! 🎉
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: 'Andika, sans-serif' }}>
              We're working hard to bring you an amazing dashboard experience. 
              <br className="hidden sm:block" />
              Stay tuned for exciting updates!
            </p>

            {/* Decorative Elements */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>

            {/* Additional Info */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-100">
              <p className="text-sm sm:text-base text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                💡 <strong>Tip:</strong> In the meantime, you can explore your subjects, play games, and track your progress from the navigation menu!
              </p>
            </div>

            {/* Quick Links */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <Link
                href="/subjects"
                className="rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors px-4 py-3 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label="Open subjects page"
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:book-open-variant" className="text-blue-600" width={20} height={20} />
                <span className="text-sm font-semibold text-blue-900">Go to Subjects</span>
              </Link>
              <Link
                href="/games"
                className="rounded-xl border border-purple-100 bg-purple-50 hover:bg-purple-100 transition-colors px-4 py-3 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                aria-label="Open games page"
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:gamepad-variant" className="text-purple-600" width={20} height={20} />
                <span className="text-sm font-semibold text-purple-900">Go to Games</span>
              </Link>
              <Link
                href="/progress"
                className="rounded-xl border border-green-100 bg-green-50 hover:bg-green-100 transition-colors px-4 py-3 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
                aria-label="Open progress page"
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:chart-line" className="text-green-600" width={20} height={20} />
                <span className="text-sm font-semibold text-green-900">Go to Progress</span>
              </Link>
              <Link
                href="/assessments"
                className="rounded-xl border border-orange-100 bg-orange-50 hover:bg-orange-100 transition-colors px-4 py-3 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                aria-label="Open assessments page"
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:clipboard-text-outline" className="text-orange-600" width={20} height={20} />
                <span className="text-sm font-semibold text-orange-900">Go to Assessments</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
