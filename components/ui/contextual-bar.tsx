'use client';

import React from 'react';
import { BackButton } from './back-button';

interface ContextualBarProps {
  /**
   * The entity type (e.g., "Student", "Session")
   */
  entityType: 'Student' | 'Session';
  
  /**
   * The page type (e.g., "View", "Edit", "New")
   */
  pageType: 'View' | 'Edit' | 'New';
  
  /**
   * Fallback route for the back button
   * Default: '/'
   */
  fallbackRoute?: string;
  
  /**
   * Optional additional content to display on the right side
   */
  rightContent?: React.ReactNode;
}

/**
 * ContextualBar Component
 * 
 * A secondary navigation bar that appears below the FixedTopBar on Student and Session pages.
 * It provides:
 * - A back button that navigates to the previous page
 * - Page context information (Entity Type — Page Type)
 * - Optional right-side content (e.g., action buttons)
 * 
 * The bar uses fixed positioning and remains pinned directly below the top bar while scrolling.
 * 
 * @example
 * <ContextualBar 
 *   entityType="Student" 
 *   pageType="View" 
 *   fallbackRoute="/"
 * />
 * 
 * @example
 * <ContextualBar 
 *   entityType="Session" 
 *   pageType="Edit" 
 *   fallbackRoute="/sessions/123"
 *   rightContent={<Button>Save</Button>}
 * />
 */
export function ContextualBar({
  entityType,
  pageType,
  fallbackRoute = '/',
  rightContent,
}: ContextualBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BackButton fallbackRoute={fallbackRoute} />
            <h2 className="text-base font-medium text-muted-foreground">
              {entityType} — {pageType}
            </h2>
          </div>
          {rightContent && (
            <div className="flex items-center gap-2">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

