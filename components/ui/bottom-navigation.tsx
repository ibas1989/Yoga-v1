'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Users, Settings, CheckSquare } from 'lucide-react';
import { Badge } from './badge';
import { getPendingTasksCount } from '@/lib/utils';

/**
 * BottomNavigation Component
 * 
 * A mobile-optimized bottom navigation bar that provides easy access to main sections:
 * - Calendar (home page)
 * - Students
 * - Tasks
 * - Settings
 * 
 * The bar is fixed at the bottom of the viewport and remains visible during scrolling.
 * Designed specifically for mobile devices with touch-friendly interface.
 */
export function BottomNavigationWithParams() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get view parameter
  const viewParam = searchParams.get('view');
  
  return <BottomNavigation pathname={pathname} viewParam={viewParam} />;
}

export function BottomNavigation({ pathname, viewParam }: { pathname: string; viewParam: string | null }) {
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [badgeAnimationKey, setBadgeAnimationKey] = useState(0);
  
  // Update pending tasks count
  useEffect(() => {
    const updatePendingTasksCount = () => {
      setPendingTasksCount(getPendingTasksCount());
    };
    
    // Initial load
    updatePendingTasksCount();
    
    // Listen for all session-related events to update count
    const handleSessionChanged = () => {
      const newCount = getPendingTasksCount();
      if (newCount !== pendingTasksCount) {
        setBadgeAnimationKey(prev => prev + 1);
      }
      updatePendingTasksCount();
    };
    
    // Listen for storage changes (new sessions, session updates)
    const handleStorageChange = () => {
      updatePendingTasksCount();
    };
    
    // Set up interval to check for sessions becoming overdue
    const intervalId = setInterval(() => {
      updatePendingTasksCount();
    }, 60000); // Check every minute
    
    if (typeof window !== 'undefined') {
      // Listen to all session change events
      window.addEventListener('sessionCreated', handleSessionChanged);
      window.addEventListener('sessionUpdated', handleSessionChanged);
      window.addEventListener('sessionCompleted', handleSessionChanged);
      window.addEventListener('sessionCancelled', handleSessionChanged);
      window.addEventListener('sessionDeleted', handleSessionChanged);
      window.addEventListener('sessionChanged', handleSessionChanged);
      window.addEventListener('taskListUpdate', handleSessionChanged);
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('sessionCreated', handleSessionChanged);
        window.removeEventListener('sessionUpdated', handleSessionChanged);
        window.removeEventListener('sessionCompleted', handleSessionChanged);
        window.removeEventListener('sessionCancelled', handleSessionChanged);
        window.removeEventListener('sessionDeleted', handleSessionChanged);
        window.removeEventListener('sessionChanged', handleSessionChanged);
        window.removeEventListener('taskListUpdate', handleSessionChanged);
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(intervalId);
      };
    }
  }, []);
  
  // Determine which view is active based on the pathname and search params
  const getActiveView = (): 'calendar' | 'students' | 'tasks' | 'settings' | 'none' => {
    // Check URL parameters first for home page views
    if (pathname === '/') {
      if (viewParam === 'students') return 'students';
      if (viewParam === 'tasks') return 'tasks';
      if (viewParam === 'settings') return 'settings';
      return 'calendar'; // Default to calendar
    }
    
    // For other pages, determine based on pathname
    if (pathname.startsWith('/students')) return 'students';
    if (pathname.startsWith('/sessions')) return 'calendar';
    return 'calendar'; // Default fallback
  };

  const activeView = getActiveView();

  const handleNavigation = (view: 'calendar' | 'students' | 'tasks' | 'settings') => {
    // Always use direct navigation to completely avoid router issues
    const targetUrl = `/?view=${view}`;
    
    // Check if we're already on the home page
    if (pathname === '/') {
      // Update URL and trigger view change without page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('view', view);
      window.history.replaceState({}, '', newUrl.toString());
      
      // Trigger a custom event to notify the page component
      window.dispatchEvent(new CustomEvent('viewchange', { detail: { view } }));
    } else {
      // For other pages, use direct navigation
      window.location.href = targetUrl;
    }
  };

  const navItems = [
    {
      id: 'calendar',
      label: 'Calendar',
      icon: CalendarIcon,
      view: 'calendar' as const,
    },
    {
      id: 'students',
      label: 'Students',
      icon: Users,
      view: 'students' as const,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      view: 'tasks' as const,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      view: 'settings' as const,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around py-3 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.view)}
              className={`
                flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-300 ease-in-out
                min-h-[64px] min-w-[64px] touch-manipulation relative
                ${isActive 
                  ? 'bg-green-100 text-green-700 shadow-md transform scale-105' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
              aria-label={`Navigate to ${item.label}`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 mb-1 transition-colors duration-300 ${
                  isActive ? 'text-green-700' : 'text-gray-500'
                }`} />
                {/* Show badge only for Tasks tab */}
                {item.id === 'tasks' && (
                  <Badge 
                    key={badgeAnimationKey}
                    count={pendingTasksCount} 
                    className={badgeAnimationKey > 0 ? 'badge-count-change' : ''}
                  />
                )}
              </div>
              <span className={`text-xs font-semibold transition-colors duration-300 ${
                isActive ? 'text-green-700' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
