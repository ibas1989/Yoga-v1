'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n'; // Initialize i18n (guarded in i18n/index.ts)

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  // useTranslation hook must be called unconditionally
  // Now that i18n is initialized on both server and client, this should work
  const { ready } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // On client side, wait for translation to be ready
    if (typeof window !== 'undefined') {
      if (ready) {
        setIsReady(true);
      } else {
        // Fallback: set ready after a short delay to avoid blocking
        const timer = setTimeout(() => setIsReady(true), 200);
        return () => clearTimeout(timer);
      }
    } else {
      // On server, render immediately
      setIsReady(true);
    }
  }, [ready]);

  // Show loading only on client side during initialization
  if (!isReady && typeof window !== 'undefined') {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
