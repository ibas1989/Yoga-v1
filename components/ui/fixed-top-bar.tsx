'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Calendar as CalendarIcon, Users, Settings } from 'lucide-react';
import { Button } from './button';

/**
 * FixedTopBar Component
 * 
 * A permanently pinned navigation bar that remains visible at the top of the viewport
 * across all pages. Provides consistent access to main navigation tabs:
 * - Calendar (home page)
 * - Students
 * - Settings
 * 
 * The bar uses fixed positioning and stays at the top even when scrolling.
 */
export function FixedTopBar() {
  const router = useRouter();
  const pathname = usePathname();

  // Determine which view is active based on the pathname
  const getActiveView = (): 'calendar' | 'students' | 'settings' | 'none' => {
    if (pathname === '/') return 'calendar';
    if (pathname.startsWith('/students')) return 'students';
    if (pathname.startsWith('/sessions')) return 'calendar';
    // Settings would be detected here if we had a dedicated settings route
    return 'none';
  };

  const activeView = getActiveView();

  const handleNavigation = (view: 'calendar' | 'students' | 'settings') => {
    // Always navigate to home with the view parameter
    router.push(`/?view=${view}`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-end">
          <nav className="flex gap-2">
            <Button
              variant={activeView === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleNavigation('calendar')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={activeView === 'students' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleNavigation('students')}
            >
              <Users className="h-4 w-4 mr-2" />
              Students
            </Button>
            <Button
              variant={activeView === 'settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleNavigation('settings')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}

