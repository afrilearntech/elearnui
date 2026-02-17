"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { createLesson } from "@/lib/api/content/lessons";
import { getSubjects, SubjectRecord, TopicRecord, getTopics } from "@/lib/api/content/subjects";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const LESSON_TYPES = ["VIDEO", "AUDIO", "PDF", "PPT", "DOC"];

export default function LearningMaterialCreatePage() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = React.useRef<HTMLInputElement | null>(null);

  const [subjects, setSubjects] = React.useState<SubjectRecord[]>([]);
  const [topics, setTopics] = React.useState<TopicRecord[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = React.useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [lessonType, setLessonType] = React.useState<string>("VIDEO");
  const [subjectId, setSubjectId] = React.useState("");
  const [topicId, setTopicId] = React.useState("");
  const [period, setPeriod] = React.useState("");
  const [duration, setDuration] = React.useState("");

  const [resourceFile, setResourceFile] = React.useState<File | null>(null);
  const [resourcePreview, setResourcePreview] = React.useState<string | null>(null);
  const [resourceName, setResourceName] = React.useState("");
  const [resourceError, setResourceError] = React.useState("");

  const [thumbnailFile, setThumbnailFile] = React.useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = React.useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function fetchSubjectsList() {
      try {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("auth_token");
        if (!token) {
          showErrorToast("Missing authentication token. Please sign in again.");
          return;
        }
        setIsLoadingSubjects(true);
        const data = await getSubjects(token);
        setSubjects(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load subjects.";
        showErrorToast(message);
      } finally {
        setIsLoadingSubjects(false);
      }
    }
    fetchSubjectsList();
  }, []);

  React.useEffect(() => {
    async function fetchTopicsForSubject(selectedSubject: number) {
      try {
        if (!selectedSubject) {
          setTopics([]);
          setTopicId("");
          return;
        }
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("auth_token");
        if (!token) {
          showErrorToast("Missing authentication token. Please sign in again.");
          return;
        }
        setIsLoadingTopics(true);
        const data = await getTopics(token, selectedSubject);
        setTopics(data);
        setTopicId("");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load topics.";
        showErrorToast(message);
      } finally {
        setIsLoadingTopics(false);
      }
    }
    if (subjectId) {
      fetchTopicsForSubject(Number(subjectId));
    } else {
      setTopics([]);
      setTopicId("");
    }
  }, [subjectId]);

  React.useEffect(() => {
    return () => {
      if (resourcePreview) URL.revokeObjectURL(resourcePreview);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [resourcePreview, thumbnailPreview]);

  function handleResourceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setResourceError("");
    setResourceFile(file);
    setResourceName(file.name);
    setResourcePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function handleThumbnailChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function removeResourceFile() {
    if (resourcePreview) URL.revokeObjectURL(resourcePreview);
    setResourcePreview(null);
    setResourceFile(null);
    setResourceName("");
    setResourceError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeThumbnailFile() {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailPreview(null);
    setThumbnailFile(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  }

  async function handleNext() {
    if (isSubmitting) return;

    if (!title.trim()) {
      showErrorToast("Lesson title is required.");
      return;
    }
    if (!subjectId) {
      showErrorToast("Please select a subject.");
      return;
    }
    if (!topicId) {
      showErrorToast("Please select a topic.");
      return;
    }
    if (!lessonType) {
      showErrorToast("Please select a lesson type.");
      return;
    }
    if (!resourceFile) {
      showErrorToast("Please upload the lesson resource.");
      return;
    }
    if (!duration || Number(duration) <= 0) {
      showErrorToast("Please provide the estimated duration in minutes.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("auth_token");
      if (!token) {
        showErrorToast("Missing authentication token. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      const response = await createLesson(
        {
          subject: Number(subjectId),
          topic: Number(topicId),
          period: Number(period) || 1,
          title: title.trim(),
          description: description.trim(),
          type: lessonType,
          status: "DRAFT",
          resource: resourceFile,
          thumbnail: thumbnailFile || null,
          moderation_comment: "",
          duration_minutes: Number(duration),
        },
        token,
      );

      showSuccessToast("Lesson saved as draft.");
      router.push(`/content/lessons/create/learning-material/preview?id=${response.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create lesson.";
      showErrorToast(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Create Lesson Material</h1>
          <p className="text-sm text-gray-500">Fill in the details to create a lesson</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleNext}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Next"}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Lesson Title */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-gray-800">
            Lesson Title<span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="eg. Introduction to Algebra"
            className="h-11 w-full rounded-lg border border-gray-300 px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
          />
        </section>

        {/* Subject, Topic, Lesson type */}
        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Subject<span className="text-rose-600">*</span>
              </label>
              <select
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">{isLoadingSubjects ? "Loading subjects..." : "Select subject"}</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} • {subject.grade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Topic<span className="text-rose-600">*</span>
              </label>
              <select
                value={topicId}
                onChange={(event) => setTopicId(event.target.value)}
                disabled={!subjectId || isLoadingTopics}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="">
                  {!subjectId ? "Select a subject first" : isLoadingTopics ? "Loading topics..." : "Select topic"}
                </option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">
                Lesson Type<span className="text-rose-600">*</span>
              </label>
              <select
                value={lessonType}
                onChange={(event) => setLessonType(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              >
                {LESSON_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Period</label>
                <input
                  type="number"
                  min={1}
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  placeholder="e.g. 1"
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Duration (minutes)<span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  placeholder="e.g. 45"
                  className="h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <label className="mb-2 block text-sm font-medium text-gray-800">Lesson Description</label>
          <textarea
            rows={6}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Write a detailed description for the lesson"
            className="w-full resize-y rounded-lg border border-gray-300 p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
          />
        </section>

        {/* Upload */}
        <section className="space-y-6 rounded-xl border border-gray-200 bg-white p-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">
              Upload Lesson Resource<span className="text-rose-600">*</span>
            </label>
            <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 16l-4-4-4 4" />
                  <path d="M12 12V3" />
                  <path d="M20 21H4" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                Upload the lesson file (video, PPT, PDF, DOC). The backend stores the file securely.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,application/msword,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/*,audio/*"
                className="hidden"
                onChange={handleResourceChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Choose File
              </button>
              {resourceName ? <div className="mt-3 text-sm text-gray-700">Selected: {resourceName}</div> : null}
              {resourceError ? <div className="mt-2 text-sm text-rose-600">{resourceError}</div> : null}
            </div>

            {resourcePreview ? (
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Resource preview</div>
                  <button
                    type="button"
                    onClick={removeResourceFile}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Remove
                  </button>
                </div>
                {lessonType === "VIDEO" ? (
                  <video src={resourcePreview} controls className="mx-auto h-56 w-full max-w-3xl rounded-lg bg-black" />
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
                    <div className="mx-auto my-6 flex h-40 w-full max-w-3xl items-center justify-center rounded-lg bg-white text-gray-600">
                      <div>
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                          </svg>
                        </div>
                        <div className="text-sm">Document Preview</div>
                        <div className="text-xs text-gray-500">{resourceName}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">Cover Thumbnail (optional)</label>
            <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleThumbnailChange}
              />
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-emerald-700 shadow hover:bg-gray-50"
              >
                Upload Thumbnail
              </button>
              <p className="mt-2 text-xs text-gray-500">PNG or JPG, any size.</p>
            </div>
            {thumbnailPreview ? (
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailPreview} alt="Lesson thumbnail preview" className="mx-auto h-48 w-full max-w-2xl rounded-lg object-cover" />
                <button onClick={removeThumbnailFile} type="button" className="mt-3 text-sm font-medium text-rose-600 hover:underline">
                  Remove image
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <div className="text-center">
          <Link href="/lessons" className="text-sm text-emerald-700 hover:underline">
            Back to Lessons
          </Link>
        </div>
      </div>
    </div>
  );
}

