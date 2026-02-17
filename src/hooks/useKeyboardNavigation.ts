'use client';

import { useEffect, useRef } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface UseKeyboardNavigationOptions {
  onNext?: () => void;
  onPrevious?: () => void;
  onSelect?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onNext,
  onPrevious,
  onSelect,
  enabled = true,
}: UseKeyboardNavigationOptions) {
  const { isEnabled, playSound } = useAccessibility();
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isEnabled || !enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow key navigation (simpler than Shift+Tab)
      if (e.key === 'ArrowRight' && onNext) {
        e.preventDefault();
        playSound('navigation');
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrevious) {
        e.preventDefault();
        playSound('navigation');
        onPrevious();
      } else if (e.key === 'Enter' && onSelect) {
        e.preventDefault();
        playSound('click');
        onSelect();
      }
    };

    const element = containerRef.current || document;
    element.addEventListener('keydown', handleKeyDown as EventListener);
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [isEnabled, enabled, onNext, onPrevious, onSelect, playSound]);

  return { containerRef };
}
