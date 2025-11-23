import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavigationWithParams } from "@/components/ui/bottom-navigation";
import { ClientBody } from "@/components/ClientBody";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { I18nProvider } from "@/components/I18nProvider";
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
  themeColor: "#10b981",
  viewportFit: "cover"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <ClientBody className={inter.className}>
        <I18nProvider>
          <ErrorBoundary>
            <Suspense fallback={
              <>
                <div className="md:hidden fixed bottom-0 left-0 right-0 h-[88px] bg-background border-t" />
                <div className="hidden md:block fixed top-0 left-0 right-0 h-16 bg-background border-b" />
              </>
            }>
              <BottomNavigationWithParams />
            </Suspense>
            {/* Add bottom padding on mobile (88px) and top padding on desktop (64px) to account for fixed navigation */}
            <div className="pb-[88px] md:pb-0 md:pt-16">
              {children}
            </div>
            <PWAInstallPrompt />
          </ErrorBoundary>
        </I18nProvider>
      </ClientBody>
    </html>
  );
}

