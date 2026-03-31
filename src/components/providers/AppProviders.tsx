"use client";

import type { ReactNode } from "react";
import QueryProvider from "./QueryProvider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
