'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from '@/components/images/SafeImage';
import { Icon } from '@iconify/react';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { getLessonById, markLessonTaken, getAllLessons } from '@/lib/api/lessons';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import StudentLoadingScreen from '@/components/ui/StudentLoadingScreen';
import LessonQuizModal from '@/components/elementary/LessonQuizModal';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { handleSequentialSeeked, handleSequentialTimeUpdate } from '@/lib/elementary/sequentialMediaPlayback';
import { studentQueryKeys } from '@/lib/student/queryKeys';
import { useStudentAuthReady } from '@/hooks/student/useStudentAuthReady';
import { buildLessonPageBundle } from '@/lib/student/buildLessonPageBundle';

function VideoThumbnail({ 
  thumbnail, 
  fallbackSrc, 
  alt 
}: { 
  thumbnail: string | null | undefined; 
  fallbackSrc: string; 
  alt: string;
}) {
  const [useFallback, setUseFallback] = useState(!thumbnail);

  if (!thumbnail) {
    return <Image src={fallbackSrc} alt={alt} fill className="object-cover" />;
  }

  if (useFallback) {
    return <Image src={fallbackSrc} alt={alt} fill className="object-cover" />;
  }

  return (
    <Image 
      src={thumbnail} 
      alt={alt} 
      fill 
      className="object-cover"
      onError={() => setUseFallback(true)}
    />
  );
}

export default function SubjectLessonDetail() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params?.id as string;
  const authReady = useStudentAuthReady();
  const { isEnabled, announce } = useAccessibility();
  const tabInitForLessonRef = useRef<string | null>(null);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMenuClose = () => setIsMobileMenuOpen(false);
  const [activeResourceTab, setActiveResourceTab] = useState<'video' | 'audio' | 'pdf' | 'ppt' | 'doc'>('video');
  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [hasRecordedProgress, setHasRecordedProgress] = useState(false);
  const [isRecordingProgress, setIsRecordingProgress] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  const { data: lessonQueryData, isPending, isError, error } = useQuery({
    queryKey: studentQueryKeys.lessonDetail(lessonId ?? ''),
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Missing auth token');
      const [lessonData, allLessonsData] = await Promise.all([
        getLessonById(lessonId!, token),
        getAllLessons(token),
      ]);
      return { lessonData, allLessonsData };
    },
    enabled: authReady && !!lessonId,
  });

  const bundle = useMemo(() => {
    if (!lessonQueryData?.lessonData || !lessonId) return null;
    return buildLessonPageBundle(lessonQueryData.lessonData, lessonQueryData.allLessonsData, lessonId);
  }, [lessonQueryData, lessonId]);

  const lesson = bundle?.lesson ?? null;
  const availableResources = bundle?.availableResources ?? {};
  const allLessons = bundle?.allLessons ?? [];
  const nextLessonId = bundle?.nextLessonId ?? null;

  const isLoading = !authReady || (isPending && lessonQueryData === undefined);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoFurthestWatchedRef = useRef(0);
  const audioFurthestWatchedRef = useRef(0);
  const videoLastKnownTimeRef = useRef(0);
  const audioLastKnownTimeRef = useRef(0);
  const hasAnnouncedPageRef = useRef(false);
  
  const fallbackVideoSources = [
    '/__mocks__/Addition using sets.mp4',
    '/__mocks__/Addition using sets 2.mp4',
    '/__mocks__/Adjectives 2.mp4',
    '/__mocks__/Dis Joint Sets 2.mp4',
  ];
  
  const fallbackThumbnail = '/grade3.png';
  
  const thumbnailSrc = lesson?.thumbnail || fallbackThumbnail;
  
  const currentResourceSrc = availableResources[activeResourceTab] || lesson?.resource || fallbackVideoSources[0];
  
  const hasMultipleResources = Object.keys(availableResources).length > 1;
  
  const getResourceTypeInfo = (type: 'video' | 'audio' | 'pdf' | 'ppt' | 'doc') => {
    const types = {
      video: {
        label: 'VIDEO',
        icon: 'mdi:play-circle',
        headerTitle: 'Watch & Learn!',
        headerSubtitle: 'Get ready for an exciting video lesson!',
        action: 'Watch',
        color: 'from-red-500 to-pink-500',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200'
      },
      audio: {
        label: 'AUDIO',
        icon: 'mdi:headphones',
        headerTitle: 'Listen & Learn!',
        headerSubtitle: 'Get ready for an exciting audio lesson!',
        action: 'Listen',
        color: 'from-purple-500 to-indigo-500',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700',
        borderColor: 'border-purple-200'
      },
      pdf: {
        label: 'PDF',
        icon: 'mdi:file-pdf-box',
        headerTitle: 'Read & Learn!',
        headerSubtitle: 'Get ready for an exciting reading lesson!',
        action: 'Read',
        color: 'from-red-600 to-orange-500',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-300'
      },
      ppt: {
        label: 'PPT',
        icon: 'mdi:file-powerpoint-box',
        headerTitle: 'View & Learn!',
        headerSubtitle: 'Get ready for an exciting presentation!',
        action: 'View',
        color: 'from-orange-500 to-red-500',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-200'
      },
      doc: {
        label: 'DOC',
        icon: 'mdi:file-word-box',
        headerTitle: 'Read & Learn!',
        headerSubtitle: 'Get ready for an exciting document lesson!',
        action: 'Read',
        color: 'from-blue-600 to-blue-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        borderColor: 'border-blue-300'
      }
    };
    return types[type];
  };
  
  const currentTypeInfo = getResourceTypeInfo(activeResourceTab) || getResourceTypeInfo('video');

  useEffect(() => {
    hasAnnouncedPageRef.current = false;
  }, [lessonId]);

  useEffect(() => {
    videoFurthestWatchedRef.current = 0;
    audioFurthestWatchedRef.current = 0;
    videoLastKnownTimeRef.current = 0;
    audioLastKnownTimeRef.current = 0;
  }, [lessonId, availableResources.video, availableResources.audio]);

  useEffect(() => {
    // Get student ID from localStorage (stored during login)
    // This is the actual student ID, not the profile ID
    const storedStudentId = localStorage.getItem('student_id');
    if (storedStudentId) {
      try {
        const studentIdNum = parseInt(storedStudentId, 10);
        if (!isNaN(studentIdNum)) {
          setStudentId(studentIdNum);
        }
      } catch (error) {
        console.error('Failed to parse student ID from storage', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!lessonId) {
      router.push('/subjects');
    }
  }, [lessonId, router]);

  useEffect(() => {
    if (!authReady) return;
    setAuthToken(localStorage.getItem('auth_token'));
  }, [authReady]);

  useEffect(() => {
    if (!bundle?.firstResourceTab || !lessonId) return;
    if (tabInitForLessonRef.current === lessonId) return;
    tabInitForLessonRef.current = lessonId;
    setActiveResourceTab(bundle.firstResourceTab);
  }, [lessonId, bundle?.firstResourceTab]);

  useEffect(() => {
    setHasRecordedProgress(false);
  }, [lessonId]);

  useEffect(() => {
    if (!isError) return;
    console.error('Lesson page error:', error);
    const errorMessage = error instanceof ApiClientError
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Failed to load lesson';
    showErrorToast(formatErrorMessage(errorMessage));
  }, [isError, error]);

  useEffect(() => {
    if (!isEnabled || isLoading || !lesson || hasAnnouncedPageRef.current) return;

    const formatCount = Object.keys(availableResources).length;
    const message = [
      `Lesson page: ${lesson.title}.`,
      `${currentTypeInfo.label} format selected.`,
      formatCount > 1 ? `${formatCount} formats available.` : 'One learning format available.',
      'Use format buttons to switch resources.',
      'Press Escape to close an open resource.',
    ].join(' ');

    announce(message, 'polite');
    hasAnnouncedPageRef.current = true;
  }, [isEnabled, isLoading, lesson, availableResources, currentTypeInfo.label, announce]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        return;
      }

      if (isQuizOpen) {
        setIsQuizOpen(false);
        announce('Quiz closed.', 'polite');
        return;
      }

      if (isResourceOpen) {
        setIsResourceOpen(false);
        announce('Resource closed.', 'polite');
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen, isResourceOpen, isQuizOpen, announce]);

  const handleMediaProgress = async () => {
    if (
      !lesson ||
      hasRecordedProgress ||
      isRecordingProgress ||
      !studentId ||
      !authToken ||
      (activeResourceTab !== 'video' && activeResourceTab !== 'audio')
    ) {
      return;
    }

    const mediaElement = (activeResourceTab === 'video' ? videoRef.current : audioRef.current) as HTMLVideoElement | HTMLAudioElement | null;
    if (!mediaElement || !mediaElement.duration || mediaElement.duration === Infinity) {
      return;
    }

    const progress = mediaElement.currentTime / mediaElement.duration;
    if (progress >= 0.5) {
      try {
        setIsRecordingProgress(true);
        await markLessonTaken(
          {
            student: studentId,
            lesson: lesson.id,
          },
          authToken,
        );
        setHasRecordedProgress(true);
      } catch (error) {
        const errorMessage = error instanceof ApiClientError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to record lesson progress';
        showErrorToast(formatErrorMessage(errorMessage));
      } finally {
        setIsRecordingProgress(false);
      }
    }
  };

  const onVideoTimeUpdate = () => {
    const el = videoRef.current;
    if (el) handleSequentialTimeUpdate(el, videoFurthestWatchedRef, videoLastKnownTimeRef);
    void handleMediaProgress();
  };

  const onAudioTimeUpdate = () => {
    const el = audioRef.current;
    if (el) handleSequentialTimeUpdate(el, audioFurthestWatchedRef, audioLastKnownTimeRef);
    void handleMediaProgress();
  };

  const onVideoSeeked = () => {
    const el = videoRef.current;
    if (el) handleSequentialSeeked(el, videoFurthestWatchedRef, videoLastKnownTimeRef);
  };

  const onAudioSeeked = () => {
    const el = audioRef.current;
    if (el) handleSequentialSeeked(el, audioFurthestWatchedRef, audioLastKnownTimeRef);
  };

  if (isLoading) {
    return <StudentLoadingScreen title="Loading lesson..." subtitle="Preparing your lesson content and activities." />;
  }

  if (!lesson) {
    return (
      <div className="min-h-screen">
        <ElementaryNavbar onMenuToggle={handleMenuToggle} />
        <div className="flex">
          <ElementarySidebar activeItem="subjects" isMobileMenuOpen={isMobileMenuOpen} onMobileMenuClose={handleMenuClose} />
          <main id="main-content" role="main" className="flex-1 bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px]">
            <div className="p-6 lg:p-10">
              <div className="max-w-xl mx-auto bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                  <Icon icon="mdi:alert-circle-outline" width={30} height={30} className="text-red-500" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Lesson not available
                </h1>
                <p className="text-gray-600 mb-6" style={{ fontFamily: 'Andika, sans-serif' }}>
                  We could not load this lesson right now. Please go back and choose another lesson.
                </p>
                <Link
                  href="/subjects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F97316] text-white font-medium hover:opacity-90 transition-opacity"
                  style={{ fontFamily: 'Andika, sans-serif' }}
                >
                  <Icon icon="mdi:arrow-left" width={18} height={18} />
                  Back to Subjects
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ElementaryNavbar onMenuToggle={handleMenuToggle} />
      <div className="flex">
        <ElementarySidebar activeItem="subjects" isMobileMenuOpen={isMobileMenuOpen} onMobileMenuClose={handleMenuClose} />

        <main id="main-content" role="main" className="flex-1 bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px]">
          <div className="p-4 lg:p-8">
            {/* Header progress card */}
            <div className="bg-white/60 rounded-xl shadow-md px-4 sm:px-6 py-4 sm:mx-8 mx-4 h-auto lg:h-[187px] flex flex-col justify-between border" style={{ borderColor: 'rgba(59, 130, 246, 0.3)' }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-[55px] h-[60px] rounded-lg bg-linear-to-r ${currentTypeInfo.color} flex items-center justify-center`}>
                    <Icon icon={currentTypeInfo.icon} width={28} height={32} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-[25px] font-normal text-[#9333EA]" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {lesson?.title || 'Loading Lesson...'}
                      </h2>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${currentTypeInfo.bgColor} ${currentTypeInfo.textColor} border ${currentTypeInfo.borderColor}`}>
                        <Icon icon={currentTypeInfo.icon} width={14} height={14} />
                        {currentTypeInfo.label}
                      </span>
                      {hasMultipleResources && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          <Icon icon="mdi:star" width={12} height={12} />
                          {Object.keys(availableResources).length} formats
                        </span>
                      )}
                    </div>
                    <p className="text-[15px] font-normal text-[#4B5563]" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {lesson?.duration_minutes ? `Duration: ${lesson.duration_minutes} minutes` : 'Lesson Details'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {lesson?.status && (
                    <span className={`inline-flex items-center justify-center px-3 h-[34px] rounded-full text-[14px] ${
                      lesson.status === 'APPROVED' 
                        ? 'bg-[#10B981]/20 text-[#10B981]' 
                        : 'bg-yellow-500/20 text-yellow-600'
                    }`} style={{ fontFamily: 'Andika, sans-serif' }}>
                      {lesson.status}
                    </span>
                  )}
                  <Link href="/subjects" aria-label="Back to subjects list" className="w-[164px] h-[40px] rounded-full bg-[#F97316] text-white text-[14px] flex items-center justify-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                    <Icon icon="mdi:arrow-left" width={18} height={18} />
                    Back to Subjects
                  </Link>
                </div>
              </div>
              {lesson?.duration_minutes && (
              <div className="mt-3">
                <div className="h-[13px] w-full bg-gray-200 rounded-full">
                    <div className="h-[13px] rounded-full bg-linear-to-r from-[#10B981] to-[#3B82F6]" style={{ width: '100%' }}></div>
                  </div>
                  <div className="text-[12px] text-[#4B5563] mt-1 text-center" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Lesson Duration: {lesson.duration_minutes} minutes
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 mt-6 sm:mx-8 mx-4">
              <div>
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="relative overflow-hidden px-6 py-3 text-white shadow-[inset_0_-12px_24px_-8px_rgba(0,0,0,0.18)]" style={{ fontFamily: 'Andika, sans-serif' }}>
                    <div className={`absolute inset-0 bg-linear-to-r ${currentTypeInfo.color}`} aria-hidden />
                    <div className="absolute inset-0 bg-black/20 pointer-events-none" aria-hidden />
                    <div className="relative z-10 [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon icon={currentTypeInfo.icon} width={20} height={20} className="drop-shadow-sm" />
                        <div className="text-[16px] font-semibold">{currentTypeInfo.headerTitle}</div>
                      </div>
                      <div className="text-[12px] opacity-95">{currentTypeInfo.headerSubtitle}</div>
                    </div>
                  </div>
                  
                  {hasMultipleResources && (
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Lesson resource formats">
                        <span className="text-xs font-semibold text-gray-600 mr-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                          Choose Format:
                        </span>
                        {availableResources.video && (
                          <button
                            onClick={() => {
                              setActiveResourceTab('video');
                              setIsResourceOpen(true);
                            }}
                            role="tab"
                            aria-selected={activeResourceTab === 'video'}
                            aria-controls="lesson-resource-panel"
                            aria-label="Video format"
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                              activeResourceTab === 'video'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'bg-white text-red-600 border-2 border-red-200 hover:bg-red-50'
                            }`}
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          >
                            <Icon icon="mdi:play-circle" width={18} height={18} />
                            Video
                          </button>
                        )}
                        {availableResources.audio && (
                          <button
                            onClick={() => {
                              setActiveResourceTab('audio');
                              setIsResourceOpen(true);
                            }}
                            role="tab"
                            aria-selected={activeResourceTab === 'audio'}
                            aria-controls="lesson-resource-panel"
                            aria-label="Audio format"
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                              activeResourceTab === 'audio'
                                ? 'bg-purple-500 text-white shadow-md'
                                : 'bg-white text-purple-600 border-2 border-purple-200 hover:bg-purple-50'
                            }`}
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          >
                            <Icon icon="mdi:headphones" width={18} height={18} />
                            Audio
                          </button>
                        )}
                        {availableResources.pdf && (
                          <button
                            onClick={() => {
                              setActiveResourceTab('pdf');
                              setIsResourceOpen(true);
                            }}
                            role="tab"
                            aria-selected={activeResourceTab === 'pdf'}
                            aria-controls="lesson-resource-panel"
                            aria-label="PDF format"
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                              activeResourceTab === 'pdf'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-white text-red-700 border-2 border-red-300 hover:bg-red-50'
                            }`}
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          >
                            <Icon icon="mdi:file-pdf-box" width={18} height={18} />
                            PDF
                          </button>
                        )}
                        {availableResources.ppt && (
                          <button
                            onClick={() => {
                              setActiveResourceTab('ppt');
                              setIsResourceOpen(true);
                            }}
                            role="tab"
                            aria-selected={activeResourceTab === 'ppt'}
                            aria-controls="lesson-resource-panel"
                            aria-label="PowerPoint format"
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                              activeResourceTab === 'ppt'
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'bg-white text-orange-600 border-2 border-orange-200 hover:bg-orange-50'
                            }`}
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          >
                            <Icon icon="mdi:file-powerpoint-box" width={18} height={18} />
                            PPT
                          </button>
                        )}
                        {availableResources.doc && (
                          <button
                            onClick={() => {
                              setActiveResourceTab('doc');
                              setIsResourceOpen(true);
                            }}
                            role="tab"
                            aria-selected={activeResourceTab === 'doc'}
                            aria-controls="lesson-resource-panel"
                            aria-label="Document format"
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                              activeResourceTab === 'doc'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-blue-600 border-2 border-blue-300 hover:bg-blue-50'
                            }`}
                            style={{ fontFamily: 'Andika, sans-serif' }}
                          >
                            <Icon icon="mdi:file-word-box" width={18} height={18} />
                            DOC
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div id="lesson-resource-panel" role="region" aria-label={`${currentTypeInfo.label} resource panel`} className={`relative w-full bg-gray-100 ${
                    (activeResourceTab === 'pdf' || activeResourceTab === 'ppt' || activeResourceTab === 'doc') && isResourceOpen
                      ? 'h-[500px] sm:h-[600px] lg:h-[700px]' 
                      : 'h-[220px] sm:h-[320px] lg:h-[460px]'
                  }`}>
                    {isResourceOpen ? (
                      activeResourceTab === 'video' && availableResources.video ? (
                        <div className="flex h-full w-full min-h-0 flex-col">
                          <div
                            className="relative min-h-0 flex-1 select-none"
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                          >
                            <video
                              ref={videoRef}
                              className="absolute inset-0 h-full w-full object-cover"
                              src={availableResources.video}
                              controls
                              controlsList="nodownload noremoteplayback"
                              disablePictureInPicture
                              playsInline
                              draggable={false}
                              autoPlay
                              preload="metadata"
                              aria-label={`Video player for ${lesson.title}`}
                              onTimeUpdate={onVideoTimeUpdate}
                              onSeeked={onVideoSeeked}
                              onDragStart={(e) => e.preventDefault()}
                              onError={(e) => {
                                const currentSrc = (e.target as HTMLVideoElement).src;
                                if (availableResources.video && currentSrc === availableResources.video) {
                                  (e.target as HTMLVideoElement).src = fallbackVideoSources[0];
                                }
                              }}
                            />
                          </div>
                          <p className="shrink-0 border-t border-gray-200/80 bg-gray-100 px-2 py-1.5 text-center text-[11px] text-gray-600 sm:text-xs" style={{ fontFamily: 'Andika, sans-serif' }}>
                            You can pause and go back, but you can&apos;t skip ahead without watching up to that time.
                          </p>
                        </div>
                      ) : activeResourceTab === 'audio' && availableResources.audio ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
                          <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <Icon icon="mdi:headphones" width={48} height={48} className="text-white" />
                          </div>
                          <div
                            className="w-full max-w-md select-none"
                            onContextMenu={(e) => e.preventDefault()}
                            onDragStart={(e) => e.preventDefault()}
                          >
                          <audio
                            ref={audioRef}
                            className="w-full"
                            src={availableResources.audio}
                            controls
                            controlsList="nodownload noremoteplayback"
                            draggable={false}
                            autoPlay
                            preload="metadata"
                            aria-label={`Audio player for ${lesson.title}`}
                            onTimeUpdate={onAudioTimeUpdate}
                            onSeeked={onAudioSeeked}
                            onDragStart={(e) => e.preventDefault()}
                          />
                          </div>
                          <p className="text-sm text-gray-600 mt-4 text-center max-w-md" style={{ fontFamily: 'Andika, sans-serif' }}>
                            You can pause and go back, but you can&apos;t skip ahead without listening up to that time.
                          </p>
                        </div>
                      ) : activeResourceTab === 'pdf' && availableResources.pdf ? (
                        <div className="w-full h-full flex flex-col bg-gradient-to-br from-red-50 to-orange-50">
                          <div className="flex-1 min-h-0">
                            <iframe
                              src={availableResources.pdf}
                              className="w-full h-full border-0"
                              title="PDF Viewer"
                              style={{ minHeight: '500px' }}
                            />
                          </div>
                          <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row gap-3 justify-center">
                            <a
                              href={availableResources.pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                              style={{ fontFamily: 'Andika, sans-serif' }}
                            >
                              <Icon icon="mdi:open-in-new" width={18} height={18} />
                              Open in New Tab
                            </a>
                            <a
                              href={availableResources.pdf}
                              download
                              className="px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                              style={{ fontFamily: 'Andika, sans-serif' }}
                            >
                              <Icon icon="mdi:download" width={18} height={18} />
                              Download PDF
                            </a>
                          </div>
                        </div>
                      ) : activeResourceTab === 'ppt' && availableResources.ppt ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-6">
                          <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <Icon icon="mdi:file-powerpoint-box" width={48} height={48} className="text-white" />
                          </div>
                          <div className="w-full h-[400px] bg-white rounded-lg border-2 border-orange-200 flex items-center justify-center mb-4">
                            <div className="text-center">
                              <Icon icon="mdi:file-powerpoint-box" width={64} height={64} className="text-orange-500 mx-auto mb-3" />
                              <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
                                PowerPoint Presentation
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                            <a
                              href={availableResources.ppt}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                              style={{ fontFamily: 'Andika, sans-serif' }}
                            >
                              <Icon icon="mdi:open-in-new" width={18} height={18} />
                              Open Presentation
                            </a>
                            <a
                              href={availableResources.ppt}
                              download
                              className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                              style={{ fontFamily: 'Andika, sans-serif' }}
                            >
                              <Icon icon="mdi:download" width={18} height={18} />
                              Download
                            </a>
                          </div>
                        </div>
                      ) : activeResourceTab === 'doc' && availableResources.doc ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <Icon icon="mdi:file-word-box" width={48} height={48} className="text-white" />
                          </div>
                          <div className="w-full h-[400px] bg-white rounded-lg border-2 border-blue-200 flex items-center justify-center mb-4">
                            <div className="text-center">
                              <Icon icon="mdi:file-word-box" width={64} height={64} className="text-blue-600 mx-auto mb-3" />
                              <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
                                Word Document
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                            <a
                              href={availableResources.doc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                              style={{ fontFamily: 'Andika, sans-serif' }}
                            >
                              <Icon icon="mdi:open-in-new" width={18} height={18} />
                              Open Document
                            </a>
                            <a
                              href={availableResources.doc}
                              download
                              className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                              style={{ fontFamily: 'Andika, sans-serif' }}
                            >
                              <Icon icon="mdi:download" width={18} height={18} />
                              Download
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-6">
                          <div className={`w-24 h-24 ${currentTypeInfo.bgColor} rounded-full flex items-center justify-center mb-6 shadow-lg`}>
                            <Icon icon={currentTypeInfo.icon} width={48} height={48} className={currentTypeInfo.textColor} />
                          </div>
                          <p className="text-sm text-gray-600 text-center" style={{ fontFamily: 'Andika, sans-serif' }}>
                            {currentTypeInfo.label} resource not available
                          </p>
                        </div>
                      )
                    ) : (
                      <>
                        <VideoThumbnail 
                          thumbnail={lesson?.thumbnail} 
                          fallbackSrc={fallbackThumbnail}
                          alt={lesson?.title || 'Lesson thumbnail'}
                        />
                        <div
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-black/20"
                          aria-hidden
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => setIsResourceOpen(true)}
                            className={`w-16 h-16 ${currentTypeInfo.bgColor} border-2 ${currentTypeInfo.borderColor} rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2`}
                            style={{ fontFamily: 'Andika, sans-serif' }}
                            aria-label={`${currentTypeInfo.action} lesson`}
                          >
                            <Icon 
                              icon={currentTypeInfo.icon} 
                              width={32} 
                              height={32} 
                              className={currentTypeInfo.textColor}
                            />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-[15px] sm:text-[16px] font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {lesson?.title || 'Lesson Content'}
                      </h3>
                      {hasMultipleResources && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          <Icon icon="mdi:format-list-bulleted" width={12} height={12} />
                          {Object.keys(availableResources).length} Formats Available
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] sm:text-[13px] text-gray-700 mb-3" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {lesson?.description || `This is a ${currentTypeInfo.label.toLowerCase()} lesson. ${currentTypeInfo.action} the content to learn and explore!`}
                    </p>
                    {lesson?.duration_minutes && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                        <Icon icon="mdi:clock-outline" width={14} height={14} />
                        <span style={{ fontFamily: 'Andika, sans-serif' }}>
                          Duration: {lesson.duration_minutes} minutes
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-4">
                      {nextLessonId ? (
                        <button
                          onClick={() => router.push(`/subjects/${nextLessonId}`)}
                          aria-label="Open next lesson"
                          className="flex-1 h-10 rounded-lg bg-linear-to-r from-[#10B981] to-[#3B82F6] text-white text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                        <Icon icon="mdi:chevron-right-circle" /> Next Lesson
                      </button>
                      ) : (
                        <button
                          disabled
                          aria-label="You are on the last lesson"
                          className="flex-1 h-10 rounded-lg bg-gray-300 text-gray-500 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                          <Icon icon="mdi:check-circle" /> Last Lesson
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!authToken) {
                            router.push('/login');
                            return;
                          }
                          setIsQuizOpen(true);
                        }}
                        aria-label="Open lesson quiz on this page"
                        className="flex-1 h-10 rounded-lg bg-linear-to-r from-[#FB923C] to-[#EF4444] text-white text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        style={{ fontFamily: 'Andika, sans-serif' }}
                      >
                        <Icon icon="mdi:clipboard-text" /> Take Quiz
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right sidebar widgets */}
              <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="mdi:trophy" className="text-[#F59E0B]" />
                    <h4 className="text-[14px] font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>Your Badges</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['Video Master','Quiz Whiz','Fast Learner'].map((b, i) => (
                      <div key={b} className="bg-gray-50 rounded-lg h-16 flex flex-col items-center justify-center">
                        <div className={`w-8 h-8 rounded-full ${i===0?'bg-[#F59E0B]':i===1?'bg-[#3B82F6]':'bg-[#8B5CF6]'} flex items-center justify-center text-white`}>
                          <Icon icon={i===0?'mdi:star':'mdi:crown'} width={16} height={16} />
                        </div>
                        <span className="text-[10px] mt-1" style={{ fontFamily: 'Andika, sans-serif' }}>{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4">
                  <h4 className="text-[14px] font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Andika, sans-serif' }}>This Week</h4>
                  <div className="text-[10px] text-gray-600 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Lessons Completed <span className="float-right">5/8</span></div>
                  <div className="h-2 bg-gray-200 rounded-full mb-2">
                    <div className="h-2 rounded-full bg-[#3B82F6]" style={{ width: '62%' }}></div>
                  </div>
                  <div className="text-[10px] text-gray-600 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Quiz Score <span className="float-right">92%</span></div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 rounded-full bg-[#EF4444]" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4">
                  <h4 className="text-[14px] font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Andika, sans-serif' }}>Quick Actions</h4>
                  <div className="space-y-2">
                    <button className="w-full h-10 rounded-lg bg-[#F472B6] text-white text-sm flex items-center justify-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                      <Icon icon="mdi:content-save" /> Save for Later
                    </button>
                    <button className="w-full h-10 rounded-lg bg-[#3B82F6] text-white text-sm flex items-center justify-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                      <Icon icon="mdi:share" /> Share with Friends
                    </button>
                    <button className="w-full h-10 rounded-lg bg-[#8B5CF6] text-white text-sm flex items-center justify-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                      <Icon icon="mdi:help-circle" /> Ask for Help
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {lesson && authToken ? (
        <LessonQuizModal
          open={isQuizOpen}
          onClose={() => setIsQuizOpen(false)}
          lessonContentId={lesson.id}
          lessonTitle={lesson.title}
          token={authToken}
        />
      ) : null}
    </div>
  );
}


