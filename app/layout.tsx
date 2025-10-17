import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { ClientBody } from "@/components/ClientBody";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
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
          <BottomNavigation />
          {/* Add bottom padding to account for fixed bottom navigation (88px height) */}
          <div className="pb-[88px]">
            {children}
          </div>
        </ErrorBoundary>
      </ClientBody>
    </html>
  );
}

