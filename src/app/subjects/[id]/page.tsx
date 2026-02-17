'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { getLessonById, LessonDetail, markLessonTaken, getAllLessons, LessonListItem } from '@/lib/api/lessons';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import Spinner from '@/components/ui/Spinner';

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
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMenuClose = () => setIsMobileMenuOpen(false);
  const [activeResourceTab, setActiveResourceTab] = useState<'video' | 'audio' | 'pdf' | 'ppt' | 'doc'>('video');
  const [isResourceOpen, setIsResourceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [hasRecordedProgress, setHasRecordedProgress] = useState(false);
  const [isRecordingProgress, setIsRecordingProgress] = useState(false);
  const [allLessons, setAllLessons] = useState<LessonListItem[]>([]);
  const [nextLessonId, setNextLessonId] = useState<number | null>(null);
  const [availableResources, setAvailableResources] = useState<{
    video?: string;
    audio?: string;
    pdf?: string;
    ppt?: string;
    doc?: string;
  }>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
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
    const fetchLessonData = async () => {
      if (!lessonId) {
        router.push('/subjects');
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }
      setAuthToken(token);

      setIsLoading(true);
      try {
        // Fetch current lesson and all lessons in parallel
        const [lessonData, allLessonsData] = await Promise.all([
          getLessonById(lessonId, token),
          getAllLessons(token)
        ]);
        
        setLesson(lessonData);
        
        const resources: { video?: string; audio?: string; pdf?: string; ppt?: string; doc?: string } = {};
        const lessonType = lessonData.type?.toUpperCase()?.trim() || '';
        
        if (lessonData.resource) {
          if (lessonType === 'VIDEO') {
            resources.video = lessonData.resource;
          } else if (lessonType === 'AUDIO') {
            resources.audio = lessonData.resource;
          } else if (lessonType === 'PDF') {
            resources.pdf = lessonData.resource;
          } else if (lessonType === 'PPT' || lessonType === 'POWERPOINT') {
            resources.ppt = lessonData.resource;
          } else if (lessonType === 'DOC' || lessonType === 'DOCX' || lessonType === 'DOCUMENT') {
            resources.doc = lessonData.resource;
          }
        }
        
        const sameTitleLessons = allLessonsData.filter(
          l => l.status === 'APPROVED' && 
          l.title.toLowerCase().trim() === lessonData.title.toLowerCase().trim() &&
          l.id !== lessonData.id
        );
        
        sameTitleLessons.forEach(l => {
          const type = l.type?.toUpperCase()?.trim() || '';
          if (l.resource) {
            if (type === 'VIDEO' && !resources.video) resources.video = l.resource;
            else if (type === 'AUDIO' && !resources.audio) resources.audio = l.resource;
            else if (type === 'PDF' && !resources.pdf) resources.pdf = l.resource;
            else if ((type === 'PPT' || type === 'POWERPOINT') && !resources.ppt) resources.ppt = l.resource;
            else if ((type === 'DOC' || type === 'DOCX' || type === 'DOCUMENT') && !resources.doc) resources.doc = l.resource;
          }
        });
        
        setAvailableResources(resources);
        
        const firstAvailable = Object.keys(resources)[0] as 'video' | 'audio' | 'pdf' | 'ppt' | 'doc' | undefined;
        if (firstAvailable) {
          setActiveResourceTab(firstAvailable);
        }
        
        const approvedLessons = allLessonsData
          .filter(l => l.status === 'APPROVED')
          .sort((a, b) => a.id - b.id);
        
        setAllLessons(approvedLessons);
        
        const currentIndex = approvedLessons.findIndex(l => l.id === parseInt(lessonId));
        if (currentIndex >= 0 && currentIndex < approvedLessons.length - 1) {
          setNextLessonId(approvedLessons[currentIndex + 1].id);
        } else {
          setNextLessonId(null);
        }
      } catch (error) {
        const errorMessage = error instanceof ApiClientError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to load lesson';
        showErrorToast(formatErrorMessage(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonData();
  }, [lessonId, router]);

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
        <ElementarySidebar activeItem="subjects" isMobileMenuOpen={isMobileMenuOpen} onMobileMenuClose={handleMenuClose} />

        <main className="flex-1 bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px]">
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
                  <Link href="/subjects" className="w-[164px] h-[40px] rounded-full bg-[#F97316] text-white text-[14px] flex items-center justify-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
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
                  <div className={`px-6 py-3 bg-linear-to-r ${currentTypeInfo.color} text-white`} style={{ fontFamily: 'Andika, sans-serif' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon icon={currentTypeInfo.icon} width={20} height={20} />
                      <div className="text-[16px] font-semibold">{currentTypeInfo.headerTitle}</div>
                    </div>
                    <div className="text-[12px] opacity-90">{currentTypeInfo.headerSubtitle}</div>
                  </div>
                  
                  {hasMultipleResources && (
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-600 mr-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                          Choose Format:
                        </span>
                        {availableResources.video && (
                          <button
                            onClick={() => {
                              setActiveResourceTab('video');
                              setIsResourceOpen(true);
                            }}
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
                  
                  <div className={`relative w-full bg-gray-100 ${
                    (activeResourceTab === 'pdf' || activeResourceTab === 'ppt' || activeResourceTab === 'doc') && isResourceOpen
                      ? 'h-[500px] sm:h-[600px] lg:h-[700px]' 
                      : 'h-[220px] sm:h-[320px] lg:h-[460px]'
                  }`}>
                    {isResourceOpen ? (
                      activeResourceTab === 'video' && availableResources.video ? (
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          src={availableResources.video}
                          controls
                          autoPlay
                          onTimeUpdate={handleMediaProgress}
                          onError={(e) => {
                            const currentSrc = (e.target as HTMLVideoElement).src;
                            if (availableResources.video && currentSrc === availableResources.video) {
                              (e.target as HTMLVideoElement).src = fallbackVideoSources[0];
                            }
                          }}
                        />
                      ) : activeResourceTab === 'audio' && availableResources.audio ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 p-6">
                          <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <Icon icon="mdi:headphones" width={48} height={48} className="text-white" />
                          </div>
                          <audio
                            ref={audioRef}
                            className="w-full max-w-md"
                            src={availableResources.audio}
                            controls
                            autoPlay
                            onTimeUpdate={handleMediaProgress}
                          />
                          <p className="text-sm text-gray-600 mt-4 text-center" style={{ fontFamily: 'Andika, sans-serif' }}>
                            Listen to the audio lesson
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
                          className="flex-1 h-10 rounded-lg bg-linear-to-r from-[#10B981] to-[#3B82F6] text-white text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                        <Icon icon="mdi:chevron-right-circle" /> Next Lesson
                      </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 h-10 rounded-lg bg-gray-300 text-gray-500 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                          style={{ fontFamily: 'Andika, sans-serif' }}
                        >
                          <Icon icon="mdi:check-circle" /> Last Lesson
                        </button>
                      )}
                      <button
                        onClick={() => router.push('/assignments')}
                        className="flex-1 h-10 rounded-lg bg-linear-to-r from-[#FB923C] to-[#EF4444] text-white text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                        style={{ fontFamily: 'Andika, sans-serif' }}
                      >
                        <Icon icon="mdi:clipboard-text" /> Try Quiz
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
    </div>
  );
}


