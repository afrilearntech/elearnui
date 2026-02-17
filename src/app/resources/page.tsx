'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import ComingSoon from '@/components/ui/ComingSoon';

export default function ResourcesPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        user={{ 
          name: user?.name || 'Student', 
          role: user?.role || 'Student', 
          initials: user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'ST' 
        }}
        notifications={3}
        messages={0}
        activeLink="resources"
      />
      
      <ComingSoon 
        title="Resources 📚"
        description="Access learning materials, study guides, and helpful resources. Coming soon!"
        illustration="default"
      />
    </div>
  );
}

