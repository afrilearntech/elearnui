'use client';

import { useState, useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

export default function StartPrompt() {
  const { speakWelcomeMessage, isEnabled } = useAccessibility();
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Do not re-run onboarding speech for users who already enabled/dismissed.
    const promptDismissed = localStorage.getItem('accessibility_prompt_dismissed') === 'true';
    if (isEnabled || promptDismissed) {
      return;
    }

    const hasInteractedBefore = sessionStorage.getItem('has_interacted');

    if (!hasInteractedBefore) {
      const autoTrigger = setTimeout(() => {
        if (!hasInteracted) {
          setHasInteracted(true);
          sessionStorage.setItem('has_interacted', 'true');
          setTimeout(() => speakWelcomeMessage(), 200);
        }
      }, 2500);

      const handleInteraction = () => {
        if (hasInteracted) return;
        setHasInteracted(true);
        sessionStorage.setItem('has_interacted', 'true');
        clearTimeout(autoTrigger);
        setTimeout(() => speakWelcomeMessage(), 200);
      };

      document.addEventListener('click', handleInteraction, { once: true });
      document.addEventListener('keydown', handleInteraction, { once: true });
      document.addEventListener('touchstart', handleInteraction, { once: true });

      return () => {
        clearTimeout(autoTrigger);
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
    } else {
      setHasInteracted(true);

      const triggerWelcome = () => {
        setTimeout(() => speakWelcomeMessage(), 200);
        document.removeEventListener('click', triggerWelcome);
        document.removeEventListener('keydown', triggerWelcome);
        document.removeEventListener('touchstart', triggerWelcome);
      };

      document.addEventListener('click', triggerWelcome, { once: true });
      document.addEventListener('keydown', triggerWelcome, { once: true });
      document.addEventListener('touchstart', triggerWelcome, { once: true });

      return () => {
        document.removeEventListener('click', triggerWelcome);
        document.removeEventListener('keydown', triggerWelcome);
        document.removeEventListener('touchstart', triggerWelcome);
      };
    }
  }, [speakWelcomeMessage, hasInteracted, isEnabled]);

  return null;
}
