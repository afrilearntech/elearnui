"use client";

import { Icon } from "@iconify/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PortalLoadingOverlay } from "@/components/parent-teacher/PortalDataSkeleton";
import DashboardLayout from "@/components/parent-teacher/layout/DashboardLayout";
import { ApiClientError } from "@/lib/api/client";
import {
  generateTeacherStories,
  getTeacherStoryDetail,
  getTeacherStories,
  getTeacherSubjects,
  updateTeacherStory,
  type TeacherStoryCharacter,
  type TeacherStoryDetail,
  type TeacherStoryListItem,
  type TeacherStoryVocabulary,
  type UpdateTeacherStoryRequest,
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

const STORY_COUNT_CHOICES = Array.from({ length: 10 }, (_, i) => i + 1);

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type StoryEditDraft = {
  title: string;
  grade: string;
  tag: string;
  estimated_minutes: number;
  cover_prompt: string;
  cover_image_url: string;
  cover_alt: string;
  moral: string;
  body: string;
  characters: TeacherStoryCharacter[];
  vocabulary: TeacherStoryVocabulary[];
};

function storyToDraft(story: TeacherStoryDetail): StoryEditDraft {
  return {
    title: story.title,
    grade: story.grade,
    tag: story.tag,
    estimated_minutes: Math.min(32767, Math.max(0, story.estimated_minutes)),
    cover_prompt: story.cover_image?.prompt ?? "",
    cover_image_url: story.cover_image?.image_url ?? "",
    cover_alt: story.cover_image?.alt_text ?? "",
    moral: story.moral,
    body: story.body,
    characters:
      story.characters.length > 0 ? story.characters.map((c) => ({ ...c })) : [{ name: "", description: "", role: "" }],
    vocabulary:
      story.vocabulary.length > 0
        ? story.vocabulary.map((v) => ({ ...v }))
        : [{ word: "", definition: "" }],
  };
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30";

const COVER_IMAGE_MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const COVER_IMAGE_CANVAS_MAX_WIDTH = 1920;
const COVER_IMAGE_JPEG_QUALITY = 0.82;

/** Resizes and JPEG-encodes locally so PATCH can send `image_url` without a separate upload API. */
function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        let width = img.naturalWidth;
        let height = img.naturalHeight;
        if (!width || !height) {
          reject(new Error("Invalid image dimensions."));
          return;
        }
        if (width > COVER_IMAGE_CANVAS_MAX_WIDTH) {
          height = Math.round((height * COVER_IMAGE_CANVAS_MAX_WIDTH) / width);
          width = COVER_IMAGE_CANVAS_MAX_WIDTH;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process image."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", COVER_IMAGE_JPEG_QUALITY));
      } catch {
        reject(new Error("Could not process image."));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image."));
    };
    img.src = objectUrl;
  });
}

function StoryDetailsModal({
  story,
  isLoading,
  isOpen,
  onClose,
  gradeOptions,
}: {
  story: TeacherStoryDetail | null;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  gradeOptions: string[];
}) {
  const queryClient = useQueryClient();
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<StoryEditDraft | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [showCoverUrlFallback, setShowCoverUrlFallback] = useState(false);
  const [isCompressingCover, setIsCompressingCover] = useState(false);

  const replaceCoverPreview = useCallback((nextUrl: string) => {
    setCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });
  }, []);

  const resetCoverFileUi = useCallback(() => {
    setCoverFile(null);
    setCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setShowCoverUrlFallback(false);
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setDraft(null);
      resetCoverFileUi();
    }
  }, [isOpen, resetCoverFileUi]);

  useEffect(() => {
    setIsEditing(false);
    setDraft(null);
    resetCoverFileUi();
  }, [story?.id, resetCoverFileUi]);

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTeacherStoryRequest }) =>
      updateTeacherStory(id, payload),
    onSuccess: (_, variables) => {
      showSuccessToast("Story saved.");
      queryClient.invalidateQueries({ queryKey: ptQueryKeys.teacherStoryDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: ptQueryKeys.teacherStories });
      setIsEditing(false);
      setDraft(null);
      resetCoverFileUi();
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to update story.");
      } else {
        showErrorToast("Failed to update story.");
      }
    },
  });

  const gradeSelectOptions = useMemo(() => {
    const set = new Set<string>(gradeOptions);
    if (story?.grade) set.add(story.grade);
    if (draft?.grade) set.add(draft.grade);
    return Array.from(set).sort();
  }, [gradeOptions, story?.grade, draft?.grade]);

  const tagSelectOptions = useMemo(() => {
    const set = new Set<string>([...STORY_TAG_CHOICES]);
    if (story?.tag) set.add(story.tag);
    if (draft?.tag) set.add(draft.tag);
    return Array.from(set).sort();
  }, [story?.tag, draft?.tag]);

  function enterEdit() {
    if (!story) return;
    resetCoverFileUi();
    setDraft(storyToDraft(story));
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setDraft(null);
    resetCoverFileUi();
  }

  function handleCoverFileChosen(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showErrorToast("Please choose an image file (JPEG, PNG, WebP, or GIF).");
      return;
    }
    if (file.size > COVER_IMAGE_MAX_UPLOAD_BYTES) {
      showErrorToast("Image must be 15 MB or smaller.");
      return;
    }
    replaceCoverPreview(URL.createObjectURL(file));
    setCoverFile(file);
    setShowCoverUrlFallback(false);
  }

  function clearChosenCoverFile() {
    setCoverFile(null);
    setCoverPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (coverFileInputRef.current) coverFileInputRef.current.value = "";
  }

  async function saveEdit() {
    if (!story || !draft) return;
    const title = draft.title.trim();
    if (!title) {
      showErrorToast("Title is required.");
      return;
    }
    if (!draft.grade.trim()) {
      showErrorToast("Grade is required.");
      return;
    }
    let imageUrl = draft.cover_image_url.trim();
    if (coverFile) {
      setIsCompressingCover(true);
      try {
        imageUrl = await compressImageFileToDataUrl(coverFile);
      } catch {
        showErrorToast("Could not read that image. Try another file.");
        return;
      } finally {
        setIsCompressingCover(false);
      }
    }
    const payload = {
      title,
      grade: draft.grade.trim(),
      tag: draft.tag.trim(),
      estimated_minutes: Math.min(32767, Math.max(0, Number(draft.estimated_minutes) || 0)),
      cover_image: {
        prompt: draft.cover_prompt.trim(),
        image_url: imageUrl,
        alt_text: draft.cover_alt.trim(),
      },
      characters: draft.characters
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name.trim(),
          description: c.description.trim(),
          role: c.role.trim(),
        })),
      vocabulary: draft.vocabulary
        .filter((v) => v.word.trim())
        .map((v) => ({
          word: v.word.trim(),
          definition: v.definition.trim(),
        })),
      moral: draft.moral.trim(),
      body: draft.body,
    };
    updateMutation.mutate({ id: story.id, payload });
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? "Edit story" : "Story details"}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-xl font-bold text-gray-900">{isEditing ? "Edit story" : "Story details"}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {!isLoading && story && !isEditing ? (
              <button
                type="button"
                onClick={enterEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Icon icon="solar:pen-bold" className="h-4 w-4" />
                Edit
              </button>
            ) : null}
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={updateMutation.isPending || isCompressingCover}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveEdit()}
                  disabled={updateMutation.isPending || !draft || isCompressingCover}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Icon icon="solar:loading-bold" className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : isCompressingCover ? (
                    <>
                      <Icon icon="solar:loading-bold" className="h-4 w-4 animate-spin" />
                      Preparing image…
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:diskette-bold" className="h-4 w-4" />
                      Save changes
                    </>
                  )}
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              aria-label="Close story details"
            >
              <Icon icon="solar:close-circle-bold" className="h-6 w-6" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8">
            <PortalLoadingOverlay label="Loading story details..." />
          </div>
        ) : !story ? (
          <div className="p-8 text-center text-sm text-gray-600">Unable to load story details.</div>
        ) : isEditing && draft ? (
          <div className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Title</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                  className={inputClass}
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Grade</span>
                <select
                  value={draft.grade}
                  onChange={(e) => setDraft((d) => (d ? { ...d, grade: e.target.value } : d))}
                  className={inputClass}
                >
                  {gradeSelectOptions.length === 0 ? (
                    <option value="">Select grade</option>
                  ) : (
                    gradeSelectOptions.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Tag</span>
                <select
                  value={draft.tag}
                  onChange={(e) => setDraft((d) => (d ? { ...d, tag: e.target.value } : d))}
                  className={inputClass}
                >
                  {tagSelectOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">Estimated minutes (max 32767)</span>
                <input
                  type="number"
                  min={0}
                  max={32767}
                  value={draft.estimated_minutes}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, estimated_minutes: Math.min(32767, Math.max(0, Number(e.target.value) || 0)) } : d
                    )
                  }
                  className={inputClass}
                />
              </label>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-900">Cover image</h4>
              <p className="mt-1 text-xs text-gray-500">
                Choose JPEG, PNG, WebP, or GIF from your device. Large images are resized automatically before saving.
              </p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="relative shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:w-56">
                  {coverPreviewUrl || draft.cover_image_url.trim() ? (
                    <img
                      src={coverPreviewUrl || draft.cover_image_url}
                      alt={draft.cover_alt || "Cover preview"}
                      className="h-44 w-full object-cover sm:h-40 sm:w-56"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center px-4 text-center text-sm text-gray-500 sm:h-40">
                      No cover image
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-3">
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    aria-label="Choose cover image file"
                    onChange={(e) => {
                      handleCoverFileChosen(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => coverFileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                    >
                      <Icon icon="solar:gallery-add-bold" className="h-4 w-4" />
                      Choose image file
                    </button>
                    {coverFile ? (
                      <button
                        type="button"
                        onClick={clearChosenCoverFile}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Discard new image
                      </button>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCoverUrlFallback((open) => !open)}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    {showCoverUrlFallback ? "Hide hosted URL option" : "Use a hosted image URL instead"}
                  </button>
                  {showCoverUrlFallback ? (
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-gray-600">Image URL</span>
                      <input
                        type="url"
                        value={draft.cover_image_url}
                        onChange={(e) => {
                          setCoverFile(null);
                          setCoverPreviewUrl((prev) => {
                            if (prev) URL.revokeObjectURL(prev);
                            return null;
                          });
                          setDraft((d) => (d ? { ...d, cover_image_url: e.target.value } : d));
                        }}
                        className={inputClass}
                        placeholder="https://..."
                      />
                    </label>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-medium text-gray-600">Prompt</span>
                  <input
                    type="text"
                    value={draft.cover_prompt}
                    onChange={(e) => setDraft((d) => (d ? { ...d, cover_prompt: e.target.value } : d))}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-xs font-medium text-gray-600">Alt text</span>
                  <input
                    type="text"
                    value={draft.cover_alt}
                    onChange={(e) => setDraft((d) => (d ? { ...d, cover_alt: e.target.value } : d))}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">Moral</span>
              <textarea
                value={draft.moral}
                onChange={(e) => setDraft((d) => (d ? { ...d, moral: e.target.value } : d))}
                rows={2}
                className={inputClass}
              />
            </label>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900">Characters</h4>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) =>
                      d ? { ...d, characters: [...d.characters, { name: "", description: "", role: "" }] } : d
                    )
                  }
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  + Add character
                </button>
              </div>
              <ul className="mt-3 space-y-3">
                {draft.characters.map((character, index) => (
                  <li key={`char-${index}`} className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                    <div className="mb-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  characters: d.characters.filter((_, i) => i !== index),
                                }
                              : d
                          )
                        }
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <input
                        placeholder="Name"
                        value={character.name}
                        onChange={(e) =>
                          setDraft((d) => {
                            if (!d) return d;
                            const next = [...d.characters];
                            next[index] = { ...next[index], name: e.target.value };
                            return { ...d, characters: next };
                          })
                        }
                        className={inputClass}
                      />
                      <input
                        placeholder="Role"
                        value={character.role}
                        onChange={(e) =>
                          setDraft((d) => {
                            if (!d) return d;
                            const next = [...d.characters];
                            next[index] = { ...next[index], role: e.target.value };
                            return { ...d, characters: next };
                          })
                        }
                        className={inputClass}
                      />
                      <input
                        placeholder="Description"
                        className={`sm:col-span-3 ${inputClass}`}
                        value={character.description}
                        onChange={(e) =>
                          setDraft((d) => {
                            if (!d) return d;
                            const next = [...d.characters];
                            next[index] = { ...next[index], description: e.target.value };
                            return { ...d, characters: next };
                          })
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900">Vocabulary</h4>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => (d ? { ...d, vocabulary: [...d.vocabulary, { word: "", definition: "" }] } : d))
                  }
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  + Add word
                </button>
              </div>
              <ul className="mt-3 space-y-3">
                {draft.vocabulary.map((entry, index) => (
                  <li key={`voc-${index}`} className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                    <div className="mb-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  vocabulary: d.vocabulary.filter((_, i) => i !== index),
                                }
                              : d
                          )
                        }
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        placeholder="Word"
                        value={entry.word}
                        onChange={(e) =>
                          setDraft((d) => {
                            if (!d) return d;
                            const next = [...d.vocabulary];
                            next[index] = { ...next[index], word: e.target.value };
                            return { ...d, vocabulary: next };
                          })
                        }
                        className={inputClass}
                      />
                      <input
                        placeholder="Definition"
                        value={entry.definition}
                        onChange={(e) =>
                          setDraft((d) => {
                            if (!d) return d;
                            const next = [...d.vocabulary];
                            next[index] = { ...next[index], definition: e.target.value };
                            return { ...d, vocabulary: next };
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-gray-700">Story body</span>
              <textarea
                value={draft.body}
                onChange={(e) => setDraft((d) => (d ? { ...d, body: e.target.value } : d))}
                rows={14}
                className={`${inputClass} font-mono text-xs leading-relaxed sm:text-sm`}
              />
            </label>

            <p className="text-xs text-gray-500">
              Published state and school metadata are shown in view mode only and are not changed here.
            </p>
          </div>
        ) : (
          <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row">
              {story.cover_image?.image_url ? (
                <img
                  src={story.cover_image.image_url}
                  alt={story.cover_image.alt_text || story.title}
                  className="h-40 w-full rounded-xl border border-gray-200 object-cover sm:w-56"
                />
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 sm:w-56">
                  No cover image
                </div>
              )}
              <div className="flex-1 space-y-3">
                <h3 className="text-2xl font-bold text-gray-900">{story.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {story.grade}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                    {story.tag}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    {story.estimated_minutes} min read
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                      story.is_published
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-gray-100 text-gray-700"
                    }`}
                  >
                    {story.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  <span className="font-semibold">Moral:</span> {story.moral}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-900">Characters</h4>
                {story.characters.length > 0 ? (
                  <ul className="mt-3 space-y-3">
                    {story.characters.map((character, index) => (
                      <li key={`${character.name}-${index}`} className="text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">
                          {character.name} <span className="font-normal text-gray-500">({character.role})</span>
                        </p>
                        <p className="mt-1 text-gray-600">{character.description}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No characters listed.</p>
                )}
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-900">Vocabulary</h4>
                {story.vocabulary.length > 0 ? (
                  <ul className="mt-3 space-y-3">
                    {story.vocabulary.map((entry, index) => (
                      <li key={`${entry.word}-${index}`} className="text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">{entry.word}</p>
                        <p className="mt-1 text-gray-600">{entry.definition}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No vocabulary listed.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-semibold text-gray-900">Story body</h4>
              <div className="mt-3 space-y-3 text-sm leading-7 text-gray-700">
                {story.body
                  .split("\n")
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            </div>

            <div className="grid gap-3 border-t border-gray-200 pt-4 text-xs text-gray-500 sm:grid-cols-2">
              <p>Created: {formatDateTime(story.created_at)}</p>
              <p>Updated: {formatDateTime(story.updated_at)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GenerateStoriesModal({
  isOpen,
  onClose,
  gradeOptions,
  formGrade,
  setFormGrade,
  formTag,
  setFormTag,
  formCount,
  setFormCount,
  canGenerate,
  isSubmitting,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  gradeOptions: string[];
  formGrade: string;
  setFormGrade: (value: string) => void;
  formTag: string;
  setFormTag: (value: string) => void;
  formCount: number;
  setFormCount: (value: number) => void;
  canGenerate: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Generate stories"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generate stories</h2>
            <p className="mt-1 text-sm text-gray-600">
              Create story drafts by grade and value tag. Maximum 10 stories per request.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Close generate stories modal"
          >
            <Icon icon="solar:close-circle-bold" className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {gradeOptions.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              No assigned grades found yet. Assign teacher subjects first, then generate stories.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Grade</span>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="">Select grade</option>
                  {gradeOptions.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Story tag</span>
                <select
                  value={formTag}
                  onChange={(e) => setFormTag(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {STORY_TAG_CHOICES.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-gray-700">Count (max 10)</span>
                <select
                  value={formCount}
                  onChange={(e) => setFormCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                >
                  {STORY_COUNT_CHOICES.map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canGenerate || isSubmitting || gradeOptions.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Icon icon="solar:loading-bold" className="h-4 w-4 animate-spin" />
                Queuing...
              </>
            ) : (
              <>
                <Icon icon="solar:stars-bold" className="h-4 w-4" />
                Generate stories
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StoryCard({
  story,
  onView,
}: {
  story: TeacherStoryListItem;
  onView: (story: TeacherStoryListItem) => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      {story.cover_image?.image_url ? (
        <img
          src={story.cover_image.image_url}
          alt={story.cover_image.alt_text || story.title}
          className="h-40 w-full object-cover"
        />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 text-sm text-gray-500">
          No cover image
        </div>
      )}

      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
            {story.grade}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              story.is_published ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {story.is_published ? "Published" : "Draft"}
          </span>
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold text-gray-900">{story.title}</h3>

        <p className="line-clamp-2 text-sm text-gray-600">
          <span className="font-medium text-gray-700">Moral:</span> {story.moral}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{story.tag}</span>
          <span>{story.estimated_minutes} min read</span>
        </div>

        <button
          type="button"
          onClick={() => onView(story)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          <Icon icon="solar:eye-bold" className="h-4 w-4" />
          View details
        </button>
      </div>
    </article>
  );
}

export default function TeacherStoriesPage() {
  const queryClient = useQueryClient();

  const [filterGrade, setFilterGrade] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");

  const [formGrade, setFormGrade] = useState<string>("");
  const [formTag, setFormTag] = useState<string>(STORY_TAG_CHOICES[0]);
  const [formCount, setFormCount] = useState<number>(3);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  const [selectedStory, setSelectedStory] = useState<TeacherStoryListItem | null>(null);

  const { data: subjects = [], isPending: isSubjectsPending } = useQuery({
    queryKey: [...ptQueryKeys.teacherStories, "subjects"],
    queryFn: getTeacherSubjects,
  });

  const gradeOptions = useMemo(
    () => Array.from(new Set(subjects.map((subject) => subject.grade).filter(Boolean))).sort(),
    [subjects]
  );

  const {
    data: stories = [],
    isPending: isStoriesPending,
    isError: isStoriesError,
    error: storiesError,
  } = useQuery({
    queryKey: [...ptQueryKeys.teacherStories, { grade: filterGrade || null, tag: filterTag || null }],
    queryFn: () => getTeacherStories({ grade: filterGrade || undefined, tag: filterTag || undefined }),
  });

  const {
    data: storyDetail,
    isPending: isStoryDetailPending,
    isError: isStoryDetailError,
    error: storyDetailError,
  } = useQuery({
    queryKey: selectedStory ? ptQueryKeys.teacherStoryDetail(selectedStory.id) : ptQueryKeys.teacherStoryDetail(0),
    queryFn: () => getTeacherStoryDetail(selectedStory!.id),
    enabled: !!selectedStory,
  });

  const generateMutation = useMutation({
    mutationFn: generateTeacherStories,
    onSuccess: (data) => {
      const message = data.message || data.detail || "Story generation task queued.";
      showSuccessToast(message);
      setIsGenerateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ptQueryKeys.teacherStories });
    },
    onError: (error) => {
      if (error instanceof ApiClientError) {
        showErrorToast(error.message || "Failed to queue story generation.");
      } else {
        showErrorToast("Failed to queue story generation.");
      }
    },
  });

  if (isSubjectsPending && gradeOptions.length === 0) {
    return (
      <DashboardLayout>
        <PortalLoadingOverlay label="Loading stories workspace..." />
      </DashboardLayout>
    );
  }

  const canGenerate = formGrade.trim().length > 0 && formTag.trim().length > 0 && formCount >= 1 && formCount <= 10;

  const storiesErrorMessage =
    isStoriesError && storiesError instanceof ApiClientError
      ? storiesError.message
      : "Failed to load stories. Please refresh and try again.";

  const storyDetailErrorMessage =
    isStoryDetailError && storyDetailError instanceof ApiClientError
      ? storyDetailError.message
      : "Failed to load story details.";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
            <p className="mt-1 text-gray-600">Generate and manage reading stories for your assigned grades.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (gradeOptions.length === 0) {
                showErrorToast("No assigned grades yet. Assign subjects first.");
                return;
              }
              setIsGenerateModalOpen(true);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 sm:w-auto"
          >
            <Icon icon="solar:stars-bold" className="h-5 w-5" />
            Generate stories
          </button>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Story library</h2>
              <p className="text-sm text-gray-600">Browse all generated stories and open any card for full details.</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="">All grades</option>
                {gradeOptions.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>

              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="">All tags</option>
                {STORY_TAG_CHOICES.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setFilterGrade("");
                  setFilterTag("");
                }}
                className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Reset
              </button>
            </div>
          </div>

          {isStoriesPending ? (
            <PortalLoadingOverlay label="Loading stories..." />
          ) : isStoriesError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{storiesErrorMessage}</div>
          ) : stories.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-600">
              No stories found for the current filters.
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{stories.length}</span>{" "}
                {stories.length === 1 ? "story" : "stories"}.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stories.map((story) => (
                  <StoryCard key={story.id} story={story} onView={setSelectedStory} />
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <StoryDetailsModal
        story={storyDetail ?? null}
        isLoading={isStoryDetailPending}
        isOpen={!!selectedStory}
        onClose={() => setSelectedStory(null)}
        gradeOptions={gradeOptions}
      />

      <GenerateStoriesModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        gradeOptions={gradeOptions}
        formGrade={formGrade}
        setFormGrade={setFormGrade}
        formTag={formTag}
        setFormTag={setFormTag}
        formCount={formCount}
        setFormCount={setFormCount}
        canGenerate={canGenerate}
        isSubmitting={generateMutation.isPending}
        onSubmit={() => {
          if (!canGenerate) {
            showErrorToast("Please choose grade, story tag, and count.");
            return;
          }
          generateMutation.mutate({
            grade: formGrade,
            tag: formTag,
            count: formCount,
          });
        }}
      />

      {isStoryDetailError && selectedStory ? (
        <div className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow">
          {storyDetailErrorMessage}
        </div>
      ) : null}
    </DashboardLayout>
  );
}
