import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavigationWithParams } from "@/components/ui/bottom-navigation";
import { ClientBody } from "@/components/ClientBody";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { Suspense } from "react";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  title: "Yoga Class Tracker",
  description: "A modern web application for yoga instructors to track classes, manage students, and monitor session balances.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Yoga Tracker"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" }
    ]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Yoga Tracker",
    "application-name": "Yoga Tracker",
    "msapplication-TileColor": "#10b981",
    "msapplication-config": "/browserconfig.xml"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <ClientBody className={inter.className}>
        <ErrorBoundary>
          <Suspense fallback={<div className="fixed bottom-0 left-0 right-0 h-[88px] bg-background border-t" />}>
            <BottomNavigationWithParams />
          </Suspense>
          {/* Add bottom padding to account for fixed bottom navigation (88px height) */}
          <div className="pb-[88px]">
            {children}
          </div>
          <PWAInstallPrompt />
        </ErrorBoundary>
      </ClientBody>
    </html>
  );
}

