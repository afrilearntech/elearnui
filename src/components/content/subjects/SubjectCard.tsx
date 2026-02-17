"use client";

import Image from "next/image";
import React from "react";

export type SubjectStatus = "APPROVED" | "PENDING" | "DRAFT" | "REJECTED";

export type SubjectCardProps = {
  title: string;
  grade: string;
  lessonsCount: number;
  imageSrc?: string | null;
  status?: SubjectStatus;
  onEdit?: () => void;
  onDelete?: () => void;
};

const statusStyles: Record<SubjectStatus, { bg: string; text: string }> = {
  APPROVED: { bg: "bg-emerald-100", text: "text-emerald-700" },
  PENDING: { bg: "bg-amber-100", text: "text-amber-700" },
  DRAFT: { bg: "bg-gray-100", text: "text-gray-600" },
  REJECTED: { bg: "bg-rose-100", text: "text-rose-700" },
};

export default function SubjectCard({ title, grade, lessonsCount, imageSrc, status = "APPROVED", onEdit, onDelete }: SubjectCardProps) {
  const style = statusStyles[status];
  const hasImage = Boolean(imageSrc);
  const isLocalBlob = hasImage && (imageSrc!.startsWith("blob:") || imageSrc!.startsWith("data:"));
  const isExternalUrl = hasImage && imageSrc!.startsWith("http");
  const gradeLabel = /^grade/i.test(grade) ? grade : `Grade ${grade}`;
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm max-w-[360px] mx-auto w-full">
      <div className="relative h-[180px] w-full overflow-hidden rounded-t-xl bg-gray-100">
        {hasImage && !imageError ? (
          <Image
            src={imageSrc as string}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
            unoptimized={isLocalBlob || isExternalUrl}
            onError={() => setImageError(true)}
          />
        ) : null}
        <div className="absolute right-3 top-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style.bg} ${style.text}`}>{status}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <div className="mt-2 flex items-center gap-6 text-sm text-gray-600">
          <span>{gradeLabel}</span>
          <span>
            {lessonsCount} {lessonsCount === 1 ? "Lesson" : "Lessons"}
          </span>
        </div>
        {(onEdit || onDelete) && (
          <div className="mt-3 flex items-center justify-end gap-3 text-gray-400">
            {onDelete && (
              <button 
                aria-label="Delete" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }} 
                className="hover:text-gray-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
              </button>
            )}
            {onEdit && (
              <button 
                aria-label="Edit" 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }} 
                className="hover:text-gray-600"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


