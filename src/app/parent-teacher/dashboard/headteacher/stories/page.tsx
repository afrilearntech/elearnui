"use client";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { PortalLoadingOverlay } from "@/components/parent-teacher/PortalDataSkeleton";
import { ApiClientError } from "@/lib/api/client";
import {
  getHeadTeacherStories,
  publishHeadTeacherStories,
  type TeacherStoryListItem,
} from "@/lib/api/parent-teacher/teacher";
import { ptQueryKeys } from "@/lib/parent-teacher/queryKeys";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const STORY_TAG_CHOICES = [
  "Friendship",
  "Honesty",
  "Kindness",
  "Respect",
  "Responsibility",
  "Courage",
  "Perseverance",
  "Teamwork",
  "Empathy",
  "Patience",
  "Gratitude",
  "Creativity",
  "Curiosity",
  "Problem Solving",
] as const;

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StoryCard({
  story,
  selected,
  onToggle,
}: {
  story: TeacherStoryListItem;
  selected: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="relative">
        {story.cover_image?.image_url ? (
          <img
            src={story.cover_image.image_url}
            alt={story.cover_image.alt_text || story.title}
            className="h-40 w-full object-cover"
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-gradient-to-br from-indigo-50 to-emerald-50 text-sm text-gray-500">
            No cover image
          </div>
        )}

        <label className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-gray-700 shadow">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Select
        </label>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold text-gray-900">{story.title}</h3>
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              story.is_published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {story.is_published ? "Published" : "Pending"}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {story.grade}
          </span>
          <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
            {story.tag}
          </span>
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
            {story.estimated_minutes} min
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-gray-600">
          <span className="font-medium text-gray-700">Moral:</span> {story.moral}
        </p>

        <p className="text-xs text-gray-500">Created {formatDate(story.created_at)}</p>
      </div>
    </article>
  );
}

export default function HeadTeacherStoriesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [authReady, setAuthReady] = useState(false);

  const [grade, setGrade] = useState("");
  const [tag, setTag] = useState("");
  const [publishState, setPublishState] = useState<"all" | "published" | "pending">("all");
  const [schoolId, setSchoolId] = useState("");
  const [selectedStoryIds, setSelectedStoryIds] = useState<number[]>([]);

  useLayoutEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/parent-teacher/sign-in/teacher");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user?.role !== "HEADTEACHER") {
        router.push("/parent-teacher/dashboard/teacher");
        return;
      }
    } catch {
      router.push("/parent-teacher/sign-in/teacher");
      return;
    }

    setAuthReady(true);
  }, [router]);

  const schoolIdNumber = schoolId.trim().length > 0 ? Number(schoolId) : undefined;
  const isPublishedFilter =
    publishState === "all" ? undefined : publishState === "published";

  const {
    data: stories = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: [...ptQueryKeys.headTeacherStories, { grade, tag, isPublishedFilter, schoolIdNumber }],
    queryFn: () =>
      getHeadTeacherStories({
        grade: grade || undefined,
        tag: tag || undefined,
        is_published: isPublishedFilter,
        school_id: schoolIdNumber,
      }),
    enabled: authReady,
  });

  const publishMutation = useMutation({
    mutationFn: publishHeadTeacherStories,
    onSuccess: (data) => {
      showSuccessToast(data.message || data.detail || "Stories published.");
      setSelectedStoryIds([]);
      queryClient.invalidateQueries({ queryKey: ptQueryKeys.headTeacherStories });
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        showErrorToast(err.message || "Failed to publish selected stories.");
      } else {
        showErrorToast("Failed to publish selected stories.");
      }
    },
  });

  const gradeOptions = useMemo(
    () => Array.from(new Set(stories.map((story) => story.grade))).sort(),
    [stories]
  );

  const visibleStoryIds = useMemo(() => stories.map((story) => story.id), [stories]);

  const allVisibleSelected =
    visibleStoryIds.length > 0 && visibleStoryIds.every((id) => selectedStoryIds.includes(id));

  const selectedPublishableCount = useMemo(
    () => stories.filter((story) => selectedStoryIds.includes(story.id) && !story.is_published).length,
    [stories, selectedStoryIds]
  );

  const handleToggleStory = (storyId: number, checked: boolean) => {
    setSelectedStoryIds((prev) => {
      if (checked) {
        if (prev.includes(storyId)) return prev;
        return [...prev, storyId];
      }
      return prev.filter((id) => id !== storyId);
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedStoryIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...visibleStoryIds]));
      }
      return prev.filter((id) => !visibleStoryIds.includes(id));
    });
  };

  const publishSelected = () => {
    if (selectedStoryIds.length === 0) {
      showErrorToast("Select at least one story to publish.");
      return;
    }
    publishMutation.mutate({ story_ids: selectedStoryIds });
  };

  const errorMessage =
    isError && error instanceof ApiClientError
      ? error.message
      : "Failed to load stories. Please try again.";

  if (!authReady) {
    return (
      <DashboardLayout>
        <PortalLoadingOverlay label="Loading head teacher stories..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Icon icon="solar:book-2-bold" className="h-4 w-4" />
                Story Approval
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">Head Teacher Stories</h1>
              <p className="mt-2 max-w-2xl text-white/90">
                Approve and publish stories generated by teachers in your school.
              </p>
            </div>
            <button
              type="button"
              onClick={publishSelected}
              disabled={selectedStoryIds.length === 0 || publishMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {publishMutation.isPending ? (
                <>
                  <Icon icon="solar:loading-bold" className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Icon icon="solar:check-circle-bold" className="h-4 w-4" />
                  Publish selected ({selectedStoryIds.length})
                </>
              )}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">All grades</option>
              {gradeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="">All tags</option>
              {STORY_TAG_CHOICES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={publishState}
              onChange={(e) => setPublishState(e.target.value as typeof publishState)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="published">Published</option>
            </select>

            <input
              type="number"
              min={1}
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              placeholder="School ID"
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />

            <button
              type="button"
              onClick={() => {
                setGrade("");
                setTag("");
                setPublishState("all");
                setSchoolId("");
                setSelectedStoryIds([]);
              }}
              className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Reset filters
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing <span className="font-semibold text-gray-900">{stories.length}</span>{" "}
              {stories.length === 1 ? "story" : "stories"}. {selectedPublishableCount} selected pending publication.
            </p>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Select all on this view
            </label>
          </div>
        </section>

        <section>
          {isPending ? (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-600">
              <Icon icon="solar:loading-bold" className="mx-auto mb-3 h-8 w-8 animate-spin text-indigo-600" />
              Loading stories...
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</div>
          ) : stories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-600">
              No stories found for the current filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stories.map((story) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  selected={selectedStoryIds.includes(story.id)}
                  onToggle={(checked) => handleToggleStory(story.id, checked)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
