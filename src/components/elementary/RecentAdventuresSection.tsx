'use client';

import Image from 'next/image';
import Card from '@/components/ui/Card';

interface Activity {
  type: string;
  description: string;
  created_at: string;
  metadata?: {
    role?: string;
    [key: string]: any;
  };
}

interface RecentAdventuresSectionProps {
  activities?: Activity[];
}

function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function getActivityIcon(type: string, index: number): { icon: string; iconBgColor: string; iconSize: { width: number; height: number } } {
  const iconMap: Record<string, { icon: string; iconBgColor: string; iconSize: { width: number; height: number } }> = {
    login: { icon: '/trophy.png', iconBgColor: 'bg-yellow-100', iconSize: { width: 20, height: 20 } },
    lesson_completed: { icon: '/trophy.png', iconBgColor: 'bg-yellow-100', iconSize: { width: 20, height: 20 } },
    game_played: { icon: '/whitep.png', iconBgColor: 'bg-green-100', iconSize: { width: 20, height: 20 } },
    quiz_passed: { icon: '/trophy.png', iconBgColor: 'bg-blue-100', iconSize: { width: 20, height: 20 } },
  };

  return iconMap[type] || { icon: '/trophy.png', iconBgColor: 'bg-gray-100', iconSize: { width: 20, height: 20 } };
}

export default function RecentAdventuresSection({
  activities = []
}: RecentAdventuresSectionProps) {
  return (
    <div className="mt-8 w-full mb-8">
      <div className="bg-white/60 rounded-lg shadow-md py-6 px-4 sm:px-8 w-full max-w-full overflow-hidden">
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
          Recent Activities
        </h2>
        <div className="space-y-3">
          {activities && activities.length > 0 ? (
            activities.map((activity, index) => {
              const activityIcon = getActivityIcon(activity.type, index);
              const timestamp = formatTimestamp(activity.created_at);
              const isFirst = index === 0;
              const isSecond = index === 1;

              return (
                <Card
                  key={index}
                  className={`${
                    isFirst
                      ? 'bg-linear-to-r from-[#FEFCE8] to-[#FEF9C3]'
                      : isSecond
                      ? 'bg-linear-to-r from-[#F0FDF4] to-[#DCFCE7]'
                      : activityIcon.iconBgColor
                  } border-0 shadow-md w-full h-[80px]`}
                  padding="md"
                >
                  <div className="flex items-center space-x-4 h-full">
                    <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg ${activityIcon.iconBgColor.replace('100', '200')} flex items-center justify-center shrink-0`}>
                      <div className={`${isFirst ? 'w-12 h-12 rounded-full bg-[#FACC15] flex items-center justify-center' : isSecond ? 'w-12 h-12 rounded-full bg-[#4ADE80] flex items-center justify-center' : ''}`}>
                        <Image
                          src={isFirst ? '/trophy.png' : isSecond ? '/whitep.png' : activityIcon.icon}
                          alt={activity.description}
                          width={isFirst ? 18 : isSecond ? 20 : activityIcon.iconSize.width}
                          height={isFirst ? 24 : isSecond ? 16 : activityIcon.iconSize.height}
                          className="object-contain"
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`${isFirst ? 'text-[16px] font-semibold text-[#A16207]' : isSecond ? 'text-[16px] font-semibold text-[#15803D]' : 'text-base lg:text-lg font-medium text-gray-900'} mb-1 truncate`}
                        style={{ fontFamily: 'Andika, sans-serif' }}
                      >
                        {activity.description}
                      </h3>
                      <p
                        className={`${isFirst ? 'text-[16px] text-[#CA8A04]' : isSecond ? 'text-[16px] text-[#16A34A]' : 'text-sm lg:text-base text-gray-600'}`}
                        style={{ fontFamily: 'Andika, sans-serif' }}
                      >
                        {timestamp}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                No recent activities. Start learning to see your progress here!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

