'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { getKidsAssessments } from '@/lib/api/dashboard';
import { 
  submitSolution, 
  SubmitSolutionRequest,
  getAssessmentQuestions,
  AssessmentQuestionsResponse,
  AssessmentQuestion
} from '@/lib/api/assignments';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, showSuccessToast, formatErrorMessage } from '@/lib/toast';
import Spinner from '@/components/ui/Spinner';
import StudentLoadingScreen from '@/components/ui/StudentLoadingScreen';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useAutoRead } from '@/hooks/useAutoRead';
import { isAssessmentLocked } from '@/lib/elementary/lessonQuizUtils';
import { studentQueryKeys } from '@/lib/student/queryKeys';
import { useStudentAuthReady } from '@/hooks/student/useStudentAuthReady';

type AssignmentLoadCode = 'NOT_FOUND' | 'LOCKED' | 'NO_QUESTIONS';

function assignmentLoadError(code: AssignmentLoadCode, message?: string) {
  const e = new Error(message ?? code) as Error & { code: AssignmentLoadCode };
  e.code = code;
  return e;
}

export default function AssignmentDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const assignmentId = params?.id as string;
  const authReady = useStudentAuthReady();
  const { isEnabled, announce, playSound } = useAccessibility();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const announcedLoadRef = useRef<string | null>(null);

  const { data, isPending, isError, error } = useQuery({
    queryKey: studentQueryKeys.assignmentDetail(assignmentId ?? ''),
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Missing auth token');
      const kidsData = await getKidsAssessments(token);
      const foundAssessment = kidsData.assessments.find(
        (a) => a.id.toString() === assignmentId,
      );
      if (!foundAssessment) throw assignmentLoadError('NOT_FOUND');
      const locked = isAssessmentLocked(foundAssessment.id, kidsData.assessments);
      if (locked) throw assignmentLoadError('LOCKED');
      const paramsQ: { general_id?: number; lesson_id?: number } =
        foundAssessment.type === 'general'
          ? { general_id: foundAssessment.id }
          : { lesson_id: foundAssessment.id };
      const questionsData = await getAssessmentQuestions(paramsQ, token);
      if (!questionsData.questions.length) throw assignmentLoadError('NO_QUESTIONS');
      return {
        assessment: foundAssessment,
        questionsData,
      };
    },
    enabled: authReady && !!assignmentId,
    retry: false,
  });

  const assessment = data?.assessment ?? null;
  const assessmentData = data?.questionsData ?? null;

  const shuffledQuestions = useMemo(() => {
    if (!assessmentData?.questions?.length || sessionId === null) return [];
    return shuffleQuestions(assessmentData.questions, sessionId);
  }, [assessmentData, sessionId]);

  const isLoading = !authReady || (isPending && data === undefined);
  const isPreparingQuiz =
    Boolean(assessmentData?.questions?.length) && sessionId === null && !isLoading;

  // Seeded random number generator for consistent shuffling
  const seededRandom = (seed: number) => {
    let value = seed;
    return () => {
      value = (value * 9301 + 49297) % 233280;
      return value / 233280;
    };
  };

  // Shuffle array using Fisher-Yates algorithm with seed
  const shuffleArray = <T,>(array: T[], seed: number): T[] => {
    const random = seededRandom(seed);
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Shuffle questions and their options
  const shuffleQuestions = (questions: AssessmentQuestion[], seed: number): AssessmentQuestion[] => {
    const shuffled = shuffleArray(questions, seed);
    
    // Also shuffle options for multiple choice and fill-in-the-blank questions
    return shuffled.map((question, index) => {
      if ((question.type === 'MULTIPLE_CHOICE' || question.type === 'FILL_IN_THE_BLANK') && question.options) {
        const optionSeed = seed + index * 1000; // Different seed for each question's options
        const shuffledOptions = shuffleArray(question.options, optionSeed);
        return { ...question, options: shuffledOptions };
      }
      return question;
    });
  };


  useEffect(() => {
    if (!assignmentId) {
      router.push('/assessments');
    }
  }, [assignmentId, router]);

  useLayoutEffect(() => {
    if (!assessmentData?.questions?.length) {
      setSessionId(null);
      return;
    }
    setSessionId(Date.now());
    setCurrentQuestionIndex(0);
    setAnswers({});
  }, [assessmentData, assignmentId]);

  useEffect(() => {
    if (!isEnabled || shuffledQuestions.length === 0 || !assessmentData || sessionId === null) return;
    const key = `${assignmentId}-${sessionId}`;
    if (announcedLoadRef.current === key) return;
    announcedLoadRef.current = key;
    const assessmentContent =
      `Assessment loaded: ${assessmentData.assessment.title}. ` +
      `${shuffledQuestions.length} questions total. ` +
      `Question types may include multiple choice, true or false, short answer, and essay. ` +
      `Use Arrow keys to navigate options, Enter to select, N for next question, P for previous, S to submit when ready.`;
    const t = setTimeout(() => announce(assessmentContent, 'polite'), 500);
    return () => clearTimeout(t);
  }, [isEnabled, shuffledQuestions.length, assessmentData, announce, assignmentId, sessionId]);

  useEffect(() => {
    if (!isError || !error) return;
    const code = (error as Error & { code?: AssignmentLoadCode }).code;
    if (code === 'LOCKED') {
      showErrorToast('🔒 This quiz is locked! Complete the previous lesson quiz first.');
      router.push('/assessments');
      return;
    }
    if (code === 'NOT_FOUND') {
      showErrorToast('Assessment not found');
      router.push('/assessments');
      return;
    }
    if (code === 'NO_QUESTIONS') {
      showErrorToast('This assessment has no questions yet.');
      router.push('/assessments');
      return;
    }
    console.error('Assignment detail error:', error);
    const errorMessage = error instanceof ApiClientError
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Failed to load assessment';
    showErrorToast(formatErrorMessage(errorMessage));
    router.push('/assessments');
  }, [isError, error, router]);


  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (shuffledQuestions.length > 0 && currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      if (isEnabled) {
        playSound('navigation');
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = shuffledQuestions[nextIndex];
        setTimeout(() => {
          announce(
            `Question ${nextIndex + 1} of ${shuffledQuestions.length}. ${nextQuestion.question}. ` +
            `Type: ${nextQuestion.type.replace(/_/g, ' ')}. ` +
            `${answers[nextQuestion.id] ? 'You have already answered this question.' : 'Not yet answered.'}`,
            'polite'
          );
        }, 100);
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      if (isEnabled) {
        playSound('navigation');
        const prevIndex = currentQuestionIndex - 1;
        const prevQuestion = shuffledQuestions[prevIndex];
        setTimeout(() => {
          announce(
            `Question ${prevIndex + 1} of ${shuffledQuestions.length}. ${prevQuestion.question}. ` +
            `Type: ${prevQuestion.type.replace(/_/g, ' ')}. ` +
            `${answers[prevQuestion.id] ? 'You have already answered this question.' : 'Not yet answered.'}`,
            'polite'
          );
        }, 100);
      }
    }
  };

  const handleSubmitAssessment = useCallback(async () => {
    if (shuffledQuestions.length === 0) return;

    const unansweredQuestions = shuffledQuestions.filter(
      (q) => !answers[q.id] || answers[q.id].trim() === '',
    );

    if (unansweredQuestions.length > 0) {
      showErrorToast(`Please answer all ${shuffledQuestions.length} questions! 🎯`);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedSolution = shuffledQuestions
        .map((q, index) => {
          const answerText = answers[q.id] || '';
          return `question${index + 1}: ${answerText}`;
        })
        .join(' ');

      const submitData: SubmitSolutionRequest = {
        ...(assessment?.type === 'general' ? { general_id: assessment.id } : {}),
        ...(assessment?.type === 'lesson' ? { lesson_id: assessment.id } : {}),
        solution: formattedSolution,
      };

      await submitSolution(submitData, token);

      if (assessment) {
        localStorage.setItem(`assessment_completed_${assessment.id}`, 'true');
      }

      void queryClient.invalidateQueries({ queryKey: studentQueryKeys.kidsAssessments });

      showSuccessToast('🎉 Assessment submitted successfully! Great job! ⭐');
      setTimeout(() => {
        router.push('/assessments');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof ApiClientError
        ? err.message
        : err instanceof Error
        ? err.message
        : 'Failed to submit assessment';
      showErrorToast(formatErrorMessage(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  }, [assessment, answers, queryClient, router, shuffledQuestions]);


  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const totalQuestions = shuffledQuestions.length;
  const answeredCount = shuffledQuestions.filter(q => answers[q.id] && answers[q.id].trim() !== '').length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Auto-read current question when it changes
  useEffect(() => {
    if (!isEnabled || !currentQuestion || shuffledQuestions.length === 0) return;
    
    const questionText = `Question ${currentQuestionIndex + 1} of ${totalQuestions}. ${currentQuestion.question}. ` +
      `Type: ${currentQuestion.type.replace(/_/g, ' ')}. ` +
      `${answers[currentQuestion.id] ? 'You have already answered this question. Your answer: ' + answers[currentQuestion.id] : 'Not yet answered.'}`;
    
    // Small delay to ensure UI is updated
    const timer = setTimeout(() => {
      announce(questionText, 'polite');
    }, 200);
    
    return () => clearTimeout(timer);
  }, [currentQuestionIndex, currentQuestion, isEnabled, answers, totalQuestions, announce]);

  // Quiz-specific keyboard shortcuts
  useEffect(() => {
    if (!isEnabled || shuffledQuestions.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable;

      // N for next, P for previous (only when not typing)
      if (!isInput) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          if (currentQuestionIndex < shuffledQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            playSound('navigation');
            const nextIndex = currentQuestionIndex + 1;
            const nextQuestion = shuffledQuestions[nextIndex];
            setTimeout(() => {
              announce(
                `Question ${nextIndex + 1} of ${shuffledQuestions.length}. ${nextQuestion.question}. ` +
                `Type: ${nextQuestion.type.replace(/_/g, ' ')}. ` +
                `${answers[nextQuestion.id] ? 'You have already answered this question.' : 'Not yet answered.'}`,
                'polite'
              );
            }, 100);
          }
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            playSound('navigation');
            const prevIndex = currentQuestionIndex - 1;
            const prevQuestion = shuffledQuestions[prevIndex];
            setTimeout(() => {
              announce(
                `Question ${prevIndex + 1} of ${shuffledQuestions.length}. ${prevQuestion.question}. ` +
                `Type: ${prevQuestion.type.replace(/_/g, ' ')}. ` +
                `${answers[prevQuestion.id] ? 'You have already answered this question.' : 'Not yet answered.'}`,
                'polite'
              );
            }, 100);
          }
        } else if (e.key === 's' || e.key === 'S') {
          // S for submit (when on last question)
          if (currentQuestionIndex === shuffledQuestions.length - 1) {
            e.preventDefault();
            const unanswered = shuffledQuestions.filter(q => !answers[q.id] || answers[q.id].trim() === '');
            if (unanswered.length === 0) {
              handleSubmitAssessment();
            } else {
              announce(`Cannot submit yet. ${unanswered.length} question${unanswered.length > 1 ? 's' : ''} still need${unanswered.length > 1 ? '' : 's'} answers.`, 'assertive');
              playSound('error');
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, shuffledQuestions, currentQuestionIndex, answers, announce, playSound, handleSubmitAssessment]);

  if (isLoading) {
    return <StudentLoadingScreen title="Loading assignment details..." subtitle="Preparing questions and resources for you." />;
  }

  if (!assessment) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <ElementaryNavbar onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      
      <div className="flex">
        <ElementarySidebar 
          activeItem="resources" 
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)} 
        />
        
        <main id="main-content" role="main" className="flex-1 bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px] overflow-x-hidden">
          <div className="p-4 lg:p-8 max-w-full">
            {/* Header */}
            <div className="sm:mx-8 mx-4 mb-6">
              <Link 
                href="/assessments"
                aria-label="Back to assessments page"
                className="inline-flex items-center gap-2 text-[#3B82F6] hover:text-[#2563EB] mb-4 transition-colors"
                style={{ fontFamily: 'Andika, sans-serif' }}
                onClick={() => isEnabled && playSound('navigation')}
              >
                <Icon icon="mdi:arrow-left" width={20} height={20} aria-hidden="true" />
                <span className="text-sm font-medium">Back to Assessments</span>
              </Link>
              
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-[#E5E7EB]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#9333EA] mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {assessmentData?.assessment.title || assessment.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {assessment.type}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {assessment.marks} marks
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isPreparingQuiz ? (
              <div className="sm:mx-8 mx-4">
                <div className="bg-white rounded-2xl shadow-lg p-12 border-2 border-[#E5E7EB] flex items-center justify-center">
                  <Spinner size="lg" />
                </div>
              </div>
            ) : shuffledQuestions.length > 0 ? (
              <div className="sm:mx-8 mx-4">
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border-2 border-[#E5E7EB]">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-[#9333EA] to-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ fontFamily: 'Andika, sans-serif' }}>
                          {currentQuestionIndex + 1}
                        </div>
                        <div>
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                            Question {currentQuestionIndex + 1} of {totalQuestions}
                          </p>
                          <p className="text-xs text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                            {answeredCount} answered
                          </p>
                        </div>
                      </div>
                      {answers[currentQuestion?.id || 0] && (
                        <div className="flex items-center gap-2 text-green-600" role="status" aria-live="polite">
                          <Icon icon="mdi:check-circle" width={24} height={24} aria-hidden="true" />
                          <span className="text-sm font-medium" style={{ fontFamily: 'Andika, sans-serif' }}>Answered</span>
                        </div>
                      )}
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-6" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Progress: ${Math.round(progress)}% complete`}>
                      <div
                        className="h-full bg-gradient-to-r from-[#9333EA] to-[#3B82F6] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {isEnabled && (
                      <div className="sr-only" aria-live="polite" aria-atomic="true">
                        {`Progress: ${answeredCount} of ${totalQuestions} questions answered, ${Math.round(progress)}% complete`}
                      </div>
                    )}
                  </div>

                  {currentQuestion && (
                    <div className="mb-8">
                      <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                        <div className="flex items-start gap-3 mb-4">
                          <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 border border-gray-300 capitalize" style={{ fontFamily: 'Andika, sans-serif' }}>
                            {currentQuestion.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h2 id={`question-${currentQuestion.id}`} className="text-xl sm:text-2xl font-bold text-gray-900 leading-relaxed" style={{ fontFamily: 'Andika, sans-serif' }}>
                          {currentQuestion.question}
                        </h2>
                      </div>

                      <div className="space-y-4">
                        {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options ? (
                          <div role="radiogroup" aria-label={`Question ${currentQuestionIndex + 1} options`}>
                            {currentQuestion.options.map((option, optIndex) => {
                              const isSelected = answers[currentQuestion.id] === option.value;
                              const optionLabel = `Option ${String.fromCharCode(65 + optIndex)}: ${option.value}`;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={isSelected}
                                  aria-label={optionLabel}
                                  onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
                                  className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white border-[#9333EA] shadow-lg scale-[1.02]'
                                      : 'bg-white text-gray-900 border-gray-300 hover:border-[#9333EA] hover:bg-purple-50 hover:shadow-md'
                                  }`}
                                  style={{ fontFamily: 'Andika, sans-serif' }}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                      isSelected ? 'border-white bg-white' : 'border-gray-400 bg-white'
                                    }`} aria-hidden="true">
                                      {isSelected && (
                                        <Icon icon="mdi:check" width={20} height={20} className="text-[#9333EA]" />
                                      )}
                                    </div>
                                    <span className="text-base sm:text-lg font-medium flex-1">{option.value}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : currentQuestion.type === 'TRUE_FALSE' ? (
                          <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-label="True or False options">
                            {['True', 'False'].map((option) => {
                              const isSelected = answers[currentQuestion.id]?.toLowerCase() === option.toLowerCase();
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  role="radio"
                                  aria-checked={isSelected}
                                  aria-label={`${option}, ${isSelected ? 'selected' : 'not selected'}`}
                                  onClick={() => handleAnswerChange(currentQuestion.id, option)}
                                  className={`p-6 rounded-xl border-2 transition-all font-semibold ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white border-[#9333EA] shadow-lg scale-[1.02]'
                                      : 'bg-white text-gray-900 border-gray-300 hover:border-[#9333EA] hover:bg-purple-50 hover:shadow-md'
                                  }`}
                                  style={{ fontFamily: 'Andika, sans-serif' }}
                                >
                                  <div className="flex items-center justify-center gap-3">
                                    {isSelected && <Icon icon="mdi:check-circle" width={24} height={24} aria-hidden="true" />}
                                    <span className="text-lg sm:text-xl">{option}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : currentQuestion.type === 'FILL_IN_THE_BLANK' && currentQuestion.options ? (
                          <div className="space-y-3">
                            {currentQuestion.options.map((option) => {
                              const isSelected = answers[currentQuestion.id] === option.value;
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
                                  className={`w-full text-left p-5 rounded-xl border-2 transition-all ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white border-[#9333EA] shadow-lg scale-[1.02]'
                                      : 'bg-white text-gray-900 border-gray-300 hover:border-[#9333EA] hover:bg-purple-50 hover:shadow-md'
                                  }`}
                                  style={{ fontFamily: 'Andika, sans-serif' }}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                      isSelected ? 'border-white bg-white' : 'border-gray-400 bg-white'
                                    }`}>
                                      {isSelected && (
                                        <Icon icon="mdi:check" width={20} height={20} className="text-[#9333EA]" />
                                      )}
                                    </div>
                                    <span className="text-base sm:text-lg font-medium flex-1">{option.value}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : currentQuestion.type === 'SHORT_ANSWER' ? (
                          <input
                            type="text"
                            id={`answer-${currentQuestion.id}`}
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            placeholder="Type your answer here..."
                            aria-label={`Answer for question ${currentQuestionIndex + 1}: ${currentQuestion.question}`}
                            aria-describedby={`question-${currentQuestion.id}`}
                            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-[#9333EA] text-base sm:text-lg"
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          />
                        ) : currentQuestion.type === 'ESSAY' ? (
                          <textarea
                            id={`answer-${currentQuestion.id}`}
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            placeholder="Write your answer here... Be creative! ✍️"
                            rows={6}
                            aria-label={`Answer for question ${currentQuestionIndex + 1}: ${currentQuestion.question}`}
                            aria-describedby={`question-${currentQuestion.id}`}
                            className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9333EA] focus:border-[#9333EA] text-base sm:text-lg resize-none"
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          />
                        ) : null}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-6 border-t-2 border-gray-200">
                    <button
                      type="button"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      aria-label={`Previous question. ${currentQuestionIndex === 0 ? 'Disabled, this is the first question' : `Go to question ${currentQuestionIndex}`}`}
                      className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold flex items-center gap-2 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ fontFamily: 'Andika, sans-serif' }}
                    >
                      <Icon icon="mdi:arrow-left" width={20} height={20} aria-hidden="true" />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {shuffledQuestions.map((question, index) => (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                            index === currentQuestionIndex
                              ? 'bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white shadow-md scale-110'
                              : answers[question.id]
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>

                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          aria-label={`Next question. Go to question ${currentQuestionIndex + 2} of ${totalQuestions}`}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                          <span>Next</span>
                          <Icon icon="mdi:arrow-right" width={20} height={20} aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmitAssessment}
                          disabled={isSubmitting || answeredCount !== totalQuestions}
                          aria-label={`Submit assessment. ${answeredCount} of ${totalQuestions} questions answered. ${answeredCount === totalQuestions ? 'Ready to submit' : 'Please answer all questions'}`}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#10B981] to-[#3B82F6] text-white font-bold flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                          {isSubmitting ? (
                            <>
                              <Spinner size="sm" className="text-white" aria-hidden="true" />
                              <span>Submitting...</span>
                            </>
                          ) : (
                            <>
                              <Icon icon="mdi:send" width={20} height={20} aria-hidden="true" />
                              <span>Submit Assessment 🚀</span>
                            </>
                          )}
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="sm:mx-8 mx-4">
                <div className="bg-white rounded-2xl shadow-lg p-12 border-2 border-yellow-200">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                      <Icon icon="mdi:help-circle-outline" width={64} height={64} className="text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Andika, sans-serif' }}>
                      No Questions Available Yet! 📝
                    </h2>
                    <p className="text-lg text-gray-600 mb-6 max-w-md" style={{ fontFamily: 'Andika, sans-serif' }}>
                      This assessment doesn't have any questions yet. Check back soon or ask your teacher about it!
                    </p>
                    <Link
                      href="/assessments"
                      className="px-6 py-3 bg-gradient-to-r from-[#9333EA] to-[#3B82F6] text-white rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg transition-all"
                      style={{ fontFamily: 'Andika, sans-serif' }}
                    >
                      <Icon icon="mdi:arrow-left" width={20} height={20} />
                      <span>Back to Assessments</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

