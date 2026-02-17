"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

type LessonTypeCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
};

function LessonTypeCard({ icon, title, description, onClick }: LessonTypeCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex h-full w-full flex-col items-center rounded-xl border-2 border-emerald-200 bg-white p-8 text-center transition-all hover:border-emerald-500 hover:shadow-lg"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#059669] bg-[#DAEFE9]/40 text-emerald-600 group-hover:text-emerald-700 [&>svg]:h-6 [&>svg]:w-6">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}

export default function CreateLessonPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900">Create New Lesson</h1>
        <p className="mt-2 text-base text-gray-600">What kind of lesson would you like to create?</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <LessonTypeCard
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          }
          title="Learning Material"
          description="Upload a file based lesson type ppt, pdf or video"
          onClick={() => router.push("/content/lessons/create/learning-material")}
        />
        <LessonTypeCard
          icon={
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="M9 9h6v6H9z"/>
              <path d="M9 1v6h6V1"/>
              <path d="M9 23v-6h6v6"/>
            </svg>
          }
          title="Quiz Assessment"
          description="Create an interactive quiz with multiple choice questions or fill in"
          onClick={() => router.push("/content/lessons/create/quiz-assessment")}
        />
      </div>
      <div className="text-center">
        <Link href="/lessons" className="text-sm text-emerald-700 hover:underline">Back to Lessons</Link>
      </div>
    </div>
  );
}

