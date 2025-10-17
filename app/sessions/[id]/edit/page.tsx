'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
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
import { getStudents, getSettings, saveSession, getSessions } from '@/lib/storage';
import { formatDateForUrl, parseDateFromUrl } from '@/lib/utils/dateUtils';

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  // Get return URL from query parameters if provided
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const returnTo = searchParams.get('returnTo');

  const [originalSession, setOriginalSession] = useState<Session | null>(null);
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
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [lastAddedStudentId, setLastAddedStudentId] = useState<string | null>(null);
  const notesTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  
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
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
  ];

  useEffect(() => {
    loadData();
  }, [sessionId]);

  useEffect(() => {
    // Auto-select newly added student
    if (lastAddedStudentId && !selectedStudentIds.includes(lastAddedStudentId)) {
      setSelectedStudentIds(prev => [...prev, lastAddedStudentId]);
      setLastAddedStudentId(null);
    }
  }, [lastAddedStudentId, students]);

  const loadData = () => {
    setIsLoading(true);
    const loadedStudents = getStudents();
    const settings = getSettings();
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      router.push('/');
      return;
    }

    setOriginalSession(session);
    setStudents(loadedStudents);
    setAvailableGoals(settings.availableGoals);
    setDefaultTeamCharge(settings.defaultTeamSessionCharge ?? 1);
    setDefaultIndividualCharge(settings.defaultIndividualSessionCharge ?? 2);

    // Populate form with existing session data
    // Ensure we use the session date as-is to avoid timezone conversion
    setSelectedDate(session.date);
    setStartTime(session.startTime);
    
    // Calculate duration
    const startParts = session.startTime.split(':');
    const endParts = session.endTime.split(':');
    const startDateObj = new Date();
    startDateObj.setHours(parseInt(startParts[0] || '0'), parseInt(startParts[1] || '0'), 0, 0);
    const endDateObj = new Date();
    endDateObj.setHours(parseInt(endParts[0] || '0'), parseInt(endParts[1] || '0'), 0, 0);
    const diffMs = endDateObj.getTime() - startDateObj.getTime();
    const minutes = Math.max(30, Math.round(diffMs / 60000));
    setDuration(String(minutes));
    
    setSessionType(session.sessionType);
    setSelectedStudentIds(session.studentIds);
    setSelectedGoals(session.goals || []);
    setNotes(session.notes || '');
    
    setIsLoading(false);
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

  const handleStudentAdded = () => {
    const loadedStudents = getStudents();
    setStudents(loadedStudents);
    
    // Get the most recently added student (by createdAt)
    if (loadedStudents.length > 0) {
      const newest = loadedStudents.reduce((prev, current) => 
        new Date(current.createdAt) > new Date(prev.createdAt) ? current : prev
      );
      setLastAddedStudentId(newest.id);
    }
  };

  // Check if user has made any changes
  const hasUnsavedChanges = () => {
    if (!originalSession) return false;
    
    return (
      selectedDate.getTime() !== originalSession.date.getTime() ||
      startTime !== originalSession.startTime ||
      duration !== String(Math.round((new Date(`2000-01-01T${originalSession.endTime}`).getTime() - new Date(`2000-01-01T${originalSession.startTime}`).getTime()) / 60000)) ||
      sessionType !== originalSession.sessionType ||
      JSON.stringify(selectedStudentIds.sort()) !== JSON.stringify(originalSession.studentIds.sort()) ||
      JSON.stringify(selectedGoals.sort()) !== JSON.stringify((originalSession.goals || []).sort()) ||
      notes.trim() !== (originalSession.notes || '').trim()
    );
  };

  const handleSave = () => {
    if (!originalSession) return;
    
    if (selectedStudentIds.length === 0) {
      alert('Please select at least one student');
      return;
    }

    const endTime = calculateEndTime(startTime, parseInt(duration));

    const updatedSession: Session = {
      ...originalSession,
      date: selectedDate,
      startTime,
      endTime,
      studentIds: selectedStudentIds,
      goals: selectedGoals,
      notes,
      sessionType: sessionType,
    };

    saveSession(updatedSession);
    
    // Navigate back to the session details page with returnTo parameter if provided
    const url = returnTo 
      ? `/sessions/${sessionId}?returnTo=${encodeURIComponent(returnTo)}`
      : `/sessions/${sessionId}`;
    router.push(url);
  };

  // Handle back navigation with confirmation
  const handleBackClick = () => {
    if (hasUnsavedChanges()) {
      setShowBackConfirmation(true);
    } else {
      router.back();
    }
  };

  // Confirm back navigation
  const confirmBackNavigation = () => {
    setShowBackConfirmation(false);
    router.back();
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

  // Filter students based on search query
  const filteredAvailableStudents = students
    .filter(student => !selectedStudentIds.includes(student.id))
    .filter(student => 
      studentSearchQuery.length === 0 || 
      student.name.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );

  if (isLoading || !originalSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Contextual Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackClick}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
            <h2 className="text-base font-medium text-muted-foreground">
              Edit Session
            </h2>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Add top padding to account for contextual bar */}
      <div className="pt-[48px]">
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="sessionDate">Session Date</Label>
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
                <Label htmlFor="startTime">Start Time</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger id="startTime">
                    <SelectValue placeholder="Select start time" />
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
                <Label htmlFor="duration">Session Length</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger id="duration">
                    <SelectValue placeholder="Select duration" />
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
                  End time: {calculateEndTime(startTime, parseInt(duration))}
                </p>
              </div>
            </div>

            {/* Session Type */}
            <div className="space-y-2">
              <Label htmlFor="sessionType">Session Type</Label>
              <Select value={sessionType} onValueChange={(value) => setSessionType(value as 'team' | 'individual')}>
                <SelectTrigger id="sessionType">
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Session Attendees</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddStudentDialog(true)}
                  className="h-8"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Student
                </Button>
              </div>

              {students.length === 0 ? (
                <div className="border rounded-md p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    No students available yet.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddStudentDialog(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Student
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Selected Students */}
                  {selectedStudentIds.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Selected ({selectedStudentIds.length})
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
                                  Balance: {formatBalanceAsSessionCount(student.balance)}
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
                                <span className="sr-only">Remove {student.name}</span>
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Available Students */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Available Students
                    </p>
                    {/* Search Input */}
                    <Input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="h-9"
                    />
                    <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                      {filteredAvailableStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
                          onClick={() => handleStudentToggle(student.id)}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Balance: {formatBalanceAsSessionCount(student.balance)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStudentToggle(student.id);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {filteredAvailableStudents.length === 0 && studentSearchQuery.length > 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No students found matching "{studentSearchQuery}"
                        </p>
                      )}
                      {filteredAvailableStudents.length === 0 && studentSearchQuery.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          All students are selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Session Goals/Tags */}
            <div className="space-y-2">
              <Label>Session Goals/Tags</Label>
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
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                ref={notesTextareaRef}
                id="notes"
                value={notes}
                onChange={handleNotesChange}
                placeholder="Add any notes about this session..."
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
      />

      {/* Back Navigation Confirmation Dialog */}
      <ConfirmationDialog
        open={showBackConfirmation}
        onOpenChange={setShowBackConfirmation}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to leave this page?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={confirmBackNavigation}
        onCancel={cancelBackNavigation}
      />
    </div>
  );
}

