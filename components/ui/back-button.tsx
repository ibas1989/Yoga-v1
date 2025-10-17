'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from './button';

interface BackButtonProps {
  /**
   * Fallback route if no navigation history exists
   * Default: '/' (home page)
   */
  fallbackRoute?: string;
  
  /**
   * Button variant
   * Default: 'ghost'
   */
  variant?: 'ghost' | 'outline' | 'default' | 'secondary' | 'destructive' | 'link';
  
  /**
   * Button size
   * Default: 'sm'
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  
  /**
   * Custom label text
   * Default: 'Back'
   */
  label?: string;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * BackButton Component
 * 
 * A reusable navigation button that returns users to their previous page.
 * Includes smart fallback logic to navigate to a specified route if no
 * navigation history exists.
 * 
 * @example
 * // Basic usage with default fallback to home
 * <BackButton />
 * 
 * @example
 * // With custom fallback route
 * <BackButton fallbackRoute="/students" />
 * 
 * @example
 * // With custom styling
 * <BackButton 
 *   fallbackRoute="/sessions" 
 *   variant="outline" 
 *   label="Return to Sessions"
 * />
 */
export function BackButton({
  fallbackRoute = '/',
  variant = 'ghost',
  size = 'sm',
  label = 'Back',
  className = '',
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Check if there's navigation history available
    // In Next.js App Router, we can use window.history.length to check
    if (typeof window !== 'undefined' && window.history.length > 1) {
      // Navigate back to previous page
      router.back();
    } else {
      // No history available, use fallback route
      router.push(fallbackRoute);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleBack}
      className={className}
      aria-label={label}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}

