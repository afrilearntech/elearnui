
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import { getGames, getGameById, Game } from '@/lib/api/games';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import Spinner from '@/components/ui/Spinner';

interface GameCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconBgColor: string;
  buttonColor: string;
  image?: string;
  instructions?: string;
}

const getGameTypeConfig = (type: string): { icon: string; iconBgColor: string; buttonColor: string } => {
  const typeUpper = type.toUpperCase();
  if (typeUpper.includes('WORD') || typeUpper.includes('PUZZLE')) {
    return {
      icon: 'mdi:alphabetical-variant',
      iconBgColor: 'bg-pink-100',
      buttonColor: 'bg-pink-500 hover:bg-pink-600',
    };
  }
  if (typeUpper.includes('NUMBER') || typeUpper.includes('MATH')) {
    return {
      icon: 'mdi:calculator',
      iconBgColor: 'bg-blue-100',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
    };
  }
  if (typeUpper.includes('SHAPE')) {
    return {
      icon: 'mdi:shape',
      iconBgColor: 'bg-green-100',
      buttonColor: 'bg-green-500 hover:bg-green-600',
    };
  }
  if (typeUpper.includes('COLOR')) {
    return {
      icon: 'mdi:palette',
      iconBgColor: 'bg-purple-100',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
    };
  }
  if (typeUpper.includes('ANIMAL') || typeUpper.includes('SOUND')) {
    return {
      icon: 'mdi:volume-high',
      iconBgColor: 'bg-orange-100',
      buttonColor: 'bg-orange-500 hover:bg-orange-600',
    };
  }
  if (typeUpper.includes('MEMORY') || typeUpper.includes('CARD')) {
    return {
      icon: 'mdi:cards',
      iconBgColor: 'bg-pink-100',
      buttonColor: 'bg-pink-500 hover:bg-pink-600',
    };
  }
  if (typeUpper.includes('ABC') || typeUpper.includes('ALPHABET')) {
    return {
      icon: 'mdi:alphabetical',
      iconBgColor: 'bg-blue-100',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
    };
  }
  return {
    icon: 'mdi:gamepad-variant',
    iconBgColor: 'bg-gray-100',
    buttonColor: 'bg-gray-500 hover:bg-gray-600',
  };
};

const mapGameToCard = (game: Game): GameCard => {
  const config = getGameTypeConfig(game.type);
  return {
    id: game.id.toString(),
    title: game.name,
    description: game.description || 'Have fun playing!',
    icon: config.icon,
    iconBgColor: config.iconBgColor,
    buttonColor: config.buttonColor,
    image: game.image || undefined,
    instructions: game.instructions,
  };
};

export default function GamesPage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const handleMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMenuClose = () => setIsMobileMenuOpen(false);
  const [selectedGame, setSelectedGame] = useState<GameCard | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [showGamePlay, setShowGamePlay] = useState(false);
  const [currentGameDetails, setCurrentGameDetails] = useState<Game | null>(null);
  const [games, setGames] = useState<GameCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGameDataLoading, setIsGameDataLoading] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [answerKey, setAnswerKey] = useState<string>('');
  const [slots, setSlots] = useState<(string|null)[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [basePool, setBasePool] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showHintPrompt, setShowHintPrompt] = useState(false);
  const [hasUsedHint, setHasUsedHint] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [checkModalMessage, setCheckModalMessage] = useState('');
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [currentGameIndex, setCurrentGameIndex] = useState<number>(-1);
  const hintButtonRef = useRef<HTMLButtonElement | null>(null);
  const checkButtonRef = useRef<HTMLButtonElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [activeTouchLetter, setActiveTouchLetter] = useState<{ letter: string; from: 'pool' | number } | null>(null);
  const [touchTargetSlot, setTouchTargetSlot] = useState<number | null>(null);

  const playDragSound = () => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = audioCtxRef.current || new AudioContextClass();
    if (!audioCtxRef.current) {
      audioCtxRef.current = ctx;
    }
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  };

  useEffect(() => {
    const fetchGames = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      try {
        const gamesData = await getGames(token);
        const mappedGames = gamesData.map(mapGameToCard);
        setGames(mappedGames);
      } catch (error) {
        const errorMessage = error instanceof ApiClientError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to load games';
        showErrorToast(formatErrorMessage(errorMessage));
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, [router]);

  useEffect(() => {
    if (!showGamePlay || hasUsedHint || isGameDataLoading || !currentGameDetails?.hint) {
      setShowHintPrompt(false);
      return;
    }
    if (slots.every((slot) => slot)) {
      setShowHintPrompt(false);
      return;
    }
    const timer = window.setTimeout(() => setShowHintPrompt(true), 12000);
    return () => window.clearTimeout(timer);
  }, [showGamePlay, hasUsedHint, isGameDataLoading, currentGameDetails, slots]);

  useEffect(() => {
    if (!showGamePlay || !answerKey || hasChecked) return;
    if (slots.every(Boolean) && slots.length === answerKey.length) {
      const attempt = slots.join('');
      if (attempt === answerKey) {
        setHasChecked(true);
        setShowCelebration(true);
        setShowCheckModal(false);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F472B6', '#FBBF24', '#60A5FA', '#34D399', '#A78BFA'],
        });
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#F472B6', '#FBBF24', '#60A5FA', '#34D399', '#A78BFA'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#F472B6', '#FBBF24', '#60A5FA', '#34D399', '#A78BFA'],
        });
        window.setTimeout(() => {
          setShowCelebration(false);
          setShowCongratulationsModal(true);
        }, 2000);
      }
    }
  }, [slots, answerKey, showGamePlay, hasChecked]);

  const handleGameClick = (game: GameCard) => {
    const gameIndex = games.findIndex((g) => g.id === game.id);
    setCurrentGameIndex(gameIndex);
    setSelectedGame(game);
    setShowGame(true);
    setShowGamePlay(false);
    setCurrentGameDetails(null);
    setAnswerKey('');
    setSlots([]);
    setPool([]);
    setBasePool([]);
    setShowDescriptionModal(false);
    setShowCelebration(false);
    setShowHintPrompt(false);
    setHasUsedHint(false);
    setHasChecked(false);
    setShowHintModal(false);
    setShowCheckModal(false);
    setShowCongratulationsModal(false);
  };

  const normalizeAnswer = (answer: string) => answer.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  const generatePoolFromAnswer = (answer: string) => {
    const letters = answer.split('');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const extrasCount = Math.max(3, Math.min(6, Math.ceil(answer.length / 2) || 3));
    for (let i = 0; i < extrasCount; i += 1) {
      const randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
      letters.push(randomChar);
    }
    for (let i = letters.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters;
  };

  const initializeGameBoard = (answer: string) => {
    const normalized = normalizeAnswer(answer || '');
    const safeAnswer = normalized || 'FUN';
    setAnswerKey(safeAnswer);
    setSlots(Array(safeAnswer.length).fill(null));
    const poolLetters = generatePoolFromAnswer(safeAnswer);
    setPool(poolLetters);
    setBasePool(poolLetters);
  };

  const handleStartGame = async () => {
    if (!selectedGame) return;
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    setShowDescriptionModal(false);
    setShowHintPrompt(false);
    setHasChecked(false);
    setShowHintModal(false);
    setShowCheckModal(false);
    setIsGameDataLoading(true);
    try {
      const details = await getGameById(selectedGame.id, token);
      setCurrentGameDetails(details);
      initializeGameBoard(details.correct_answer || details.name);
      setShowGamePlay(true);
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to load game details';
      showErrorToast(formatErrorMessage(errorMessage));
    } finally {
      setIsGameDataLoading(false);
    }
  };

  const handleBackToList = () => {
    setShowGame(false);
    setShowGamePlay(false);
    setSelectedGame(null);
    setCurrentGameDetails(null);
    setAnswerKey('');
    setSlots([]);
    setPool([]);
    setBasePool([]);
    setShowDescriptionModal(false);
    setShowCelebration(false);
    setShowHintPrompt(false);
    setHasUsedHint(false);
    setHasChecked(false);
    setShowHintModal(false);
    setShowCheckModal(false);
    setShowCongratulationsModal(false);
    setCurrentGameIndex(-1);
  };

  const handleNextGame = async () => {
    if (currentGameIndex < 0 || currentGameIndex >= games.length - 1) {
      handleBackToList();
      return;
    }

    const nextGame = games[currentGameIndex + 1];
    if (!nextGame) {
      handleBackToList();
      return;
    }

    setShowCongratulationsModal(false);
    setShowCelebration(false);
    setCurrentGameIndex(currentGameIndex + 1);
    setSelectedGame(nextGame);
    setShowGamePlay(false);
    setCurrentGameDetails(null);
    setAnswerKey('');
    setSlots([]);
    setPool([]);
    setBasePool([]);
    setShowDescriptionModal(false);
    setShowHintPrompt(false);
    setHasUsedHint(false);
    setHasChecked(false);
    setShowHintModal(false);
    setShowCheckModal(false);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsGameDataLoading(true);
    try {
      const details = await getGameById(nextGame.id, token);
      setCurrentGameDetails(details);
      initializeGameBoard(details.correct_answer || details.name);
      setShowGamePlay(true);
    } catch (error) {
      const errorMessage = error instanceof ApiClientError
        ? error.message
        : error instanceof Error
        ? error.message
        : 'Failed to load game details';
      showErrorToast(formatErrorMessage(errorMessage));
    } finally {
      setIsGameDataLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, letter: string, from: 'pool' | number) => {
    e.dataTransfer.setData('application/letter', JSON.stringify({ letter, from }));
    e.dataTransfer.effectAllowed = 'move';
    playDragSound();
  };

  const handleDropOnSlot = (e: React.DragEvent<HTMLDivElement>, slotIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/letter');
    if (!data) return;
    const { letter, from } = JSON.parse(data) as { letter: string; from: 'pool' | number };
    if (slots[slotIndex]) return;
    const nextSlots = [...slots];
    if (from === 'pool') {
      nextSlots[slotIndex] = letter;
      setSlots(nextSlots);
      setPool((prev) => {
        const idx = prev.indexOf(letter);
        if (idx >= 0) {
          const copy = [...prev];
          copy.splice(idx, 1);
          return copy;
        }
        return prev;
      });
      playDragSound();
      setShowCheckModal(false);
    } else {
      const prevIndex = from as number;
      const movingLetter = nextSlots[prevIndex];
      if (!movingLetter) return;
      nextSlots[prevIndex] = null;
      nextSlots[slotIndex] = movingLetter;
      setSlots(nextSlots);
      playDragSound();
      setShowCheckModal(false);
    }
  };

  const handleAllowDrop = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const handleDropBackToPool = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/letter');
    if (!data) return;
    const { letter, from } = JSON.parse(data) as { letter: string; from: 'pool' | number };
    if (from !== 'pool') {
      const fromIndex = from as number;
      const nextSlots = [...slots];
      if (nextSlots[fromIndex] === letter) {
        nextSlots[fromIndex] = null;
        setSlots(nextSlots);
        setPool((prev) => [...prev, letter]);
        playDragSound();
        setShowCheckModal(false);
      }
    }
  };

  const handleSlotClick = (index: number) => {
    const letter = slots[index];
    if (!letter) {
      // If slot is empty and we have an active touch letter, place it here
      if (activeTouchLetter) {
        const { letter: touchLetter, from } = activeTouchLetter;
        const nextSlots = [...slots];
        nextSlots[index] = touchLetter;
        setSlots(nextSlots);
        if (from === 'pool') {
          setPool((prev) => {
            const idx = prev.indexOf(touchLetter);
            if (idx >= 0) {
              const copy = [...prev];
              copy.splice(idx, 1);
              return copy;
            }
            return prev;
          });
        } else {
          const prevIndex = from as number;
          nextSlots[prevIndex] = null;
          setSlots(nextSlots);
        }
        playDragSound();
        setActiveTouchLetter(null);
        setTouchTargetSlot(null);
        setShowCheckModal(false);
        return;
      }
      return;
    }
    // If slot has a letter, remove it and send back to pool
    const nextSlots = [...slots];
    nextSlots[index] = null;
    setSlots(nextSlots);
    setPool((prev) => [...prev, letter]);
    setShowCheckModal(false);
  };

  // Click-to-drop: Click on a pool letter to auto-fill next available slot
  const handlePoolLetterClick = (letter: string) => {
    // Find the first empty slot
    const emptySlotIndex = slots.findIndex((slot) => !slot);
    if (emptySlotIndex >= 0) {
      const nextSlots = [...slots];
      nextSlots[emptySlotIndex] = letter;
      setSlots(nextSlots);
      setPool((prev) => {
        const idx = prev.indexOf(letter);
        if (idx >= 0) {
          const copy = [...prev];
          copy.splice(idx, 1);
          return copy;
        }
        return prev;
      });
      playDragSound();
      setShowCheckModal(false);
    }
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>, letter: string, from: 'pool' | number) => {
    e.preventDefault();
    setActiveTouchLetter({ letter, from });
    playDragSound();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!activeTouchLetter) return;
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const slotElement = element.closest('[data-slot-index]');
      if (slotElement) {
        const slotIndex = parseInt(slotElement.getAttribute('data-slot-index') || '-1', 10);
        if (slotIndex >= 0 && slotIndex < slots.length) {
          setTouchTargetSlot(slotIndex);
        }
      } else {
        setTouchTargetSlot(null);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!activeTouchLetter) {
      setActiveTouchLetter(null);
      setTouchTargetSlot(null);
      return;
    }

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element) {
      const slotElement = element.closest('[data-slot-index]');
      if (slotElement) {
        const slotIndex = parseInt(slotElement.getAttribute('data-slot-index') || '-1', 10);
        if (slotIndex >= 0 && slotIndex < slots.length && !slots[slotIndex]) {
          // Place letter in slot (same logic as handleDropOnSlot)
          const { letter, from } = activeTouchLetter;
          const nextSlots = [...slots];
          if (from === 'pool') {
            nextSlots[slotIndex] = letter;
            setSlots(nextSlots);
            setPool((prev) => {
              const idx = prev.indexOf(letter);
              if (idx >= 0) {
                const copy = [...prev];
                copy.splice(idx, 1);
                return copy;
              }
              return prev;
            });
            playDragSound();
            setShowCheckModal(false);
          } else {
            const prevIndex = from as number;
            const movingLetter = nextSlots[prevIndex];
            if (movingLetter) {
              nextSlots[prevIndex] = null;
              nextSlots[slotIndex] = movingLetter;
              setSlots(nextSlots);
              playDragSound();
              setShowCheckModal(false);
            }
          }
        }
      } else {
        // Check if dropped on pool area
        const poolElement = element.closest('[data-pool-area]');
        if (poolElement && activeTouchLetter.from !== 'pool') {
          // Return letter to pool (same logic as handleDropBackToPool)
          const { letter, from } = activeTouchLetter;
          const fromIndex = from as number;
          const nextSlots = [...slots];
          if (nextSlots[fromIndex] === letter) {
            nextSlots[fromIndex] = null;
            setSlots(nextSlots);
            setPool((prev) => [...prev, letter]);
            playDragSound();
            setShowCheckModal(false);
          }
        }
      }
    }
    
    setActiveTouchLetter(null);
    setTouchTargetSlot(null);
  };

  const handleClear = () => {
    if (!answerKey) return;
    setSlots(Array(answerKey.length).fill(null));
    setPool([...basePool]);
    setHasChecked(false);
    setShowCheckModal(false);
  };

  const handleHintClick = () => {
    if (isGameDataLoading) return;
    setHasUsedHint(true);
    setShowHintPrompt(false);
    setShowHintModal(true);
  };

  const handleCheckWord = () => {
    if (!answerKey || !currentGameDetails) return;
    setCheckModalMessage(`Correct answer: ${currentGameDetails.correct_answer || answerKey}`);
    setShowCheckModal(true);
  };

  const isCorrect = answerKey.length > 0 && slots.every(Boolean) && slots.join('') === answerKey;
  const progressPercent = answerKey.length
    ? Math.round((slots.filter(Boolean).length / answerKey.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ElementaryNavbar onMenuToggle={handleMenuToggle} />
      <div className="flex">
        <ElementarySidebar activeItem="games" isMobileMenuOpen={isMobileMenuOpen} onMobileMenuClose={handleMenuClose} />

        <main className="flex-1 bg-linear-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] sm:pl-[280px] lg:pl-[320px]">
          <div className="p-4 lg:p-8">
            {/* Heading */}
            <div className="bg-white/60 rounded-xl shadow-md px-4 sm:px-6 py-4 sm:py-5 sm:ml-8 sm:mr-8" style={{ fontFamily: 'Andika, sans-serif' }}>
              <div>
                <div className="text-[20px] sm:text-[22px] lg:text-[24px] font-semibold text-[#7C3AED]">Fun & Games!</div>
                <div className="text-[14px] sm:text-[15px] text-[#4B5563] mt-1">Test what you learned with fun games and quizzes!</div>
              </div>
            </div>

            {/* Games content */}
            <div className="sm:ml-8 sm:mr-8 mt-6">
                {!showGame ? (
                  games.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                      {games.map((game) => (
                      <div
                        key={game.id}
                        className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.08)] overflow-hidden hover:shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-300 cursor-pointer"
                        onClick={() => handleGameClick(game)}
                      >
                        <div className="relative h-32 sm:h-36 lg:h-40 bg-linear-to-br from-gray-50 via-gray-100 to-gray-200 overflow-hidden">
                          {game.image ? (
                            <Image
                              src={game.image}
                              alt={game.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className={`w-16 h-16 rounded-full ${game.iconBgColor} flex items-center justify-center`}>
                                <Icon icon={game.icon} className="text-gray-700" width={32} height={32} />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-4 sm:p-5">
                          <div className="flex items-start gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-full ${game.iconBgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                              <Icon icon={game.icon} className="text-gray-700" width={20} height={20} />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-[16px] sm:text-[18px] font-semibold text-[#111827] mb-1" style={{ fontFamily: 'Andika, sans-serif' }}>
                                {game.title}
                              </h3>
                              <p className="text-[12px] sm:text-[13px] text-[#6B7280]" style={{ fontFamily: 'Andika, sans-serif' }}>
                                {game.description}
                              </p>
                            </div>
                      </div>
                        <button
                          type="button"
                            className={`w-full ${game.buttonColor} text-white text-[13px] sm:text-[14px] font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm`}
                            style={{ fontFamily: 'Andika, sans-serif' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGameClick(game);
                            }}
                          >
                            Play Now!
                            <Icon icon="mdi:play" width={16} height={16} />
                        </button>
                        </div>
                      </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white/70 rounded-2xl shadow-md px-6 py-12 text-center">
                      <p className="text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                        No games available at the moment.
                      </p>
                  </div>
                  )
                ) : !showGamePlay ? (
                  <div className="bg-white/70 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] px-4 sm:px-6 py-6 sm:py-10 border-2" style={{ borderColor: '#FACC15' }}>
                    <div className="text-center" style={{ fontFamily: 'Andika, sans-serif' }}>
                      <div className="text-[24px] sm:text-[28px] lg:text-[34px] font-extrabold text-[#7C3AED]">
                        Let's Play {selectedGame?.title || 'Game'}!
                      </div>
                      <div className="text-[14px] sm:text-[16px] text-[#4B5563] mt-2">
                        {selectedGame?.instructions || selectedGame?.description || 'Look at the picture and spell the word correctly!'}
                      </div>
                      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={handleStartGame}
                          disabled={isGameDataLoading}
                          className="h-12 px-6 rounded-full text-white flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ background: 'linear-gradient(90deg, #10B981, #3B82F6)' }}
                        >
                          {isGameDataLoading ? (
                            <>
                              <Icon icon="mdi:loading" className="animate-spin" width={20} height={20} />
                              Loading...
                            </>
                          ) : (
                            <>
                          <Icon icon="mdi:play-circle" width={20} height={20} />
                          Start Game
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="h-12 px-6 rounded-full text-white flex items-center gap-2 shadow-md cursor-pointer"
                          style={{ background: 'linear-gradient(90deg, #FDBA74, #F97316)' }}
                          onClick={() => setShowDescriptionModal(true)}
                        >
                          <Icon icon="mdi:help-circle" width={20} height={20} />
                          How to Play
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                  <div className="bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.08)] p-4 sm:p-6 border" style={{ borderColor: '#E5E7EB' }}>
                    <div className="flex flex-col items-center" style={{ fontFamily: 'Andika, sans-serif' }}>
                      <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between items-center mb-4">
                        <button 
                          className="h-10 px-4 rounded-full text-white text-sm flex items-center gap-2 cursor-pointer" 
                          style={{ background: 'linear-gradient(90deg, #FB923C, #F97316)' }} 
                          onClick={handleBackToList}
                        >
                          <Icon icon="mdi:arrow-left" /> Back to List
                        </button>
                        <div className="text-center flex items-center gap-2">
                          <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#7C3AED]" style={{ fontFamily: 'Andika, sans-serif' }}>
                            {selectedGame?.title || 'Let\'s Play!'}
                          </h2>
                          {(currentGameDetails?.description || selectedGame?.description) && (
                            <button
                              type="button"
                              className="w-8 h-8 rounded-full bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center"
                              onClick={() => setShowDescriptionModal(true)}
                              aria-label="Show description"
                            >
                              <Icon icon="mdi:information-outline" />
                            </button>
                          )}
                        </div>
                        <div className="w-24"></div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl w-full max-w-3xl p-3 sm:p-4 md:p-6 shadow-inner">
                        {isGameDataLoading ? (
                          <div className="w-full flex justify-center py-12">
                            <Spinner size="lg" />
                          </div>
                        ) : (
                        <div className="flex flex-col items-center w-full">
                          <div className="mb-4">
                            {currentGameDetails?.image ? (
                            <div className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] rounded-xl overflow-hidden shadow mx-auto">
                                <Image
                                  src={currentGameDetails.image}
                                  alt={currentGameDetails.name || 'game'}
                                  width={160}
                                  height={160}
                                  className="object-cover w-full h-full"
                                />
                              </div>
                            ) : (
                              <div className="w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] rounded-xl shadow bg-gray-200 flex items-center justify-center mx-auto">
                                <Icon icon="mdi:image-off-outline" className="text-gray-500" width={32} height={32} />
                              </div>
                            )}
                            </div>
                          <div className="text-[14px] sm:text-[15px] md:text-[16px] text-[#111827] mb-3 text-center px-2">
                            {currentGameDetails?.instructions || selectedGame?.instructions || 'Spell the word!'}
                          </div>

                          {/* Drop slots */}
                          <div className="w-full flex items-center justify-center gap-2 sm:gap-3 mb-6 flex-wrap px-2">
                            {slots.map((s, idx) => (
                              <div
                                key={idx}
                                data-slot-index={idx}
                                onDrop={(e) => handleDropOnSlot(e, idx)}
                                onDragOver={handleAllowDrop}
                                onTouchEnd={(e) => {
                                  if (activeTouchLetter && !s) {
                                    // Place letter in slot from touch
                                    const { letter, from } = activeTouchLetter;
                                    const nextSlots = [...slots];
                                    if (from === 'pool') {
                                      nextSlots[idx] = letter;
                                      setSlots(nextSlots);
                                      setPool((prev) => {
                                        const idx = prev.indexOf(letter);
                                        if (idx >= 0) {
                                          const copy = [...prev];
                                          copy.splice(idx, 1);
                                          return copy;
                                        }
                                        return prev;
                                      });
                                      playDragSound();
                                      setShowCheckModal(false);
                                    } else {
                                      const prevIndex = from as number;
                                      const movingLetter = nextSlots[prevIndex];
                                      if (movingLetter) {
                                        nextSlots[prevIndex] = null;
                                        nextSlots[idx] = movingLetter;
                                        setSlots(nextSlots);
                                        playDragSound();
                                        setShowCheckModal(false);
                                      }
                                    }
                                    setActiveTouchLetter(null);
                                    setTouchTargetSlot(null);
                                  } else {
                                    handleSlotClick(idx);
                                  }
                                }}
                                onClick={() => handleSlotClick(idx)}
                                className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-[16px] sm:text-[18px] md:text-[20px] font-semibold transition-all cursor-pointer touch-none select-none ${
                                  s 
                                    ? 'bg-white shadow-md hover:shadow-lg active:scale-95' 
                                    : touchTargetSlot === idx
                                    ? 'bg-blue-50 border-2 border-blue-400 border-dashed'
                                    : 'bg-white border border-dashed border-[#E5E7EB] hover:border-[#3B82F6]'
                                }`}
                                style={s ? { border: '2px solid transparent', background: 'linear-gradient(#FFFFFF,#FFFFFF) padding-box, linear-gradient(90deg, #22C55E, #3B82F6) border-box' } : undefined}
                                title={s ? 'Tap to send back to the letter pool' : 'Tap a letter to fill this slot'}
                              >
                                {s && (
                                  <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, s, idx)}
                                    onTouchStart={(e) => handleTouchStart(e, s, idx)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    className="w-full h-full flex items-center justify-center rounded-xl select-none"
                                  >
                                    {s}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="text-[13px] sm:text-[14px] md:text-[15px] text-[#4B5563] mb-3 text-center">
                            <span className="hidden sm:inline">Choose the letters: </span>
                            <span className="sm:hidden">Tap letters to fill slots:</span>
                          </div>

                          {/* Pool */}
                          <div
                            data-pool-area
                            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-6 min-h-[72px] w-full border-2 border-dashed border-transparent hover:border-[#C7D2FE] rounded-2xl bg-white/60 transition px-3 sm:px-4 py-2"
                            onDrop={handleDropBackToPool}
                            onDragOver={handleAllowDrop}
                          >
                            {pool.map((ch, i) => (
                              <div
                                key={`${ch}-${i}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, ch, 'pool')}
                                onTouchStart={(e) => handleTouchStart(e, ch, 'pool')}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                onClick={() => handlePoolLetterClick(ch)}
                                className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center text-[16px] sm:text-[18px] md:text-[20px] font-semibold border border-[#E5E7EB] shadow-sm cursor-pointer touch-none select-none transition-all hover:shadow-md hover:scale-105 active:scale-95 ${
                                  activeTouchLetter?.letter === ch && activeTouchLetter?.from === 'pool' ? 'ring-2 ring-blue-400 scale-110' : ''
                                }`}
                                title="Tap to auto-fill or drag to a slot"
                              >
                                {ch}
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full">
                            <button
                              onClick={handleClear}
                              className="h-10 sm:h-11 px-5 sm:px-6 rounded-full text-white text-sm sm:text-base flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center shadow-md hover:shadow-lg transition-all active:scale-95"
                              style={{ background: 'linear-gradient(90deg, #FB923C, #F97316)' }}
                            >
                              <Icon icon="mdi:refresh" width={18} height={18} /> Clear
                            </button>
                            <div className="relative w-full sm:w-auto">
                              {showCheckModal && (
                                <div
                                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg p-4 max-w-xs w-64 z-50 border border-gray-200"
                                  style={{ fontFamily: 'Andika, sans-serif' }}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-[#16A34A]">Great Job!</h4>
                                    <button
                                      type="button"
                                      className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs"
                                      onClick={() => setShowCheckModal(false)}
                                    >
                                      <Icon icon="mdi:close" width={14} height={14} />
                                    </button>
                                  </div>
                                  <p className="text-xs text-[#4B5563]">{checkModalMessage}</p>
                                </div>
                              )}
                              <button
                                ref={checkButtonRef}
                                onClick={handleCheckWord}
                                disabled={isGameDataLoading || !answerKey}
                                className="h-10 sm:h-11 px-5 sm:px-6 rounded-full text-white text-sm sm:text-base flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center disabled:opacity-60 shadow-md hover:shadow-lg transition-all active:scale-95"
                                style={{ background: 'linear-gradient(90deg, #22C55E, #16A34A)' }}
                              >
                              <Icon icon="mdi:check-circle" width={18} height={18} /> Check Word
                            </button>
                            </div>
                            <div className="relative w-full sm:w-auto">
                              {showHintPrompt && (
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-[#7C3AED] text-xs font-semibold px-3 py-1 rounded-full shadow animate-bounce whitespace-nowrap z-10">
                                  Need help? Try a hint!
                                </div>
                              )}
                              {showHintModal && (
                                <div
                                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg p-4 max-w-xs w-64 z-50 border border-gray-200"
                                  style={{ fontFamily: 'Andika, sans-serif' }}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-[#7C3AED]">Hint</h4>
                                    <button
                                      type="button"
                                      className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs"
                                      onClick={() => setShowHintModal(false)}
                                    >
                                      <Icon icon="mdi:close" width={14} height={14} />
                                    </button>
                                  </div>
                                  <p className="text-xs text-[#4B5563]">
                                    {currentGameDetails?.hint || currentGameDetails?.instructions || selectedGame?.instructions || 'Keep trying!'}
                                  </p>
                                </div>
                              )}
                              <button
                                ref={hintButtonRef}
                                type="button"
                                disabled={isGameDataLoading || (!currentGameDetails?.hint && !selectedGame?.instructions)}
                                onClick={handleHintClick}
                                className="h-10 sm:h-11 px-5 sm:px-6 rounded-full text-white text-sm sm:text-base flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center disabled:opacity-60 shadow-md hover:shadow-lg transition-all active:scale-95"
                                style={{ background: 'linear-gradient(90deg, #60A5FA, #2563EB)' }}
                              >
                              <Icon icon="mdi:lightbulb-on-outline" width={18} height={18} /> Hint
                            </button>
                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Progress section */}
                  <div className="mt-6 bg-white/70 rounded-2xl shadow p-4">
                    <div className="text-[14px] text-[#111827] mb-2" style={{ fontFamily: 'Andika, sans-serif' }}>Progress</div>
                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-3 rounded-full"
                        style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #22C55E, #3B82F6)' }}
                      />
                    </div>
                  </div>
                  </>
                )}
              </div>
          </div>
        </main>
      </div>
      {showDescriptionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-lg" style={{ fontFamily: 'Andika, sans-serif' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#111827] flex items-center gap-2">
                <Icon icon="mdi:help-circle" className="text-[#3B82F6]" width={24} height={24} />
                How to Play
              </h3>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                onClick={() => setShowDescriptionModal(false)}
              >
                <Icon icon="mdi:close" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm font-medium text-[#1E40AF] mb-2">📝 Instructions:</p>
                <p className="text-sm text-[#4B5563] leading-relaxed">
                  Drag and drop the letters that form the correct answer to the boxes in the right order.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#10B981] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Look at the image or question</p>
                    <p className="text-xs text-[#6B7280] mt-1">Read the question carefully to understand what word you need to spell.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Drag or tap letters from the pool</p>
                    <p className="text-xs text-[#6B7280] mt-1">On desktop: Click and drag letters from the pool to the boxes. On mobile/tablet: Simply tap a letter to automatically fill the next empty slot!</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Place them in the correct order</p>
                    <p className="text-xs text-[#6B7280] mt-1">Drop each letter into the boxes in the right order to spell the word correctly.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Get instant feedback</p>
                    <p className="text-xs text-[#6B7280] mt-1">When all boxes are filled correctly, you'll see a celebration! 🎉</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <p className="text-xs text-[#92400E] flex items-center gap-2">
                  <Icon icon="mdi:lightbulb-on" width={16} height={16} />
                  <span><strong>Tip:</strong> Tap a letter in a box to send it back to the pool. On mobile, tap any letter in the pool to auto-fill the next slot!</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="relative">
            <div className="bg-white/95 rounded-3xl px-10 py-8 text-center shadow-2xl animate-pulse" style={{ fontFamily: 'Andika, sans-serif' }}>
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-xl font-bold text-[#7C3AED]">Fantastic!</p>
              <p className="text-sm text-[#4B5563] mt-1">You spelled it perfectly! 🌟</p>
            </div>
          </div>
        </div>
      )}
      {showCongratulationsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" style={{ fontFamily: 'Andika, sans-serif' }}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h2 className="text-3xl font-bold bg-linear-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Amazing Job!
              </h2>
              <p className="text-lg text-gray-700 mb-1">You completed the game!</p>
              <p className="text-sm text-gray-500 mb-8">You're doing great! Keep it up! ⭐</p>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                {currentGameIndex >= 0 && currentGameIndex < games.length - 1 ? (
                  <button
                    onClick={handleNextGame}
                    className="flex-1 h-12 px-6 rounded-full text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    style={{ background: 'linear-gradient(90deg, #10B981, #3B82F6)' }}
                  >
                    <Icon icon="mdi:arrow-right" width={20} height={20} />
                    Next Game
                  </button>
                ) : (
                  <button
                    onClick={handleBackToList}
                    className="flex-1 h-12 px-6 rounded-full text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    style={{ background: 'linear-gradient(90deg, #10B981, #3B82F6)' }}
                  >
                    <Icon icon="mdi:trophy" width={20} height={20} />
                    All Games Done!
                  </button>
                )}
                <button
                  onClick={handleBackToList}
                  className="flex-1 h-12 px-6 rounded-full text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2 shadow-md transition-all transform hover:scale-105"
                >
                  <Icon icon="mdi:home" width={20} height={20} />
                  Back to Games
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

