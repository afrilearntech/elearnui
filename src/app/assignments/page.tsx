'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { getKidsAssessments, KidsAssessment } from '@/lib/api/dashboard';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import StudentLoadingScreen from '@/components/ui/StudentLoadingScreen';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useAutoRead } from '@/hooks/useAutoRead';

interface AssessmentCard extends KidsAssessment {
  displayStatus: 'pending' | 'due_soon' | 'overdue' | 'submitted';
  daysUntilDue: number;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  icon: string;
  iconColor: string;
  badgeColor: string;
  badgeText: string;
  titleColor: string;
  isSubmitted: boolean;
  isLocked: boolean;
  due_at: string;
  status: string;
  instructions: string;
}

const calculateDaysUntilDue = (dueDateString: string): number => {
  const dueDate = new Date(dueDateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Check if assessment is completed (from localStorage)
const isAssessmentCompleted = (assessmentId: number): boolean => {
  if (typeof window === 'undefined') return false;
  const completed = localStorage.getItem(`assessment_completed_${assessmentId}`);
  return completed === 'true';
};

const getStatusConfig = (assessment: KidsAssessment, isLocked: boolean = false) => {
  const today = new Date();
  const dueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const due_at = dueDate.toISOString();
  const daysUntilDue = 7;
  const isSubmitted = isAssessmentCompleted(assessment.id);
  
  if (isLocked) {
    return {
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300',
      iconBg: 'bg-gray-200',
      icon: 'mdi:lock',
      iconColor: '#6B7280',
      badgeColor: 'bg-gray-200 text-gray-600',
      badgeText: 'Locked',
      titleColor: 'text-gray-600',
      displayStatus: 'pending' as const,
      daysUntilDue,
      isSubmitted: false,
      isLocked: true,
      due_at,
      status: 'locked',
      instructions: '',
    };
  }
  
  return {
    bgColor: isSubmitted ? 'bg-green-50' : 'bg-blue-50',
    borderColor: isSubmitted ? 'border-green-200' : 'border-blue-200',
    iconBg: isSubmitted ? 'bg-green-100' : 'bg-blue-100',
    icon: isSubmitted ? 'mdi:check-circle' : 'mdi:clipboard-text-outline',
    iconColor: isSubmitted ? '#10B981' : '#3B82F6',
    badgeColor: isSubmitted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700',
    badgeText: isSubmitted ? 'Completed' : 'Pending',
    titleColor: isSubmitted ? 'text-green-900' : 'text-blue-900',
    displayStatus: isSubmitted ? 'submitted' as const : 'pending' as const,
    daysUntilDue,
    isSubmitted,
    isLocked: false,
    due_at,
    status: isSubmitted ? 'submitted' : 'pending',
    instructions: '',
  };
};

const getSubjectIcon = (assignmentType: string, title: string): string => {
  const type = assignmentType.toLowerCase();
  const name = title.toLowerCase();
  
  if (type.includes('essay') || name.includes('essay') || name.includes('writing')) {
    return 'mdi:pen';
  } else if (type.includes('math') || name.includes('math') || name.includes('numeracy')) {
    return 'mdi:calculator';
  } else if (type.includes('reading') || name.includes('reading') || name.includes('literacy') || name.includes('english')) {
    return 'mdi:book-open-variant';
  } else if (type.includes('science') || name.includes('science')) {
    return 'mdi:flask-outline';
  } else if (type.includes('art') || name.includes('art') || name.includes('creative')) {
    return 'mdi:palette-outline';
  } else if (type.includes('music') || name.includes('music')) {
    return 'mdi:music-note';
  } else if (type.includes('sport') || name.includes('sport') || name.includes('pe')) {
    return 'mdi:run';
  }
  return 'mdi:book-open-page-variant';
};

const formatDueDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} ago`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays <= 7) {
    return `In ${diffDays} days`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
};

export default function MyAssignmentsPage() {
  const router = useRouter();
  const { isEnabled, announce, playSound } = useAccessibility();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentCard[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    due_soon: 0,
    overdue: 0,
    submitted: 0,
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'due_soon' | 'overdue' | 'submitted'>('all');

  useEffect(() => {
    const fetchAssessments = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      try {
        const data = await getKidsAssessments(token);
        
        // Hide assessments that have no questions for better student UX
        const assessmentsWithQuestions = (data.assessments || []).filter(
          (assessment) => assessment.has_questions !== false
        );

        // Separate lesson and general assessments
        const lessonAssessments = assessmentsWithQuestions.filter(a => a.type === 'lesson' && a.lesson_id);
        const generalAssessments = assessmentsWithQuestions.filter(a => a.type === 'general' || !a.lesson_id);
        
        // Sort lesson assessments by lesson_id (sequential order)
        lessonAssessments.sort((a, b) => (a.lesson_id || 0) - (b.lesson_id || 0));
        
        // Determine lock status for lesson assessments
        const lessonAssessmentsWithLocks = lessonAssessments.map((assessment, index) => {
          // First lesson assessment is always unlocked
          if (index === 0) {
            const config = getStatusConfig(assessment, false);
            return { ...assessment, ...config };
          }
          
          // Check if previous assessment is completed
          const previousAssessment = lessonAssessments[index - 1];
          const previousCompleted = isAssessmentCompleted(previousAssessment.id);
          
          // Lock if previous is not completed
          const isLocked = !previousCompleted;
          const config = getStatusConfig(assessment, isLocked);
          return { ...assessment, ...config };
        });
        
        // General assessments are always unlocked
        const generalAssessmentsWithStatus = generalAssessments.map((assessment) => {
          const config = getStatusConfig(assessment, false);
          return { ...assessment, ...config };
        });
        
        // Combine: lesson assessments first (in order), then general assessments
        const assessmentsWithStatus = [...lessonAssessmentsWithLocks, ...generalAssessmentsWithStatus];
        
        setAssessments(assessmentsWithStatus);
        const statsData = {
          total: assessmentsWithStatus.length,
          pending: assessmentsWithStatus.filter(a => !a.isSubmitted && !a.isLocked).length,
          due_soon: 0,
          overdue: 0,
          submitted: assessmentsWithStatus.filter(a => a.isSubmitted).length,
        };
        setStats(statsData);
        
        // Auto-read page summary
        const lockedCount = assessmentsWithStatus.filter(a => a.isLocked).length;
        const pageContent = `Assessments page loaded. ${statsData.total} total assessments available. ` +
          `${statsData.pending} pending, ${statsData.submitted} completed. ` +
          `${lockedCount > 0 ? `${lockedCount} locked. ` : ''}` +
          `Use Tab or Arrow keys to navigate between items, Enter to open an assessment. ` +
          `Press question mark for keyboard shortcuts help.`;
        
        // This will auto-read when assessments are loaded
        if (isEnabled) {
          setTimeout(() => {
            announce(pageContent, 'polite');
          }, 500);
        }
      } catch (error) {
        const errorMessage = error instanceof ApiClientError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to load assessments';
        showErrorToast(formatErrorMessage(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessments();
    

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAssessments();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  const handleMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMenuClose = () => setIsMobileMenuOpen(false);

  const filteredAssessments = filter === 'all'
    ? assessments
    : filter === 'submitted'
    ? assessments.filter((assessment) => assessment.isSubmitted)
    : assessments.filter((assessment) => !assessment.isSubmitted && assessment.displayStatus === filter);

  if (isLoading) {
    return <StudentLoadingScreen title="Loading assessments..." subtitle="Fetching your latest tasks and due dates." />;
  }

  return (
    <div className="min-h-screen">
      <ElementaryNavbar onMenuToggle={handleMenuToggle} />

      <div className="flex">
        <ElementarySidebar 
          activeItem="resources" 
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={handleMenuClose} 
        />

        <main id="main-content" role="main" className="flex-1 bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px] overflow-x-hidden">
          <div className="p-4 lg:p-8 max-w-full">
            {/* Title Section */}
            <div className="sm:mx-8 mx-4 mb-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#9333EA] mb-2 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                My Assessments 📚
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                Complete your assessments and earn stars! ⭐
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 sm:mx-8 mx-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-2 border-blue-200 min-w-0">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 mb-1 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {stats.total}
                  </p>
                  <p className="text-xs text-gray-600 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>Total</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-2 border-blue-200 min-w-0">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 mb-1 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {stats.pending}
                  </p>
                  <p className="text-xs text-gray-600 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>Pending</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-2 border-orange-200 min-w-0">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-orange-600 mb-1 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {stats.due_soon}
                  </p>
                  <p className="text-xs text-gray-600 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>Due Soon</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-2 border-red-200 min-w-0">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-red-600 mb-1 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {stats.overdue}
                  </p>
                  <p className="text-xs text-gray-600 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>Overdue</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border-2 border-green-200 col-span-2 sm:col-span-1 min-w-0">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-green-600 mb-1 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {stats.submitted}
                  </p>
                  <p className="text-xs text-gray-600 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>Submitted</p>
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:mx-8 mx-4 mb-6">
              <button
                onClick={() => {
                  setFilter('all');
                  if (isEnabled) {
                    playSound('click');
                    announce('Filter: All assessments selected');
                  }
                }}
                aria-label="Filter: All assessments"
                aria-pressed={filter === 'all'}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-[#60A5FA] text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:view-list" width={16} height={16} className="sm:w-[18px] sm:h-[18px]" aria-hidden="true" />
                <span className="hidden sm:inline">All Assessments</span>
                <span className="sm:hidden">All</span>
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                  filter === 'pending'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:clipboard-text-outline" width={16} height={16} className="sm:w-[18px] sm:h-[18px]" />
                Pending
              </button>
              <button
                onClick={() => setFilter('due_soon')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                  filter === 'due_soon'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:clock-alert-outline" width={16} height={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Due Soon</span>
                <span className="sm:hidden">Due</span>
              </button>
              <button
                onClick={() => setFilter('overdue')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                  filter === 'overdue'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:alert-circle-outline" width={16} height={16} className="sm:w-[18px] sm:h-[18px]" />
                Overdue
              </button>
              <button
                onClick={() => setFilter('submitted')}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap ${
                  filter === 'submitted'
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:check-circle-outline" width={16} height={16} className="sm:w-[18px] sm:h-[18px]" />
                Submitted
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 sm:mx-8 mx-4">
              {filteredAssessments.length > 0 ? (
                filteredAssessments.map((assessment, index) => {
                  const subjectIcon = getSubjectIcon(assessment.type, assessment.title);
                  
                  const handleCardClick = (e: React.MouseEvent) => {
                    if (assessment.isLocked) {
                      e.preventDefault();
                      showErrorToast('🔒 Complete the previous lesson quiz first to unlock this one!');
                      if (isEnabled) {
                        announce('Assessment locked. Complete the previous lesson quiz to unlock this one.', 'assertive');
                        playSound('error');
                      }
                    } else if (isEnabled) {
                      playSound('navigation');
                      announce(`Opening assessment: ${assessment.title}, ${assessment.type}, ${assessment.marks} marks`);
                    }
                  };
                  
                  const cardAriaLabel = assessment.isLocked
                    ? `${assessment.title}, ${assessment.type}, Locked. Complete previous lesson quiz to unlock.`
                    : `${assessment.title}, ${assessment.type}, ${assessment.isSubmitted ? 'Completed' : 'Pending'}, ${assessment.marks} marks, ${assessment.isSubmitted ? 'View' : 'Start'} button`;
                  
                  return (
                    <Link
                      href={assessment.isLocked ? '#' : `/assessments/${assessment.id}`}
                      key={assessment.id}
                      onClick={handleCardClick}
                      aria-label={cardAriaLabel}
                      aria-disabled={assessment.isLocked}
                      className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 ${assessment.borderColor} transition-all w-full max-w-full block ${
                        assessment.isLocked 
                          ? 'cursor-not-allowed opacity-60 hover:scale-100' 
                          : 'cursor-pointer hover:scale-105 hover:shadow-xl'
                      }`}
                    >
                      <div className={`${assessment.bgColor} p-4 sm:p-5 border-b-2 ${assessment.borderColor}`}>
                        <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${assessment.iconBg} rounded-full flex items-center justify-center shrink-0`}>
                            <Icon 
                              icon={subjectIcon} 
                              width={20} 
                              height={20}
                              className="sm:w-6 sm:h-6"
                              style={{ color: assessment.iconColor }}
                              aria-hidden="true"
                            />
                          </div>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${assessment.badgeColor} truncate max-w-[60%] sm:max-w-none`} style={{ fontFamily: 'Andika, sans-serif' }}>
                            {assessment.badgeText}
                          </span>
                        </div>
                        <h3 className={`text-base sm:text-lg font-bold ${assessment.titleColor} mb-2 truncate`} style={{ fontFamily: 'Andika, sans-serif' }}>
                          {assessment.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate capitalize" style={{ fontFamily: 'Andika, sans-serif' }}>
                          {assessment.type}
                        </p>
                      </div>

                      <div className="p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon icon="mdi:star" width={16} height={16} className="sm:w-[18px] sm:h-[18px] text-yellow-500 shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-600 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                              {assessment.marks} marks
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon icon="mdi:book-open-page-variant" width={14} height={14} className="sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                            <span className="text-[10px] sm:text-xs text-gray-500 truncate capitalize" style={{ fontFamily: 'Andika, sans-serif' }}>
                              {assessment.type}
                            </span>
                          </div>
                          {assessment.isLocked ? (
                            <div className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 bg-gray-200 text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                              <Icon icon="mdi:lock" width={16} height={16} />
                              <span>Locked</span>
                            </div>
                          ) : (
                            <div
                              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 ${
                                assessment.isSubmitted
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                              style={{ fontFamily: 'Andika, sans-serif' }}
                            >
                              {assessment.isSubmitted ? (
                                <>
                                  <Icon icon="mdi:check-circle" width={16} height={16} />
                                  <span>View</span>
                                </>
                              ) : (
                                <>
                                  <Icon icon="mdi:play-circle" width={16} height={16} />
                                  <span>Start</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {assessment.isLocked && assessment.type === 'lesson' && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs text-gray-500 text-center" style={{ fontFamily: 'Andika, sans-serif' }}>
                              Complete previous lesson quiz to unlock
                            </p>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 sm:py-12">
                  <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 max-w-md mx-auto">
                    <Icon icon="mdi:clipboard-check-outline" width={48} height={48} className="sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-base sm:text-lg font-semibold text-gray-700 mb-2 px-4" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {filter === 'all' ? 'No Assessments Yet! 🎉' : `No ${filter === 'due_soon' ? 'due soon' : filter === 'submitted' ? 'submitted' : filter.replace('_', ' ')} assessments`}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 px-4" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {filter === 'all' 
                        ? "Great job! You're all caught up. Check back later for new assessments!" 
                        : filter === 'submitted'
                        ? "You haven't submitted any assessments yet. Start working on them!"
                        : 'Try selecting a different filter to see more assessments.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

