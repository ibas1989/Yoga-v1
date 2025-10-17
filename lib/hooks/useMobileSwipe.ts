'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SwipeConfig {
  threshold?: number;
  velocity?: number;
  preventDefaultTouchmoveEvent?: boolean;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

/**
 * Custom hook for mobile swipe navigation
 * Provides swipe gestures for navigation between pages
 */
export function useMobileSwipe(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const {
    threshold = 50,
    velocity = 0.3,
    preventDefaultTouchmoveEvent = false
  } = config;

  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = threshold;
  const maxSwipeTime = 300; // Maximum time for a swipe (ms)

  const onTouchStart = (e: TouchEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    setTouchEnd(null);
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
  };

  const onTouchMove = (e: TouchEvent) => {
    if (preventDefaultTouchmoveEvent) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const timeDiff = touchEnd.time - touchStart.time;
    const velocityX = Math.abs(distanceX) / timeDiff;
    const velocityY = Math.abs(distanceY) / timeDiff;

    const isLeftSwipe = distanceX > minSwipeDistance && velocityX > velocity;
    const isRightSwipe = distanceX < -minSwipeDistance && velocityX > velocity;
    const isUpSwipe = distanceY > minSwipeDistance && velocityY > velocity;
    const isDownSwipe = distanceY < -minSwipeDistance && velocityY > velocity;

    // Check if it's a valid swipe (not too long in time)
    const isValidSwipe = timeDiff < maxSwipeTime;

    if (isValidSwipe) {
      if (isLeftSwipe && handlers.onSwipeLeft) {
        handlers.onSwipeLeft();
      } else if (isRightSwipe && handlers.onSwipeRight) {
        handlers.onSwipeRight();
      } else if (isUpSwipe && handlers.onSwipeUp) {
        handlers.onSwipeUp();
      } else if (isDownSwipe && handlers.onSwipeDown) {
        handlers.onSwipeDown();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', onTouchStart, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchmove', onTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [touchStart, touchEnd, handlers]);

  return elementRef;
}

/**
 * Hook for navigation-based swipe gestures
 * Automatically handles navigation between main views
 */
export function useNavigationSwipe() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'calendar' | 'students' | 'settings'>('calendar');

  const handleSwipeLeft = () => {
    // Swipe left: Calendar -> Students -> Settings
    if (currentView === 'calendar') {
      setCurrentView('students');
      router.push('/?view=students');
    } else if (currentView === 'students') {
      setCurrentView('settings');
      router.push('/?view=settings');
    }
  };

  const handleSwipeRight = () => {
    // Swipe right: Settings -> Students -> Calendar
    if (currentView === 'settings') {
      setCurrentView('students');
      router.push('/?view=students');
    } else if (currentView === 'students') {
      setCurrentView('calendar');
      router.push('/?view=calendar');
    }
  };

  const swipeHandlers = {
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  };

  const swipeRef = useMobileSwipe(swipeHandlers, {
    threshold: 50,
    velocity: 0.3,
  });

  return { swipeRef: swipeRef as React.RefObject<HTMLDivElement>, currentView, setCurrentView };
}

/**
 * Hook for day navigation swipe gestures
 * Handles swiping between calendar days
 */
export function useDayNavigationSwipe(currentDate: Date, onDateChange: (date: Date) => void) {
  const handleSwipeLeft = () => {
    // Swipe left: Next day
    const nextDay = new Date(currentDate);
    nextDay.setDate(currentDate.getDate() + 1);
    onDateChange(nextDay);
  };

  const handleSwipeRight = () => {
    // Swipe right: Previous day
    const prevDay = new Date(currentDate);
    prevDay.setDate(currentDate.getDate() - 1);
    onDateChange(prevDay);
  };

  const swipeHandlers = {
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  };

  const swipeRef = useMobileSwipe(swipeHandlers, {
    threshold: 50,
    velocity: 0.3,
  });

  return swipeRef;
}
