'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { AddStudentDialog } from './AddStudentDialog';
import { Student, Session } from '@/lib/types';
import { getStudents, getSettings, saveSession } from '@/lib/storage';

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSessionCreated: () => void;
  sessionToEdit?: Session | null;
  onSessionSaved?: (session: Session) => void;
  onCancelEdit?: () => void;
}

export function SessionDialog({
  open,
  onOpenChange,
  selectedDate,
  onSessionCreated,
  sessionToEdit,
  onSessionSaved,
  onCancelEdit,
}: SessionDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [defaultTeamCharge, setDefaultTeamCharge] = useState(1);
  const [defaultIndividualCharge, setDefaultIndividualCharge] = useState(2);
  
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
    if (open) {
      loadData();
      if (sessionToEdit) {
        // populate from existing session
        setStartTime(sessionToEdit.startTime);
        const startParts = sessionToEdit.startTime.split(':');
        const endParts = sessionToEdit.endTime.split(':');
        const startDateObj = new Date();
        startDateObj.setHours(parseInt(startParts[0] || '0'), parseInt(startParts[1] || '0'), 0, 0);
        const endDateObj = new Date();
        endDateObj.setHours(parseInt(endParts[0] || '0'), parseInt(endParts[1] || '0'), 0, 0);
        const diffMs = endDateObj.getTime() - startDateObj.getTime();
        const minutes = Math.max(30, Math.round(diffMs / 60000));
        setDuration(String(minutes));
        setSessionType(sessionToEdit.sessionType);
        setSelectedStudentIds(sessionToEdit.studentIds);
        setSelectedGoals(sessionToEdit.goals || []);
        setNotes(sessionToEdit.notes || '');
      } else {
        resetForm();
      }
    }
  }, [open, sessionToEdit]);

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

  const resetForm = () => {
    setStartTime('09:00');
    setDuration('60');
    setSessionType('team');
    setSelectedStudentIds([]);
    setSelectedGoals([]);
    setNotes('');
    setStudentSearchQuery('');
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
    
    // If studentId is provided, use it; otherwise find the most recently added student
    if (studentId) {
      setLastAddedStudentId(studentId);
    } else if (loadedStudents.length > 0) {
      const newest = loadedStudents.reduce((prev, current) => 
        new Date(current.createdAt) > new Date(prev.createdAt) ? current : prev
      );
      setLastAddedStudentId(newest.id);
    }
  };

  const handleSave = () => {
    const effectiveDate = sessionToEdit ? new Date(sessionToEdit.date) : selectedDate;
    if (!effectiveDate || selectedStudentIds.length === 0) {
      alert('Please select at least one student');
      return;
    }

    const endTime = calculateEndTime(startTime, parseInt(duration));

    const newSession: Session = {
      id: sessionToEdit ? sessionToEdit.id : Date.now().toString(),
      date: effectiveDate,
      startTime,
      endTime,
      studentIds: selectedStudentIds,
      goals: selectedGoals,
      pricePerStudent: sessionToEdit ? (sessionToEdit as any).pricePerStudent : (sessionType === 'individual' ? defaultIndividualCharge : defaultTeamCharge),
      status: sessionToEdit ? sessionToEdit.status : 'scheduled',
      balanceEntries: sessionToEdit ? sessionToEdit.balanceEntries || {} : {},
      notes,
      sessionType: sessionType,
      createdAt: sessionToEdit ? sessionToEdit.createdAt : new Date(),
    };

    saveSession(newSession);
    if (sessionToEdit) {
      onSessionSaved && onSessionSaved(newSession);
    } else {
      onSessionCreated();
    }
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sessionToEdit ? 'Edit Session' : 'Create New Session'}</DialogTitle>
          <DialogDescription>
            {(sessionToEdit ? new Date(sessionToEdit.date) : selectedDate) && format(sessionToEdit ? new Date(sessionToEdit.date) : (selectedDate as Date), 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                              <X className="h-4 w-4" />
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); if (sessionToEdit) { onCancelEdit && onCancelEdit(); } }}>
            {sessionToEdit ? 'Close' : 'Cancel'}
          </Button>
          <Button onClick={handleSave}>{sessionToEdit ? 'Save Changes' : 'Create Session'}</Button>
        </DialogFooter>
      </DialogContent>

      <AddStudentDialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}
        onStudentAdded={handleStudentAdded}
      />
    </Dialog>
  );
}

