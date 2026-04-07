"use client";

import Image from "@/components/images/SafeImage";
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

const statusConfig: Record<SubjectStatus, { bg: string; text: string; label: string }> = {
  APPROVED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Approved" },
  PENDING: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700", label: "Pending" },
  DRAFT: { bg: "bg-gray-50 border-gray-200", text: "text-gray-600", label: "Draft" },
  REJECTED: { bg: "bg-rose-50 border-rose-200", text: "text-rose-700", label: "Rejected" },
};

export default function SubjectCard({ title, grade, lessonsCount, imageSrc, status = "APPROVED", onEdit, onDelete }: SubjectCardProps) {
  const config = statusConfig[status];
  const hasImage = Boolean(imageSrc);
  const isLocalBlob = hasImage && (imageSrc!.startsWith("blob:") || imageSrc!.startsWith("data:"));
  const isExternalUrl = hasImage && imageSrc!.startsWith("http");
  const gradeLabel = /^grade/i.test(grade) ? grade : `Grade ${grade}`;
  const [imageError, setImageError] = React.useState(false);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-300">
      {/* Image */}
      <div className="relative h-44 w-full shrink-0 overflow-hidden bg-gray-100">
        {hasImage && !imageError ? (
          <Image
            src={imageSrc as string}
            alt={title}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized={isLocalBlob || isExternalUrl}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute left-3 top-3">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        </div>

        {/* Delete button overlay */}
        {onDelete && (
          <button
            aria-label="Delete subject"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-500 opacity-0 shadow-sm backdrop-blur-sm transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900">{title}</h3>
        <div className="mt-auto flex items-center gap-4 pt-3 text-[13px] text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M22 10v6M2 10l10-5 10 5M2 10l10 5M2 10v6c0 1.1.9 2 2 2h4M22 10l-10 5M22 10v6c0 1.1-.9 2-2 2h-4M6 21h12" />
            </svg>
            {gradeLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            {lessonsCount} {lessonsCount === 1 ? "Lesson" : "Lessons"}
          </span>
        </div>
      </div>

      {/* Edit button row */}
      {onEdit && (
        <div className="border-t border-gray-100 px-4 py-2.5">
          <button
            aria-label="Edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition-colors hover:text-emerald-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
