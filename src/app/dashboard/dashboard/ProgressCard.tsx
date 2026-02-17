'use client';

import Card from '@/components/ui/Card';
import { Icon } from '@iconify/react';

interface ProgressCardProps {
  title: string;
  subtitle?: string;
  progress: number;
  timeLeft?: string;
  icon: string;
  iconColor?: string;
  progressColor?: string;
}

export default function ProgressCard({
  title,
  subtitle,
  progress,
  timeLeft,
  icon,
  iconColor = 'bg-blue-100',
  progressColor = 'bg-blue-500'
}: ProgressCardProps) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center`}>
          <Icon 
            icon={icon} 
            className={`w-5 h-5 ${
              iconColor === 'bg-green-100' ? 'text-green-600' :
              iconColor === 'bg-purple-100' ? 'text-purple-600' :
              iconColor === 'bg-red-100' ? 'text-red-600' :
              'text-blue-600'
            }`} 
          />
        </div>
      </div>
      
      <h4 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
        {title}
      </h4>
      
      {subtitle && (
        <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Andika, sans-serif' }}>
          {subtitle}
        </p>
      )}
      
      {timeLeft && (
        <div className="flex items-center space-x-2 mb-3">
          <Icon icon="material-symbols:schedule" className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
            {timeLeft}
          </span>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
            Progress
          </span>
          <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
            {progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${progressColor}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </Card>
  );
}
