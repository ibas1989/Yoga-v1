'use client';

import React, { useEffect, useState } from 'react';
import '@/lib/i18n'; // Initialize i18n (guarded in i18n/index.ts)
import i18n from '@/lib/i18n';

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // On client side, ensure i18n is initialized
    if (typeof window !== 'undefined') {
      // Check if i18n is initialized
      if (i18n.isInitialized) {
        setIsReady(true);
        return;
      }

      // Try to initialize if not already done (mobile browsers might need this)
      try {
        // Wait a bit for initialization to complete
        const checkReady = () => {
          if (i18n.isInitialized) {
            setIsReady(true);
          } else {
            // Fallback: set ready after delay to avoid blocking the app
            setTimeout(() => {
              setIsReady(true);
            }, 500);
          }
        };

        // Check immediately
        checkReady();

        // Also check after a short delay for mobile browsers
        const timer = setTimeout(checkReady, 100);
        return () => clearTimeout(timer);
      } catch (error) {
        // If initialization fails, still render children to avoid blocking
        console.warn('i18n initialization warning (non-blocking):', error);
        setHasError(true);
        setIsReady(true); // Allow app to continue
      }
    } else {
      // On server, render immediately
      setIsReady(true);
    }
  }, []);

  // Show loading only on client side during initialization
  // But don't block for too long on mobile
  if (!isReady && typeof window !== 'undefined') {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
