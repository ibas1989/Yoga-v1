'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Custom hook for safe navigation that handles RSC fetch errors
 * and provides fallback mechanisms
 */
export function useSafeNavigation() {
  const router = useRouter();

  const safePush = useCallback((href: string) => {
    // For home page navigation with view parameters, use direct navigation
    if (href.startsWith('/?view=')) {
      window.location.href = href;
      return;
    }
    
    try {
      router.push(href);
    } catch (error) {
      console.error('Router push failed:', error);
      // Fallback to window.location
      window.location.href = href;
    }
  }, [router]);

  const safeReplace = useCallback((href: string) => {
    // For home page navigation with view parameters, use direct navigation
    if (href.startsWith('/?view=')) {
      window.location.href = href;
      return;
    }
    
    try {
      router.replace(href);
    } catch (error) {
      console.error('Router replace failed:', error);
      // Fallback to window.location
      window.location.href = href;
    }
  }, [router]);

  const safeBack = useCallback(() => {
    try {
      router.back();
    } catch (error) {
      console.error('Router back failed:', error);
      // Fallback to window.history
      window.history.back();
    }
  }, [router]);

  return {
    push: safePush,
    replace: safeReplace,
    back: safeBack,
  };
}
