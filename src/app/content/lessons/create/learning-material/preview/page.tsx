"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { getLessonById, updateLesson } from "@/lib/api/content/lessons";
import { getSubjects, getTopics, SubjectRecord, TopicRecord } from "@/lib/api/content/subjects";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

function LessonPreviewContent() {
  const router = useRouter();
  const params = useSearchParams();
  const lessonIdParam = params.get("id");
  const lessonId = lessonIdParam ? Number(lessonIdParam) : null;

  const [lesson, setLesson] = React.useState<Awaited<ReturnType<typeof getLessonById>> | null>(null);
  const [subjectName, setSubjectName] = React.useState<string>("");
  const [topicName, setTopicName] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string>("CONTENTCREATOR");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    try {
      const user = JSON.parse(userStr);
      setUserRole(user.role || "CONTENTCREATOR");
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }, []);

  React.useEffect(() => {
    async function fetchLessonDetails() {
      if (!lessonId) {
        setError("Missing lesson identifier.");
        setIsLoading(false);
        return;
      }
      try {
        if (typeof window === "undefined") return;
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setError("Missing authentication token. Please sign in again.");
          setIsLoading(false);
          return;
        }
        const data = await getLessonById(lessonId, token);
        setLesson(data);

        const [subjects, subjectTopics] = await Promise.all([getSubjects(token), getTopics(token, data.subject)]);
        const subject = subjects.find((item: SubjectRecord) => item.id === data.subject);
        setSubjectName(subject ? subject.name : `Subject #${data.subject}`);
        const topic = subjectTopics.find((item: TopicRecord) => item.id === data.topic);
        setTopicName(topic ? topic.name : `Topic #${data.topic}`);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to load lesson details.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLessonDetails();
  }, [lessonId]);

  async function handlePublish() {
    if (!lesson || isPublishing) return;
    try {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("auth_token");
      if (!token) {
        showErrorToast("Missing authentication token. Please sign in again.");
        return;
      }
      setIsPublishing(true);
      const updated = await updateLesson(lesson.id, { status: "PENDING" }, token);
      setLesson(updated);
      showSuccessToast("Lesson submitted for review.");
      router.push("/content/lessons");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to publish lesson.";
      showErrorToast(message);
    } finally {
      setIsPublishing(false);
    }
  }

  if (!lessonId) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lesson Details Page</h1>
            <p className="text-sm text-gray-500">Missing lesson identifier.</p>
          </div>
          <Link href="/content/lessons" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Back to lessons
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lesson Details Page</h1>
            <p className="text-sm text-gray-500">Fetching your lesson details…</p>
          </div>
          <Link href="/content/lessons" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Back to lessons
          </Link>
        </div>
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="text-sm text-gray-600">Loading preview...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lesson Details Page</h1>
            <p className="text-sm text-rose-500">{error ?? "Lesson not found."}</p>
          </div>
          <Link href="/content/lessons" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Back to lessons
          </Link>
        </div>
      </div>
    );
  }

  const isVideo = lesson.type.toUpperCase() === "VIDEO";
  const isRequestChanges = lesson.status === "REQUEST_CHANGES" || 
    lesson.status === "CHANGES_REQUESTED" || 
    lesson.status === "REQUEST_REVISION" || 
    lesson.status === "REVIEW_REQUESTED" ||
    (typeof lesson.status === "string" && lesson.status.toUpperCase().includes("REQUEST") && lesson.status.toUpperCase().includes("CHANGE"));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Review Lesson</h1>
          <p className="text-sm text-gray-500">Double-check the details before submitting for review.</p>
        </div>
        <Link href="/content/lessons" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
          Back to lessons
        </Link>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
          {isVideo ? (
            <div className="text-sm text-gray-600">
              Video resource uploaded. {lesson.resource ? "The validator can play it from the dashboard." : "Resource URL not available yet."}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              {lesson.resource ? "Document uploaded successfully." : "Resource will be attached to this lesson."}
            </div>
          )}
        </div>

        <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="text-xs text-emerald-700">{subjectName || `Subject #${lesson.subject}`}</div>
          <h2 className="text-xl font-semibold text-gray-900">{lesson.title}</h2>
          <div className="text-xs text-emerald-700">{topicName || `Topic #${lesson.topic}`}</div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Lesson Description</h3>
            <p className="mt-2 text-sm leading-6 text-gray-700">{lesson.description || "No description provided."}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-semibold text-gray-900">Lesson Type</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{lesson.type}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Duration</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{lesson.duration_minutes} minutes</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
            <div>
              <div className="text-gray-500">Period</div>
              <div className="font-medium text-gray-900">{lesson.period || 1}</div>
            </div>
            <div>
              <div className="text-gray-500">Resource</div>
              {lesson.resource ? (
                <a href={lesson.resource} target="_blank" rel="noreferrer" className="font-medium text-emerald-600 underline">
                  Open resource
                </a>
              ) : (
                <div className="font-medium text-gray-900">Resource will be attached.</div>
              )}
            </div>
          </div>

          {lesson.thumbnail ? (
            <div>
              <div className="mb-2 text-sm font-semibold text-gray-900">Thumbnail</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lesson.thumbnail} alt="Lesson thumbnail" className="w-full rounded-xl border border-gray-100 object-cover" />
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
            <div>
              <div className="text-gray-500">Status</div>
              <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                lesson.status === "DRAFT" 
                  ? "bg-gray-100 text-gray-700" 
                  : isRequestChanges
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}>
                {lesson.status === "DRAFT" 
                  ? "Draft" 
                  : isRequestChanges
                  ? "Revision Requested"
                  : lesson.status}
              </span>
            </div>
            <div>
              <div className="text-gray-500">Created</div>
              <div className="font-medium text-gray-900">
                {lesson.created_at
                  ? new Date(lesson.created_at).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })
                  : "Unknown"}
              </div>
            </div>
          </div>

          {isRequestChanges && lesson.moderation_comment ? (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Requested Review
                </span>
              </div>
              <div className="font-semibold text-amber-900 mb-1">Moderator Comment</div>
              <p className="text-amber-800">{lesson.moderation_comment}</p>
            </div>
          ) : lesson.moderation_comment ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="font-semibold">Moderator Comment</div>
              <p className="mt-1">{lesson.moderation_comment}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
            <Link href="/content/lessons" className="rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Back
            </Link>
            {userRole === "CONTENTCREATOR" && isRequestChanges ? (
              <Link
                href={`/content/lessons/create/learning-material?edit=${lesson.id}`}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Edit Lesson
              </Link>
            ) : userRole === "CONTENTCREATOR" && lesson.status === "DRAFT" ? (
              <button
                onClick={handlePublish}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isPublishing}
              >
                {isPublishing ? "Submitting..." : "Submit for Review"}
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function LessonPreviewPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Lesson Details Page</h1>
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
          <Link href="/content/lessons" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Back to lessons
          </Link>
        </div>
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
            <div className="text-sm text-gray-600">Loading preview...</div>
          </div>
        </div>
      </div>
    }>
      <LessonPreviewContent />
    </Suspense>
  );
}
