import type { Metadata } from "next";
import { Andika } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import AppProviders from "@/components/providers/AppProviders";
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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://digitallearning.moe.gov.lr";
const logoPath = "/moe.png";
const logoUrl = `${siteUrl}${logoPath}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MOE - ELEARN",
  description: "For students",
  applicationName: "MOE - ELEARN",
  alternates: {
    canonical: siteUrl,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: logoPath, type: "image/png", sizes: "128x128" },
      { url: logoPath, rel: "icon" },
    ],
    shortcut: [{ url: logoPath, type: "image/png" }],
    apple: [{ url: logoPath, type: "image/png", sizes: "128x128" }],
  },
  openGraph: {
    title: "MOE - ELEARN",
    description: "For students",
    url: siteUrl,
    siteName: "MOE - ELEARN",
    locale: "en_US",
    images: [
      {
        url: logoUrl,
        width: 1200,
        height: 630,
        alt: "Ministry of Education Liberia - eLearn",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MOE - ELEARN",
    description: "For students",
    images: [logoUrl],
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
          <AppProviders>
            <GlobalKeyboardNavigation />
            <SkipLinks />
            <KeyboardShortcutsHelp />
            <StartPrompt />
            {children}
          </AppProviders>
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
