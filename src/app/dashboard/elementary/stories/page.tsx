'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import Link from 'next/link';

import ElementaryNavbar from '@/components/elementary/ElementaryNavbar';
import ElementarySidebar from '@/components/elementary/ElementarySidebar';
import StudentLoadingScreen from '@/components/ui/StudentLoadingScreen';
import { getKidsStories, type KidsStoryListItem } from '@/lib/api/kidsStories';
import { ApiClientError } from '@/lib/api/client';
import { showErrorToast, formatErrorMessage } from '@/lib/toast';
import { studentQueryKeys } from '@/lib/student/queryKeys';
import { useStudentAuthReady } from '@/hooks/student/useStudentAuthReady';
import { useAccessibility } from '@/contexts/AccessibilityContext';

const TAG_CHOICES = [
  'Friendship',
  'Honesty',
  'Kindness',
  'Respect',
  'Responsibility',
  'Courage',
  'Perseverance',
  'Teamwork',
  'Empathy',
  'Patience',
  'Gratitude',
  'Creativity',
  'Curiosity',
  'Problem Solving',
] as const;

function StoryCard({ story }: { story: KidsStoryListItem }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-md transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      {story.cover_image?.image_url ? (
        <img
          src={story.cover_image.image_url}
          alt={story.cover_image.alt_text || story.title}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-pink-100 via-yellow-100 to-blue-100 text-4xl">
          📖
        </div>
      )}
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">
            {story.grade}
          </span>
          <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
            {story.tag}
          </span>
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {story.estimated_minutes} min
          </span>
        </div>

        <h3 className="line-clamp-2 text-lg font-bold text-gray-900" style={{ fontFamily: 'Andika, sans-serif' }}>
          {story.title}
        </h3>

        <p className="line-clamp-2 text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
          <span className="font-semibold text-gray-700">Moral:</span> {story.moral}
        </p>

        <Link
          href={`/dashboard/elementary/stories/${story.id}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:from-emerald-600 hover:to-teal-600"
          style={{ fontFamily: 'Andika, sans-serif' }}>
          <Icon icon="mdi:book-open-page-variant" width={18} height={18} />
          Open Story
        </Link>
      </div>
    </article>
  );
}

export default function ElementaryStoriesPage() {
  const authReady = useStudentAuthReady();
  const { isEnabled, announce } = useAccessibility();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [gradeFilter, setGradeFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  const {
    data: stories = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: [...studentQueryKeys.kidsStories, { gradeFilter, tagFilter }],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('Missing auth token');
      return getKidsStories(token, {
        grade: gradeFilter || undefined,
        tag: tagFilter || undefined,
      });
    },
    enabled: authReady,
  });

  useEffect(() => {
    if (!isError) return;
    const message =
      error instanceof ApiClientError ? error.message : 'Failed to load stories.';
    showErrorToast(formatErrorMessage(message));
  }, [isError, error]);

  const gradeChoices = useMemo(
    () => Array.from(new Set(stories.map((story) => story.grade))).sort(),
    [stories]
  );

  if (!authReady || isPending) {
    return (
      <StudentLoadingScreen
        title="Loading magical stories..."
        subtitle="Bringing colorful adventures to your reading castle."
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

        <main className="flex-1 overflow-x-hidden bg-gradient-to-br from-[#FFFBEB] via-[#ECFEFF] to-[#F3E8FF] sm:pl-[280px] lg:pl-[320px]">
          <div className="mx-4 mt-8 space-y-6 sm:mx-8 lg:mx-10">
            <section className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-lg backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
                    <span>🏰</span> Story Castle
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Read Amazing Stories
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 sm:text-base" style={{ fontFamily: 'Andika, sans-serif' }}>
                    Pick a story, meet fun characters, and learn great values every day.
                  </p>
                </div>
                <div className="hidden items-center gap-2 rounded-2xl bg-white/80 px-4 py-3 text-sm font-semibold text-gray-700 shadow sm:flex">
                  <Icon icon="mdi:book-open-variant" width={20} height={20} className="text-emerald-600" />
                  {stories.length} stories
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option value="">All grades</option>
                  {gradeChoices.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>

                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
                >
                  <option value="">All tags</option>
                  {TAG_CHOICES.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setGradeFilter('');
                    setTagFilter('');
                    if (isEnabled) announce('Filters reset.', 'polite');
                  }}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Reset filters
                </button>

                <div className="flex items-center justify-center rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">
                  {stories.length} story{stories.length === 1 ? '' : 'ies'}
                </div>
              </div>
            </section>

            {stories.length === 0 ? (
              <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-lg font-semibold text-gray-800" style={{ fontFamily: 'Andika, sans-serif' }}>
                  No stories found
                </p>
                <p className="mt-2 text-sm text-gray-600" style={{ fontFamily: 'Andika, sans-serif' }}>
                  Try different filters to find your next adventure.
                </p>
              </section>
            ) : (
              <section className="grid grid-cols-1 gap-4 pb-8 sm:grid-cols-2 xl:grid-cols-3">
                {stories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
