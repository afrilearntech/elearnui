'use client';

import Card from '@/components/ui/Card';
import { Icon } from '@iconify/react';

interface ActivityItem {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  timestamp: string;
  points?: number;
  iconColor?: string;
}

interface ActivityFeedProps {
  title: string;
  activities: ActivityItem[];
}

export default function ActivityFeed({ title, activities }: ActivityFeedProps) {
  return (
    <Card className="w-full lg:w-[904px] h-auto lg:h-[294px]">
      <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
        {title}
      </h3>
      <div className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              activity.iconColor || 'bg-green-100'
            }`}>
              <Icon 
                icon={activity.icon} 
                className={`w-4 h-4 ${
                  activity.iconColor === 'bg-blue-100' ? 'text-blue-600' :
                  activity.iconColor === 'bg-yellow-100' ? 'text-yellow-600' :
                  activity.iconColor === 'bg-purple-100' ? 'text-purple-600' :
                  'text-green-600'
                }`} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                {activity.title}
              </p>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                  {activity.subtitle ? `${activity.subtitle} • ${activity.timestamp}` : activity.timestamp}
              </p>
            </div>
            {activity.points && (
              <span className="text-xs font-semibold text-green-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                +{activity.points} points
              </span>
            )}
          </div>
          ))
        ) : (
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
            No recent activities
          </p>
        )}
      </div>
    </Card>
  );
}
