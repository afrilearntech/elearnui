'use client';

import { useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface PageAccessibilityOptions {
  pageTitle: string;
  pageDescription?: string;
  actions?: string[];
  autoRead?: boolean;
  delay?: number;
}

/**
 * Hook for comprehensive page-level accessibility
 * Provides auto-reading, action guidance, and announcements
 */
export function usePageAccessibility({
  pageTitle,
  pageDescription,
  actions = [],
  autoRead = true,
  delay = 500,
}: PageAccessibilityOptions) {
  const { isEnabled, announce, speak } = useAccessibility();

  useEffect(() => {
    if (!isEnabled || !autoRead) return;

    const timer = setTimeout(() => {
      let message = `Page: ${pageTitle}.`;
      
      if (pageDescription) {
        message += ` ${pageDescription}.`;
      }
      
      if (actions.length > 0) {
        message += ` Available actions: ${actions.join(', ')}.`;
      }
      
      announce(message, 'polite');
    }, delay);

    return () => clearTimeout(timer);
  }, [isEnabled, pageTitle, pageDescription, actions, autoRead, delay, announce]);
}

/**
 * Hook for announcing action guidance when elements are focused
 * Example: "Click to login", "Type your password"
 */
export function useActionGuidance(elementRef: React.RefObject<HTMLElement>, guidance: string) {
  const { isEnabled, announce } = useAccessibility();

  useEffect(() => {
    if (!isEnabled || !elementRef.current) return;

    const element = elementRef.current;
    
    const handleFocus = () => {
      announce(guidance, 'polite');
    };

    element.addEventListener('focus', handleFocus);
    return () => element.removeEventListener('focus', handleFocus);
  }, [isEnabled, elementRef, guidance, announce]);
}
