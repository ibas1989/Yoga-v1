'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Session, Student } from '@/lib/types';
import { getStudents, saveStudent, getSettings } from '@/lib/storage';
import { AddStudentDialog } from './AddStudentDialog';

interface CompleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onConfirm: (confirmedAttendeeIds: string[]) => void;
}

export function CompleteSessionDialog({
  open,
  onOpenChange,
  session,
  onConfirm,
}: CompleteSessionDialogProps) {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);

  useEffect(() => {
    if (open && session) {
      loadStudents();
      // Initialize with current session attendees
      setSelectedStudentIds([...session.studentIds]);
    }
  }, [open, session]);

  const loadStudents = () => {
    const students = getStudents();
    setAllStudents(students);
  };

  if (!session) return null;

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const addNewStudent = (studentId?: string) => {
    if (studentId) {
      setSelectedStudentIds(prev => {
        if (!prev.includes(studentId)) {
          return [...prev, studentId];
        }
        return prev;
      });
      loadStudents(); // Refresh student list
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedStudentIds);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset to original attendees
    setSelectedStudentIds([...session.studentIds]);
    onOpenChange(false);
  };

  // Get session deduction from settings
  const settings = getSettings();
  const sessionDeduction = session.sessionType === 'individual' 
    ? settings.defaultIndividualSessionCharge 
    : settings.defaultTeamSessionCharge;
  const originalAttendees = allStudents.filter(s => session.studentIds.includes(s.id));
  const addedStudents = allStudents.filter(s => 
    selectedStudentIds.includes(s.id) && !session.studentIds.includes(s.id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Session</DialogTitle>
            <DialogDescription>
              Confirm attendees for this session. Students will be charged {sessionDeduction} {sessionDeduction === 1 ? 'session' : 'sessions'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Session Type Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-blue-900">
                  Session Type: <span className="capitalize">{session.sessionType}</span>
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Each attendee will be deducted <strong>{sessionDeduction} {sessionDeduction === 1 ? 'session' : 'sessions'}</strong> from their balance
                </p>
              </CardContent>
            </Card>

            {/* Original Attendees */}
            {originalAttendees.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Planned Attendees</Label>
                  <span className="text-xs text-muted-foreground">
                    Uncheck if they did not attend
                  </span>
                </div>
                <div className="space-y-2">
                  {originalAttendees.map((student) => (
                    <Card key={student.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudentIds.includes(student.id)}
                            onCheckedChange={() => toggleStudent(student.id)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`student-${student.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {student.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Current Balance: {student.balance} {Math.abs(student.balance) === 1 ? 'session' : 'sessions'}
                              {selectedStudentIds.includes(student.id) && (
                                <span className="ml-2 text-orange-600 font-medium">
                                  → After: {student.balance - sessionDeduction}
                                </span>
                              )}
                            </p>
                          </div>
                          {selectedStudentIds.includes(student.id) ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Added Students */}
            {addedStudents.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-green-700">
                  Added Attendees (Not Planned)
                </Label>
                <div className="space-y-2">
                  {addedStudents.map((student) => (
                    <Card key={student.id} className="border-green-300 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudentIds.includes(student.id)}
                            onCheckedChange={() => toggleStudent(student.id)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={`student-${student.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {student.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Current Balance: {student.balance} {Math.abs(student.balance) === 1 ? 'session' : 'sessions'}
                              <span className="ml-2 text-orange-600 font-medium">
                                → After: {student.balance - sessionDeduction}
                              </span>
                            </p>
                          </div>
                          <Check className="h-5 w-5 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Add Student Button */}
            <Button
              variant="outline"
              onClick={() => setShowAddStudentDialog(true)}
              className="w-full"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Student (Not Planned)
            </Button>

            {/* Summary */}
            <Card className="bg-muted">
              <CardContent className="p-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Attendees:</span>
                    <span className="font-medium">{selectedStudentIds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sessions to Deduct:</span>
                    <span className="font-medium">{sessionDeduction} per attendee</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={selectedStudentIds.length === 0}
            >
              Complete Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <AddStudentDialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}
        onStudentAdded={addNewStudent}
        existingStudentIds={selectedStudentIds}
      />
    </>
  );
}

