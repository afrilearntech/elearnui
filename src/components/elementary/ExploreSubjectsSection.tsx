'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import { getElementarySubjectsAndLessons } from '@/lib/api/dashboard';

interface Subject {
  title: string;
  subtitle: string;
  icon: string;
  iconSize: { width: number; height: number };
  bgColor: string;
  iconBgColor: string;
}

interface ExploreSubjectsSectionProps {
  subjects?: Subject[];
}

export default function ExploreSubjectsSection({
  subjects = [
    {
      title: 'Math Kingdom',
      subtitle: 'Numbers & Operations',
      icon: '/calculator.png',
      iconSize: { width: 32, height: 32 },
      bgColor: 'bg-red-500',
      iconBgColor: 'bg-white'
    },
    {
      title: 'Reading Forest',
      subtitle: 'Stories & Letters',
      icon: '/book-open.png',
      iconSize: { width: 32, height: 32 },
      bgColor: 'bg-blue-500',
      iconBgColor: 'bg-white'
    },
    {
      title: 'Science Lab',
      subtitle: 'Discover & Explore',
      icon: '/beaker.png',
      iconSize: { width: 32, height: 32 },
      bgColor: 'bg-green-500',
      iconBgColor: 'bg-white'
    }
  ]
}: ExploreSubjectsSectionProps) {
  const router = useRouter();
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      try {
        const data = await getElementarySubjectsAndLessons(token);
        setAvailableSubjects(data.subjects || []);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };

    fetchSubjects();
  }, []);

  const findSubjectId = (title: string): number | null => {
    const titleLower = title.toLowerCase();
    for (const subject of availableSubjects) {
      const subjectName = subject.name.toLowerCase();
      if (titleLower.includes('math') || titleLower.includes('kingdom')) {
        if (subjectName.includes('math') || subjectName.includes('numeracy')) {
          return subject.id;
        }
      } else if (titleLower.includes('reading') || titleLower.includes('forest')) {
        if (subjectName.includes('reading') || subjectName.includes('literacy') || subjectName.includes('english')) {
          return subject.id;
        }
      }
    }
    return null;
  };

  const handleCardClick = (index: number, title: string) => {
    if (index === 2) return;
    
    const subjectId = findSubjectId(title);
    if (subjectId) {
      router.push(`/subjects?subjectId=${subjectId}`);
    } else {
      router.push('/subjects');
    }
  };

  return (
    <div className="mt-8 w-full">
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
        Explore Magical Subjects
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
        {subjects.map((subject, index) => (
          <Card
            key={index}
            onClick={() => handleCardClick(index, subject.title)}
            className={`${
              index === 0
                ? 'bg-gradient-to-r from-[#FCA5A5] to-[#EF4444]'
                : index === 1
                ? 'bg-gradient-to-r from-[#93C5FD] to-[#3B82F6]'
                : index === 2
                ? 'bg-gradient-to-r from-[#86EFAC] to-[#22C55E]'
                : subject.bgColor
            } border-0 shadow-lg relative transition-all duration-300 ${
              index === 2 
                ? 'cursor-default' 
                : 'cursor-pointer hover:shadow-xl hover:scale-105 active:scale-100'
            }`}
            padding="lg"
          >
            {/* Coming Soon Badge for Science Lab */}
            {index === 2 && (
              <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-10 flex items-center gap-1.5 whitespace-nowrap" style={{ fontFamily: 'Andika, sans-serif' }}>
                <span>🚀</span>
                <span>Coming Soon</span>
              </div>
            )}
            
            <div className="flex flex-col items-center text-center">
              <div className={`${index === 0 || index === 1 || index === 2 ? 'w-16 h-16 rounded-full bg-white/20' : 'w-16 h-16 lg:w-20 lg:h-20 rounded-lg ' + subject.iconBgColor} flex items-center justify-center mb-4`}>
                <Image
                  src={index === 0 ? '/whitecalc.png' : index === 1 ? '/whiteb.png' : index === 2 ? '/tube.png' : subject.icon}
                  alt={subject.title}
                  width={index === 0 ? 23 : index === 1 ? 27 : index === 2 ? 27 : subject.iconSize.width}
                  height={index === 0 ? 36 : index === 1 ? 30 : index === 2 ? 30 : subject.iconSize.height}
                  className="object-contain"
                />
              </div>
              <h3 className={`${index === 0 || index === 1 || index === 2 ? 'text-[20px]' : 'text-lg lg:text-xl'} font-bold text-white mb-2`} style={{ fontFamily: 'Andika, sans-serif' }}>
                {subject.title}
              </h3>
              <p className={`${index === 0 ? 'text-[16px] text-[#FEE2E2]' : index === 1 ? 'text-[16px] text-[#DBEAFE]' : index === 2 ? 'text-[16px] text-[#DCFCE7]' : 'text-sm lg:text-base text-white/90'}`} style={{ fontFamily: 'Andika, sans-serif' }}>
                {subject.subtitle}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

