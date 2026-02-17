import Image from 'next/image';

interface LearningJourneyBannerProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onButtonClick?: () => void;
}

export function LearningJourneyBanner({
  title = 'My Learning Journey',
  description = 'Track your progress across all courses and stay on top of your learning goals.',
  buttonText = 'Explore Courses',
  onButtonClick
}: LearningJourneyBannerProps) {
  return (
    <div className="bg-gradient-to-r from-[#1E40AF] to-[#059669] rounded-lg p-6 sm:p-8 text-white relative overflow-hidden w-full h-auto lg:h-[200px]">
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
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
          {title}
        </h1>
        <p className="text-sm sm:text-base opacity-90 mb-6" style={{ fontFamily: 'Andika, sans-serif' }}>
          {description}
        </p>
        <button
          onClick={onButtonClick}
          className="bg-white text-[#1E40AF] px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          style={{ fontFamily: 'Andika, sans-serif' }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
