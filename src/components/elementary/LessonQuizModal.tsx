'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { getKidsAssessments, KidsAssessment } from '@/lib/api/dashboard';
import {
  submitSolution,
  SubmitSolutionRequest,
  getAssessmentQuestions,
  AssessmentQuestionsResponse,
  AssessmentQuestion,
} from '@/lib/api/assignments';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, showSuccessToast, formatErrorMessage } from '@/lib/toast';
import Spinner from '@/components/ui/Spinner';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { findAssessmentForLesson, isAssessmentLocked } from '@/lib/elementary/lessonQuizUtils';

type LessonQuizModalProps = {
  open: boolean;
  onClose: () => void;
  lessonContentId: number;
  lessonTitle: string;
  token: string;
};

const seededRandom = (seed: number) => {
  let value = seed;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
};

const shuffleArray = <T,>(array: T[], seed: number): T[] => {
  const random = seededRandom(seed);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const shuffleQuestions = (questions: AssessmentQuestion[], seed: number): AssessmentQuestion[] => {
  const shuffled = shuffleArray(questions, seed);
  return shuffled.map((question, index) => {
    if (
      (question.type === 'MULTIPLE_CHOICE' || question.type === 'FILL_IN_THE_BLANK') &&
      question.options
    ) {
      const optionSeed = seed + index * 1000;
      const shuffledOptions = shuffleArray(question.options, optionSeed);
      return { ...question, options: shuffledOptions };
    }
    return question;
  });
};

export default function LessonQuizModal({
  open,
  onClose,
  lessonContentId,
  lessonTitle,
  token,
}: LessonQuizModalProps) {
  const { isEnabled, announce, playSound } = useAccessibility();

  const [phase, setPhase] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<KidsAssessment | null>(null);
  const [assessmentData, setAssessmentData] = useState<AssessmentQuestionsResponse | null>(null);
  const [shuffledQuestions, setShuffledQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetState = useCallback(() => {
    setPhase('idle');
    setErrorMessage(null);
    setAssessment(null);
    setAssessmentData(null);
    setShuffledQuestions([]);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setIsLoadingQuestions(false);
    setIsSubmitting(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    let cancelled = false;

    const run = async () => {
      setPhase('loading');
      setErrorMessage(null);
      try {
        const data = await getKidsAssessments(token);
        if (cancelled) return;

        const found = findAssessmentForLesson(lessonContentId, data.assessments);
        if (!found) {
          setPhase('error');
          setErrorMessage('There is no quiz linked to this lesson yet. Your teacher may add one soon.');
          return;
        }

        if (found.has_questions === false) {
          setPhase('error');
          setErrorMessage('This quiz does not have questions yet.');
          return;
        }

        const locked = isAssessmentLocked(found.id, data.assessments);
        if (locked) {
          setPhase('error');
          setErrorMessage('This quiz is locked. Complete the previous lesson quiz first from Assessments.');
          return;
        }

        setAssessment(found);
        setIsLoadingQuestions(true);
        try {
          const questionsData = await getAssessmentQuestions({ lesson_id: found.id }, token);
          if (cancelled) return;

          setAssessmentData(questionsData);
          const newSessionId = Date.now();

          if (questionsData.questions.length > 0) {
            setShuffledQuestions(shuffleQuestions(questionsData.questions, newSessionId));
            setPhase('ready');
            if (isEnabled) {
              setTimeout(() => {
                announce(
                  `Quiz for ${lessonTitle}. ${questionsData.questions.length} questions.`,
                  'polite'
                );
              }, 300);
            }
          } else {
            setPhase('error');
            setErrorMessage('This quiz has no questions yet.');
          }
        } catch (e) {
          if (!cancelled) {
            setPhase('error');
            setErrorMessage(
              e instanceof ApiClientError
                ? formatErrorMessage(e.message)
                : 'Could not load quiz questions.'
            );
          }
        } finally {
          if (!cancelled) setIsLoadingQuestions(false);
        }
      } catch (e) {
        if (!cancelled) {
          setPhase('error');
          setErrorMessage(
            e instanceof ApiClientError
              ? formatErrorMessage(e.message)
              : 'Could not load quizzes.'
          );
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [open, lessonContentId, lessonTitle, token, resetState, isEnabled, announce]);

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (shuffledQuestions.length > 0 && currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      if (isEnabled) playSound('navigation');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      if (isEnabled) playSound('navigation');
    }
  };

  const handleSubmitAssessment = async () => {
    if (shuffledQuestions.length === 0 || !assessment) return;

    const unanswered = shuffledQuestions.filter((q) => !answers[q.id] || answers[q.id].trim() === '');
    if (unanswered.length > 0) {
      showErrorToast(`Please answer all ${shuffledQuestions.length} questions.`);
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
        lesson_id: assessment.id,
        solution: formattedSolution,
      };

      await submitSolution(submitData, token);
      localStorage.setItem(`assessment_completed_${assessment.id}`, 'true');
      showSuccessToast('Quiz submitted! Great job.');
      if (isEnabled) announce('Quiz submitted successfully.', 'polite');
      onClose();
      resetState();
    } catch (error) {
      const msg =
        error instanceof ApiClientError
          ? formatErrorMessage(error.message)
          : 'Failed to submit quiz.';
      showErrorToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const totalQuestions = shuffledQuestions.length;
  const answeredCount = shuffledQuestions.filter(
    (q) => answers[q.id] && answers[q.id].trim() !== ''
  ).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center p-0 sm:p-3 md:p-4 lg:p-6 bg-slate-900/65 backdrop-blur-md overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-quiz-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="flex flex-col bg-white w-full h-[100svh] max-h-[100svh] min-h-0 sm:h-auto sm:max-h-[min(96dvh,52rem)] md:max-h-[min(96dvh,56rem)] lg:max-h-[min(96dvh,60rem)] xl:max-h-[min(96dvh,64rem)] landscape:max-h-[100dvh] landscape:sm:max-h-[min(92dvh,48rem)] sm:rounded-[1.75rem] md:rounded-[2rem] shadow-2xl overflow-hidden border-0 sm:border-2 border-violet-200/40 sm:max-w-[min(100%,42rem)] md:max-w-[min(100%,48rem)] lg:max-w-[min(100%,56rem)] xl:max-w-[min(100%,72rem)] 2xl:max-w-[min(100%,80rem)] sm:mx-auto touch-manipulation [touch-action:manipulation]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 text-white px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-5 sm:px-6 sm:py-5 md:px-8 md:py-6 landscape:py-3 landscape:sm:py-4 flex flex-col min-[420px]:flex-row min-[420px]:items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/85">Your quiz</p>
            <h2
              id="lesson-quiz-title"
              className="text-xl sm:text-2xl md:text-3xl font-extrabold leading-tight mt-1 line-clamp-2 landscape:line-clamp-1 landscape:sm:line-clamp-2"
              style={{ fontFamily: 'Andika, sans-serif' }}
            >
              {assessmentData?.assessment.title || lessonTitle}
            </h2>
            {assessment ? (
              <p className="text-sm sm:text-base text-white/90 mt-2 leading-snug max-w-2xl landscape:hidden sm:landscape:block" style={{ fontFamily: 'Andika, sans-serif' }}>
                {assessment.marks} marks · Big, easy-to-read questions — tap your answer below
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              if (!isSubmitting) onClose();
            }}
            className="self-end min-[420px]:self-auto shrink-0 min-h-[48px] min-w-[48px] sm:min-h-[52px] sm:min-w-[52px] rounded-2xl flex items-center justify-center text-white hover:bg-white/20 active:bg-white/25 transition-colors"
            aria-label="Close quiz"
          >
            <Icon icon="mdi:close" className="w-8 h-8 sm:w-9 sm:h-9" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] scroll-smooth">
          {phase === 'loading' || (phase === 'ready' && isLoadingQuestions) ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-5 sm:px-8">
              <Spinner size="lg" />
              <p className="mt-5 text-gray-600 text-base sm:text-lg text-center" style={{ fontFamily: 'Andika, sans-serif' }}>
                Loading your quiz…
              </p>
            </div>
          ) : phase === 'error' ? (
            <div className="p-5 sm:p-8 md:p-10 text-center px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center mb-5">
                <Icon icon="mdi:information-outline" className="w-10 h-10 sm:w-12 sm:h-12 text-amber-700" />
              </div>
              <p className="text-gray-800 font-bold text-lg sm:text-xl mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                Quiz unavailable
              </p>
              <p className="text-gray-600 text-base sm:text-lg max-w-lg mx-auto mb-8 leading-relaxed" style={{ fontFamily: 'Andika, sans-serif' }}>
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full max-w-sm mx-auto min-h-[52px] px-6 py-3 rounded-2xl bg-slate-800 text-white text-base font-semibold hover:bg-slate-900 active:scale-[0.99] transition-transform"
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                Back to lesson
              </button>
            </div>
          ) : phase === 'ready' && currentQuestion ? (
            <div className="p-4 sm:p-6 md:p-8 lg:p-10 landscape:px-4 landscape:py-3 landscape:sm:p-6 space-y-5 sm:space-y-6 md:space-y-8 landscape:space-y-3 landscape:sm:space-y-6 max-w-5xl xl:max-w-6xl mx-auto w-full">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-lg sm:text-xl md:text-2xl font-extrabold flex items-center justify-center shadow-md shrink-0"
                      style={{ fontFamily: 'Andika, sans-serif' }}
                    >
                      {currentQuestionIndex + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base md:text-lg text-gray-700 font-semibold" style={{ fontFamily: 'Andika, sans-serif' }}>
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {answeredCount} of {totalQuestions} answered
                      </p>
                    </div>
                  </div>
                  {answers[currentQuestion.id] ? (
                    <span className="text-sm sm:text-base font-semibold text-emerald-600 flex items-center gap-1.5 shrink-0" style={{ fontFamily: 'Andika, sans-serif' }}>
                      <Icon icon="mdi:check-circle" className="w-5 h-5 sm:w-6 sm:h-6" />
                      Answered
                    </span>
                  ) : null}
                </div>
                <div className="h-3 sm:h-4 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="rounded-2xl sm:rounded-3xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-violet-50/60 p-4 sm:p-6 md:p-8">
                <span
                  className="inline-block px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-white border border-indigo-100 text-indigo-800 capitalize mb-3 sm:mb-4"
                  style={{ fontFamily: 'Andika, sans-serif' }}
                >
                  {currentQuestion.type.replace(/_/g, ' ')}
                </span>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-[1.65rem] font-bold text-gray-900 leading-relaxed sm:leading-snug break-words hyphens-auto [overflow-wrap:anywhere]" style={{ fontFamily: 'Andika, sans-serif' }}>
                  {currentQuestion.question}
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options ? (
                  <div className="space-y-3" role="radiogroup">
                    {currentQuestion.options.map((option, optIndex) => {
                      const isSelected = answers[currentQuestion.id] === option.value;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => handleAnswerChange(currentQuestion.id, option.value)}
                          className={`w-full text-left min-h-[56px] sm:min-h-[60px] md:min-h-[4.5rem] p-4 sm:p-5 md:p-6 rounded-2xl border-[3px] transition-all active:scale-[0.99] ${
                            isSelected
                              ? 'border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg ring-2 ring-violet-300 ring-offset-0 sm:ring-offset-2'
                              : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/60'
                          }`}
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                            <span
                              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full border-[3px] flex items-center justify-center text-sm sm:text-base font-extrabold shrink-0 mt-0.5 sm:mt-0 ${
                                isSelected ? 'border-white bg-white/20 text-white' : 'border-slate-300 text-slate-600 bg-white'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className="font-semibold text-base sm:text-lg md:text-xl leading-snug pt-0.5 sm:pt-0">{option.value}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : currentQuestion.type === 'TRUE_FALSE' ? (
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:gap-4" role="radiogroup">
                    {['True', 'False'].map((option) => {
                      const isSelected = answers[currentQuestion.id]?.toLowerCase() === option.toLowerCase();
                      return (
                        <button
                          key={option}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => handleAnswerChange(currentQuestion.id, option)}
                          className={`min-h-[56px] sm:min-h-[4.5rem] py-4 sm:py-6 px-4 landscape:py-3 landscape:sm:py-6 rounded-2xl border-[3px] text-lg sm:text-xl md:text-2xl font-extrabold transition-all active:scale-[0.99] ${
                            isSelected
                              ? 'border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg ring-2 ring-violet-300 ring-offset-0 sm:ring-offset-2'
                              : 'border-slate-200 bg-white hover:border-violet-300'
                          }`}
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                          {option}
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
                          className={`w-full text-left min-h-[56px] sm:min-h-[60px] p-4 sm:p-5 rounded-2xl border-[3px] text-base sm:text-lg md:text-xl font-semibold transition-all active:scale-[0.99] ${
                            isSelected
                              ? 'border-violet-500 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                              : 'border-slate-200 bg-white hover:border-violet-300'
                          }`}
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                          {option.value}
                        </button>
                      );
                    })}
                  </div>
                ) : currentQuestion.type === 'SHORT_ANSWER' ? (
                  <input
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer…"
                    className="w-full min-h-[56px] px-4 sm:px-5 py-4 border-[3px] border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-200 focus:border-violet-500 text-base sm:text-lg md:text-xl"
                    style={{ fontFamily: 'Andika, sans-serif' }}
                  />
                ) : currentQuestion.type === 'ESSAY' ? (
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Write your answer…"
                    rows={6}
                    className="w-full min-h-[12rem] sm:min-h-[14rem] landscape:min-h-[8rem] landscape:sm:min-h-[12rem] px-4 sm:px-5 py-4 border-[3px] border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-violet-200 focus:border-violet-500 text-base sm:text-lg leading-relaxed resize-y"
                    style={{ fontFamily: 'Andika, sans-serif' }}
                  />
                ) : null}
              </div>

              <div className="flex flex-col gap-4 pt-4 sm:pt-6 border-t-2 border-slate-100">
                {totalQuestions > 1 ? (
                  <div className="w-full">
                    <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-2 text-center sm:text-left" style={{ fontFamily: 'Andika, sans-serif' }}>
                      Jump to question (swipe sideways on phone)
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:flex-wrap sm:justify-center sm:overflow-x-visible snap-x snap-mandatory [scrollbar-width:thin]">
                      {shuffledQuestions.map((q, index) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`snap-center shrink-0 min-w-[44px] h-11 sm:min-w-[48px] sm:h-12 rounded-xl text-sm sm:text-base font-extrabold transition-all ${
                            index === currentQuestionIndex
                              ? 'bg-violet-600 text-white shadow-md scale-105 ring-2 ring-violet-300'
                              : answers[q.id]
                                ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
                          }`}
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="w-full sm:flex-1 sm:min-w-0 sm:max-w-none min-h-[52px] landscape:min-h-[48px] px-6 py-3 rounded-2xl bg-slate-100 text-slate-800 text-base sm:text-lg font-bold disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.99]"
                    style={{ fontFamily: 'Andika, sans-serif' }}
                  >
                    <Icon icon="mdi:arrow-left" className="w-5 h-5 sm:w-6 sm:h-6" />
                    Back
                  </button>

                  {currentQuestionIndex < totalQuestions - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="w-full sm:flex-1 sm:min-w-0 min-h-[52px] landscape:min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-base sm:text-lg font-bold flex items-center justify-center gap-2 shadow-lg active:scale-[0.99]"
                      style={{ fontFamily: 'Andika, sans-serif' }}
                    >
                      Next
                      <Icon icon="mdi:arrow-right" className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitAssessment}
                      disabled={isSubmitting || answeredCount !== totalQuestions}
                      className="w-full sm:flex-1 sm:min-w-0 min-h-[52px] landscape:min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-base sm:text-lg font-extrabold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg active:scale-[0.99]"
                      style={{ fontFamily: 'Andika, sans-serif' }}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" className="text-white" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Icon icon="mdi:send" className="w-5 h-5 sm:w-6 sm:h-6" />
                          Submit quiz
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
