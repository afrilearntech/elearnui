'use client';

import { Icon } from '@iconify/react';

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: string;
  illustration?: 'default' | 'construction' | 'rocket' | 'star' | 'magic';
}

export default function ComingSoon({ 
  title = 'Coming Soon!',
  description = 'We\'re working hard to bring you something amazing. Check back soon!',
  icon,
  illustration = 'default'
}: ComingSoonProps) {
  const illustrations = {
    default: 'mdi:rocket-launch',
    construction: 'mdi:hammer-wrench',
    rocket: 'mdi:rocket-launch',
    star: 'mdi:star-outline',
    magic: 'mdi:magic-staff'
  };

  const illustrationIcon = icon || illustrations[illustration];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-8 sm:p-12 shadow-2xl">
              <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                <Icon 
                  icon={illustrationIcon} 
                  className="w-full h-full"
                  style={{ 
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 
          className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {title}
        </h1>

        {/* Description */}
        <p 
          className="text-lg sm:text-xl text-gray-600 mb-8 max-w-md mx-auto"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {description}
        </p>

        {/* Decorative Elements */}
        <div className="flex justify-center gap-2 mt-8">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}

