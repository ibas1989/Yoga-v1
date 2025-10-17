'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, setYear, getYear } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Session } from '@/lib/types';
import { getSessions } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { formatDateForUrl } from '@/lib/utils/dateUtils';

interface CalendarProps {
  onDateSelect?: (date: Date) => void; // Made optional
  onSessionClick: (session: Session) => void;
  refreshTrigger?: number;
}

export function Calendar({ onDateSelect, onSessionClick, refreshTrigger }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    loadSessions();
  }, [refreshTrigger]);

  const loadSessions = () => {
    setSessions(getSessions());
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 }); // End week on Sunday
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSessionsForDate = (date: Date) => {
    return sessions.filter(session => isSameDay(new Date(session.date), date));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    
    // Navigate to Day View page - use direct navigation to avoid router issues
    const dateStr = formatDateForUrl(date);
    window.location.href = `/calendar/day/${dateStr}`;
    
    // Call the optional callback if provided
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Generate years array (current year ±5 years)
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleYearChange = (yearStr: string) => {
    const newYear = parseInt(yearStr, 10);
    const updatedMonth = setYear(currentMonth, newYear);
    setCurrentMonth(updatedMonth);
  };

  const handleAddSession = () => {
    window.location.href = '/sessions/new';
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="w-full h-full">
      {/* Fixed Top Bar */}
      <div className="sticky top-0 z-10 bg-background border-b pb-4 mb-6">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Calendar Title */}
          <h1 className="text-lg sm:text-xl font-bold flex-shrink-0">Calendar</h1>
          
          {/* Center: Year Selector */}
          <div className="flex-shrink-0">
            <Select value={getYear(currentMonth).toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px] sm:w-[120px] h-9">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Right: Add Session Button */}
          <Button
            onClick={handleAddSession}
            size="sm"
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Add Session</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={previousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 flex-1">
          {calendarDays.map((day, index) => {
            const daySessions = getSessionsForDate(day)
              .slice()
              .sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0));
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hasAnySessions = daySessions.length > 0;

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] p-2 cursor-pointer transition-colors flex flex-col border rounded-lg",
                  !isCurrentMonth && "bg-muted/50 text-muted-foreground border-muted",
                  isCurrentMonth && "hover:bg-accent border-border",
                  isSelected && "ring-2 ring-primary",
                  isToday && "bg-primary/10 border-primary"
                )}
                onClick={() => handleDateClick(day)}
              >
                <div
                  className="mb-1 flex-shrink-0 flex items-center justify-start"
                >
                  <div
                    className={cn(
                      "h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-xs sm:text-sm",
                      isToday ? "ring-2 ring-primary text-primary" : "",
                      hasAnySessions ? "bg-accent text-accent-foreground" : ""
                    )}
                    aria-label={`${format(day, 'd')}${hasAnySessions ? ' has sessions' : ''}`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="space-y-1 flex-1 overflow-hidden">
                  {daySessions.slice(0, 10).map(session => (
                    <div
                      key={session.id}
                      className={cn(
                        "text-xs px-2 py-1 rounded truncate transition-colors hover:shadow-sm",
                        session.status === 'completed' && "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200",
                        session.status === 'scheduled' && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                        session.status === 'cancelled' && "bg-red-100 text-red-700 line-through"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Always navigate to Day View instead of session details
                        const dateStr = formatDateForUrl(day);
                        window.location.href = `/calendar/day/${dateStr}`;
                      }}
                    >
                      {session.startTime}
                    </div>
                  ))}
                  {daySessions.length > 10 && (
                    <div className="text-xs text-muted-foreground px-2 font-medium">
                      +{daySessions.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

