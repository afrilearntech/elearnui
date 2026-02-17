import { Icon } from '@iconify/react';
import Image from 'next/image';

interface QuickStatsCardsProps {
  stats?: {
    activeCourses: number;
    avgGrade: number;
    studyTime: string;
    badgesEarned: number;
  };
}

export function QuickStatsCards({
  stats = {
    activeCourses: 6,
    avgGrade: 87,
    studyTime: '24h',
    badgesEarned: 12
  }
}: QuickStatsCardsProps) {
  const statsData = [
    {
      icon: 'mdi:file-document-outline',
      value: stats.activeCourses,
      label: 'Active Courses',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: 'mdi:chart-line',
      value: `${stats.avgGrade}%`,
      label: 'Avg Grade',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: 'mdi:clock-outline',
      value: stats.studyTime,
      label: 'Study Time',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      icon: 'mdi:trophy-outline',
      value: stats.badgesEarned,
      label: 'Badges Earned',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 w-full lg:w-[288px] h-[102px] flex items-center gap-3">
          {index === 0 ? (
            <div className={`w-[42px] h-[50px] ${stat.bgColor} rounded-lg flex items-center justify-center`}>
              <Image src="/res15.png" alt="Active Courses" width={16} height={18} />
            </div>
          ) : (
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <Icon icon={stat.icon} className={`w-5 h-5 ${stat.color}`} />
            </div>
          )}
          <div className="flex-1">
            <div className={`text-xl font-bold ${stat.color} leading-6`} style={{ fontFamily: 'Andika, sans-serif' }}>
              {stat.value}
            </div>
            <div className="text-xs text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
