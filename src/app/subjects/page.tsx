'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { getElementarySubjectsAndLessons } from '@/lib/api/dashboard';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import Spinner from '@/components/ui/Spinner';

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

export default function SubjectsLessonsPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lessons, setLessons] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      try {
        // Fetch subjects and lessons from the elementary endpoint
        const data = await getElementarySubjectsAndLessons(token);
        
        // Use subjects directly from the API response
        const subjectsData = data.subjects || [];
        
        // Use lessons directly from the API response (they already have subject_name, subject_id, resource_type, etc.)
        const lessonsData = (data.lessons || []).map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          subject_id: lesson.subject_id,
          subject_name: lesson.subject_name || `Subject ${lesson.subject_id}`,
          type: lesson.resource_type || 'VIDEO', // Use resource_type from API
          resource_type: lesson.resource_type || 'VIDEO',
          thumbnail: lesson.thumbnail,
          resource: lesson.resource,
          grade: lesson.grade,
          status: lesson.status,
        }));
        
        setSubjects(subjectsData);
        setLessons(lessonsData);

        const urlParams = new URLSearchParams(window.location.search);
        const subjectIdParam = urlParams.get('subjectId');
        if (subjectIdParam && subjectsData.some((s: any) => s.id.toString() === subjectIdParam)) {
          setSelectedSubject(subjectIdParam);
        }
      } catch (error) {
        const errorMessage = error instanceof ApiClientError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to load lessons';
        showErrorToast(formatErrorMessage(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMenuClose = () => setIsMobileMenuOpen(false);

  // Filter lessons based on selected subject
  const filteredLessons = selectedSubject === 'all'
    ? lessons
    : lessons.filter((lesson) => lesson.subject_id === parseInt(selectedSubject));

  // Get unique subjects (deduplicate by ID to ensure correct filtering)
  const uniqueSubjects = Array.from(
    new Map(subjects.map((s) => [s.id, s])).values()
  ).sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically for better UX

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
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  selectedSubject === 'all'
                    ? 'bg-[#60A5FA] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:file-document-outline" width={18} height={18} />
                All Subjects
              </button>
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

            {/* Grid of lesson cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6 sm:ml-8 sm:mr-8">
              {filteredLessons.length > 0 ? (
                filteredLessons.map((lesson, index) => {
                  const borderColor = getBorderColor(index);
                  const playColor = getPlayColor(index);
                  const fallbackImage = getFallbackImage(index);
                  const typeInfo = getLessonTypeInfo(lesson.type || lesson.resource_type);

                  return (
                    <Link href={`/subjects/${lesson.id}`} key={lesson.id} className={`bg-white rounded-xl shadow-md overflow-hidden border ${borderColor} hover:shadow-lg transition-shadow duration-200`}>
                  {/* Thumbnail */}
                  <div className="relative h-[160px] w-full">
                        <LessonThumbnail 
                          thumbnail={lesson.thumbnail} 
                          fallbackSrc={fallbackImage}
                          alt={lesson.title}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
                        
                        {/* Type Badge - Top Right */}
                        <div className={`absolute top-2 right-2 ${typeInfo.color} ${typeInfo.textColor} px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-md`}>
                          <Icon icon={typeInfo.icon} width={14} height={14} />
                          <span className="text-[10px] font-semibold" style={{ fontFamily: 'Andika, sans-serif' }}>
                            {typeInfo.label}
                          </span>
                        </div>
                        
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-12 h-12 ${typeInfo.bgColor} rounded-full flex items-center justify-center shadow-lg border-2 ${typeInfo.borderColor}`}>
                            <Icon icon={typeInfo.icon} width={22} height={22} className={typeInfo.color.replace('bg-', 'text-')} />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                        <h3 className="text-[16px] font-semibold text-gray-900 mb-1 line-clamp-2" style={{ fontFamily: 'Andika, sans-serif' }}>{lesson.title}</h3>
                        <p className="text-[12px] text-gray-600 mb-3" style={{ fontFamily: 'Andika, sans-serif' }}>
                          {typeInfo.action} and explore with fun activities
                        </p>
                    <div className="flex items-center justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>{lesson.subject_name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg ${typeInfo.bgColor} ${typeInfo.color.replace('bg-', 'text-')} font-medium`} style={{ fontFamily: 'Andika, sans-serif' }}>
                            {typeInfo.label}
                          </span>
                    </div>
                  </div>
                </Link>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                    No lessons available. {selectedSubject !== 'all' ? 'Try selecting a different subject.' : 'Check back later for new lessons!'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


