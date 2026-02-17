'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ElementarySidebarProps {
  activeItem?: string;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
}

export default function ElementarySidebar({ activeItem = 'home', isMobileMenuOpen, onMobileMenuClose }: ElementarySidebarProps) {

  const navigationItems = [
    {
      id: 'home',
      title: 'Home Dashboard',
      icon: '🏠',
      href: '/dashboard/elementary',
      bgColor: 'bg-gradient-to-r from-[#60A5FA] to-[#4ADE80]',
      hoverColor: 'hover:opacity-90'
    },
    {
      id: 'subjects',
      title: 'Subjects World',
      icon: '🌍',
      href: '/subjects',
      bgColor: 'bg-[#F3E8FF]',
      hoverColor: 'hover:opacity-90'
    },
    {
      id: 'games',
      title: 'Fun & Games',
      icon: '⭐',
      href: '/games',
      bgColor: 'bg-[#FEF9C3]',
      hoverColor: 'hover:opacity-90'
    },
    {
      id: 'progress',
      title: 'Progress Garden',
      icon: '🌱',
      href: '/progress',
      bgColor: 'bg-[#DCFCE7]',
      hoverColor: 'hover:opacity-90'
    },
    {
      id: 'funzone',
      title: 'Grades',
      icon: '✏️',
      href: '/funzone',
      bgColor: 'bg-[#FCE7F3]',
      hoverColor: 'hover:opacity-90'
    },
    {
      id: 'resources',
      title: 'My Assessments',
      icon: '📄',
      href: '/assignments',
      bgColor: 'bg-[#E0E7FF]',
      hoverColor: 'hover:opacity-90'
    },
    {
      id: 'avatar',
      title: 'Avatar Room',
      icon: '👤',
      href: '/avatar',
      bgColor: 'bg-[#FFEDD5]',
      hoverColor: 'hover:opacity-90'
    },
    {
      id: 'profile',
      title: 'My Profile',
      icon: '👤',
      href: '/dashboard/elementary/profile',
      bgColor: 'bg-[#E0F2FE]',
      hoverColor: 'hover:opacity-90'
    }
  ];

  return (
    <>
      <aside className="hidden sm:block fixed left-0 top-16 z-40 bg-white w-[280px] lg:w-[320px] border-r border-[#E5E7EB] shadow-[2px_0_4px_rgba(0,0,0,0.1)] h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="h-full flex flex-col">
          <nav className="flex-1 pl-4 pr-4 pt-4 pb-4 space-y-4">
            {navigationItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center w-[240px] lg:w-[272px] h-[72px] pl-4 rounded-xl text-white font-medium transition-all duration-200 ${
                  activeItem === item.id 
                    ? `${item.bgColor} shadow-lg` 
                    : `${item.bgColor} ${item.hoverColor}`
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                {item.id === 'home' ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-4">
                      <Image
                        src="/home.png"
                        alt="Home"
                        width={23}
                        height={28}
                      />
                    </div>
                    <span className="text-[18px] font-semibold text-white">{item.title}</span>
                  </div>
                ) : item.id === 'subjects' ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#C084FC] rounded-full flex items-center justify-center mr-4">
                      <Image
                        src="/world.png"
                        alt="World"
                        width={16}
                        height={16}
                      />
                    </div>
                    <span className="text-[18px] font-semibold text-[#7E22CE]">{item.title}</span>
                  </div>
                ) : item.id === 'videos' ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#F87171] rounded-full flex items-center justify-center mr-4">
                      <Image
                        src="/play.png"
                        alt="Play"
                        width={12}
                        height={16}
                      />
                    </div>
                    <span className="text-[18px] font-semibold text-[#B91C1C]">{item.title}</span>
                  </div>
                ) : item.id === 'games' ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#FACC15] rounded-full flex items-center justify-center mr-4">
                      <Image
                        src="/game.png"
                        alt="Game"
                        width={16}
                        height={16}
                      />
                    </div>
                    <span className="text-[18px] font-semibold text-[#78350F]">{item.title}</span>
                  </div>
                ) : item.id === 'progress' ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#4ADE80] rounded-full flex items-center justify-center mr-4">
                      <Image
                        src="/tree.png"
                        alt="Tree"
                        width={16}
                        height={16}
                      />
                    </div>
                    <span className="text-[18px] font-semibold text-[#15803D]">{item.title}</span>
                  </div>
                ) : item.id === 'funzone' ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#F472B6] rounded-full flex items-center justify-center mr-4">
                      <Image
                        src="/fun.png"
                        alt="Fun"
                        width={16}
                        height={16}
                      />
                    </div>
                    <span className="text-[18px] font-semibold text-[#BE185D]">{item.title}</span>
                  </div>
                ) : item.id === 'resources' ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#818CF8] rounded-full flex items-center justify-center mr-4">
                      <Image
                        src="/resources.png"
                        alt="Resources"
                        width={14}
                        height={16}
                      />
                    </div>
                    <span className="text-[18px] font-semibold text-[#4338CA]">{item.title}</span>
                  </div>
                ) : item.id === 'avatar' ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#FB923C] rounded-full flex items-center justify-center mr-4">
                      <Image
                        src="/avata.png"
                        alt="Avatar"
                        width={14}
                        height={16}
                      />
                    </div>
                    <span className="text-[18px] font-semibold text-[#C2410C]">{item.title}</span>
                  </div>
                ) : item.id === 'profile' ? (
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#0EA5E9] rounded-full flex items-center justify-center mr-4">
                      <span className="text-xl">👤</span>
                    </div>
                    <span className="text-[18px] font-semibold text-[#0369A1]">{item.title}</span>
                  </div>
                ) : (
                  <>
                    <span className="text-xl mr-4">{item.icon}</span>
                    <span className="text-[18px] font-semibold">{item.title}</span>
                  </>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 bg-black/50 z-50">
          <div className="bg-white h-full w-80 shadow-lg">
            <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Navigation
                </h2>
                <button 
                  onClick={onMobileMenuClose}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-white p-4 overflow-y-auto h-full">
          <div className="grid grid-cols-2 gap-3">
            {navigationItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center p-4 rounded-xl text-white font-medium transition-all duration-200 ${
                  activeItem === item.id 
                    ? `${item.bgColor} shadow-lg` 
                    : `${item.bgColor} ${item.hoverColor}`
                }`}
                style={{ fontFamily: 'Andika, sans-serif' }}
                onClick={onMobileMenuClose}
              >
                {item.id === 'home' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-2">
                      <Image
                        src="/home.png"
                        alt="Home"
                        width={23}
                        height={28}
                      />
                    </div>
                    <span className="text-xs text-center leading-tight text-white">{item.title}</span>
                  </div>
                ) : item.id === 'subjects' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-[#C084FC] rounded-full flex items-center justify-center mb-2">
                      <Image
                        src="/world.png"
                        alt="World"
                        width={16}
                        height={16}
                      />
                    </div>
                    <span className="text-xs text-center leading-tight text-[#7E22CE]">{item.title}</span>
                  </div>
                ) : item.id === 'videos' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-[#F87171] rounded-full flex items-center justify-center mb-2">
                      <Image
                        src="/play.png"
                        alt="Play"
                        width={12}
                        height={16}
                      />
                    </div>
                    <span className="text-xs text-center leading-tight text-[#B91C1C]">{item.title}</span>
                  </div>
                ) : item.id === 'quizzes' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-[#FACC15] rounded-full flex items-center justify-center mb-2">
                      <Image
                        src="/game.png"
                        alt="Game"
                        width={16}
                        height={16}
                      />
                    </div>
                    <span className="text-xs text-center leading-tight text-[#A16207]">{item.title}</span>
                  </div>
                ) : item.id === 'progress' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-[#4ADE80] rounded-full flex items-center justify-center mb-2">
                      <Image
                        src="/tree.png"
                        alt="Tree"
                        width={16}
                        height={16}
                      />
                    </div>
                    <span className="text-xs text-center leading-tight text-[#15803D]">{item.title}</span>
                  </div>
                ) : item.id === 'funzone' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-[#F472B6] rounded-full flex items-center justify-center mb-2">
                      <Image
                        src="/fun.png"
                        alt="Fun"
                        width={16}
                        height={16}
                      />
                    </div>
                    <span className="text-xs text-center leading-tight text-[#BE185D]">{item.title}</span>
                  </div>
                ) : item.id === 'resources' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-[#818CF8] rounded-full flex items-center justify-center mb-2">
                      <Image
                        src="/resources.png"
                        alt="Resources"
                        width={14}
                        height={16}
                      />
                    </div>
                    <span className="text-xs text-center leading-tight text-[#4338CA]">{item.title}</span>
                  </div>
                ) : item.id === 'avatar' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-[#FB923C] rounded-full flex items-center justify-center mb-2">
                      <Image
                        src="/avata.png"
                        alt="Avatar"
                        width={14}
                        height={16}
                      />
                    </div>
                    <span className="text-xs text-center leading-tight text-[#C2410C]">{item.title}</span>
                  </div>
                ) : item.id === 'profile' ? (
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-[#0EA5E9] rounded-full flex items-center justify-center mb-2">
                      <span className="text-xl">👤</span>
                    </div>
                    <span className="text-xs text-center leading-tight text-[#0369A1]">{item.title}</span>
                  </div>
                ) : (
                  <>
                    <span className="text-2xl mb-2">{item.icon}</span>
                    <span className="text-xs text-center leading-tight">{item.title}</span>
                  </>
                )}
              </Link>
            ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
