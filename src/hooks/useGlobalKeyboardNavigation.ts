'use client';

import { useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export function useGlobalKeyboardNavigation() {
  const { isEnabled, playSound } = useAccessibility();

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in input fields
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || 
                     target.tagName === 'TEXTAREA' || 
                     target.isContentEditable ||
                     target.getAttribute('role') === 'textbox';

      if (isInput) return;

      // Arrow key navigation for interactive elements
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const focusableElements = Array.from(
          document.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });

        const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

        if (currentIndex === -1) {
          // No element focused, focus first
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
            playSound('navigation');
          }
          return;
        }

        let nextIndex: number;
        if (e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % focusableElements.length;
        } else {
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) nextIndex = focusableElements.length - 1;
        }

        e.preventDefault();
        focusableElements[nextIndex].focus();
        playSound('navigation');
      }

      // Keyboard shortcuts for navigation
      if (e.key === 'h' || e.key === 'H') {
        // Jump to next heading
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const currentHeading = headings.find(h => h === document.activeElement || h.contains(document.activeElement));
        const currentIndex = currentHeading ? headings.indexOf(currentHeading) : -1;
        const nextHeading = headings[currentIndex + 1] || headings[0];
        if (nextHeading) {
          (nextHeading as HTMLElement).focus();
          playSound('navigation');
        }
      }

      if (e.key >= '1' && e.key <= '6') {
        // Jump to heading level
        const level = parseInt(e.key);
        const heading = document.querySelector(`h${level}`);
        if (heading) {
          (heading as HTMLElement).focus();
          playSound('navigation');
        }
      }

      if (e.key === 'k' || e.key === 'K') {
        // Jump to next link
        const links = Array.from(document.querySelectorAll<HTMLElement>('a[href]'));
        const currentLink = links.find(l => l === document.activeElement);
        const currentIndex = currentLink ? links.indexOf(currentLink) : -1;
        const nextLink = links[currentIndex + 1] || links[0];
        if (nextLink) {
          nextLink.focus();
          playSound('navigation');
        }
      }

      if (e.key === 'b' || e.key === 'B') {
        // Jump to next button
        const buttons = Array.from(document.querySelectorAll<HTMLElement>('button:not([disabled])'));
        const currentButton = buttons.find(b => b === document.activeElement);
        const currentIndex = currentButton ? buttons.indexOf(currentButton) : -1;
        const nextButton = buttons[currentIndex + 1] || buttons[0];
        if (nextButton) {
          nextButton.focus();
          playSound('navigation');
        }
      }

      if (e.key === 'f' || e.key === 'F') {
        // Jump to next form field
        const inputs = Array.from(document.querySelectorAll<HTMLElement>('input, textarea, select'));
        const currentInput = inputs.find(i => i === document.activeElement);
        const currentIndex = currentInput ? inputs.indexOf(currentInput) : -1;
        const nextInput = inputs[currentIndex + 1] || inputs[0];
        if (nextInput) {
          nextInput.focus();
          playSound('navigation');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, playSound]);
}
