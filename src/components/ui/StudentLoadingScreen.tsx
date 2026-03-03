"use client";

import { Icon } from "@iconify/react";

type StudentLoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

export default function StudentLoadingScreen({
  title = "Preparing your learning space...",
  subtitle = "Loading your adventure. This will be ready in a moment.",
}: StudentLoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DBEAFE] via-[#F0FDF4] to-[#CFFAFE] flex items-center justify-center px-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white/80 backdrop-blur-sm border border-white/60 shadow-xl p-8 text-center overflow-hidden">
        <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-blue-200/40 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-emerald-200/40 blur-2xl" />

        <div className="relative">
          <div className="mx-auto mb-5 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#3AB0FF] to-[#00D68F] shadow-lg">
            <Icon icon="material-symbols:auto-stories-rounded" className="w-10 h-10 text-white animate-pulse" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-800" style={{ fontFamily: "Andika, sans-serif" }}>
            {title}
          </h2>
          <p className="mt-2 text-sm text-gray-600" style={{ fontFamily: "Andika, sans-serif" }}>
            {subtitle}
          </p>

          <div className="mt-6">
            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#3AB0FF] to-[#00D68F] animate-pulse" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.12s]" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.24s]" />
          </div>
        </div>
      </div>
    </div>
  );
}
