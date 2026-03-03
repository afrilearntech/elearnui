"use client";

import AppShell from "@/components/content/layout/AppShell";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
