'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { LearningJourneyBanner } from '@/components/courses/LearningJourneyBanner';
import { QuickStatsCards } from '@/components/courses/QuickStatsCards';
import { MyCoursesSection } from '@/components/courses/MyCoursesSection';
import { AssignmentsDueSection } from '@/components/courses/AssignmentsDueSection';
import { getStudyStats, getMySubjects, getAssignmentsDue } from '@/lib/api/courses';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import Spinner from '@/components/ui/Spinner';

export default function CoursesPage() {
  const router = useRouter();
  const [studyStats, setStudyStats] = useState<any>(null);
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [assignmentsDue, setAssignmentsDue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
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

      setIsLoading(true);
      try {
        const [statsData, subjectsData, assignmentsData] = await Promise.all([
          getStudyStats(token),
          getMySubjects(token),
          getAssignmentsDue(token)
        ]);
        
        setStudyStats(statsData);
        setMySubjects(subjectsData.slice(0, 3));
        setAssignmentsDue(assignmentsData.slice(0, 3));
      } catch (error) {
        const errorMessage = error instanceof ApiClientError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to load courses data';
        showErrorToast(formatErrorMessage(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (isLoading || !studyStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = {
    activeCourses: studyStats.active_subjects || 0,
    avgGrade: studyStats.avg_grade || 0,
    studyTime: `${studyStats.study_time_hours || 0}h`,
    badgesEarned: studyStats.badges || 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        user={{ 
          name: user?.name || 'Student', 
          role: user?.role || 'Student', 
          initials: user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST' 
        }}
        notifications={3}
        messages={0}
        activeLink="courses"
      />
      
      <main className="container mx-auto px-4 py-8">
        <LearningJourneyBanner />
        
        <div className="mt-8">
          <QuickStatsCards stats={stats} />
        </div>
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <MyCoursesSection courses={mySubjects} />
          <AssignmentsDueSection assignments={assignmentsDue} />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
