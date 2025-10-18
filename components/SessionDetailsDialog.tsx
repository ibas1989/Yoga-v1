'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, User, Tag, FileText, Calendar as CalendarIcon, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Session, Student } from '@/lib/types';
import { getStudents, getSettings } from '@/lib/storage';

interface SessionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onRequestEdit?: (session: Session) => void;
  onAttendeeClick?: (studentId: string) => void;
}

export function SessionDetailsDialog({
  open,
  onOpenChange,
  session,
  onRequestEdit,
  onAttendeeClick,
}: SessionDetailsDialogProps) {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (open && session) {
      loadStudents();
    }
  }, [open, session]);

  const loadStudents = () => {
    const allStudents = getStudents();
    setStudents(allStudents);
  };

  if (!session) return null;

  const sessionStudents = students.filter(s => session.studentIds.includes(s.id));

  const getStatusBadge = (status: Session['status']) => {
    const styles = {
      scheduled: 'bg-secondary text-secondary-foreground',
      completed: 'bg-green-100 text-green-700 border border-green-300',
      cancelled: 'bg-red-100 text-red-700 border border-red-300',
    };

    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Session Details</DialogTitle>
          </div>
          <DialogDescription>
            {format(new Date(session.date), 'EEEE, MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Time and Session Information */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {session.startTime} - {session.endTime}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0">
                    {getStatusBadge(session.status)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Session Type</p>
                <p className="text-sm text-muted-foreground">
                  {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
                </p>
              </div>
            </div>
          </div>

          {/* Students Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium">
                Attendees ({sessionStudents.length})
              </p>
            </div>
            <div className="space-y-2 pl-7 max-h-[300px] overflow-y-auto">
              {sessionStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No students assigned</p>
              ) : (
                sessionStudents.map((student) => (
                  <Card key={student.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => onAttendeeClick && onAttendeeClick(student.id)}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className={`text-xs font-medium ${
                            student.balance > 0 
                              ? 'text-green-600' 
                              : student.balance < 0 
                              ? 'text-red-600' 
                              : 'text-gray-600'
                          }`}>
                            Current Balance: {student.balance > 0 ? `+${student.balance}` : student.balance} {Math.abs(student.balance) === 1 ? 'session' : 'sessions'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Session Goals */}
          {session.goals && session.goals.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">Session Goals</p>
              </div>
              <div className="flex flex-wrap gap-2 pl-7">
                {session.goals.map((goal) => (
                  <span
                    key={goal}
                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                  >
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {session.notes && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm font-medium">Notes</p>
              </div>
              <p className="text-sm text-muted-foreground pl-7 break-words break-all whitespace-pre-wrap hyphens-auto overflow-x-hidden">{session.notes}</p>
            </div>
          )}

          {/* Session Metadata */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>
                Created on {format(new Date(session.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}

