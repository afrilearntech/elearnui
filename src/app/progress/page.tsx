'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { getProgressGarden } from '@/lib/api/dashboard';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import Spinner from '@/components/ui/Spinner';

interface Plant {
  id: number;
  name: string;
  emoji: string;
  level: number;
  progress: number;
  color: string;
  bgColor: string;
  thumbnail: string;
  unlocked: boolean;
}

const subjectEmojis: { [key: string]: string } = {
  'literacy': '📚',
  'numeracy': '🔢',
  'science': '🔬',
  'art': '🎨',
  'music': '🎵',
  'sports': '⚽',
  'english': '📖',
  'math': '➕',
  'reading': '📖',
};

const subjectColors: { [key: string]: { color: string; bgColor: string } } = {
  'literacy': { color: 'from-green-400 to-emerald-600', bgColor: 'bg-green-50' },
  'numeracy': { color: 'from-blue-400 to-cyan-600', bgColor: 'bg-blue-50' },
  'science': { color: 'from-purple-400 to-pink-600', bgColor: 'bg-purple-50' },
  'art': { color: 'from-pink-400 to-rose-600', bgColor: 'bg-pink-50' },
  'music': { color: 'from-yellow-400 to-orange-600', bgColor: 'bg-yellow-50' },
  'sports': { color: 'from-emerald-400 to-teal-600', bgColor: 'bg-emerald-50' },
  'english': { color: 'from-indigo-400 to-blue-600', bgColor: 'bg-indigo-50' },
  'math': { color: 'from-cyan-400 to-blue-600', bgColor: 'bg-cyan-50' },
  'reading': { color: 'from-green-400 to-teal-600', bgColor: 'bg-green-50' },
};

const getSubjectEmoji = (name: string): string => {
  const lowerName = name.toLowerCase();
  for (const [key, emoji] of Object.entries(subjectEmojis)) {
    if (lowerName.includes(key)) {
      return emoji;
    }
  }
  return '🌱';
};

const getSubjectColors = (name: string): { color: string; bgColor: string } => {
  const lowerName = name.toLowerCase();
  for (const [key, colors] of Object.entries(subjectColors)) {
    if (lowerName.includes(key)) {
      return colors;
    }
  }
  return { color: 'from-gray-400 to-gray-600', bgColor: 'bg-gray-50' };
};

export default function ProgressPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progressData, setProgressData] = useState<any>(null);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  useEffect(() => {
    const fetchProgressData = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      try {
        const data = await getProgressGarden(token);
        setProgressData(data);
      } catch (error) {
        const errorMessage = error instanceof ApiClientError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to load progress data';
        showErrorToast(formatErrorMessage(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgressData();
  }, [router]);

  const handleMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMenuClose = () => setIsMobileMenuOpen(false);

  const calculateLevel = (percentComplete: number): number => {
    if (percentComplete === 0) return 1;
    if (percentComplete < 20) return 1;
    if (percentComplete < 40) return 2;
    if (percentComplete < 60) return 3;
    if (percentComplete < 80) return 4;
    return 5;
  };

  const realPlants: Plant[] = (progressData?.subjects || []).map((subject: any) => {
    const level = calculateLevel(subject.percent_complete);
    const colors = getSubjectColors(subject.name);
    
    return {
      id: subject.id,
      name: subject.name,
      emoji: getSubjectEmoji(subject.name),
      level,
      progress: subject.percent_complete,
      color: colors.color,
      bgColor: colors.bgColor,
      thumbnail: subject.thumbnail,
      unlocked: true,
    };
  });

  const lockedPlants: Plant[] = [
    {
      id: 999,
      name: 'Science Lab',
      emoji: '🔬',
      level: 1,
      progress: 0,
      color: 'from-purple-400 to-pink-600',
      bgColor: 'bg-purple-50',
      thumbnail: '',
      unlocked: false,
    },
    {
      id: 998,
      name: 'Art Studio',
      emoji: '🎨',
      level: 1,
      progress: 0,
      color: 'from-pink-400 to-rose-600',
      bgColor: 'bg-pink-50',
      thumbnail: '',
      unlocked: false,
    },
    {
      id: 997,
      name: 'Music Room',
      emoji: '🎵',
      level: 1,
      progress: 0,
      color: 'from-yellow-400 to-orange-600',
      bgColor: 'bg-yellow-50',
      thumbnail: '',
      unlocked: false,
    },
    {
      id: 996,
      name: 'Sports Field',
      emoji: '⚽',
      level: 1,
      progress: 0,
      color: 'from-emerald-400 to-teal-600',
      bgColor: 'bg-emerald-50',
      thumbnail: '',
      unlocked: false,
    },
  ];

  const plants: Plant[] = [...realPlants, ...lockedPlants];

  const getPlantSize = (level: number) => {
    const sizes = ['text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl'];
    return sizes[Math.min(level - 1, 4)] || sizes[0];
  };

  const formatRank = (rankData: any): string => {
    if (rankData === null || rankData === undefined) {
      return 'Not ranked yet';
    }

    const rankValue = typeof rankData === 'number' ? rankData : rankData?.rank;
    const outOf = typeof rankData === 'number' ? null : rankData?.out_of;

    if (rankValue === null || rankValue === undefined) {
      return 'Not ranked yet';
    }

    if (outOf !== null && outOf !== undefined) {
      return `${rankValue}/${outOf}`;
    }

    return String(rankValue);
  };

  const renderPlant = (plant: Plant) => {
    if (!plant.unlocked) {
      return (
        <div
          key={plant.id}
          className={`${plant.bgColor} rounded-3xl p-6 border-4 border-dashed border-gray-300 relative overflow-hidden opacity-60`}
        >
          <div className="flex flex-col items-center justify-center h-48">
            <div className="relative mb-4">
              <div className="text-6xl mb-2 grayscale opacity-50">
                {plant.emoji}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-2 shadow-lg">
                  <Icon icon="mdi:lock" className="text-gray-600" width={32} height={32} />
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-500 text-center mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
              {plant.name}
            </div>
            <div className="text-xs text-gray-400 text-center" style={{ fontFamily: 'Andika, sans-serif' }}>
              Coming Soon! 🔒
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={plant.id}
        onClick={() => setSelectedPlant(plant)}
        className={`${plant.bgColor} rounded-3xl p-6 border-4 border-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer relative overflow-hidden`}
      >
        <div className="absolute top-2 right-2 bg-white/80 rounded-full px-3 py-1 flex items-center gap-1 z-10">
          <Icon icon="mdi:star" className="text-yellow-500" width={16} height={16} />
          <span className="text-xs font-bold text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
            Lv.{plant.level}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center h-48">
          <div className="relative mb-4">
            {plant.thumbnail ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image
                  src={plant.thumbnail}
                  alt={plant.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : (
              <div className={`${getPlantSize(plant.level)} animate-bounce`} style={{ animationDuration: '2s' }}>
                {plant.emoji}
              </div>
            )}
          </div>
          
          <div className="text-lg font-bold text-gray-800 mb-2 text-center min-w-0 w-full" style={{ fontFamily: 'Andika, sans-serif' }}>
            <div className="truncate px-2">{plant.name}</div>
          </div>
          
          <div className="w-full max-w-xs">
            <div className="bg-white/60 rounded-full h-3 mb-2 overflow-hidden">
              <div
                className={`h-full bg-linear-to-r ${plant.color} rounded-full transition-all duration-500`}
                style={{ width: `${plant.progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 text-center" style={{ fontFamily: 'Andika, sans-serif' }}>
              {Math.round(plant.progress)}% complete
            </div>
          </div>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 h-2 bg-linear-to-r ${plant.color} opacity-30`} />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalLessons = progressData?.lessons_completed || 0;
  const longestStreak = progressData?.longest_streak || 0;
  const currentLevel = progressData?.level || 'Beginner';
  const pointsEarned = progressData?.points || 0;
  const rankInSchool = progressData?.rank_in_school;
  const rankInDistrict = progressData?.rank_in_district;
  const rankInCounty = progressData?.rank_in_county;

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-blue-50 to-purple-50">
      <ElementaryNavbar onMenuToggle={handleMenuToggle} />
      
      <div className="flex">
        <ElementarySidebar 
          activeItem="progress" 
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={handleMenuClose} 
        />
        
        <main className="flex-1 sm:pl-[280px] lg:pl-[320px] overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-linear-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent" style={{ fontFamily: 'Andika, sans-serif' }}>
                🌱 Progress Garden
              </h1>
              <p className="text-gray-600 text-sm sm:text-base" style={{ fontFamily: 'Andika, sans-serif' }}>
                Watch your learning garden grow as you complete lessons!
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shrink-0">
                    <Icon icon="mdi:book-open-variant" className="text-white" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Lessons</div>
                    <div className="text-xl font-bold text-gray-800 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {totalLessons}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shrink-0">
                    <Icon icon="mdi:fire" className="text-white" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Longest Streak</div>
                    <div className="text-xl font-bold text-gray-800 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {longestStreak} days 🔥
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shrink-0">
                    <Icon icon="mdi:star" className="text-white" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Level</div>
                    <div className="text-xl font-bold text-gray-800 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {currentLevel}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                    <Icon icon="mdi:gift" className="text-white" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>Points</div>
                    <div className="text-xl font-bold text-gray-800 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {pointsEarned} ⭐
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-indigo-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shrink-0">
                    <Icon icon="mdi:school" className="text-white" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>School Rank</div>
                    <div className="text-lg font-bold text-gray-800 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {formatRank(rankInSchool)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center shrink-0">
                    <Icon icon="mdi:map-marker" className="text-white" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>District Rank</div>
                    <div className="text-lg font-bold text-gray-800 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {formatRank(rankInDistrict)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-lg border-2 border-rose-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-linear-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shrink-0">
                    <Icon icon="mdi:earth" className="text-white" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>County Rank</div>
                    <div className="text-lg font-bold text-gray-800 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
                      {formatRank(rankInCounty)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                <Icon icon="mdi:flower" className="text-green-500" width={28} height={28} />
                Your Garden
              </h2>
              {plants.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plants.map(plant => renderPlant(plant))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
                  <div className="text-6xl mb-4">🌱</div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                    No plants yet!
                  </h3>
                  <p className="text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Start learning to grow your first plant!
                  </p>
                </div>
              )}
            </div>

            {selectedPlant && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPlant(null)}>
                <div
                  className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {selectedPlant.thumbnail ? (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                          <Image
                            src={selectedPlant.thumbnail}
                            alt={selectedPlant.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <span className="text-4xl">{selectedPlant.emoji}</span>
                      )}
                      <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {selectedPlant.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedPlant(null)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 shrink-0"
                    >
                      <Icon icon="mdi:close" width={20} height={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>                                                                                                                                                                      
                          Level {selectedPlant.level}
                        </span>
                        <span className="text-xs text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                          {Math.round(selectedPlant.progress)}% complete
                        </span>
                      </div>
                      <div className="bg-white rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full bg-linear-to-r ${selectedPlant.color} rounded-full transition-all duration-500`}
                          style={{ width: `${selectedPlant.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-linear-to-r from-green-100 to-blue-100 rounded-2xl p-4 border-2 border-green-200">
                      <p className="text-sm text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                        Keep learning to help your {selectedPlant.name.toLowerCase()} grow bigger and stronger! 🌟
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-linear-to-r from-yellow-100 via-green-100 to-blue-100 rounded-3xl p-6 border-2 border-yellow-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl">💡</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                    How Your Garden Grows
                  </h3>
                  <p className="text-sm text-gray-700 mb-3" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Every lesson you complete helps your plants grow! Complete more lessons to unlock new plants and watch them reach level 5!
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                    <li>🌱 Complete lessons to water your plants</li>
                    <li>⭐ Earn points and level up your plants</li>
                    <li>🏆 Climb the rankings in your school, district, and county</li>
                    <li>🔥 Keep your streak going for bonus growth!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
