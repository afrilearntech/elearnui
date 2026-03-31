'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { getElementarySubjectsAndLessons } from '@/lib/api/dashboard';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import StudentLoadingScreen from '@/components/ui/StudentLoadingScreen';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { usePageAccessibility } from '@/hooks/usePageAccessibility';
import { studentQueryKeys } from '@/lib/student/queryKeys';
import { useStudentAuthReady } from '@/hooks/student/useStudentAuthReady';

type SubjectMediaTab = 'video' | 'audio' | 'file';

function LessonThumbnail({ 
  thumbnail, 
  fallbackSrc, 
  alt 
}: { 
  thumbnail: string | null; 
  fallbackSrc: string; 
  alt: string;
}) {
  const [imgSrc, setImgSrc] = useState(thumbnail || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (thumbnail) {
      setImgSrc(thumbnail);
      setHasError(false);
    } else {
      setImgSrc(fallbackSrc);
    }
  }, [thumbnail, fallbackSrc]);

  const handleError = () => {
    if (!hasError && thumbnail) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <Image 
      src={imgSrc} 
      alt={alt} 
      fill 
      className="object-cover"
      unoptimized={hasError || !thumbnail}
      onError={handleError}
    />
  );
}

const borderColors = [
  'border-[#60A5FA]',
  'border-[#F472B6]',
  'border-[#34D399]',
  'border-[#A78BFA]',
  'border-[#FB923C]',
  'border-[#22D3EE]',
];

const playColors = [
  '#3B82F6',
  '#EC4899',
  '#16A34A',
  '#A855F7',
  '#F59E0B',
  '#10B981',
];

const gradeImages = [
  '/grade1.png',
  '/grade2.png',
  '/grade3.png',
  '/grade4.png',
  '/grade5.png',
  '/grade6.png',
];

function getFallbackImage(index: number): string {
  return gradeImages[index % gradeImages.length];
}

function getBorderColor(index: number): string {
  return borderColors[index % borderColors.length];
}

function getPlayColor(index: number): string {
  return playColors[index % playColors.length];
}

function getLessonTypeInfo(type: string | undefined) {
  const normalizedType = type?.toUpperCase()?.trim() || '';
  
  // Exact match first for better accuracy
  if (normalizedType === 'VIDEO') {
    return {
      label: 'VIDEO',
      icon: 'mdi:play-circle',
      color: 'bg-red-500',
      textColor: 'text-white',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      action: 'Watch'
    };
  } else if (normalizedType === 'AUDIO') {
    return {
      label: 'AUDIO',
      icon: 'mdi:headphones',
      color: 'bg-purple-500',
      textColor: 'text-white',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      action: 'Listen'
    };
  } else if (normalizedType === 'PDF') {
    return {
      label: 'PDF',
      icon: 'mdi:file-pdf-box',
      color: 'bg-red-600',
      textColor: 'text-white',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      action: 'Read'
    };
  } else if (normalizedType === 'PPT' || normalizedType === 'POWERPOINT') {
    return {
      label: 'PPT',
      icon: 'mdi:file-powerpoint-box',
      color: 'bg-orange-500',
      textColor: 'text-white',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      action: 'View'
    };
  } else if (normalizedType === 'DOC' || normalizedType === 'DOCX' || normalizedType === 'DOCUMENT') {
    return {
      label: 'DOC',
      icon: 'mdi:file-word-box',
      color: 'bg-blue-600',
      textColor: 'text-white',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      action: 'Read'
    };
  }
  
  // Default fallback
  return {
    label: 'LESSON',
    icon: 'mdi:book-open-variant',
    color: 'bg-blue-500',
    textColor: 'text-white',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    action: 'Learn'
  };
}

function getMediaGroup(type: string | undefined): SubjectMediaTab {
  const normalizedType = type?.toUpperCase()?.trim() || '';
  if (normalizedType === 'VIDEO') return 'video';
  if (normalizedType === 'AUDIO') return 'audio';
  return 'file';
}

function getMediaTabLabel(tab: SubjectMediaTab): string {
  if (tab === 'video') return 'Videos';
  if (tab === 'audio') return 'Audios';
  return 'Files';
}

function getMediaTabEmptyMessage(tab: SubjectMediaTab): string {
  if (tab === 'video') return 'No videos yet for this subject.';
  if (tab === 'audio') return 'No audios yet for this subject.';
  return 'No files yet for this subject.';
}

function getLessonProgressState(lesson: any) {
  const unlockExpiresAt =
    lesson.manual_unlock_expires_at ||
    lesson.unlock_expires_at ||
    lesson.unlocked_expires_at ||
    lesson.expires_at ||
    null;

  const hasTeacherUnlockMarker =
    Boolean(unlockExpiresAt) ||
    Boolean(lesson.unlocked_by_id) ||
    (typeof lesson.lock_reason === 'string' && /teacher|temporary|unlocked/i.test(lesson.lock_reason));

  const isCompleted =
    Boolean(lesson.is_completed) ||
    lesson.progression_status === 'completed' ||
    lesson.status === 'taken';

  const isAvailable =
    isCompleted ||
    lesson.progression_status === 'available' ||
    !lesson.is_locked;

  const isLocked = !isAvailable;
  const isTeacherUnlocked = !isCompleted && isAvailable && hasTeacherUnlockMarker;

  const lockReason =
    lesson.lock_reason ||
    'Finish the current lesson first to unlock this one.';

  const availabilityReason = isTeacherUnlocked
    ? unlockExpiresAt
      ? `Opened by your teacher until ${new Date(unlockExpiresAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}.`
      : 'Opened by your teacher for extra practice.'
    : '';

  return {
    isCompleted,
    isAvailable,
    isLocked,
    isTeacherUnlocked,
    lockReason,
    availabilityReason,
  };
}

export default function SubjectsLessonsPage() {
  const { isEnabled, announce } = useAccessibility();
  const authReady = useStudentAuthReady();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const subjectInitRef = useRef(false);
  const { data, isPending, isError, error } = useQuery({
    queryKey: studentQueryKeys.subjectsLessons,
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Missing auth token');
      return getElementarySubjectsAndLessons(token);
    },
    enabled: authReady,
  });

  const subjects = data?.subjects ?? [];
  const lessons = useMemo(
    () =>
      (data?.lessons || []).map((lesson) => ({
        ...lesson,
        id: lesson.id,
        title: lesson.title,
        subject_id: lesson.subject_id,
        subject_name: lesson.subject_name || `Subject ${lesson.subject_id}`,
        type: lesson.resource_type || 'VIDEO',
        resource_type: lesson.resource_type || 'VIDEO',
      })),
    [data?.lessons],
  );

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedMediaTab, setSelectedMediaTab] = useState<SubjectMediaTab>('video');
  const [searchQuery, setSearchQuery] = useState('');
  const lastA11yAnnouncementRef = useRef<number>(0);

  const announceWithDebounce = useCallback((message: string) => {
    if (!isEnabled) return;
    const now = Date.now();
    if (now - lastA11yAnnouncementRef.current < 700) return;
    lastA11yAnnouncementRef.current = now;
    announce(message, 'polite');
  }, [isEnabled, announce]);

  useEffect(() => {
    if (!subjects.length || subjectInitRef.current) return;
    subjectInitRef.current = true;
    const urlParams = new URLSearchParams(window.location.search);
    const subjectIdParam = urlParams.get('subjectId');
    if (subjectIdParam && subjects.some((s) => s.id.toString() === subjectIdParam)) {
      setSelectedSubject(subjectIdParam);
    } else {
      const firstSubject = [...subjects].sort((a, b) => a.name.localeCompare(b.name))[0];
      setSelectedSubject(firstSubject.id.toString());
    }
  }, [subjects]);

  useEffect(() => {
    if (!isError) return;
    console.error('Subjects page error:', error);
    const errorMessage = error instanceof ApiClientError
      ? error.message
      : error instanceof Error
      ? error.message
      : 'Failed to load lessons';
    showErrorToast(formatErrorMessage(errorMessage));
  }, [isError, error]);

  const isLoading = !authReady || (isPending && data === undefined);

  const handleMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMenuClose = () => setIsMobileMenuOpen(false);

  // Filter lessons based on selected subject first
  const selectedSubjectLessons = selectedSubject
    ? lessons.filter((lesson) => lesson.subject_id === parseInt(selectedSubject))
    : [];

  const videoLessons = selectedSubjectLessons.filter((lesson) => getMediaGroup(lesson.type || lesson.resource_type) === 'video');
  const audioLessons = selectedSubjectLessons.filter((lesson) => getMediaGroup(lesson.type || lesson.resource_type) === 'audio');
  const fileLessons = selectedSubjectLessons.filter((lesson) => getMediaGroup(lesson.type || lesson.resource_type) === 'file');

  const mediaTabCounts: Record<SubjectMediaTab, number> = {
    video: videoLessons.length,
    audio: audioLessons.length,
    file: fileLessons.length,
  };

  const tabLessonsMap: Record<SubjectMediaTab, any[]> = {
    video: videoLessons,
    audio: audioLessons,
    file: fileLessons,
  };

  const filteredLessons = tabLessonsMap[selectedMediaTab]
    .filter((lesson) =>
      lesson.title?.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    .sort((a, b) => {
      const seqA = typeof a.sequence_position === 'number' ? a.sequence_position : Number.MAX_SAFE_INTEGER;
      const seqB = typeof b.sequence_position === 'number' ? b.sequence_position : Number.MAX_SAFE_INTEGER;
      if (seqA !== seqB) return seqA - seqB;
      return a.id - b.id;
    });

  // Get unique subjects (deduplicate by ID to ensure correct filtering)
  const uniqueSubjects = Array.from(
    new Map(subjects.map((s) => [s.id, s])).values()
  ).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically for better UX

  useEffect(() => {
    setSearchQuery('');
  }, [selectedSubject]);

  const selectedSubjectName =
    uniqueSubjects.find((subject) => subject.id.toString() === selectedSubject)?.name || 'this subject';

  usePageAccessibility({
    pageTitle: 'Subject World',
    pageDescription: `${selectedSubjectName} selected. ${getMediaTabLabel(selectedMediaTab)} tab active with ${filteredLessons.length} lesson${filteredLessons.length === 1 ? '' : 's'}.`,
    actions: ['Choose a subject', 'Switch media tabs', 'Search lessons', 'Open an unlocked lesson'],
    autoRead: true,
    delay: 700,
  });

  if (isLoading) {
    return <StudentLoadingScreen title="Loading subjects..." subtitle="Bringing your subjects and lessons into view." />;
  }

  return (
    <div className="min-h-screen">
      <ElementaryNavbar onMenuToggle={handleMenuToggle} />

      <div className="flex">
        <ElementarySidebar activeItem="subjects" isMobileMenuOpen={isMobileMenuOpen} onMobileMenuClose={handleMenuClose} />

        <main id="main-content" role="main" className="flex-1 bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px]">
          <div className="p-4 lg:p-8">
            {/* Title Section */}
            <div className="sm:ml-8 sm:mr-8 mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-[#9333EA] mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                Subject World 🌍
              </h1>
              <p className="text-base lg:text-lg text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                Explore amazing lessons - Watch videos, listen to audio, read PDFs, and view presentations!
              </p>
            </div>

            {/* Subject Filters */}
            <div className="flex flex-wrap items-center gap-3 sm:ml-8 sm:mr-8 mb-6">
              {uniqueSubjects.map((subject) => {
                const subjectName = subject.name.toLowerCase();
                let icon = 'mdi:book-open-outline';
                
                if (subjectName.includes('math') || subjectName.includes('numeracy')) {
                  icon = 'mdi:calculator';
                } else if (subjectName.includes('science')) {
                  icon = 'mdi:flask-outline';
                } else if (subjectName.includes('reading') || subjectName.includes('literacy')) {
                  icon = 'mdi:book-open-outline';
                } else if (subjectName.includes('art')) {
                  icon = 'mdi:palette-outline';
                }

                const isSelected = selectedSubject === subject.id.toString();

                return (
                  <button
                    key={subject.id}
                    onClick={() => setSelectedSubject(subject.id.toString())}
                    aria-pressed={isSelected}
                    aria-label={`${subject.name}${isSelected ? ', selected' : ''}. Press Enter to view lessons.`}
                    onFocus={() => announceWithDebounce(`${subject.name}${isSelected ? ', selected' : ''}.`)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-[#60A5FA] text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    style={{ fontFamily: 'Andika, sans-serif' }}
                  >
                    <Icon icon={icon} width={18} height={18} />
                    {subject.name}
                  </button>
                );
              })}
            </div>

            {/* Media Type Tabs + Search */}
            <div className="sm:ml-8 sm:mr-8 mb-6 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedMediaTab('video')}
                  aria-pressed={selectedMediaTab === 'video'}
                  aria-label={`Videos tab. ${mediaTabCounts.video} item${mediaTabCounts.video === 1 ? '' : 's'}. ${selectedMediaTab === 'video' ? 'Selected.' : ''}`}
                  onFocus={() => announceWithDebounce(`Videos tab. ${mediaTabCounts.video} items.`)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                    selectedMediaTab === 'video'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-red-50'
                  }`}
                  style={{ fontFamily: 'Andika, sans-serif' }}
                >
                  <Icon icon="mdi:play-circle" width={18} height={18} />
                  Videos
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selectedMediaTab === 'video' ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {mediaTabCounts.video}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedMediaTab('audio')}
                  aria-pressed={selectedMediaTab === 'audio'}
                  aria-label={`Audios tab. ${mediaTabCounts.audio} item${mediaTabCounts.audio === 1 ? '' : 's'}. ${selectedMediaTab === 'audio' ? 'Selected.' : ''}`}
                  onFocus={() => announceWithDebounce(`Audios tab. ${mediaTabCounts.audio} items.`)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                    selectedMediaTab === 'audio'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-purple-50'
                  }`}
                  style={{ fontFamily: 'Andika, sans-serif' }}
                >
                  <Icon icon="mdi:headphones" width={18} height={18} />
                  Audios
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selectedMediaTab === 'audio' ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {mediaTabCounts.audio}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedMediaTab('file')}
                  aria-pressed={selectedMediaTab === 'file'}
                  aria-label={`Files tab. ${mediaTabCounts.file} item${mediaTabCounts.file === 1 ? '' : 's'}. ${selectedMediaTab === 'file' ? 'Selected.' : ''}`}
                  onFocus={() => announceWithDebounce(`Files tab. ${mediaTabCounts.file} items.`)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                    selectedMediaTab === 'file'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-blue-50'
                  }`}
                  style={{ fontFamily: 'Andika, sans-serif' }}
                >
                  <Icon icon="mdi:file-document-outline" width={18} height={18} />
                  Files
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selectedMediaTab === 'file' ? 'bg-white/20' : 'bg-gray-100'}`}>
                    {mediaTabCounts.file}
                  </span>
                </button>
              </div>

              <div className="max-w-md">
                <div className="relative">
                  <Icon icon="mdi:magnify" width={20} height={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label={`Search within ${getMediaTabLabel(selectedMediaTab)} for ${selectedSubjectName}`}
                    onFocus={() => announceWithDebounce(`Search ${getMediaTabLabel(selectedMediaTab).toLowerCase()} for ${selectedSubjectName}.`)}
                    placeholder={`Search ${selectedMediaTab === 'video' ? 'videos' : selectedMediaTab === 'audio' ? 'audios' : 'files'}...`}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-[#60A5FA]"
                    style={{ fontFamily: 'Andika, sans-serif' }}
                  />
                </div>
              </div>
            </div>

            {/* Grid of lesson cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6 sm:ml-8 sm:mr-8">
              {filteredLessons.length > 0 ? (
                filteredLessons.map((lesson, index) => {
                  const borderColor = getBorderColor(index);
                  const fallbackImage = getFallbackImage(index);
                  const typeInfo = getLessonTypeInfo(lesson.type || lesson.resource_type);
                  const progressState = getLessonProgressState(lesson);
                  const progressBadge = progressState.isCompleted
                    ? {
                        label: 'Completed',
                        icon: 'mdi:check-circle',
                        className: 'bg-emerald-500 text-white',
                      }
                    : progressState.isLocked
                    ? {
                        label: 'Locked',
                        icon: 'mdi:lock',
                        className: 'bg-gray-500 text-white',
                      }
                    : {
                        label: 'Ready',
                        icon: 'mdi:lock-open-variant',
                        className: 'bg-blue-500 text-white',
                      };

                  const cardContent = (
                    <>
                      {/* Thumbnail */}
                      <div className="relative h-[160px] w-full">
                        <LessonThumbnail 
                          thumbnail={lesson.thumbnail} 
                          fallbackSrc={fallbackImage}
                          alt={lesson.title}
                        />
                        <div className={`absolute inset-0 bg-linear-to-t ${progressState.isLocked ? 'from-black/60' : 'from-black/30'} to-transparent`} />

                        {/* Type Badge - Top Right */}
                        <div className={`absolute top-2 right-2 ${typeInfo.color} ${typeInfo.textColor} px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md`}>
                          <Icon icon={typeInfo.icon} width={14} height={14} />
                          <span className="text-[10px] font-semibold" style={{ fontFamily: 'Andika, sans-serif' }}>
                            {typeInfo.label}
                          </span>
                        </div>

                        {/* Progress Badge - Top Left */}
                        <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md ${progressBadge.className}`}>
                          <Icon icon={progressBadge.icon} width={14} height={14} />
                          <span className="text-[10px] font-semibold" style={{ fontFamily: 'Andika, sans-serif' }}>
                            {progressBadge.label}
                          </span>
                        </div>

                        {progressState.isTeacherUnlocked && (
                          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-indigo-600/95 text-white flex items-center gap-1.5 shadow-md">
                            <Icon icon="mdi:account-check-outline" width={13} height={13} />
                            <span className="text-[10px] font-semibold" style={{ fontFamily: 'Andika, sans-serif' }}>
                              Teacher Opened
                            </span>
                          </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`w-12 h-12 ${typeInfo.bgColor} rounded-full flex items-center justify-center shadow-lg border-2 ${typeInfo.borderColor}`}>
                            <Icon icon={progressState.isLocked ? 'mdi:lock' : typeInfo.icon} width={22} height={22} className={progressState.isLocked ? 'text-gray-500' : typeInfo.color.replace('bg-', 'text-')} />
                          </div>
                        </div>

                        {progressState.isLocked && (
                          <div className="absolute inset-0 z-10 flex items-end justify-center p-3 bg-black/55 backdrop-blur-[1.5px]">
                            <div className="w-full rounded-xl border border-white/25 bg-white/20 px-3 py-2 text-white shadow-md">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Icon icon="mdi:lock-outline" width={14} height={14} />
                                <span className="text-[11px] font-semibold" style={{ fontFamily: 'Andika, sans-serif' }}>
                                  Locked for now
                                </span>
                              </div>
                              <p className="text-[10px] leading-4 text-white/95 line-clamp-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                                {progressState.lockReason}
                              </p>
                            </div>
                          </div> 
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="text-[16px] font-semibold text-gray-900 mb-1 line-clamp-2" style={{ fontFamily: 'Andika, sans-serif' }}>{lesson.title}</h3>
                        <p className="text-[12px] text-gray-600 mb-3" style={{ fontFamily: 'Andika, sans-serif' }}>
                          {progressState.isLocked
                            ? progressState.lockReason
                            : progressState.isCompleted
                            ? 'Great job! You already completed this lesson.'
                            : progressState.isTeacherUnlocked
                            ? progressState.availabilityReason
                            : `${typeInfo.action} this lesson to unlock the next one.`}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                            {lesson.subject_name}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg ${typeInfo.bgColor} ${typeInfo.color.replace('bg-', 'text-')} font-medium`} style={{ fontFamily: 'Andika, sans-serif' }}>
                            {typeof lesson.sequence_position === 'number' ? `Lesson ${lesson.sequence_position}` : typeInfo.label}
                          </span>
                        </div>
                      </div>
                    </>
                  );

                  return (
                    progressState.isLocked ? (
                      <article
                        key={lesson.id}
                        aria-disabled="true"
                        tabIndex={0}
                        role="article"
                        aria-label={`${lesson.title}. Locked. ${progressState.lockReason}`}
                        onFocus={() => announceWithDebounce(`${lesson.title}. Locked. ${progressState.lockReason}`)}
                        className={`bg-white rounded-xl shadow-md overflow-hidden border ${borderColor} cursor-not-allowed`}
                      >
                        {cardContent}
                      </article>
                    ) : (
                      <Link
                        href={`/subjects/${lesson.id}`}
                        key={lesson.id}
                        aria-label={`${lesson.title}. ${progressState.isCompleted ? 'Completed' : 'Ready'}. ${typeInfo.action} lesson ${typeof lesson.sequence_position === 'number' ? lesson.sequence_position : ''}.`}
                        onFocus={() => announceWithDebounce(`${lesson.title}. ${progressState.isCompleted ? 'Completed' : 'Ready to open'}.`)}
                        className={`bg-white rounded-xl shadow-md overflow-hidden border ${borderColor} hover:shadow-lg transition-shadow duration-200`}
                      >
                        {cardContent}
                      </Link>
                    )
                  );
                })
              ) : (
                <div className="col-span-full">
                  <div className="bg-white/95 border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
                      <Icon
                        icon={
                          selectedMediaTab === 'video'
                            ? 'mdi:play-box-multiple-outline'
                            : selectedMediaTab === 'audio'
                            ? 'mdi:headphones-box'
                            : 'mdi:file-cabinet-outline'
                        }
                        width={34}
                        height={34}
                        className="text-[#6366F1]"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-[#4338CA] mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {getMediaTabLabel(selectedMediaTab)} for {selectedSubjectName}
                    </h3>
                    <p className="text-gray-600 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {searchQuery.trim()
                        ? `No results in ${getMediaTabLabel(selectedMediaTab)} for "${searchQuery}".`
                        : getMediaTabEmptyMessage(selectedMediaTab)}
                    </p>
                    <p className="text-sm text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {searchQuery.trim()
                        ? 'Try a shorter word, or clear the search and explore more.'
                        : 'Pick another tab or subject to continue your adventure.'}
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


