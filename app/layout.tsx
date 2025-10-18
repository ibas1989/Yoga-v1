import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavigationWithParams } from "@/components/ui/bottom-navigation";
import { ClientBody } from "@/components/ClientBody";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense } from "react";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  title: "Yoga Class Tracker",
  description: "Track yoga classes and student sessions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="/suppress-errors.js" />
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
        </ErrorBoundary>
      </ClientBody>
    </html>
  );
}

