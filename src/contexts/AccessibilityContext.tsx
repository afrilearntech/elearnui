'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface AccessibilityContextType {
  isEnabled: boolean;
  enable: () => void;
  disable: () => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  speak: (text: string, interrupt?: boolean) => void;
  readElement: (element: HTMLElement) => void;
  readPage: () => void;
  playSound: (type: 'click' | 'success' | 'error' | 'navigation') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  speechEnabled: boolean;
  setSpeechEnabled: (enabled: boolean) => void;
  speakWelcomeMessage: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const shiftKeyPressRef = useRef<boolean>(false);
  const shiftAnnouncementRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const speechQueueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isSpeakingRef = useRef(false);
  const voicesLoadedRef = useRef(false);
  const femaleVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const welcomeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load and select female voice
  const loadFemaleVoice = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      voicesLoadedRef.current = true;
      
      // Try to find a female voice
      // Common female voice names contain keywords like "female", "woman", or specific names
      const femaleVoice = voices.find(voice => {
        const name = voice.name.toLowerCase();
        const lang = voice.lang.toLowerCase();
        
        // Check for common female voice indicators
        return (
          name.includes('female') ||
          name.includes('woman') ||
          name.includes('zira') || // Windows female voice
          name.includes('samantha') || // macOS female voice
          name.includes('karen') || // Australian female voice
          name.includes('fiona') || // Scottish female voice
          name.includes('tessa') || // South African female voice
          name.includes('susan') || // UK female voice
          (lang.includes('en') && (
            name.includes('enhanced') ||
            name.includes('premium')
          ))
        );
      }) || voices.find(voice => {
        // Fallback: look for voices that are not explicitly male
        const name = voice.name.toLowerCase();
        return !name.includes('male') && 
               !name.includes('man') && 
               !name.includes('david') &&
               !name.includes('daniel') &&
               !name.includes('alex') &&
               voice.lang.toLowerCase().includes('en');
      }) || voices.find(voice => voice.lang.toLowerCase().includes('en'));
      
      // Only set if voice is valid
      if (femaleVoice && femaleVoice.voiceURI) {
        femaleVoiceRef.current = femaleVoice;
        console.log('✅ Selected voice:', femaleVoice.name);
      } else if (voices[0] && voices[0].voiceURI) {
        femaleVoiceRef.current = voices[0];
        console.log('✅ Using default voice:', voices[0].name);
      } else {
        console.warn('⚠️ No valid voices found');
        femaleVoiceRef.current = null;
      }
    } else {
      console.log('⏳ Voices not loaded yet, will retry...');
    }
  }, []);

  // Function to speak welcome message - with retry logic and voice loading
  const speakWelcomeMessage = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      console.log('Speech synthesis not available');
      return;
    }
    
    const message = 'Welcome! Press and hold the Shift key to activate accessibility mode for automatic screen reader support.';
    
    // Update live region
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = message;
    }
    
    // Helper function to actually speak the message
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptSpeak = () => {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Ensure voices are loaded - wait a bit if needed
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0 && retryCount < maxRetries) {
          console.log('⏳ Voices not loaded yet, waiting... (attempt', retryCount + 1, ')');
          retryCount++;
          // Wait for voices to load
          loadFemaleVoice();
          setTimeout(() => {
            attemptSpeak();
          }, 300);
          return;
        }
        
        // If still no voices after retries, proceed with default
        if (voices.length === 0) {
          console.warn('⚠️ No voices available, proceeding with default');
        }
        
        // Load voices if not loaded
        if (!voicesLoadedRef.current) {
          loadFemaleVoice();
        }
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.85;
        utterance.volume = 1;
        utterance.pitch = 1;
        
        // Try to set female voice, but don't fail if it's not available
        // Only set voice if it's valid and not null
        if (femaleVoiceRef.current && femaleVoiceRef.current.voiceURI) {
          try {
            utterance.voice = femaleVoiceRef.current;
            console.log('✅ Using voice:', femaleVoiceRef.current.name);
          } catch (voiceError) {
            console.warn('⚠️ Could not set voice, using default:', voiceError);
            // Continue without setting voice - browser will use default
          }
        } else {
          // Try to find any English voice if female voice not available
          const voices = window.speechSynthesis.getVoices();
          const englishVoice = voices.find(v => v.lang.startsWith('en'));
          if (englishVoice) {
            try {
              utterance.voice = englishVoice;
              console.log('✅ Using English voice:', englishVoice.name);
            } catch (e) {
              console.warn('⚠️ Could not set English voice, using default');
            }
          }
        }
        
        utterance.onstart = () => {
          console.log('✅ Welcome message started speaking');
        };
        
        utterance.onend = () => {
          console.log('✅ Welcome message finished speaking');
        };
        
        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
          // 'not-allowed' is expected on page load - browser blocks speech until user interaction
          if (e.error === 'not-allowed') {
            console.log('ℹ️ Speech blocked by browser (needs user interaction) - this is normal');
            return; // Don't retry, wait for user interaction
          }
          
          // 'interrupted' is expected when we cancel speech - not an error
          if (e.error === 'interrupted' || e.error === 'canceled') {
            // This is normal when interrupting speech - don't log as error
            return;
          }
          
          console.error('❌ Speech synthesis error:', e.error);
          
          // Retry logic for certain errors (only if we haven't retried too many times)
          const currentRetry = retryCount;
          if ((e.error === 'synthesis-failed' || e.error === 'synthesis-unavailable') && currentRetry < maxRetries) {
            console.log('🔄 Retrying welcome message without voice selection... (attempt', currentRetry + 1, ')');
            retryCount++;
            setTimeout(() => {
              const retryUtterance = new SpeechSynthesisUtterance(message);
              retryUtterance.rate = 0.85;
              retryUtterance.volume = 1;
              retryUtterance.pitch = 1;
              // Don't set voice - let browser choose default
              retryUtterance.onstart = () => {
                console.log('✅ Welcome message (retry) started speaking');
              };
              retryUtterance.onend = () => {
                console.log('✅ Welcome message (retry) finished speaking');
              };
              retryUtterance.onerror = (retryError: SpeechSynthesisErrorEvent) => {
                if (retryError.error !== 'interrupted' && retryError.error !== 'canceled' && retryError.error !== 'not-allowed') {
                  console.error('❌ Retry also failed:', retryError.error);
                }
              };
              window.speechSynthesis.speak(retryUtterance);
            }, 300);
          }
        };
        
        // Speak immediately - no delays
        window.speechSynthesis.speak(utterance);
        console.log('🎤 Attempted to speak welcome message');
      } catch (e) {
        console.error('❌ Failed to speak welcome message:', e);
        // Retry once if it's a general error
        if (retryCount < maxRetries) {
          console.log('🔄 Retrying welcome message after error... (attempt', retryCount + 1, ')');
          retryCount++;
          setTimeout(() => {
            attemptSpeak();
          }, 500);
        } else {
          console.error('❌ Max retries reached, giving up on welcome message');
        }
      }
    };
    
    // Start the attempt
    attemptSpeak();
  }, [loadFemaleVoice]);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const saved = localStorage.getItem('accessibility_mode_enabled');
    const savedSpeech = localStorage.getItem('accessibility_speech_enabled');
    const wasEnabled = saved === 'true';
    const wasSpeechEnabled = savedSpeech !== 'false'; // Default to true
    setIsEnabled(wasEnabled);
    setSpeechEnabled(wasSpeechEnabled);
    
    // Check if first visit (no preference saved)
    if (saved === null) {
      setIsFirstVisit(true);
    }
    
    // Only announce onboarding prompt if user has never dismissed it
    // and accessibility mode is not already enabled.
    const promptDismissed = localStorage.getItem('accessibility_prompt_dismissed') === 'true';
    if (!wasEnabled && !promptDismissed) {
      console.log('🎤 Attempting to speak welcome onboarding message...');
      welcomeTimerRef.current = setTimeout(() => {
        speakWelcomeMessage();
      }, 500);
    }

    // Initialize Web Audio API for sound cues
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
    
    // Load voices immediately and on change
    if ('speechSynthesis' in window) {
      // Load immediately
      loadFemaleVoice();
      
      // Some browsers load voices asynchronously - listen for when they're ready
      window.speechSynthesis.onvoiceschanged = loadFemaleVoice;
      
      // Also try loading again after a short moment (some browsers need this)
      setTimeout(() => {
        loadFemaleVoice();
      }, 100);
    }

    return () => {
      if (welcomeTimerRef.current) {
        clearTimeout(welcomeTimerRef.current);
      }
    };
  }, [speakWelcomeMessage, loadFemaleVoice]);

  // Note: User interaction handler removed - StartPrompt component handles this now
  // This ensures speech works immediately after the prompt is clicked


  const playSound = useCallback((type: 'click' | 'success' | 'error' | 'navigation') => {
    if (!soundEnabled || !audioContextRef.current) return;

    try {
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different sound types
      const frequencies: Record<typeof type, number> = {
        click: 800,
        success: 1000,
        error: 400,
        navigation: 600,
      };

      oscillator.frequency.value = frequencies[type];
      oscillator.type = type === 'error' ? 'sawtooth' : 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Silently fail if audio context is not available
    }
  }, [soundEnabled]);

  const speak = useCallback((text: string, interrupt: boolean = false) => {
    if (!speechEnabled || !isEnabled || !('speechSynthesis' in window)) return;
    
    // Ensure voices are loaded
    if (!voicesLoadedRef.current) {
      loadFemaleVoice();
    }
    
    if (interrupt) {
      window.speechSynthesis.cancel();
      speechQueueRef.current = [];
      isSpeakingRef.current = false;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1;
    utterance.volume = 1; // Full volume
    
    // Set female voice if available - but don't fail if it's not
    if (femaleVoiceRef.current && femaleVoiceRef.current.voiceURI) {
      try {
        utterance.voice = femaleVoiceRef.current;
      } catch (voiceError) {
        // Continue without setting voice if it fails
        console.warn('Could not set voice, using default');
      }
    }
    
    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };
    
    utterance.onend = () => {
      isSpeakingRef.current = false;
      // Process next in queue if any
      if (speechQueueRef.current.length > 0) {
        const next = speechQueueRef.current.shift();
        if (next) window.speechSynthesis.speak(next);
      }
    };
    
    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      isSpeakingRef.current = false;
      
      // 'interrupted' or 'canceled' is expected when we interrupt speech - not an error
      if (e.error === 'interrupted' || e.error === 'canceled') {
        return; // This is normal when interrupting speech
      }
      
      // If voice selection failed, retry without voice
      if (e.error === 'synthesis-failed' || e.error === 'synthesis-unavailable') {
        const retryUtterance = new SpeechSynthesisUtterance(text);
        retryUtterance.rate = 0.85;
        retryUtterance.pitch = 1;
        retryUtterance.volume = 1;
        // Don't set voice - use browser default
        window.speechSynthesis.speak(retryUtterance);
      }
    };
    
    if (isSpeakingRef.current && !interrupt) {
      // Queue if already speaking
      speechQueueRef.current.push(utterance);
    } else {
      window.speechSynthesis.speak(utterance);
    }
  }, [speechEnabled, isEnabled, loadFemaleVoice]);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!isEnabled && !isFirstVisit) return;
    
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
      
      // Clear after announcement (for repeated announcements)
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 1000);
    }

    // Always use Web Speech API when enabled (automatic reading)
    if (speechEnabled && isEnabled) {
      speak(message, priority === 'assertive');
    }
  }, [isEnabled, isFirstVisit, speechEnabled, speak]);

  const readElement = useCallback((element: HTMLElement) => {
    if (!speechEnabled || !isEnabled) return;
    
    let text = '';
    
    // Get aria-label first (most descriptive)
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      text = ariaLabel;
    } else {
      // Get text content
      const textContent = element.textContent?.trim();
      if (textContent) {
        text = textContent;
      } else {
        // Get alt text for images
        const alt = element.getAttribute('alt');
        if (alt) {
          text = alt;
        } else {
          // Get title
          const title = element.getAttribute('title');
          if (title) {
            text = title;
          }
        }
      }
    }
    
    // Add role/type information
    const role = element.getAttribute('role') || element.tagName.toLowerCase();
    if (role === 'button' && !text.includes('button')) {
      text = `${text}, button`;
    } else if (role === 'link' && !text.includes('link')) {
      text = `${text}, link`;
    }
    
    if (text) {
      speak(text, false);
    }
  }, [speechEnabled, isEnabled, speak]);

  const readPage = useCallback(() => {
    if (!speechEnabled || !isEnabled) return;
    
    const mainContent = document.querySelector('main[id="main-content"]') || document.querySelector('main');
    if (!mainContent) return;
    
    // Get page title
    const pageTitle = document.querySelector('h1')?.textContent || 'Page';
    
    // Get all important content
    const headings = Array.from(mainContent.querySelectorAll('h1, h2, h3'));
    const buttons = Array.from(mainContent.querySelectorAll('button:not([aria-hidden="true"])'));
    const links = Array.from(mainContent.querySelectorAll('a[href]:not([aria-hidden="true"])'));
    
    let content = `Page: ${pageTitle}. `;
    
    if (headings.length > 0) {
      content += `Headings: ${headings.map(h => h.textContent).join(', ')}. `;
    }
    
    if (buttons.length > 0) {
      content += `Available actions: ${buttons.length} button${buttons.length > 1 ? 's' : ''}. `;
    }
    
    if (links.length > 0) {
      content += `${links.length} link${links.length > 1 ? 's' : ''} available. `;
    }
    
    speak(content, true);
  }, [speechEnabled, isEnabled, speak]);

  const enable = useCallback(() => {
    setIsEnabled(true);
    localStorage.setItem('accessibility_mode_enabled', 'true');
    localStorage.setItem('accessibility_prompt_dismissed', 'true');
    // Announce after state update
    setTimeout(() => {
      const message = 'Accessibility mode activated. Automatic screen reader is now enabled. All content will be read aloud automatically. You can now use keyboard shortcuts. Press question mark for keyboard shortcuts help. Press and hold Shift key again to disable.';
      announce(message, 'assertive');
      playSound('success');
    }, 100);
  }, [announce, playSound]);

  const disable = useCallback(() => {
    setIsEnabled(false);
    localStorage.setItem('accessibility_mode_enabled', 'false');
    // Keep prompt dismissed so returning users are not repeatedly re-onboarded.
    localStorage.setItem('accessibility_prompt_dismissed', 'true');
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setTimeout(() => {
      announce('Accessibility mode disabled.', 'polite');
    }, 100);
  }, [announce]);

  // Robust function to announce Shift activation - with retry logic
  const announceShiftActivation = useCallback((message: string, isEnabled: boolean) => {
    if (!('speechSynthesis' in window)) {
      console.error('❌ Speech synthesis not available');
      return;
    }

    console.log('🎤 Attempting to announce:', message);
    
    let retryCount = 0;
    const maxRetries = 3;
    
    const attemptSpeak = () => {
      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Ensure voices are loaded - wait if needed
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0 && retryCount < maxRetries) {
          console.log('⏳ Voices not loaded yet, waiting... (attempt', retryCount + 1, ')');
          retryCount++;
          loadFemaleVoice();
          setTimeout(() => {
            attemptSpeak();
          }, 300);
          return;
        }
        
        // Load voices if not loaded
        if (!voicesLoadedRef.current) {
          loadFemaleVoice();
        }
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.85;
        utterance.volume = 1;
        utterance.pitch = 1;
        
        // Try to set voice, with fallbacks
        if (femaleVoiceRef.current && femaleVoiceRef.current.voiceURI) {
          try {
            utterance.voice = femaleVoiceRef.current;
            console.log('✅ Using voice:', femaleVoiceRef.current.name);
          } catch (e) {
            console.warn('⚠️ Could not set female voice, trying English voice...');
            // Try English voice as fallback
            const voices = window.speechSynthesis.getVoices();
            const englishVoice = voices.find(v => v.lang.startsWith('en'));
            if (englishVoice) {
              try {
                utterance.voice = englishVoice;
                console.log('✅ Using English voice:', englishVoice.name);
              } catch (e2) {
                console.warn('⚠️ Could not set English voice, using default');
              }
            }
          }
        } else {
          // Try to find any English voice
          const voices = window.speechSynthesis.getVoices();
          const englishVoice = voices.find(v => v.lang.startsWith('en'));
          if (englishVoice) {
            try {
              utterance.voice = englishVoice;
              console.log('✅ Using English voice:', englishVoice.name);
            } catch (e) {
              console.warn('⚠️ Could not set English voice, using default');
            }
          }
        }
        
        utterance.onstart = () => {
          console.log('✅ Announcement started speaking:', message.substring(0, 50) + '...');
        };
        
        utterance.onend = () => {
          console.log('✅ Announcement finished speaking');
        };
        
        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
          console.error('❌ Speech synthesis error:', e.error, 'for message:', message.substring(0, 50));
          
          // 'not-allowed' means browser blocked it - this shouldn't happen after user interaction
          if (e.error === 'not-allowed') {
            console.warn('⚠️ Speech blocked by browser - this is unexpected after user interaction');
            // Still retry once
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(() => attemptSpeak(), 500);
            }
            return;
          }
          
          // 'interrupted' or 'canceled' is expected when we cancel speech
          if (e.error === 'interrupted' || e.error === 'canceled') {
            return;
          }
          
          // Retry logic for other errors
          if ((e.error === 'synthesis-failed' || e.error === 'synthesis-unavailable') && retryCount < maxRetries) {
            console.log('🔄 Retrying announcement without voice selection... (attempt', retryCount + 1, ')');
            retryCount++;
            setTimeout(() => {
              const retryUtterance = new SpeechSynthesisUtterance(message);
              retryUtterance.rate = 0.85;
              retryUtterance.volume = 1;
              retryUtterance.pitch = 1;
              // Don't set voice - let browser choose default
              retryUtterance.onstart = () => {
                console.log('✅ Retry announcement started');
              };
              retryUtterance.onend = () => {
                console.log('✅ Retry announcement finished');
              };
              retryUtterance.onerror = (retryError: SpeechSynthesisErrorEvent) => {
                if (retryError.error !== 'interrupted' && retryError.error !== 'canceled' && retryError.error !== 'not-allowed') {
                  console.error('❌ Retry also failed:', retryError.error);
                }
              };
              window.speechSynthesis.speak(retryUtterance);
            }, 300);
          }
        };
        
        // Speak immediately
        window.speechSynthesis.speak(utterance);
        console.log('🎤 Utterance queued for speaking');
      } catch (e) {
        console.error('❌ Failed to create/speak utterance:', e);
        // Retry once if it's a general error
        if (retryCount < maxRetries) {
          console.log('🔄 Retrying after error... (attempt', retryCount + 1, ')');
          retryCount++;
          setTimeout(() => {
            attemptSpeak();
          }, 500);
        } else {
          console.error('❌ Max retries reached, giving up on announcement');
        }
      }
    };
    
    // Start the attempt
    attemptSpeak();
  }, [loadFemaleVoice]);

  // Shift key detection for accessibility toggle - press and hold
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let holdTimer: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Listen for Shift key (either left or right shift)
      // Only trigger if Shift is pressed alone (not with other modifiers)
      if (e.key === 'Shift' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const isInput = e.target instanceof HTMLElement && (
          e.target.tagName === 'INPUT' || 
          e.target.tagName === 'TEXTAREA' || 
          e.target.isContentEditable
        );
        
        // Allow shift in input fields for normal typing (capital letters, etc.)
        if (isInput) return;

        // Only process if shift wasn't already pressed (prevent multiple triggers)
        if (!shiftKeyPressRef.current) {
          shiftKeyPressRef.current = true;
          shiftAnnouncementRef.current = false;

          // After a short hold (300ms), announce and toggle
          holdTimer = setTimeout(() => {
            if (shiftKeyPressRef.current && !shiftAnnouncementRef.current) {
              shiftAnnouncementRef.current = true;
              
              // Toggle accessibility mode
              if (isEnabled) {
                disable();
                // Announce that it's disabled and they can release
                setTimeout(() => {
                  announceShiftActivation(
                    'Accessibility mode disabled. You can release the Shift key now.',
                    false
                  );
                }, 200);
              } else {
                enable();
                // Always announce that it's enabled, even if welcome message didn't play
                // This ensures users know accessibility is activated
                setTimeout(() => {
                  announceShiftActivation(
                    'Accessibility mode is now enabled. All content will be read aloud automatically. You can release the Shift key now.',
                    true
                  );
                }, 200);
              }
            }
          }, 300); // Wait 300ms to confirm it's a hold, not a quick press
        }
      } else {
        // Reset if any other key is pressed
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        shiftKeyPressRef.current = false;
        shiftAnnouncementRef.current = false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Reset when Shift is released
      if (e.key === 'Shift') {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        shiftKeyPressRef.current = false;
        shiftAnnouncementRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
      }
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEnabled, enable, disable, announceShiftActivation]);

  // Auto-read focused elements
  useEffect(() => {
    if (!isEnabled || !speechEnabled) return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // Don't read if it's an input field (user is typing)
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Small delay to ensure element is fully focused
      setTimeout(() => {
        readElement(target);
      }, 100);
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [isEnabled, speechEnabled, readElement]);

  return (
    <AccessibilityContext.Provider
      value={{
        isEnabled,
        enable,
        disable,
        announce,
        speak,
        readElement,
        readPage,
        playSound,
        soundEnabled,
        setSoundEnabled,
        speechEnabled,
        setSpeechEnabled: (enabled: boolean) => {
          setSpeechEnabled(enabled);
          localStorage.setItem('accessibility_speech_enabled', enabled.toString());
        },
        speakWelcomeMessage,
      }}
    >
      {children}
      {/* Hidden live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        id="a11y-announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
