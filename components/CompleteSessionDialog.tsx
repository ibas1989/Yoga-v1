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
import { useTranslation } from '@/lib/hooks/useTranslation';

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
  const { t } = useTranslation();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  const loadStudents = () => {
    const students = getStudents();
    setAllStudents(students);
  };

  useEffect(() => {
    if (open && session) {
      loadStudents();
      // Initialize with current session attendees
      setSelectedStudentIds([...session.studentIds]);
      // Reset adding state when dialog opens
      setIsAddingStudent(false);
    }
  }, [open, session]);

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
      setIsAddingStudent(true);
      // Add student to selected list
      setSelectedStudentIds(prev => {
        if (!prev.includes(studentId)) {
          return [...prev, studentId];
        }
        return prev;
      });
      // Refresh student list to get updated data
      loadStudents();
      // Close the AddStudentDialog after adding - this should not close the CompleteSessionDialog
      setShowAddStudentDialog(false);
      // Reset the adding state after a brief delay
      setTimeout(() => {
        setIsAddingStudent(false);
      }, 100);
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
      <Dialog open={open} onOpenChange={(newOpen) => {
        // Prevent closing the dialog when AddStudentDialog is open or when adding a student
        if (!newOpen && (showAddStudentDialog || isAddingStudent)) {
          return;
        }
        // Only allow closing if we're not in the middle of adding a student
        onOpenChange(newOpen);
      }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('completeSession.title')}</DialogTitle>
            <DialogDescription>
              {t('completeSession.description', { 
                count: sessionDeduction, 
                sessionText: sessionDeduction === 1 ? t('common.session') : t('common.sessions') 
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Session Type Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-blue-900">
                  {t('completeSession.sessionType')}: {session.sessionType === 'team' ? t('sessions.team') : t('sessions.individual')}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {t('completeSession.eachAttendeeDeducted', { 
                    count: sessionDeduction, 
                    sessionText: sessionDeduction === 1 ? t('common.session') : t('common.sessions') 
                  })}
                </p>
              </CardContent>
            </Card>

            {/* Original Attendees */}
            {originalAttendees.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{t('completeSession.plannedAttendees')}</Label>
                  <span className="text-xs text-muted-foreground">
                    {t('completeSession.uncheckIfNotAttended')}
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
                              {t('completeSession.currentBalance')}: {student.balance} {Math.abs(student.balance) === 1 ? t('common.session') : t('common.sessions')}
                              {selectedStudentIds.includes(student.id) && (
                                <span className="ml-2 text-orange-600 font-medium">
                                  → {t('completeSession.after')}: {student.balance - sessionDeduction}
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
                  {t('completeSession.addedAttendees')}
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
                              {t('completeSession.currentBalance')}: {student.balance} {Math.abs(student.balance) === 1 ? t('common.session') : t('common.sessions')}
                              <span className="ml-2 text-orange-600 font-medium">
                                → {t('completeSession.after')}: {student.balance - sessionDeduction}
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
              {t('completeSession.addStudentNotPlanned')}
            </Button>

            {/* Summary */}
            <Card className="bg-muted">
              <CardContent className="p-4">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('completeSession.totalAttendees')}:</span>
                    <span className="font-medium">{selectedStudentIds.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              {t('common.cancel')}
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={selectedStudentIds.length === 0}
            >
              {t('completeSession.completeSession')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      {showAddStudentDialog && (
        <AddStudentDialog
          open={showAddStudentDialog}
          onOpenChange={setShowAddStudentDialog}
          onStudentAdded={addNewStudent}
          existingStudentIds={session.studentIds}
        />
      )}
    </>
  );
}

