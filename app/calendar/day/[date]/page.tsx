'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format, parseISO, isSameDay } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ArrowLeft, Clock, Users, CheckCircle, XCircle, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Session, Student } from '@/lib/types';
import { getSessions, getStudents } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { formatDateForUrl, parseDateFromUrl } from '@/lib/utils/dateUtils';
import { useDayNavigationSwipe } from '@/lib/hooks/useMobileSwipe';
import { useTranslation } from '@/lib/hooks/useTranslation';

export default function CalendarDayViewPage() {
  const router = useRouter();
  const params = useParams();
  const dateParam = params.date as string;
  const { t, getCurrentLanguage } = useTranslation();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [daySessions, setDaySessions] = useState<Session[]>([]);

  // Mobile swipe navigation for day changes
  const swipeRef = useDayNavigationSwipe(selectedDate || new Date(), (newDate) => {
    const dateStr = formatDateForUrl(newDate);
    router.push(`/calendar/day/${dateStr}`);
  });

  useEffect(() => {
    if (dateParam) {
      try {
        // Parse the date string as local date to avoid timezone issues
        const date = parseDateFromUrl(dateParam);
        setSelectedDate(date);
        loadData(date);
      } catch (error) {
        console.error('Invalid date format:', error);
        router.push('/?view=calendar');
      }
    }
  }, [dateParam]);

  const loadData = (date: Date) => {
    const allSessions = getSessions();
    const allStudents = getStudents();
    
    setSessions(allSessions);
    setStudents(allStudents);
    
    // Filter sessions for the selected date
    const filteredSessions = allSessions.filter(session => 
      isSameDay(new Date(session.date), date)
    );
    setDaySessions(filteredSessions);
  };

  // Generate time slots (30-minute intervals from 06:00 to 22:00)
  const timeSlots = Array.from({ length: 33 }, (_, i) => {
    const hours = Math.floor(i / 2) + 6;
    const minutes = (i % 2) * 30;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  });

  // Compute grid positioning for sessions in 30-min increments starting 06:00
  const getGridPosition = (session: Session) => {
    const [startH, startM] = session.startTime.split(':').map(Number);
    const [endH, endM] = session.endTime.split(':').map(Number);
    const startMinutesFromSix = (startH - 6) * 60 + startM;
    const endMinutesFromSix = (endH - 6) * 60 + endM;
    const rowStart = Math.max(1, Math.floor(startMinutesFromSix / 30) + 1);
    const totalMinutes = Math.max(30, endMinutesFromSix - startMinutesFromSix);
    const rowSpan = Math.ceil(totalMinutes / 30);
    return { rowStart, rowSpan };
  };

  // Calculate statistics
  const scheduledCount = daySessions.filter(s => s.status === 'scheduled').length;
  const completedCount = daySessions.filter(s => s.status === 'completed').length;
  const cancelledCount = daySessions.filter(s => s.status === 'cancelled').length;
  
  // Get unique student IDs from all sessions
  const uniqueStudentIds = new Set(daySessions.flatMap(s => s.studentIds));
  const studentCount = uniqueStudentIds.size;

  const handleBackToCalendar = () => {
    router.push('/?view=calendar');
  };


  const handleTimeSlotClick = (timeSlot: string) => {
    if (!selectedDate) return;
    
    // Use local date formatting to avoid UTC conversion issues
    const dateStr = formatDateForUrl(selectedDate);
    router.push(`/sessions/new?date=${dateStr}&time=${timeSlot}&returnTo=${encodeURIComponent(`/calendar/day/${dateStr}`)}`);
  };

  const handleSessionClick = (session: Session) => {
    if (!selectedDate) return;
    // Use local date formatting to avoid UTC conversion issues
    const dateStr = formatDateForUrl(selectedDate);
    // Pass return URL so session details can navigate back to day view
    router.push(`/sessions/${session.id}?returnTo=/calendar/day/${dateStr}`);
  };


  // Single-block rendering: sessions will be placed once using grid rows
  const sortedDaySessions = daySessions
    .slice()
    .sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0));

  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-gray-200 border-gray-300 text-gray-900 hover:bg-gray-300';
      case 'completed':
        return 'bg-green-500 border-green-600 text-white hover:bg-green-600';
      case 'cancelled':
        return 'bg-red-100 border-red-200 text-red-700 hover:bg-red-200 line-through';
      default:
        return 'bg-gray-200 border-gray-300 text-gray-900 hover:bg-gray-300';
    }
  };

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  if (!selectedDate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">{t('calendarDay.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background touch-manipulation" ref={swipeRef}>
      {/* Header Section - Fixed at top of screen */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToCalendar}
              className="gap-2 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t('calendarDay.backToCalendar')}</span>
              <span className="sm:hidden">{t('calendarDay.back')}</span>
            </Button>
            <div className="text-center flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                <div className="capitalize">{format(selectedDate, 'EEEE', { locale: getCurrentLanguage() === 'ru' ? ru : enUS })}</div>
                <div className="text-lg sm:text-xl capitalize">
                  {getCurrentLanguage() === 'ru' 
                    ? format(selectedDate, 'd MMMM, yyyy', { locale: ru })
                    : format(selectedDate, 'MMMM d, yyyy', { locale: enUS })
                  }
                </div>
              </h1>
            </div>
            <div className="flex-shrink-0 w-24"></div> {/* Spacer for balance */}
          </div>

          {/* Day Summary Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 mb-1">
            <Card>
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('calendarDay.totalSessions')}</p>
                    <p className="text-lg font-bold">{daySessions.length}</p>
                  </div>
                  <CalendarIcon className="h-5 w-5 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('calendarDay.scheduled')}</p>
                    <p className="text-lg font-bold text-gray-600">{scheduledCount}</p>
                  </div>
                  <Clock className="h-5 w-5 text-gray-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('calendarDay.completed')}</p>
                    <p className="text-lg font-bold text-green-600">{completedCount}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('calendarDay.canceled')}</p>
                    <p className="text-lg font-bold text-red-600">{cancelledCount}</p>
                  </div>
                  <XCircle className="h-5 w-5 text-red-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Timeline Section */}
      <main className="container mx-auto px-4 pt-[240px] sm:pt-[260px] pb-8">
        <Card>
          <CardContent className="p-0">
            {/* Timeline grid with labels and session overlay */}
            <div className="relative overflow-hidden">
              {/* Underlay grid for time rows and labels */}
              <div className="divide-y">
                {timeSlots.map((timeSlot) => {
                  const isHourMark = timeSlot.endsWith(':00');
                  return (
                    <div
                      key={timeSlot}
                      className={cn(
                        "flex min-h-[60px] transition-colors hover:bg-muted/20",
                        isHourMark && "border-t-2 border-primary/20"
                      )}
                    >
                      {/* Time Label */}
                      <div className={cn(
                        "w-16 sm:w-20 flex-shrink-0 p-2 sm:p-3 border-r bg-muted/30 flex items-center justify-center",
                        isHourMark && "font-semibold bg-muted/50"
                      )}>
                        <span className={cn(
                          "text-xs sm:text-sm",
                          isHourMark ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {timeSlot}
                        </span>
                      </div>
                      {/* Click to add session in empty areas */}
                      <div
                        className="flex-1 p-2 cursor-pointer hover:bg-accent/30 transition-colors rounded-sm"
                        onClick={() => handleTimeSlotClick(timeSlot)}
                        title={t('calendarDay.clickToAddSession', { time: timeSlot })}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Absolute overlay to place single blocks spanning duration */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  display: 'grid',
                  gridTemplateRows: 'repeat(33, minmax(60px, auto))',
                  gridTemplateColumns: '80px 1fr',
                }}
                aria-hidden="false"
              >
                {/* left column spacer for labels */}
                <div style={{ gridColumn: 1, gridRow: '1 / -1' }} />
                {/* session blocks placed directly in grid column 2 */}
                {sortedDaySessions.map((session) => {
                  const { rowStart, rowSpan } = getGridPosition(session);
                  const sessionStudents = students.filter(s => session.studentIds.includes(s.id));
                  return (
                    <div
                      key={session.id}
                      style={{ gridColumn: 2, gridRow: `${rowStart} / span ${rowSpan}`, pointerEvents: 'auto' }}
                      className={cn(
                        "m-2 p-2 sm:p-3 rounded-lg border-l-4 cursor-pointer transition-all shadow-sm",
                        getStatusColor(session.status)
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSessionClick(session);
                      }}
                    >
                      <div className="flex flex-col gap-2">
                        {/* Top row: time on left, status on right (mobile-friendly) */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(session.status)}
                            <span className="text-xs sm:text-sm font-semibold">
                              {session.startTime} - {session.endTime}
                            </span>
                          </div>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                            "bg-white/20 backdrop-blur-sm"
                          )}>
                            {getStatusIcon(session.status)}
                            {t(`calendarDay.status.${session.status}`)}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs opacity-90 mb-1">
                            {session.sessionType === 'team' ? t('sessionDetails.team') : t('sessionDetails.individual')} {t('calendarDay.session')}
                          </p>
                          <div className="flex items-center gap-1 text-xs opacity-90">
                            <Users className="h-3 w-3" />
                            <span>
                              {sessionStudents.length} {sessionStudents.length === 1 ? t('calendarDay.attendee') : t('calendarDay.attendees')}
                            </span>
                          </div>
                          {sessionStudents.length > 0 && (
                            <p className="text-xs mt-1 opacity-80 truncate">
                              {sessionStudents.map(s => s.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

