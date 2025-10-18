'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, setYear, getYear } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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


  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Generate months array
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthChange = (monthStr: string) => {
    const monthIndex = months.indexOf(monthStr);
    const updatedMonth = new Date(getYear(currentMonth), monthIndex, 1);
    setCurrentMonth(updatedMonth);
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden">
      {/* Navigation Selectors Section */}
      <div className="fixed top-4 left-4 right-4 z-10 border border-border rounded-lg p-2" style={{ backgroundColor: '#2563eb' }}>
        <div className="flex items-center justify-center gap-4">
          <Select value={getYear(currentMonth).toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[80px] sm:w-[90px] h-8 text-sm font-bold">
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
          
          <Select value={format(currentMonth, 'MMMM')} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[100px] sm:w-[110px] h-8 text-sm font-bold">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid Section */}
      <div className="fixed top-20 left-4 right-4 bottom-4 z-10 bg-background border border-border rounded-lg p-0">
        <div className="grid grid-cols-7 gap-2 mb-0">
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Compact Calendar Grid - Fixed 7x5 grid with fixed height */}
        <div className="grid grid-cols-7 grid-rows-5 border border-border rounded-lg" style={{ gridTemplateRows: 'repeat(5, 1fr)', height: '500px' }}>
          {calendarDays.map((day, index) => {
            const daySessions = getSessionsForDate(day)
              .slice()
              .sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0));
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const hasAnySessions = daySessions.length > 0;

            // Calculate session indicators (max 4: 1 circle + 3 squares)
            const statusCounts = {
              scheduled: daySessions.filter(s => s.status === 'scheduled').length,
              completed: daySessions.filter(s => s.status === 'completed').length,
              cancelled: daySessions.filter(s => s.status === 'cancelled').length
            };

            const sessionIndicators = [];
            
            // Add green circle for any sessions
            if (hasAnySessions) {
              sessionIndicators.push('circle');
            }
            
            // Add squares for each status (max 3 additional)
            const maxSquares = 3;
            let squareCount = 0;
            
            if (statusCounts.scheduled > 0 && squareCount < maxSquares) {
              sessionIndicators.push('scheduled');
              squareCount++;
            }
            if (statusCounts.completed > 0 && squareCount < maxSquares) {
              sessionIndicators.push('completed');
              squareCount++;
            }
            if (statusCounts.cancelled > 0 && squareCount < maxSquares) {
              sessionIndicators.push('cancelled');
              squareCount++;
            }

            return (
              <div
                key={index}
                className={cn(
                  "w-full h-full p-1 cursor-pointer transition-colors flex flex-col border-r border-b border-border",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isCurrentMonth && "bg-background hover:bg-accent/50",
                  isSelected && "bg-primary/20 border-primary",
                  isToday && "bg-blue-100 border-blue-500 border-2 shadow-lg"
                )}
                style={{ minHeight: '100px' }}
                onClick={() => handleDateClick(day)}
              >
                {/* Date Number - Green circle if sessions exist, centered */}
                <div className="flex justify-center mb-1 flex-shrink-0">
                  <div
                    className={cn(
                      "text-sm font-semibold flex items-center justify-center",
                      hasAnySessions 
                        ? "w-7 h-7 bg-green-500 text-white rounded-full" 
                        : "",
                      !isCurrentMonth && !hasAnySessions && "text-muted-foreground/60",
                      isToday && !hasAnySessions && "w-8 h-8 ring-2 ring-blue-500 bg-blue-500 text-white rounded-full font-bold"
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Session Status Labels - Exactly 3 labels below green circle */}
                {hasAnySessions && (
                  <div className="flex flex-col gap-1 flex-1 items-center justify-start">
                    {/* First: Scheduled sessions - Grey square */}
                    {statusCounts.scheduled > 0 && (
                      <div
                        className="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: '#B5B5BA' }}
                        title={`${statusCounts.scheduled} scheduled session${statusCounts.scheduled !== 1 ? 's' : ''}`}
                      >
                        {statusCounts.scheduled}
                      </div>
                    )}
                    
                    {/* Second: Completed sessions - Blue square */}
                    {statusCounts.completed > 0 && (
                      <div
                        className="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: 'rgb(37, 99, 235)' }}
                        title={`${statusCounts.completed} completed session${statusCounts.completed !== 1 ? 's' : ''}`}
                      >
                        {statusCounts.completed}
                      </div>
                    )}
                    
                    {/* Third: Canceled sessions - Orange square */}
                    {statusCounts.cancelled > 0 && (
                      <div
                        className="w-4 h-4 rounded-sm flex items-center justify-center text-xs font-medium text-white"
                        style={{ backgroundColor: 'rgb(249, 115, 22)' }}
                        title={`${statusCounts.cancelled} cancelled session${statusCounts.cancelled !== 1 ? 's' : ''}`}
                      >
                        {statusCounts.cancelled}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

