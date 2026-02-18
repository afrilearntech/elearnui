"use client";

import { Toaster } from "react-hot-toast";
import AppShell from "@/components/content/layout/AppShell";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      {children}
      <Toaster
        position="top-right"
        containerClassName="!z-[9999]"
        containerStyle={{
          top: "16px",
          right: "16px",
          left: "auto",
          bottom: "auto",
        }}
        toastOptions={{
          className: "",
          duration: 4000,
          style: {
            fontFamily: "Poppins, sans-serif",
            padding: "16px 20px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "500",
            lineHeight: "1.5",
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: "#FFFFFF",
              secondary: "#10B981",
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: "#FFFFFF",
              secondary: "#EF4444",
            },
          },
        }}
      />
    </AppShell>
  );
}
