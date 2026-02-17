'use client';

import { useState, useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function StartPrompt() {
  const { speakWelcomeMessage, isEnabled } = useAccessibility();
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if user has interacted before in this session
    const hasInteractedBefore = sessionStorage.getItem('has_interacted');
    
    if (!hasInteractedBefore) {
      // Show prompt after a brief moment
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      // If they've interacted before, we still need a real user interaction
      // to trigger speech (browser blocks speech without user interaction)
      // So we'll listen for the first interaction and then speak
      setHasInteracted(true);
      
      // Set up a one-time listener for valid user gestures to trigger welcome
      // Note: Only click, keydown, and touchstart are valid gestures for speech synthesis
      const triggerWelcome = () => {
        console.log('🎤 User interaction detected after refresh, speaking welcome message');
        // Small delay to ensure browser recognizes the interaction
        setTimeout(() => {
          speakWelcomeMessage();
        }, 200);
        // Remove all listeners after triggering
        document.removeEventListener('click', triggerWelcome);
        document.removeEventListener('keydown', triggerWelcome);
        document.removeEventListener('touchstart', triggerWelcome);
      };
      
      // Listen for valid user gestures only (mousemove is NOT valid for speech)
      document.addEventListener('click', triggerWelcome, { once: true });
      document.addEventListener('keydown', triggerWelcome, { once: true });
      document.addEventListener('touchstart', triggerWelcome, { once: true });
      
      return () => {
        document.removeEventListener('click', triggerWelcome);
        document.removeEventListener('keydown', triggerWelcome);
        document.removeEventListener('touchstart', triggerWelcome);
      };
    }
  }, [speakWelcomeMessage]);

  // Auto-dismiss after showing prompt
  useEffect(() => {
    if (!showPrompt || hasInteracted) return;

    // Auto-dismiss and trigger after 2.5 seconds if no interaction
    const autoDismiss = setTimeout(() => {
      handleStart();
    }, 2500);

    return () => clearTimeout(autoDismiss);
  }, [showPrompt, hasInteracted]);

  const handleStart = () => {
    if (hasInteracted) return; // Prevent multiple calls
    
    setShowPrompt(false);
    setHasInteracted(true);
    sessionStorage.setItem('has_interacted', 'true');
    
    // Speak welcome message after real user interaction
    // Use a small delay to ensure the interaction is registered by the browser
    setTimeout(() => {
      console.log('🎤 Triggering welcome message after user interaction');
      speakWelcomeMessage();
    }, 200);
  };

  // Listen for any interaction to auto-start (only valid user gestures)
  useEffect(() => {
    if (hasInteracted || !showPrompt) return;

    const handleAnyInteraction = () => {
      handleStart();
    };

    // Listen for valid user gestures (click, keydown, touchstart)
    // Note: mousemove is NOT a valid gesture for speech synthesis
    document.addEventListener('click', handleAnyInteraction, { once: true });
    document.addEventListener('keydown', handleAnyInteraction, { once: true });
    document.addEventListener('touchstart', handleAnyInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleAnyInteraction);
      document.removeEventListener('keydown', handleAnyInteraction);
      document.removeEventListener('touchstart', handleAnyInteraction);
    };
  }, [showPrompt, hasInteracted]);

  // Don't show if accessibility is already enabled
  if (isEnabled || hasInteracted) {
    return null;
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={handleStart}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStart();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Click anywhere or press Enter to start"
    >
      <div className="text-center text-white px-6">
        <div className="mb-4">
          <div className="inline-block animate-pulse">
            <svg
              className="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 15l-2-5L9 9l-2 5m5-5h.01M19 19a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v10z"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Welcome!</h2>
        <p className="text-xl mb-2">Click anywhere or press Enter</p>
        <p className="text-lg opacity-90">to start your learning journey</p>
        <div className="mt-6 text-sm opacity-75">
          Press and hold Shift to activate accessibility mode
        </div>
      </div>
    </div>
  );
}
