'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Disable static generation for this page
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { Plus, Target } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AddStudentDialog } from '@/components/AddStudentDialog';
import { ContextualBar } from '@/components/ui/contextual-bar';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Student, Session } from '@/lib/types';
import { getStudents, getSettings, saveSession } from '@/lib/storage';
import { formatDateForUrl, parseDateFromUrl } from '@/lib/utils/dateUtils';
import { useTranslation } from '@/lib/hooks/useTranslation';

function NewSessionContentWithParams() {
  const searchParams = useSearchParams();
  
  // Get date and time from query parameters if provided
  const dateParam = searchParams.get('date');
  const timeParam = searchParams.get('time');
  const returnTo = searchParams.get('returnTo');
  
  return <NewSessionContent dateParam={dateParam} timeParam={timeParam} returnTo={returnTo} />;
}

function NewSessionContent({ dateParam, timeParam, returnTo }: { dateParam: string | null; timeParam: string | null; returnTo: string | null }) {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [defaultTeamCharge, setDefaultTeamCharge] = useState(1);
  const [defaultIndividualCharge, setDefaultIndividualCharge] = useState(2);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('60'); // Duration in minutes
  const [sessionType, setSessionType] = useState<'team' | 'individual'>('team');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [lastAddedStudentId, setLastAddedStudentId] = useState<string | null>(null);
  const notesTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  
  // State for unsaved changes confirmation
  const [showBackConfirmation, setShowBackConfirmation] = useState(false);

  // Time options - 30-minute intervals from 06:00 to 22:00
  const timeOptions = Array.from({ length: 33 }, (_, i) => {
    const hours = Math.floor(i / 2) + 6;
    const minutes = (i % 2) * 30;
    const value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return { value, label: value };
  });

  // Duration options in minutes
  const durationOptions = [
    { value: '60', label: t('sessions.durationOptions.oneHour') },
    { value: '90', label: t('sessions.durationOptions.oneAndHalfHours') },
    { value: '120', label: t('sessions.durationOptions.twoHours') },
  ];

  useEffect(() => {
    loadData();
    
    // Set initial values from URL parameters
    if (dateParam) {
      const parsedDate = parseDateFromUrl(dateParam);
      setSelectedDate(parsedDate);
    }
    if (timeParam) {
      setStartTime(timeParam);
    }
  }, []);

  // Update state when search parameters change
  useEffect(() => {
    if (dateParam) {
      const parsedDate = parseDateFromUrl(dateParam);
      setSelectedDate(parsedDate);
    }
    if (timeParam) {
      setStartTime(timeParam);
    }
  }, [dateParam, timeParam]);

  useEffect(() => {
    // Auto-select newly added student
    if (lastAddedStudentId && !selectedStudentIds.includes(lastAddedStudentId)) {
      setSelectedStudentIds(prev => [...prev, lastAddedStudentId]);
      setLastAddedStudentId(null);
    }
  }, [lastAddedStudentId, students]);

  const loadData = () => {
    const loadedStudents = getStudents();
    const settings = getSettings();
    setStudents(loadedStudents);
    setAvailableGoals(settings.availableGoals);
    setDefaultTeamCharge(settings.defaultTeamSessionCharge ?? 1);
    setDefaultIndividualCharge(settings.defaultIndividualSessionCharge ?? 2);
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (start: string, durationMinutes: number): string => {
    const [hours, minutes] = start.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleGoalToggle = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    // Auto-resize textarea
    if (notesTextareaRef.current) {
      notesTextareaRef.current.style.height = 'auto';
      notesTextareaRef.current.style.height = `${notesTextareaRef.current.scrollHeight}px`;
    }
  };

  const handleStudentAdded = (studentId?: string) => {
    const loadedStudents = getStudents();
    setStudents(loadedStudents);
    
    if (studentId) {
      // If a specific student ID is provided, add that student to the session
      if (!selectedStudentIds.includes(studentId)) {
        setSelectedStudentIds(prev => [...prev, studentId]);
      }
    } else {
      // Get the most recently added student (by createdAt) - for newly created students
      if (loadedStudents.length > 0) {
        const newest = loadedStudents.reduce((prev, current) => 
          new Date(current.createdAt) > new Date(prev.createdAt) ? current : prev
        );
        setLastAddedStudentId(newest.id);
      }
    }
  };

  // Check if user has entered any data
  const hasUnsavedChanges = () => {
    return (
      selectedDate.getTime() !== new Date().getTime() ||
      startTime !== '09:00' ||
      duration !== '60' ||
      sessionType !== 'team' ||
      selectedStudentIds.length > 0 ||
      selectedGoals.length > 0 ||
      notes.trim() !== ''
    );
  };

  const handleSave = () => {
    if (selectedStudentIds.length === 0) {
      alert(t('sessions.pleaseSelectStudent'));
      return;
    }

    const endTime = calculateEndTime(startTime, parseInt(duration));

    const newSession: Session = {
      id: Date.now().toString(),
      date: selectedDate,
      startTime,
      endTime,
      studentIds: selectedStudentIds,
      goals: selectedGoals,
      pricePerStudent: sessionType === 'individual' ? defaultIndividualCharge : defaultTeamCharge,
      status: 'scheduled',
      balanceEntries: {},
      notes,
      sessionType: sessionType,
      createdAt: new Date(),
    };

    saveSession(newSession);
    
    // Navigate to the session details page with returnTo parameter if provided
    const url = returnTo 
      ? `/sessions/${newSession.id}?returnTo=${encodeURIComponent(returnTo)}`
      : `/sessions/${newSession.id}`;
    router.push(url);
  };

  // Handle back navigation with confirmation
  const handleBackClick = () => {
    if (hasUnsavedChanges()) {
      setShowBackConfirmation(true);
    } else {
      // Use returnTo parameter if available, otherwise go back
      if (returnTo) {
        router.push(returnTo);
      } else {
        router.back();
      }
    }
  };

  // Confirm back navigation
  const confirmBackNavigation = () => {
    setShowBackConfirmation(false);
    // Use returnTo parameter if available, otherwise go back
    if (returnTo) {
      router.push(returnTo);
    } else {
      router.back();
    }
  };

  // Cancel back navigation
  const cancelBackNavigation = () => {
    setShowBackConfirmation(false);
  };


  // Helper function to format balance as session count
  const formatBalanceAsSessionCount = (balance: number): string => {
    const sessionCount = Math.round(balance);
    const plural = Math.abs(sessionCount) !== 1 ? 's' : '';
    return `${sessionCount} session${plural}`;
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Contextual Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b safe-top-bar">
        <div className="container mx-auto px-4 pb-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              ← {t('sessions.back')}
            </Button>
            <h2 className="text-base font-medium text-muted-foreground">
              {t('sessions.newSession')}
            </h2>
            <Button onClick={handleSave}>
              {t('sessions.create')}
            </Button>
          </div>
        </div>
      </div>

      {/* Add top padding to account for contextual bar and safe area */}
      <div className="pt-20">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{t('sessions.sessionDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="sessionDate">{t('sessions.sessionDate')}</Label>
              <Input
                id="sessionDate"
                type="date"
                value={formatDateForUrl(selectedDate)}
                onChange={(e) => {
                  // Parse the date string as local date to avoid timezone issues
                  setSelectedDate(parseDateFromUrl(e.target.value));
                }}
              />
            </div>

            {/* Time and Duration Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">{t('sessions.startTime')}</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="startTime">
                    <SelectValue placeholder={t('sessions.selectStartTime')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{t('sessions.sessionLength')}</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue placeholder={t('sessions.selectDuration')} />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('sessions.endTime')}: {calculateEndTime(startTime, parseInt(duration))}
                </p>
              </div>
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <Label htmlFor="sessionType">{t('sessions.sessionType')}</Label>
              <Select value={sessionType} onValueChange={(value) => setSessionType(value as 'team' | 'individual')}>
                <SelectTrigger id="sessionType">
                  <SelectValue placeholder={t('sessions.selectSessionType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">{t('sessions.team')}</SelectItem>
                  <SelectItem value="individual">{t('sessions.individual')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('sessions.attendees')}</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddStudentDialog(true)}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t('sessions.addStudent')}
                </Button>
              </div>

              {students.length === 0 ? (
                <div className="border rounded-md p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('sessions.noStudentsAvailable')}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddStudentDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('sessions.addYourFirstStudent')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Selected Students */}
                  {selectedStudentIds.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('sessions.selected')} ({selectedStudentIds.length})
                      </p>
                      <div className="space-y-2">
                        {selectedStudentIds.map((studentId) => {
                          const student = students.find(s => s.id === studentId);
                          if (!student) return null;
                          return (
                            <div
                              key={student.id}
                              className="flex items-center justify-between bg-primary/10 rounded-md px-3 py-2 border border-primary/20"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{student.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {t('sessions.balance')}: {formatBalanceAsSessionCount(student.balance)}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStudentToggle(student.id)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Plus className="h-4 w-4 rotate-45" />
                                <span className="sr-only">{t('sessions.removeStudent', { studentName: student.name })}</span>
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Session Goals/Tags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                {t('sessions.sessionGoals')}
              </Label>
              <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableGoals.map((goal) => (
                    <div key={goal} className="flex items-center space-x-2">
                      <Checkbox
                        id={`goal-${goal}`}
                        checked={selectedGoals.includes(goal)}
                        onCheckedChange={() => handleGoalToggle(goal)}
                      />
                      <label
                        htmlFor={`goal-${goal}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {goal}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('sessions.notesOptional')}</Label>
              <Textarea
                ref={notesTextareaRef}
                id="notes"
                value={notes}
                onChange={handleNotesChange}
                placeholder={t('sessions.addNotesPlaceholder')}
                className="min-h-[80px] resize-none overflow-hidden"
                rows={3}
              />
            </div>

          </CardContent>
        </Card>
        </main>
      </div>

      <AddStudentDialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}
        onStudentAdded={handleStudentAdded}
        existingStudentIds={selectedStudentIds}
      />

      {/* Back Navigation Confirmation Dialog */}
      <ConfirmationDialog
        open={showBackConfirmation}
        onOpenChange={setShowBackConfirmation}
        title={t('sessions.unsavedChanges')}
        description={t('sessions.unsavedChangesDescription')}
        confirmText={t('sessions.yes')}
        cancelText={t('sessions.no')}
        cancelVariant="destructive"
        onConfirm={confirmBackNavigation}
        onCancel={cancelBackNavigation}
      />
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewSessionContentWithParams />
    </Suspense>
  );
}

