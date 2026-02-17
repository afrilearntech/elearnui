'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';

interface NavbarProps {
  user?: {
    name: string;
    role: string;
    avatar?: string;
    initials?: string;
  };
  notifications?: number;
  messages?: number;
  activeLink?: string;
  disableNavigation?: boolean;
}

export default function Navbar({ 
  user = { name: 'Sarah Johnson', role: 'Student', initials: 'SJ' },
  notifications = 3,
  messages = 0,
  activeLink = 'dashboard',
  disableNavigation = false
}: NavbarProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const navigationLinks = [
    { href: '/dashboard', label: 'Dashboard', key: 'dashboard' },
    { href: '/courses', label: 'Courses', key: 'courses' },
    { href: '/assignments', label: 'Assignments', key: 'assignments' },
    { href: '/grades', label: 'Grades', key: 'grades' },
    { href: '/calendar', label: 'Calendar', key: 'calendar' },
    { href: '/resources', label: 'Resources', key: 'resources' }
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      {/* Top Row - Utility Bar */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo */}
          <div className="flex items-center space-x-3">
            <Image
              src="/moe.png"
              alt="Ministry of Education Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                Ministry of Education
              </h1>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                Liberia eLearning
              </p>
            </div>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8" style={{ pointerEvents: disableNavigation ? 'none' : 'auto', opacity: disableNavigation ? 0.5 : 1 }}>
            <div className="relative w-full">
              <Icon icon="material-symbols:search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses, lessons, teachers..."
                disabled={disableNavigation}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disableNavigation ? 'cursor-not-allowed bg-gray-100' : ''}`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              />
            </div>
          </div>

          {/* Right - User Info */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <Icon icon="material-symbols:notifications" className="w-6 h-6 text-gray-600" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </div>

            {/* Messages */}
            <div className="relative">
              <Icon icon="material-symbols:chat" className="w-6 h-6 text-gray-600" />
              {messages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {messages}
                </span>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-white text-sm font-semibold">{user.initials}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                  {user.name}
                </p>
                <p className="text-xs text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                  {user.role}
                </p>
              </div>
              <Icon icon="material-symbols:keyboard-arrow-down" className="w-4 h-4 text-gray-600" />
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 font-medium text-sm"
              style={{ fontFamily: 'Andika, sans-serif' }}
              aria-label="Logout"
            >
              <Icon icon="mdi:logout" className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            <Icon icon="material-symbols:menu" className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom Row - Main Navigation */}
      <div className="px-4 sm:px-6 lg:px-8 border-t border-gray-200">
        <div className="flex items-center justify-between h-12">
          <div className="hidden md:flex space-x-8" style={{ pointerEvents: disableNavigation ? 'none' : 'auto', opacity: disableNavigation ? 0.5 : 1 }}>
            {navigationLinks.map((link) => (
              <Link
                key={link.key}
                href={disableNavigation ? '#' : link.href}
                onClick={(e) => {
                  if (disableNavigation) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activeLink === link.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                } ${disableNavigation ? 'cursor-not-allowed' : ''}`}
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Outside and Fixed */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[112px] bg-white border-t border-gray-200 shadow-lg z-50 max-h-[calc(100vh-112px)] overflow-y-auto">
          <div className="px-4 py-4">
            <div className="space-y-1" style={{ pointerEvents: disableNavigation ? 'none' : 'auto', opacity: disableNavigation ? 0.5 : 1 }}>
              {navigationLinks.map((link) => (
                <Link
                  key={link.key}
                  href={disableNavigation ? '#' : link.href}
                  onClick={(e) => {
                    if (disableNavigation) {
                      e.preventDefault();
                      e.stopPropagation();
                    } else {
                      setIsMenuOpen(false);
                    }
                  }}
                  className={`block py-3 px-3 text-base font-medium rounded-lg transition-colors ${
                    activeLink === link.key
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:bg-gray-50'
                  } ${disableNavigation ? 'cursor-not-allowed' : ''}`}
                  style={{ fontFamily: 'Andika, sans-serif' }}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile Logout Button */}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 py-3 px-3 text-base font-medium rounded-lg transition-colors bg-red-500 hover:bg-red-600 text-white mt-2"
                style={{ fontFamily: 'Andika, sans-serif' }}
              >
                <Icon icon="mdi:logout" className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
