'use client';

import Card from '@/components/ui/Card';
import { Icon } from '@iconify/react';
import Image from 'next/image';

interface WelcomeBannerProps {
  userName?: string;
  message?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export default function WelcomeBanner({
  userName = 'John',
  message = 'Continue your learning journey. You have 3 assignments due this week.',
  buttonText = 'View Assignments',
  onButtonClick
}: WelcomeBannerProps) {
  return (
  <div className="bg-gradient-to-r from-[#1E40AF] to-[#059669] rounded-lg p-4 sm:p-6 text-white relative overflow-hidden w-full h-auto lg:w-[910px] lg:h-[194px] lg:mr-[112px]">
    {/* Banner Image - Hidden on mobile, visible on desktop */}
    <div className="hidden lg:block absolute right-4 top-4">
      <Image
        src="/bannerImg.png"
        alt="Students studying"
        width={137}
        height={126}
        className="object-cover"
      />
    </div>
    
    <div className="relative z-10 lg:pr-[180px]">
        <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
          Welcome back, {userName}!
        </h1>
        <p className="text-sm opacity-90 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
          {message}
        </p>
        <button
          onClick={onButtonClick}
          className="bg-white text-[#1E40AF] font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          style={{ fontFamily: 'Andika, sans-serif' }}
        >
          {buttonText}
        </button>
      </div>
      
      {/* Decorative illustration */}
      <div className="absolute right-3 top-3 opacity-20">
        <Icon icon="material-symbols:school" className="w-12 h-12 sm:w-16 sm:h-16" />
      </div>
    </div>
  );
}
