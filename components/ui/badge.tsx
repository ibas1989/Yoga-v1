'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  count: number;
  className?: string;
  maxCount?: number;
}

/**
 * Badge Component
 * 
 * A small circular badge typically used for showing notification counts.
 * Displays a number in a red circular background with smooth animations.
 * 
 * @param count - The number to display in the badge
 * @param className - Additional CSS classes to apply
 * @param maxCount - Maximum number to display (e.g., 99+ for counts over 99)
 */
export function Badge({ count, className, maxCount = 99 }: BadgeProps) {
  // Don't render badge if count is 0 or negative
  if (count <= 0) return null;
  
  // Format count for display
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  return (
    <div
      className={cn(
        'absolute -top-2 -right-5 min-w-[18px] h-[18px] rounded-full',
        'bg-red-500 text-white text-xs font-semibold',
        'flex items-center justify-center',
        'px-1 shadow-sm border border-white',
        'transition-all duration-300 ease-in-out',
        'animate-in fade-in-0 zoom-in-95 duration-300',
        'hover:scale-110 transform',
        className
      )}
      aria-label={`${count} pending tasks`}
      style={{
        animation: 'badgePulse 0.3s ease-in-out'
      }}
    >
      {displayCount}
    </div>
  );
}
