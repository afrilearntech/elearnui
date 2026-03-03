import type { Metadata } from "next";
import { Andika } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import SkipLinks from "@/components/accessibility/SkipLinks";
import KeyboardShortcutsHelp from "@/components/accessibility/KeyboardShortcutsHelp";
import { GlobalKeyboardNavigation } from "@/components/accessibility/GlobalKeyboardNavigation";
import StartPrompt from "@/components/accessibility/StartPrompt";
import "./globals.css";

const andika = Andika({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-andika",
});

export const metadata: Metadata = {
  title: "MOE - ELEARN",
  description: "For students",
  icons: {
    icon: '/moe.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${andika.variable} antialiased`}
        style={{ fontFamily: 'Andika, sans-serif' }}
      >
        <AccessibilityProvider>
          <GlobalKeyboardNavigation />
          <SkipLinks />
          <KeyboardShortcutsHelp />
          <StartPrompt />
          {children}
        </AccessibilityProvider>
        <Toaster
          position="top-right"
          containerClassName="!z-[9999]"
          containerStyle={{
            top: '16px',
            right: '16px',
            left: 'auto',
            bottom: 'auto',
          }}
          toastOptions={{
            className: '',
             duration: 3500,
            removeDelay: 500,
            style: {
              fontFamily: 'Andika, sans-serif',
              padding: '16px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: '1.5',
            },
            success: {
              duration: 3500,
              iconTheme: {
                primary: '#FFFFFF',
                secondary: '#10B981',
              },
            },
            error: {
              duration: 4500,
              iconTheme: {
                primary: '#FFFFFF',
                secondary: '#EF4444',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
