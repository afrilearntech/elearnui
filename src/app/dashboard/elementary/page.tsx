'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import ElementaryStatsCards from '@/components/elementary/ElementaryStatsCards';
import ContinueLearningSection from '@/components/elementary/ContinueLearningSection';
import MagicChallengesSection from '@/components/elementary/MagicChallengesSection';
import ExploreSubjectsSection from '@/components/elementary/ExploreSubjectsSection';
import RecentAdventuresSection from '@/components/elementary/RecentAdventuresSection';
import { getElementaryDashboard } from '@/lib/api/dashboard';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import Spinner from '@/components/ui/Spinner';

export default function ElementaryDashboard() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
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

      setIsLoading(true);
      try {
        const data = await getElementaryDashboard(token);
        setDashboardData(data);
      } catch (error) {
        const errorMessage = error instanceof ApiClientError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to load dashboard data';
        showErrorToast(formatErrorMessage(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ElementaryNavbar onMenuToggle={handleMenuToggle} />
      
      <div className="flex">
        <ElementarySidebar 
          activeItem="home" 
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={handleMenuClose}
        />
        
        <main className="flex-1 bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px] overflow-x-hidden">
          <div className="p-4 lg:p-8 max-w-full">
            {/* Welcome Banner */}
            <div className="bg-white/60 rounded-2xl shadow-lg h-[140px] mt-8 sm:mx-8 mx-4 w-full max-w-full overflow-hidden">
              <div className="h-full flex flex-col justify-center px-6 sm:px-8">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Welcome back, {user?.name || 'Student'}! ✨
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Ready for another magical learning adventure?
                </p>
              </div>
            </div>

            {/* Progress/Stats Section */}
            <div className="sm:mx-8 mx-4">
              <ElementaryStatsCards 
                stats={dashboardData ? [
                  {
                    title: 'Lessons Completed',
                    value: dashboardData.lessons_completed || 0,
                    icon: '/correct.png',
                    iconSize: { width: 20, height: 20 },
                    bgColor: 'bg-blue-50',
                    bgClass: 'bg-linear-to-r from-[#60A5FA] to-[#2563EB]',
                    iconBgColor: 'bg-blue-100'
                  },
                  {
                    title: 'Stars Earned',
                    value: dashboardData.points_earned ? dashboardData.points_earned.toLocaleString() : '0',
                    icon: '/star.png',
                    iconSize: { width: 20, height: 20 },
                    bgColor: 'bg-orange-50',
                    bgClass: 'bg-linear-to-r from-[#FACC15] to-[#F97316]',
                    iconBgColor: 'bg-orange-100'
                  },
                  {
                    title: 'Day Streak',
                    value: dashboardData.streaks_this_week || 0,
                    icon: '/streak.png',
                    iconSize: { width: 31, height: 40 },
                    bgColor: 'bg-green-50',
                    bgClass: 'bg-linear-to-r from-[#4ADE80] to-[#16A34A]',
                    iconBgColor: 'bg-green-100'
                  },
                  {
                    title: 'Current Level',
                    value: dashboardData.current_level || 'Grade 1',
                    icon: '/trophy.png',
                    iconSize: { width: 40, height: 40 },
                    bgColor: 'bg-purple-50',
                    bgClass: 'bg-linear-to-r from-[#C084FC] to-[#9333EA]',
                    iconBgColor: 'bg-purple-100'
                  }
                ] : undefined}
              />
            </div>

            <div className="flex flex-col lg:flex-row lg:gap-[24px] mt-8 sm:mx-8 mx-4 w-full max-w-full">
              {/* Continue Learning Section */}
              <ContinueLearningSection 
                modules={dashboardData?.continue_learning && dashboardData.continue_learning.length > 0
                  ? dashboardData.continue_learning.map((item: any, index: number) => ({
                      title: item.name || item.title || 'Learning Module',
                      subtitle: item.subject || 'Continue your learning',
                      icon: index === 0 ? '/apple.png' : index === 1 ? '/book.png' : '/fun.png',
                      iconSize: { width: 24, height: 24 },
                      bgColor: index === 0 ? 'bg-red-50' : index === 1 ? 'bg-blue-50' : 'bg-green-50',
                      iconBgColor: index === 0 ? 'bg-red-100' : index === 1 ? 'bg-blue-100' : 'bg-green-100'
                    }))
                  : []}
              />

              {/* Today's Magic Challenges */}
              <MagicChallengesSection />
            </div>

            {/* Explore Magical Subjects */}
            <div className="sm:mx-8 mx-4">
            <ExploreSubjectsSection />
            </div>

            {/* Recent Activities */}
            <div className="sm:mx-8 mx-4">
              <RecentAdventuresSection 
                activities={dashboardData?.recent_activities || []}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
