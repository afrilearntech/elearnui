'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import StudentLoadingScreen from '@/components/ui/StudentLoadingScreen';
import { getKidsStories, getKidsStoryById } from '@/lib/api/kidsStories';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import { studentQueryKeys } from '@/lib/student/queryKeys';
import { useStudentAuthReady } from '@/hooks/student/useStudentAuthReady';
import { useAccessibility } from '@/contexts/AccessibilityContext';

function ReadAloudConfigModal({
  isOpen,
  onClose,
  voices,
  voiceUri,
  setVoiceUri,
  rate,
  setRate,
  isSpeaking,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
}: {
  isOpen: boolean;
  onClose: () => void;
  voices: SpeechSynthesisVoice[];
  voiceUri: string;
  setVoiceUri: (value: string) => void;
  rate: number;
  setRate: (value: number) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Read aloud settings">
      <div
        className="w-full max-w-xl rounded-3xl border border-white/70 bg-white p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Icon icon="mdi:volume-high" width={14} height={14} />
              Read Aloud Settings
            </p>
            <h3 className="mt-2 text-xl font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
              Choose your reading voice
            </h3>
            <p className="mt-1 text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
              Pick a voice and speed, then tap start to listen.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Close read aloud settings">
            <Icon icon="solar:close-circle-bold" width={24} height={24} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Voice</span>
            <select
              value={voiceUri}
              onChange={(e) => setVoiceUri(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200">
              {voices.length === 0 ? (
                <option value="">Default voice</option>
              ) : (
                voices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>
                    {voice.name} ({voice.lang})
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-gray-700">Speed: {rate.toFixed(1)}x</span>
            <input
              type="range"
              min={0.6}
              max={1.4}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Slower</span>
              <span>Normal</span>
              <span>Faster</span>
            </div>
          </label>
        </div>

        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
              {isSpeaking ? (isPaused ? 'Paused' : 'Reading') : 'Stopped'}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
              Speed {rate.toFixed(1)}x
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              <Icon icon="mdi:play" width={18} height={18} />
              Start
            </button>
            {!isPaused ? (
              <button
                type="button"
                onClick={onPause}
                disabled={!isSpeaking}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50">
                <Icon icon="mdi:pause" width={18} height={18} />
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={onResume}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                <Icon icon="mdi:play-circle" width={18} height={18} />
                Resume
              </button>
            )}
            <button
              type="button"
              onClick={onStop}
              disabled={!isSpeaking && !isPaused}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50">
              <Icon icon="mdi:stop" width={18} height={18} />
              Stop
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ElementaryStoryReaderPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const storyId = Number(params?.id);
  const authReady = useStudentAuthReady();
  const { isEnabled, announce } = useAccessibility();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState('');
  const [rate, setRate] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isReadAloudModalOpen, setIsReadAloudModalOpen] = useState(false);

  const {
    data: story,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: studentQueryKeys.kidsStoryDetail(Number.isFinite(storyId) ? storyId : -1),
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token || !Number.isFinite(storyId)) throw new Error('Invalid story request');
      return getKidsStoryById(token, storyId);
    },
    enabled: authReady && Number.isFinite(storyId),
  });

  const { data: stories = [] } = useQuery({
    queryKey: studentQueryKeys.kidsStories,
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Missing auth token');
      return getKidsStories(token);
    },
    enabled: authReady && Number.isFinite(storyId),
  });

  useEffect(() => {
    if (!isError) return;
    const message =
      error instanceof ApiClientError ? error.message : 'Failed to load story.';
    showErrorToast(formatErrorMessage(message));
  }, [isError, error]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const loaded = window.speechSynthesis.getVoices();
      if (loaded.length === 0) return;
      setVoices(loaded);
      if (!voiceUri) {
        const preferred =
          loaded.find((voice) => voice.lang.toLowerCase().startsWith('en') && /female|samantha|zira|karen|susan/i.test(voice.name)) ||
          loaded.find((voice) => voice.lang.toLowerCase().startsWith('en')) ||
          loaded[0];
        if (preferred) setVoiceUri(preferred.voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, [voiceUri]);

  const storySpeechText = useMemo(() => {
    if (!story) return '';
    const vocabText = story.vocabulary
      .map((entry) => `${entry.word}. ${entry.definition}.`)
      .join(' ');
    return `Title: ${story.title}. Tag: ${story.tag}. Moral: ${story.moral}. ${story.body} ${vocabText}`;
  }, [story]);

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voiceURI === voiceUri) || null,
    [voices, voiceUri]
  );

  const nextStoryId = useMemo(() => {
    if (!stories.length || !Number.isFinite(storyId)) return null;
    const currentIndex = stories.findIndex((item) => item.id === storyId);
    if (currentIndex < 0 || currentIndex >= stories.length - 1) return null;
    return stories[currentIndex + 1]?.id ?? null;
  }, [stories, storyId]);

  const startReadAloud = () => {
    if (typeof window === 'undefined' || !storySpeechText) return;
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(storySpeechText);
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      if (isEnabled) announce('Read aloud started.', 'polite');
    };
    utterance.onpause = () => {
      setIsPaused(true);
    };
    utterance.onresume = () => {
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      if (isEnabled) announce('Read aloud finished.', 'polite');
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      showErrorToast('Read aloud failed on this browser voice. Try another voice.');
    };

    synth.speak(utterance);
    setIsReadAloudModalOpen(false);
  };

  const pauseReadAloud = () => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeReadAloud = () => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopReadAloud = () => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  if (!authReady || isPending) {
    return (
      <StudentLoadingScreen
        title="Opening your story..."
        subtitle="Preparing a comfy reading experience."
      />
    );
  }

  return (
    <div className="min-h-screen">
      <ElementaryNavbar onMenuToggle={() => setIsMobileMenuOpen((v) => !v)} />
      <div className="flex">
        <ElementarySidebar
          activeItem="stories"
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-x-hidden bg-gradient-to-br from-[#FFF7ED] via-[#ECFEFF] to-[#EEF2FF] sm:pl-[280px] lg:pl-[320px]">
          <div className="mx-4 mt-6 space-y-5 pb-10 sm:mx-8 lg:mx-10">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/elementary/stories"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Icon icon="mdi:arrow-left" width={18} height={18} />
                Back to stories
              </Link>
              <Link
                href="/dashboard/elementary"
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Icon icon="mdi:home" width={18} height={18} />
                Home
              </Link>
              <button
                type="button"
                onClick={() => {
                  if (!nextStoryId) return;
                  stopReadAloud();
                  router.push(`/dashboard/elementary/stories/${nextStoryId}`);
                }}
                disabled={!nextStoryId}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50">
                Next Story
                <Icon icon="mdi:arrow-right" width={18} height={18} />
              </button>
            </div>

            {!story ? (
              <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Story not found
                </p>
                <p className="mt-2 text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Go back and open another story.
                </p>
              </section>
            ) : (
              <>
                <section className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-lg backdrop-blur sm:p-6">
                  <div className="flex flex-col gap-5 lg:flex-row">
                    {story.cover_image?.image_url ? (
                      <img
                        src={story.cover_image.image_url}
                        alt={story.cover_image.alt_text || story.title}
                        className="h-52 w-full rounded-2xl border border-gray-100 object-cover lg:w-80"
                      />
                    ) : (
                      <div className="flex h-52 w-full items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 via-yellow-100 to-blue-100 text-5xl lg:w-80">
                        📘
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
                        ✨ Story Time
                      </div>
                      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: 'Andika, sans-serif' }}>
                        {story.title}
                      </h1>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {story.grade}
                        </span>
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                          {story.tag}
                        </span>
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          {story.estimated_minutes} min read
                        </span>
                      </div>

                      <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                        <p className="text-sm font-semibold text-emerald-800" style={{ fontFamily: 'Andika, sans-serif' }}>
                          Moral of this story
                        </p>
                        <p className="mt-1 text-sm text-emerald-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                          {story.moral}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-lg backdrop-blur sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                        Listen to this story
                      </h2>
                      <p className="mt-1 text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                        Tap the button to choose voice, speed, and playback controls.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsReadAloudModalOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                      <Icon icon="mdi:volume-high" width={18} height={18} />
                      Read Aloud
                    </button>
                  </div>
                </section>

                {story.characters.length > 0 ? (
                  <section className="rounded-3xl border border-pink-100 bg-pink-50/90 p-5 shadow">
                    <h2 className="text-lg font-bold text-pink-800" style={{ fontFamily: 'Andika, sans-serif' }}>
                      Characters
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {story.characters.map((character, idx) => (
                        <li key={`${character.name}-${idx}`} className="text-sm text-pink-900">
                          <span className="font-semibold">{character.name}</span> ({character.role}) — {character.description}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {story.vocabulary.length > 0 ? (
                  <section className="rounded-3xl border border-indigo-100 bg-indigo-50/90 p-5 shadow">
                    <h2 className="text-lg font-bold text-indigo-800" style={{ fontFamily: 'Andika, sans-serif' }}>
                      New words
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {story.vocabulary.map((entry, idx) => (
                        <li key={`${entry.word}-${idx}`} className="text-sm text-indigo-900">
                          <span className="font-semibold">{entry.word}:</span> {entry.definition}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-lg">
                  <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Story text
                  </h2>
                  <div className="mt-4 space-y-4 text-[15px] leading-7 text-gray-700" style={{ fontFamily: 'Andika, sans-serif' }}>
                    {story.body
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line, idx) => (
                        <p key={idx}>{line}</p>
                      ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      <ReadAloudConfigModal
        isOpen={isReadAloudModalOpen}
        onClose={() => setIsReadAloudModalOpen(false)}
        voices={voices}
        voiceUri={voiceUri}
        setVoiceUri={setVoiceUri}
        rate={rate}
        setRate={setRate}
        isSpeaking={isSpeaking}
        isPaused={isPaused}
        onStart={startReadAloud}
        onPause={pauseReadAloud}
        onResume={resumeReadAloud}
        onStop={stopReadAloud}
      />
    </div>
  );
}
