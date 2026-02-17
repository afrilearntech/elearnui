"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function QuizAssessmentCreatePage() {
  const router = useRouter();
  const [startAtEnd, setStartAtEnd] = React.useState(false);
  const [quizTitle, setQuizTitle] = React.useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quiz Details Page</h1>
          <p className="text-sm text-gray-500">Fill in the details to create a subject</p>
        </div>
        <div className="hidden gap-3 sm:flex">
          <button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Save Draft</button>
          <button onClick={() => router.push(`/content/lessons/create/quiz-assessment/questions?title=${encodeURIComponent(quizTitle || "Introduction to Algebra")}`)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Next</button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Quiz Information Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Quiz Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Quiz Title</label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="eg. Introduction to Algebra"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Quiz Type</label>
                <select className="h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500">
                  <option>Select Quiz type</option>
                  <option>Multiple Choice</option>
                  <option>True/False</option>
                  <option>Short Answer</option>
                  <option>Long Answer</option>
                  <option>Matching</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">
                  Associated Grade Level<span className="text-rose-600">*</span>
                </label>
                <select className="h-11 w-full rounded-lg border border-gray-300 px-3 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500">
                  <option>Select Grade Level</option>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1}>{`Grade ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-800">Associated Topic</label>
              <input
                type="text"
                placeholder="eg. Introduction to Algebra"
                className="h-11 w-full rounded-lg border border-gray-300 px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Timing Information Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Timing Information</h2>
          
          <div className="space-y-4">
            {/* Labels on same row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Start Time</label>
                <div className="relative">
                  <input
                    type="date"
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 pr-10 text-gray-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                  <svg
                    className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {/* Toggle below Start Time input */}
                <div className="mt-3 flex items-center justify-between px-4 py-3">
                  <label className="text-sm font-medium text-gray-800">Start at the end of lesson</label>
                  <label className="inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={startAtEnd}
                      onChange={(e) => setStartAtEnd(e.target.checked)}
                    />
                    <span className="h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-emerald-500"></span>
                    <span className="-ml-8 h-5 w-5 translate-x-0 rounded-full bg-white transition peer-checked:translate-x-5"></span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-800">Display Duration (minutes)</label>
                <input
                  type="text"
                  placeholder="eg. 45mins"
                  className="h-11 w-full rounded-lg border border-gray-300 px-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quiz Instructions Section */}
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Quiz Instructions</h2>
          
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-800">Quiz Instructions</label>
            <textarea
              rows={8}
              placeholder="Write a detailed Quiz instructions here."
              className="w-full resize-y rounded-lg border border-gray-300 p-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </section>

        {/* Mobile Actions */}
        <div className="flex gap-3 sm:hidden">
          <button className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Save Draft</button>
          <button onClick={() => router.push(`/content/lessons/create/quiz-assessment/questions?title=${encodeURIComponent(quizTitle || "Introduction to Algebra")}`)} className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Next</button>
        </div>

        <div className="text-center">
          <Link href="/lessons" className="text-sm text-emerald-700 hover:underline">Back to Lessons</Link>
        </div>
      </div>
    </div>
  );
}

