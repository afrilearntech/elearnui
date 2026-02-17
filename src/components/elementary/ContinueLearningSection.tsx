'use client';

import Image from 'next/image';

interface LearningModule {
  title: string;
  subtitle: string;
  icon: string;
  iconSize: { width: number; height: number };
  bgColor: string;
  iconBgColor: string;
}

interface ContinueLearningSectionProps {
  modules?: LearningModule[];
}

export default function ContinueLearningSection({
  modules = [
    {
      title: 'Math Adventures',
      subtitle: 'Addition & Subtraction',
      icon: '/apple.png',
      iconSize: { width: 24, height: 24 },
      bgColor: 'bg-red-50',
      iconBgColor: 'bg-red-100'
    },
    {
      title: 'Reading Quest',
      subtitle: 'Phonics & Words',
      icon: '/book.png',
      iconSize: { width: 24, height: 24 },
      bgColor: 'bg-blue-50',
      iconBgColor: 'bg-blue-100'
    }
  ]
}: ContinueLearningSectionProps) {
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
          Continue Learning
        </h2>
        <div className="space-y-4">
          {modules && modules.length > 0 ? (
            modules.map((module, index) => {
            const cardBgClass = index === 0
              ? 'bg-linear-to-r from-[#FEE2E2] to-[#FECACA]'
              : index === 1
              ? 'bg-linear-to-r from-[#DBEAFE] to-[#BFDBFE]'
              : module.bgColor;

            return (
              <div key={index} className={`${cardBgClass} rounded-lg p-4 w-full max-w-full h-auto lg:h-[80px]`}>
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center space-x-4">
                    <div className={`${index === 0 ? 'w-12 h-12 rounded-full bg-[#F87171]' : index === 1 ? 'w-12 h-12 rounded-full bg-[#60A5FA]' : 'w-14 h-14 lg:w-16 lg:h-16 rounded-lg ' + module.iconBgColor} flex items-center justify-center shrink-0`}>
                      <Image
                        src={index === 0 ? '/apple.png' : index === 1 ? '/whitebook.png' : module.icon}
                        alt={module.title}
                        width={index === 0 ? 14 : index === 1 ? 18 : module.iconSize.width}
                        height={index === 0 ? 24 : index === 1 ? 16 : module.iconSize.height}
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {module.title}
                      </h3>
                      <p className="text-sm lg:text-base text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {module.subtitle}
                      </p>
                    </div>
                  </div>
                  {index === 0 ? (
                    <div className="w-[48px] h-[8px] rounded-full bg-[#F87171] shrink-0"></div>
                  ) : index === 1 ? (
                    <div className="w-[32px] h-[8px] rounded-full bg-[#60A5FA] shrink-0"></div>
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${module.iconBgColor.replace('100', '400')} shrink-0`}></div>
                  )}
                </div>
              </div>
            );
          })) : (
            <div className="text-center py-8">
              <p className="text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                No courses available. Start learning to see your progress here!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

