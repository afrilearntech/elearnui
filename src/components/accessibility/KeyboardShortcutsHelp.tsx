'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function KeyboardShortcutsHelp() {
  const { isEnabled, announce, playSound } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Show help on ? key
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const isInput = e.target instanceof HTMLElement && 
                       (e.target.tagName === 'INPUT' || 
                        e.target.tagName === 'TEXTAREA' || 
                        e.target.isContentEditable);
        
        if (!isInput) {
          e.preventDefault();
          setIsOpen(true);
          playSound('navigation');
          announce('Keyboard shortcuts help opened. Use Escape to close.');
        }
      }

      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        playSound('navigation');
        announce('Keyboard shortcuts help closed.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled, isOpen, announce, playSound]);

  if (!isEnabled || !isOpen) return null;

  const shortcuts = [
    { key: 'Shift (Hold)', description: 'Press and hold to activate/deactivate accessibility mode' },
    { key: 'Tab', description: 'Navigate forward through interactive elements' },
    { key: 'Arrow Right', description: 'Navigate to next item' },
    { key: 'Arrow Left', description: 'Navigate to previous item' },
    { key: 'Enter / Space', description: 'Activate button or link' },
    { key: 'Escape', description: 'Close modal or cancel action' },
    { key: 'H', description: 'Jump to next heading' },
    { key: '1-6', description: 'Jump to heading level (H1-H6)' },
    { key: 'K', description: 'Jump to next link' },
    { key: 'B', description: 'Jump to next button' },
    { key: 'F', description: 'Jump to next form field' },
    { key: '?', description: 'Show this help dialog' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50"
      onClick={() => {
        setIsOpen(false);
        playSound('navigation');
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: 'Andika, sans-serif' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="shortcuts-title" className="text-2xl font-bold text-gray-900">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => {
              setIsOpen(false);
              playSound('navigation');
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close keyboard shortcuts help"
          >
            <Icon icon="mdi:close" width={24} height={24} />
          </button>
        </div>

        <div className="space-y-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <kbd className="px-3 py-1 bg-white border-2 border-gray-300 rounded-lg font-mono font-semibold text-sm text-gray-800 min-w-[120px] text-center">
                {shortcut.key}
              </kbd>
              <p className="text-gray-700 flex-1 pt-1">{shortcut.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Tip:</strong> All shortcuts work when accessibility mode is enabled. 
            Press Escape to close this dialog.
          </p>
        </div>
      </div>
    </div>
  );
}
