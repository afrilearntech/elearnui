'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';

interface ElementaryNavbarProps {
  onMenuToggle: () => void;
}

export default function ElementaryNavbar({ onMenuToggle }: ElementaryNavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear all authentication data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_grade');
    }
    // Redirect to login
    router.push('/login');
  };

  return (
    <nav className="bg-linear-to-r from-[#3AB0FF] to-[#00D68F] w-full h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <Image
            src="/moe.png"
            alt="Ministry of Education Logo"
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold text-[#111827]" style={{ fontFamily: 'Andika, sans-serif' }}>
            Ministry of Education
          </h1>
          <p className="text-[14px] font-normal text-[#6B7280]" style={{ fontFamily: 'Andika, sans-serif' }}>
            Liberia eLearning
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Profile Button */}
        <button
          onClick={() => router.push('/dashboard/elementary/profile')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm"
          style={{ fontFamily: 'Andika, sans-serif' }}
          aria-label="Profile"
        >
          <Icon icon="material-symbols:person" className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Profile</span>
        </button>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all duration-200 font-medium text-xs sm:text-sm"
          style={{ fontFamily: 'Andika, sans-serif' }}
          aria-label="Logout"
        >
          <Icon icon="mdi:logout" className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
        
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuToggle}
          className="sm:hidden p-2 text-white hover:text-gray-100"
          aria-label="Toggle menu"
        >
          <Icon icon="material-symbols:menu" className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
}
