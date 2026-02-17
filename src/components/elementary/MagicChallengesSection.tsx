'use client';

import Image from 'next/image';

interface Challenge {
  title: string;
  icon: string;
  iconSize: { width: number; height: number };
  iconBgColor: string;
  stars: number; // 1-3 stars
}

interface MagicChallengesSectionProps {
  challenges?: Challenge[];
}

export default function MagicChallengesSection({
  challenges = [
    {
      title: 'Complete 3 lessons',
      icon: '/pencil.png',
      iconSize: { width: 20, height: 20 },
      iconBgColor: 'bg-purple-100',
      stars: 2
    },
    {
      title: 'Play 2 learning games',
      icon: '/game-controller.png',
      iconSize: { width: 20, height: 20 },
      iconBgColor: 'bg-green-100',
      stars: 1
    },
    {
      title: 'Pass a Quiz',
      icon: '/quiz.png',
      iconSize: { width: 20, height: 20 },
      iconBgColor: 'bg-orange-100',
      stars: 0
    }
  ]
}: MagicChallengesSectionProps) {
  const renderStars = (count: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3].map((star) => (
          <svg
            key={star}
            className={`w-[18px] h-[24px] ${star <= count ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full lg:flex-1 lg:min-w-0">
      <div 
        className="bg-white rounded-lg shadow-md w-full h-auto lg:h-[322px] p-6"
        style={{ 
          border: '0.5px solid #E5E7EB',
          fontFamily: 'Andika, sans-serif'
        }}
      >
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
          Today&apos;s Magic Challenges
        </h2>
        <div className="space-y-3">
          {challenges.map((challenge, index) => (
            <div
              key={index}
              className={`${
                index === 0
                  ? 'bg-gradient-to-r from-[#F3E8FF] to-[#FCE7F3]'
                  : index === 1
                  ? 'bg-gradient-to-r from-[#DCFCE7] to-[#CCFBF1]'
                  : index === 2
                  ? 'bg-gradient-to-r from-[#FFEDD5] to-[#FEF9C3]'
                  : challenge.iconBgColor
              } rounded-lg ${index === 0 ? 'px-4 py-2 flex items-center' : 'p-4'} w-full max-w-full h-auto lg:h-[60px]`}
            >
              <div className="flex items-center justify-between w-full h-full">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg ${challenge.iconBgColor.replace('100', '200')} flex items-center justify-center shrink-0`}>
                    <Image
                      src={index === 0 ? '/magicpen.png' : index === 1 ? '/player.png' : index === 2 ? '/planter.png' : challenge.icon}
                      alt={challenge.title}
                      width={challenge.iconSize.width}
                      height={challenge.iconSize.height}
                      className="object-contain"
                    />
                  </div>
                  <h3
                    className={`${index === 0 ? 'text-[16px] font-semibold text-[#7E22CE]' : index === 1 ? 'text-[16px] font-semibold text-[#15803D]' : index === 2 ? 'text-[16px] font-semibold text-[#C2410C]' : 'text-base lg:text-lg font-medium text-gray-900'}`}
                    style={{ fontFamily: 'Andika, sans-serif' }}
                  >
                    {challenge.title}
                  </h3>
                </div>
                {renderStars(challenge.stars)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

