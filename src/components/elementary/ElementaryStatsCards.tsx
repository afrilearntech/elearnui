'use client';

import Image from 'next/image';
import Card from '@/components/ui/Card';

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  iconSize: { width: number; height: number };
  bgColor: string;
  bgClass?: string; // optional full background class e.g., gradient
  iconBgColor: string;
}

interface ElementaryStatsCardsProps {
  stats?: StatCard[];
}

export default function ElementaryStatsCards({ 
  stats = [
    {
      title: 'Lessons Completed',
      value: 24,
      icon: '/correct.png',
      iconSize: { width: 20, height: 20 },
      bgColor: 'bg-blue-50',
      bgClass: 'bg-gradient-to-r from-[#60A5FA] to-[#2563EB]',
      iconBgColor: 'bg-blue-100'
    },
    {
      title: 'Stars Earned',
      value: '1,250',
      icon: '/star.png',
      iconSize: { width: 20, height: 20 },
      bgColor: 'bg-orange-50',
      bgClass: 'bg-gradient-to-r from-[#FACC15] to-[#F97316]',
      iconBgColor: 'bg-orange-100'
    },
    {
      title: 'Day Streak',
      value: 7,
      icon: '/streak.png',
      iconSize: { width: 31, height: 40 },
      bgColor: 'bg-green-50',
      bgClass: 'bg-gradient-to-r from-[#4ADE80] to-[#16A34A]',
      iconBgColor: 'bg-green-100'
    },
    {
      title: 'Current Level',
      value: 'Grade 2',
      icon: '/trophy.png',
      iconSize: { width: 40, height: 40 },
      bgColor: 'bg-purple-50',
      bgClass: 'bg-gradient-to-r from-[#C084FC] to-[#9333EA]',
      iconBgColor: 'bg-purple-100'
    }
  ]
}: ElementaryStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-[24px] mt-8 w-full">
      {stats.map((stat, index) => (
        <Card key={index} className={`${stat.bgClass || stat.bgColor} border-0 shadow-md w-full min-w-0 h-auto lg:h-[108px] rounded-4xl overflow-hidden`} padding="md">
          <div className="flex items-start justify-between h-full gap-2">
            <div className="flex-1 min-w-0">
              <h3 
                className={index <= 3 ? 'mb-2 truncate' : 'text-sm lg:text-base text-gray-600 mb-2 truncate'}
                style={{ 
                  fontFamily: 'Andika, sans-serif',
                  ...(index === 0 && { fontSize: '14px', color: '#DBEAFE' }),
                  ...(index === 1 && { fontSize: '14px', color: '#FEF9C3' }),
                  ...(index === 2 && { fontSize: '14px', color: '#DCFCE7' }),
                  ...(index === 3 && { fontSize: '14px', color: '#F3E8FF' })
                }}
              >
                {stat.title}
              </h3>
              <p 
                className={index <= 3 ? 'truncate' : 'text-2xl lg:text-3xl font-bold text-gray-900 truncate'}
                style={{ 
                  fontFamily: 'Andika, sans-serif',
                  ...(index === 0 && { fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 'bold', color: '#FFFFFF' }),
                  ...(index === 1 && { fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 'bold', color: '#FFFFFF' }),
                  ...(index === 2 && { fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 'bold', color: '#FFFFFF' }),
                  ...(index === 3 && { fontSize: 'clamp(18px, 3.5vw, 24px)', fontWeight: 'bold', color: '#FFFFFF' })
                }}
              >
                {stat.value}
              </p>
            </div>
            {index === 0 ? (
              <Image
                src={stat.icon}
                alt={stat.title}
                width={36}
                height={40}
                className="object-contain shrink-0 w-9 h-10"
              />
            ) : index === 1 ? (
              <Image
                src={stat.icon}
                alt={stat.title}
                width={40}
                height={40}
                className="object-contain shrink-0 w-10 h-10"
              />
            ) : index === 2 ? (
              <Image
                src={stat.icon}
                alt={stat.title}
                width={31}
                height={40}
                className="object-contain shrink-0 w-8 h-10"
              />
            ) : index === 3 ? (
              <Image
                src={stat.icon}
                alt={stat.title}
                width={40}
                height={40}
                className="object-contain shrink-0 w-10 h-10"
              />
            ) : (
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg ${stat.iconBgColor} flex items-center justify-center shrink-0`}>
                <Image
                  src={stat.icon}
                  alt={stat.title}
                  width={stat.iconSize.width}
                  height={stat.iconSize.height}
                  className="object-contain"
                />
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

