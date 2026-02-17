'use client';

import Card from '@/components/ui/Card';
import { Icon } from '@iconify/react';

interface StatItem {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
}

interface StatsCardProps {
  title: string;
  stats: StatItem[];
}

export default function StatsCard({ title, stats }: StatsCardProps) {
  return (
    <Card className="w-full lg:w-[280px] h-auto lg:h-[222px] lg:ml-[112px]">
      <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
        {title}
      </h3>
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                stat.color || 'bg-blue-100'
              }`}>
                <Icon 
                  icon={stat.icon} 
                  className={`w-4 h-4 ${
                    stat.color === 'bg-green-100' ? 'text-green-600' :
                    stat.color === 'bg-yellow-100' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} 
                />
              </div>
              <span className="text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                {stat.label}
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
