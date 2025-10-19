'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { Plus } from 'lucide-react';
import { Calendar } from '@/components/Calendar';
import { StudentsView } from '@/components/StudentsView';
import { TasksView } from '@/components/TasksView';
import { SettingsView } from '@/components/SettingsView';
import { Button } from '@/components/ui/button';
import { Session } from '@/lib/types';
import { useNavigationSwipe } from '@/lib/hooks/useMobileSwipe';

function HomeContentWithParams() {
  const searchParams = useSearchParams();
  
  // Get view from URL parameters
  const viewParam = searchParams.get('view');
  const initialView = (viewParam === 'students' || viewParam === 'tasks' || viewParam === 'settings' || viewParam === 'calendar') 
    ? viewParam as 'calendar' | 'students' | 'tasks' | 'settings'
    : 'calendar';
  
  return <HomeContent initialView={initialView} />;
}

function HomeContent({ initialView }: { initialView: 'calendar' | 'students' | 'tasks' | 'settings' }) {
  const router = useRouter();
  const [view, setView] = useState<'calendar' | 'students' | 'tasks' | 'settings'>(initialView);
  const [calendarRefresh, setCalendarRefresh] = useState(0);
  
  // Mobile swipe navigation
  const { swipeRef } = useNavigationSwipe();

  // Listen for custom viewchange events from bottom navigation
  useEffect(() => {
    const handleViewChange = (event: CustomEvent) => {
      const { view } = event.detail;
      if (view === 'students' || view === 'tasks' || view === 'settings' || view === 'calendar') {
        setView(view as 'calendar' | 'students' | 'tasks' | 'settings');
      }
    };

    window.addEventListener('viewchange', handleViewChange as EventListener);
    return () => {
      window.removeEventListener('viewchange', handleViewChange as EventListener);
    };
  }, []);

  // Removed handleDateSelect - Calendar component now handles its own navigation to Day View

  const handleSessionClick = (session: Session) => {
    // Construct return URL to calendar day view for the session's date
    const sessionDate = new Date(session.date);
    const dateStr = sessionDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const returnTo = `/calendar/day/${dateStr}`;
    
    // Navigate to session details with returnTo parameter
    window.location.href = `/sessions/${session.id}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleSessionCreated = () => {
    setCalendarRefresh(prev => prev + 1);
  };

  const handleAddSessionClick = () => {
    // Navigate to new session page with returnTo parameter to go back to calendar
    window.location.href = '/sessions/new?returnTo=' + encodeURIComponent('/?view=calendar');
  };

  return (
    <div className="min-h-screen bg-background touch-manipulation" ref={swipeRef}>
      {/* Main Content - No header here, it's in the layout */}
      <main className="container mx-auto px-4 py-8 smooth-scroll">
        {view === 'calendar' && (
          <Calendar
            onSessionClick={handleSessionClick}
            refreshTrigger={calendarRefresh}
          />
        )}
        
        {view === 'students' && <StudentsView />}
        
        {view === 'tasks' && <TasksView />}
        
        {view === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContentWithParams />
    </Suspense>
  );
}

