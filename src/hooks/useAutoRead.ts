'use client';

import { useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

/**
 * Hook to automatically read page content when it loads
 * Call this in page components to enable auto-reading
 */
export function useAutoRead(content: string, delay: number = 500) {
  const { isEnabled, speechEnabled, speak } = useAccessibility();

  useEffect(() => {
    if (!isEnabled || !speechEnabled || !content) return;

    const timer = setTimeout(() => {
      speak(content, false);
    }, delay);

    return () => clearTimeout(timer);
  }, [isEnabled, speechEnabled, content, delay, speak]);
}
