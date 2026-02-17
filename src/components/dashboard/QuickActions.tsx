'use client';

import Card from '@/components/ui/Card';
import { Icon } from '@iconify/react';
import Image from 'next/image';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  title: string;
  actions: QuickAction[];
}

export default function QuickActions({ title, actions }: QuickActionsProps) {
  return (
    <Card className="w-full lg:w-[280px] h-auto lg:h-[322px] lg:ml-[112px]">
      <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Andika, sans-serif' }}>
        {title}
      </h3>
      <div className="space-y-3 pb-4">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            {action.id === '1' ? (
              <Image
                src="/res7.png"
                alt="Browse Courses Icon"
                width={18}
                height={24}
                className="w-[18px] h-6"
              />
            ) : action.id === '2' ? (
              <Image
                src="/res8.png"
                alt="Join Discussion Icon"
                width={20}
                height={24}
                className="w-5 h-6"
              />
            ) : action.id === '3' ? (
              <Image
                src="/res9.png"
                alt="View Progress Icon"
                width={16}
                height={24}
                className="w-4 h-6"
              />
            ) : action.id === '4' ? (
              <Image
                src="/res10.png"
                alt="Download Materials Icon"
                width={16}
                height={24}
                className="w-4 h-6"
              />
            ) : (
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon icon={action.icon} className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <span className="text-sm font-medium text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
