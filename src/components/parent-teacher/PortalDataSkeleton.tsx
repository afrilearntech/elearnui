"use client";

import { Icon } from "@iconify/react";

/** Lightweight placeholder while portal data is loading (no extra CSS deps). */
export function PortalDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden>
      <div className="h-8 w-48 max-w-[60%] rounded-lg bg-gray-200" />
      <div className="h-4 w-72 max-w-[80%] rounded bg-gray-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-gray-200 bg-gray-50" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl border border-gray-200 bg-gray-50" />
        <div className="h-64 rounded-xl border border-gray-200 bg-gray-50" />
      </div>
    </div>
  );
}

export function PortalTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      <div className="h-10 w-full rounded-lg bg-gray-100" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 w-full rounded-lg border border-gray-100 bg-gray-50" />
      ))}
    </div>
  );
}

export function PortalLoadingOverlay({ label }: { label: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-2">
      <Icon icon="solar:loading-bold" className="h-9 w-9 animate-spin text-emerald-600" />
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}
