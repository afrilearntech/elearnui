'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';

interface FooterProps {
  showSocialMedia?: boolean;
  customLinks?: {
    quickLinks?: Array<{ label: string; href: string }>;
    resources?: Array<{ label: string; href: string }>;
  };
}

export default function Footer({ 
  showSocialMedia = true,
  customLinks
}: FooterProps) {
  const defaultQuickLinks = [
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Help Center', href: '/help' },
    { label: 'Privacy Policy', href: '/privacy' }
  ];

  const defaultResources = [
    { label: 'Student Guide', href: '/student-guide' },
    { label: 'Teacher Resources', href: '/teacher-resources' },
    { label: 'Parent Portal', href: '/parent-portal' },
    { label: 'System Status', href: '/system-status' }
  ];

  const quickLinks = customLinks?.quickLinks || defaultQuickLinks;
  const resources = customLinks?.resources || defaultResources;

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Left Section - Branding & Mission */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Image
                src="/moe.png"
                alt="Ministry of Education Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Ministry of Education
                </h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                  eLearning Platform
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: 'Andika, sans-serif' }}>
              Empowering education across Liberia through innovative digital learning solutions.
            </p>
          </div>

          {/* Middle-Left Section - Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors" 
                    style={{ fontFamily: 'Andika, sans-serif' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Middle-Right Section - Resources */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
              Resources
            </h4>
            <ul className="space-y-2">
              {resources.map((link, index) => (
                <li key={index}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors" 
                    style={{ fontFamily: 'Andika, sans-serif' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Section - Connect */}
          {showSocialMedia && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                Connect
              </h4>
              <div className="flex space-x-4">
                <Link 
                  href="#" 
                  className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  aria-label="Facebook"
                >
                  <Icon icon="mdi:facebook" className="w-5 h-5 text-white" />
                </Link>
                <Link 
                  href="#" 
                  className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
                  aria-label="Twitter"
                >
                  <Icon icon="mdi:twitter" className="w-5 h-5 text-white" />
                </Link>
                <Link 
                  href="#" 
                  className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                  aria-label="YouTube"
                >
                  <Icon icon="mdi:youtube" className="w-5 h-5 text-white" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section - Copyright */}
        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
            © 2025 Ministry of Education, Liberia. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
