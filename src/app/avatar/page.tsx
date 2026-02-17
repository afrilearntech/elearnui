'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { Icon } from '@iconify/react';
import Image from 'next/image';

interface AvatarParts {
  hair: string;
  eyes: string;
  skin: string;
  clothes: string;
  accessory: string;
}

const hairOptions = [
  { id: 'curly', name: 'Curly Hair', emoji: '👨‍🦱', color: '#8B4513' },
  { id: 'straight', name: 'Straight Hair', emoji: '👩', color: '#000000' },
  { id: 'braids', name: 'Braids', emoji: '👧', color: '#654321' },
  { id: 'afro', name: 'Afro', emoji: '👨‍🦲', color: '#2C1810' },
  { id: 'ponytail', name: 'Ponytail', emoji: '👱‍♀️', color: '#FFD700' },
  { id: 'short', name: 'Short Cut', emoji: '👦', color: '#4A4A4A' },
];

const eyesOptions = [
  { id: 'brown', name: 'Brown Eyes', emoji: '👁️', color: '#8B4513' },
  { id: 'blue', name: 'Blue Eyes', emoji: '👁️', color: '#4169E1' },
  { id: 'green', name: 'Green Eyes', emoji: '👁️', color: '#228B22' },
  { id: 'hazel', name: 'Hazel Eyes', emoji: '👁️', color: '#DAA520' },
  { id: 'dark', name: 'Dark Eyes', emoji: '👁️', color: '#000000' },
];

const skinOptions = [
  { id: 'light', name: 'Light', emoji: '🤚', color: '#FDBCB4' },
  { id: 'medium', name: 'Medium', emoji: '🤚', color: '#E0AC69' },
  { id: 'tan', name: 'Tan', emoji: '🤚', color: '#C68642' },
  { id: 'brown', name: 'Brown', emoji: '🤚', color: '#8D5524' },
  { id: 'dark', name: 'Dark', emoji: '🤚', color: '#5C4033' },
];

const clothesOptions = [
  { id: 'tshirt', name: 'T-Shirt', emoji: '👕', color: '#FF6B6B' },
  { id: 'dress', name: 'Dress', emoji: '👗', color: '#FFB6C1' },
  { id: 'hoodie', name: 'Hoodie', emoji: '🧥', color: '#4ECDC4' },
  { id: 'uniform', name: 'School Uniform', emoji: '👔', color: '#95E1D3' },
  { id: 'jacket', name: 'Jacket', emoji: '🧥', color: '#F38181' },
  { id: 'sweater', name: 'Sweater', emoji: '🧶', color: '#AA96DA' },
];

const accessoryOptions = [
  { id: 'none', name: 'None', emoji: '', color: 'transparent' },
  { id: 'glasses', name: 'Glasses', emoji: '👓', color: '#2C3E50' },
  { id: 'hat', name: 'Hat', emoji: '🎩', color: '#8B4513' },
  { id: 'cap', name: 'Cap', emoji: '🧢', color: '#FF6347' },
  { id: 'crown', name: 'Crown', emoji: '👑', color: '#FFD700' },
  { id: 'headband', name: 'Headband', emoji: '🎀', color: '#FF69B4' },
];

export default function AvatarPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof AvatarParts>('hair');
  const [avatar, setAvatar] = useState<AvatarParts>({
    hair: 'curly',
    eyes: 'brown',
    skin: 'medium',
    clothes: 'tshirt',
    accessory: 'none',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedAvatar = localStorage.getItem('kid_avatar');
    if (savedAvatar) {
      try {
        setAvatar(JSON.parse(savedAvatar));
      } catch (e) {
      }
    }
  }, []);

  const handleMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMenuClose = () => setIsMobileMenuOpen(false);

  const handlePartChange = (part: keyof AvatarParts, value: string) => {
    setAvatar(prev => ({ ...prev, [part]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem('kid_avatar', JSON.stringify(avatar));
    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };

  const getCurrentOption = (category: keyof AvatarParts) => {
    const currentId = avatar[category];
    if (category === 'hair') return hairOptions.find(opt => opt.id === currentId);
    if (category === 'eyes') return eyesOptions.find(opt => opt.id === currentId);
    if (category === 'skin') return skinOptions.find(opt => opt.id === currentId);
    if (category === 'clothes') return clothesOptions.find(opt => opt.id === currentId);
    if (category === 'accessory') return accessoryOptions.find(opt => opt.id === currentId);
    return null;
  };

  const renderAvatarPreview = () => {
    const hair = hairOptions.find(h => h.id === avatar.hair);
    const eyes = eyesOptions.find(e => e.id === avatar.eyes);
    const skin = skinOptions.find(s => s.id === avatar.skin);
    const clothes = clothesOptions.find(c => c.id === avatar.clothes);
    const accessory = accessoryOptions.find(a => a.id === avatar.accessory);

    return (
      <div className="relative w-full max-w-xs mx-auto">
        <div className="bg-linear-to-br from-purple-100 via-pink-100 to-blue-100 rounded-3xl p-8 shadow-2xl border-4 border-white">
          <div className="bg-white rounded-full w-48 h-48 mx-auto flex items-center justify-center relative overflow-hidden shadow-lg">
            <div className="text-8xl relative z-10">
              {hair?.emoji || '👤'}
            </div>
            {accessory && accessory.id !== 'none' && (
              <div className="absolute top-2 text-4xl z-20">
                {accessory.emoji}
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <div className="text-4xl mb-2">{clothes?.emoji || '👕'}</div>
            <div className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
              Your Avatar
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOptions = () => {
    let options: any[] = [];
    if (activeCategory === 'hair') options = hairOptions;
    else if (activeCategory === 'eyes') options = eyesOptions;
    else if (activeCategory === 'skin') options = skinOptions;
    else if (activeCategory === 'clothes') options = clothesOptions;
    else if (activeCategory === 'accessory') options = accessoryOptions;

    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handlePartChange(activeCategory, option.id)}
            className={`p-4 rounded-2xl border-4 transition-all duration-200 transform hover:scale-105 ${
              avatar[activeCategory] === option.id
                ? 'border-purple-500 bg-purple-100 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50'
            }`}
          >
            <div className="text-3xl mb-2">{option.emoji}</div>
            <div className="text-xs font-medium text-gray-700 truncate" style={{ fontFamily: 'Andika, sans-serif' }}>
              {option.name}
            </div>
          </button>
        ))}
      </div>
    );
  };

  const categories = [
    { id: 'hair' as keyof AvatarParts, name: 'Hair', icon: 'mdi:hair-dryer', color: 'bg-amber-100', textColor: 'text-amber-700' },
    { id: 'eyes' as keyof AvatarParts, name: 'Eyes', icon: 'mdi:eye', color: 'bg-blue-100', textColor: 'text-blue-700' },
    { id: 'skin' as keyof AvatarParts, name: 'Skin', icon: 'mdi:palette', color: 'bg-orange-100', textColor: 'text-orange-700' },
    { id: 'clothes' as keyof AvatarParts, name: 'Clothes', icon: 'mdi:tshirt-crew', color: 'bg-pink-100', textColor: 'text-pink-700' },
    { id: 'accessory' as keyof AvatarParts, name: 'Accessories', icon: 'mdi:star', color: 'bg-purple-100', textColor: 'text-purple-700' },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-pink-50 to-blue-50">
      <ElementaryNavbar onMenuToggle={handleMenuToggle} />
      
      <div className="flex">
        <ElementarySidebar 
          activeItem="avatar" 
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={handleMenuClose} 
        />
        
        <main className="flex-1 sm:pl-[280px] lg:pl-[320px] overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 bg-linear-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: 'Andika, sans-serif' }}>
                🎨 Avatar Room
              </h1>
              <p className="text-gray-600 text-sm sm:text-base" style={{ fontFamily: 'Andika, sans-serif' }}>
                Create your unique character! Mix and match to make it special!
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-purple-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                  <Icon icon="mdi:account-circle" className="text-purple-500" width={24} height={24} />
                  Your Avatar
                </h2>
                {renderAvatarPreview()}
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full mt-6 bg-linear-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontFamily: 'Andika, sans-serif' }}
                >
                  {isSaving ? (
                    <>
                      <Icon icon="mdi:loading" className="animate-spin" width={20} height={20} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:content-save" width={20} height={20} />
                      <span>Save Avatar</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-purple-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                  <Icon icon="mdi:palette-outline" className="text-pink-500" width={24} height={24} />
                  Customize
                </h2>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                        activeCategory === cat.id
                          ? `${cat.color} ${cat.textColor} shadow-md scale-105`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      style={{ fontFamily: 'Andika, sans-serif' }}
                    >
                      <Icon icon={cat.icon} width={18} height={18} />
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <div className="text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {categories.find(c => c.id === activeCategory)?.name}
                  </div>
                  <div className="text-xs text-gray-500" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Choose your favorite style!
                  </div>
                </div>

                {renderOptions()}
              </div>
            </div>

            <div className="bg-linear-to-r from-yellow-100 via-orange-100 to-pink-100 rounded-3xl p-6 border-2 border-yellow-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🌟</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Unlock More Items!
                  </h3>
                  <p className="text-sm text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Complete lessons and earn points to unlock special accessories, cool hairstyles, and awesome outfits! Keep learning to make your avatar even more amazing!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
