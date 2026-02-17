'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { Icon } from '@iconify/react';
import { getKidsGrades, LessonGrade, GeneralGrade } from '@/lib/api/dashboard';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import Spinner from '@/components/ui/Spinner';

export default function FunzonePage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [gradesData, setGradesData] = useState<{ lesson_grades: LessonGrade[]; general_grades: GeneralGrade[] } | null>(null);
  const [activeTab, setActiveTab] = useState<'lessons' | 'general'>('lessons');

  useEffect(() => {
    const fetchGrades = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      try {
        const data = await getKidsGrades(token);
        setGradesData(data);
      } catch (error) {
        const errorMessage = error instanceof ApiClientError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to load grades';
        showErrorToast(formatErrorMessage(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, [router]);

  const handleMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMenuClose = () => setIsMobileMenuOpen(false);

  const calculatePercentage = (score: number, marks: number): number => {
    if (marks === 0) return 0;
    return Math.round((score / marks) * 100);
  };

  const getGradeColor = (percentage: number): { bg: string; border: string; text: string; icon: string; gradient: string } => {
    if (percentage >= 90) {
      return {
        bg: 'bg-linear-to-br from-green-50 to-emerald-50',
        border: 'border-green-300',
        text: 'text-green-700',
        icon: 'mdi:trophy',
        gradient: 'from-green-400 to-emerald-600',
      };
    } else if (percentage >= 80) {
      return {
        bg: 'bg-linear-to-br from-blue-50 to-cyan-50',
        border: 'border-blue-300',
        text: 'text-blue-700',
        icon: 'mdi:star',
        gradient: 'from-blue-400 to-cyan-600',
      };
    } else if (percentage >= 70) {
      return {
        bg: 'bg-linear-to-br from-yellow-50 to-orange-50',
        border: 'border-yellow-300',
        text: 'text-yellow-700',
        icon: 'mdi:check-circle',
        gradient: 'from-yellow-400 to-orange-600',
      };
    } else if (percentage >= 60) {
      return {
        bg: 'bg-linear-to-br from-orange-50 to-red-50',
        border: 'border-orange-300',
        text: 'text-orange-700',
        icon: 'mdi:alert-circle',
        gradient: 'from-orange-400 to-red-600',
      };
    } else {
      return {
        bg: 'bg-linear-to-br from-red-50 to-pink-50',
        border: 'border-red-300',
        text: 'text-red-700',
        icon: 'mdi:help-circle',
        gradient: 'from-red-400 to-pink-600',
      };
    }
  };

  const getGradeEmoji = (percentage: number): string => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '⭐';
    if (percentage >= 70) return '✅';
    if (percentage >= 60) return '📝';
    return '📚';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderGradeCard = (grade: LessonGrade | GeneralGrade, type: 'lesson' | 'general') => {
    const title = type === 'lesson' ? (grade as LessonGrade).lesson_title : (grade as GeneralGrade).assessment_title;
    const percentage = calculatePercentage(grade.score, grade.marks);
    const colors = getGradeColor(percentage);
    const emoji = getGradeEmoji(percentage);

    return (
      <div
        key={grade.id}
        className={`${colors.bg} rounded-3xl p-6 border-4 ${colors.border} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]`}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-3xl">{emoji}</span>
              <h3 className="text-lg font-bold text-gray-800 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                {title}
              </h3>
            </div>
            <div className="text-xs text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
              {formatDate(grade.created_at)}
            </div>
          </div>
          <div className="shrink-0 ml-4">
            <div className={`w-20 h-20 rounded-full ${colors.bg} border-4 ${colors.border} flex items-center justify-center`}>
              <Icon icon={colors.icon} className={colors.text} width={40} height={40} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
              Score
            </span>
            <span className={`text-2xl font-bold ${colors.text}`} style={{ fontFamily: 'Andika, sans-serif' }}>
              {grade.score} / {grade.marks}
            </span>
          </div>

          <div className="bg-white/60 rounded-full h-4 overflow-hidden">
            <div
              className={`h-full bg-linear-to-r ${colors.gradient} rounded-full transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
              Percentage
            </span>
            <span className={`text-lg font-bold ${colors.text}`} style={{ fontFamily: 'Andika, sans-serif' }}>
              {percentage}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const lessonGrades = gradesData?.lesson_grades || [];
  const generalGrades = gradesData?.general_grades || [];
  const totalGrades = lessonGrades.length + generalGrades.length;

  const calculateAverage = (grades: (LessonGrade | GeneralGrade)[]): number => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((sum, grade) => sum + calculatePercentage(grade.score, grade.marks), 0);
    return Math.round(total / grades.length);
  };

  const lessonAverage = calculateAverage(lessonGrades);
  const generalAverage = calculateAverage(generalGrades);
  const overallAverage = totalGrades > 0 ? Math.round((lessonAverage * lessonGrades.length + generalAverage * generalGrades.length) / totalGrades) : 0;

  return (
    <div className="min-h-screen">
      <ElementaryNavbar onMenuToggle={handleMenuToggle} />
      
      <div className="flex">
        <ElementarySidebar 
          activeItem="funzone" 
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={handleMenuClose} 
        />
        
        <main className="flex-1 bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px] overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-linear-to-r from-blue-600 via-green-600 to-cyan-600 bg-clip-text text-transparent" style={{ fontFamily: 'Andika, sans-serif' }}>
                My Grades
              </h1>
              <p className="text-gray-600 text-sm sm:text-base" style={{ fontFamily: 'Andika, sans-serif' }}>
                See all your amazing achievements and scores!
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-r from-[#60A5FA] to-[#2563EB] rounded-2xl p-4 shadow-lg border-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon icon="mdi:book-open-variant" className="text-white" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/80 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Lesson Grades</div>
                    <div className="text-xl font-bold text-white truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {lessonGrades.length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#FACC15] to-[#F97316] rounded-2xl p-4 shadow-lg border-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon icon="mdi:file-document" className="text-white" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/80 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Assignment Grades</div>
                    <div className="text-xl font-bold text-white truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {generalGrades.length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-[#4ADE80] to-[#16A34A] rounded-2xl p-4 shadow-lg border-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon icon="mdi:chart-line" className="text-white" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/80 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Overall Average</div>
                    <div className="text-xl font-bold text-white truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {overallAverage}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-2 mb-6 shadow-lg border-2 border-gray-100 inline-flex">
              <button
                onClick={() => setActiveTab('lessons')}
                className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'lessons'
                    ? 'bg-gradient-to-r from-[#60A5FA] to-[#2563EB] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:book-open-variant" width={20} height={20} />
                <span>Lesson Grades</span>
                {lessonGrades.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {lessonGrades.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('general')}
                className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  activeTab === 'general'
                    ? 'bg-gradient-to-r from-[#60A5FA] to-[#2563EB] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:file-document" width={20} height={20} />
                <span>Assignment Grades</span>
                {generalGrades.length > 0 && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {generalGrades.length}
                  </span>
                )}
              </button>
            </div>

            {activeTab === 'lessons' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                  <Icon icon="mdi:book-open-variant" className="text-blue-500" width={28} height={28} />
                  Lesson Assessment Grades
                </h2>
                {lessonGrades.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lessonGrades.map(grade => renderGradeCard(grade, 'lesson'))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                      No lesson grades yet!
                    </h3>
                    <p className="text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                      Complete lesson assessments to see your grades here!
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'general' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                  <Icon icon="mdi:file-document" className="text-orange-500" width={28} height={28} />
                  Assignment Grades
                </h2>
                {generalGrades.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generalGrades.map(grade => renderGradeCard(grade, 'general'))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                      No assignment grades yet!
                    </h3>
                    <p className="text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                      Submit assignments to see your grades here!
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 bg-linear-to-r from-yellow-100 via-orange-100 to-pink-100 rounded-3xl p-6 border-2 border-yellow-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🌟</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Keep Up the Great Work!
                  </h3>
                  <p className="text-sm text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Every grade is a step forward in your learning journey! Keep practicing and you'll see your scores improve! 🎉
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
