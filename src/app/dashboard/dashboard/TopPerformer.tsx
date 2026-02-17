'use client';

import Card from '@/components/ui/Card';
import { Icon } from '@iconify/react';

interface TopPerformerProps {
  show?: boolean;
  title?: string;
  subtitle?: string;
  rank?: number;
  icon?: string;
}

const motivationalMessages = [
  { title: 'Keep Going!', subtitle: 'You\'re doing great! Keep up the amazing work!' },
  { title: 'You\'ve Got This!', subtitle: 'Every step forward is progress. Keep learning!' },
  { title: 'Stay Motivated!', subtitle: 'Your dedication will lead to success!' },
  { title: 'Keep Learning!', subtitle: 'Every lesson brings you closer to your goals!' },
  { title: 'You\'re Amazing!', subtitle: 'Continue your learning journey with confidence!' }
];

export default function TopPerformer({ 
  show = false,
  title,
  subtitle,
  rank,
  icon = 'material-symbols:trophy' 
}: TopPerformerProps) {
  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
  
  let displayTitle: string;
  let displaySubtitle: string;
  
  if (show && title) {
    displayTitle = title;
    displaySubtitle = subtitle 
      ? (rank ? `Rank #${rank} • ${subtitle}` : subtitle)
      : randomMessage.subtitle;
  } else if (title) {
    displayTitle = title;
    displaySubtitle = subtitle || randomMessage.subtitle;
  } else {
    displayTitle = randomMessage.title;
    displaySubtitle = randomMessage.subtitle;
  }

  return (
    <Card className="bg-linear-to-r from-[#1E40AF] to-[#059669] text-white w-full lg:w-[280px] h-auto lg:h-[132px] lg:ml-[112px] p-3">
      <div className="text-center h-full flex flex-col justify-center">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
          <Icon icon={icon} className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
          {displayTitle}
        </h3>
        <p className="text-xs opacity-90" style={{ fontFamily: 'Andika, sans-serif' }}>
          {displaySubtitle}
        </p>
      </div>
    </Card>
  );
}
