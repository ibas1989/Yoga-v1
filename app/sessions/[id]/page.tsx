'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Clock, User, Tag, FileText, Calendar as CalendarIcon, Users, Edit, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContextualBar } from '@/components/ui/contextual-bar';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { CompleteSessionDialog } from '@/components/CompleteSessionDialog';
import { Session, Student } from '@/lib/types';
import { getStudents, getSessions, cancelSession, completeSession, deleteSession, getSettings } from '@/lib/storage';
import { useMobileSwipe } from '@/lib/hooks/useMobileSwipe';

export default function SessionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  // Get return URL from query parameters if provided
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const returnTo = searchParams.get('returnTo') || '/?view=calendar';

  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  // Mobile swipe navigation - swipe right to go back
  const swipeRef = useMobileSwipe({
    onSwipeRight: () => router.push(returnTo)
  });

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = () => {
    setIsLoading(true);
    const sessions = getSessions();
    const foundSession = sessions.find(s => s.id === sessionId);
    
    if (foundSession) {
      setSession(foundSession);
      const allStudents = getStudents();
      setStudents(allStudents);
    }
    
    setIsLoading(false);
  };


  const handleEdit = () => {
    // Pass returnTo parameter to edit page so navigation remains consistent
    router.push(`/sessions/${sessionId}/edit?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const handleAttendeeClick = (studentId: string) => {
    router.push(`/students/${studentId}`);
  };

  const handleCancelSession = () => {
    if (!session) return;
    cancelSession(session.id);
    loadSessionData(); // Refresh session data to show updated status
    setShowCancelDialog(false);
  };

  const handleCompleteSession = (confirmedAttendeeIds: string[]) => {
    if (!session) return;
    completeSession(session.id, confirmedAttendeeIds);
    loadSessionData(); // Refresh session data to show updated status
    setShowCompleteDialog(false);
    
    // Navigate back to the return URL (Tasks tab) after a short delay to show completion
    setTimeout(() => {
      router.push(returnTo);
    }, 1000);
  };

  const handleDeleteSession = () => {
    setShowDeleteDialog(true);
  };

  const confirmDeleteSession = async () => {
    if (!session) return;
    
    setIsDeletingSession(true);
    try {
      // Delete the session (this will also remove all associated records)
      deleteSession(session.id);
      
      // Navigate back to the return URL or calendar
      router.push(returnTo);
    } catch (error) {
      console.error('Error deleting session:', error);
    } finally {
      setIsDeletingSession(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Loading session details...</h3>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch the session information.
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile-friendly header with back button */}
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push(returnTo)}
                className="flex items-center gap-2"
              >
                ← Back
              </Button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div>
          <main className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Session not found. It may have been deleted.</p>
                  <Button onClick={() => router.push(returnTo)} className="mt-4">
                    Return to Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const sessionStudents = students.filter(s => session.studentIds.includes(s.id));

  return (
    <div className="min-h-screen bg-background" ref={swipeRef}>
      {/* Mobile-friendly header with back button */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push(returnTo)}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
            <div className="flex items-center gap-2">
              {/* Only show Delete button if session is not in completed stage */}
              {session.status !== 'completed' && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteSession}
                  disabled={isDeletingSession}
                >
                  {isDeletingSession ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </Button>
              )}
              {session.status === 'scheduled' && (
                <Button onClick={handleEdit} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div>
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Date */}
              <div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(session.date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

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
                <div className="space-y-2 pl-7">
                  {sessionStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students assigned</p>
                  ) : (
                    sessionStudents.map((student) => (
                      <Card 
                        key={student.id} 
                        className="hover:shadow-sm transition-shadow cursor-pointer" 
                        onClick={() => handleAttendeeClick(student.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Balance: {student.balance} {Math.abs(student.balance) === 1 ? 'session' : 'sessions'}
                              </p>
                              {student.goals.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {student.goals.map((goal) => (
                                    <span
                                      key={goal}
                                      className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs"
                                    >
                                      {goal}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xs text-muted-foreground">Charge</p>
                              <p className="text-sm font-medium">
                                {(() => {
                                  const settings = getSettings();
                                  const charge = session.sessionType === 'individual' 
                                    ? settings.defaultIndividualSessionCharge 
                                    : settings.defaultTeamSessionCharge;
                                  return `${charge} ${charge === 1 ? 'session' : 'sessions'}`;
                                })()}
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
                  <p className="text-sm text-muted-foreground pl-7 break-words break-all whitespace-pre-wrap hyphens-auto overflow-x-hidden">
                    {session.notes}
                  </p>
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

              {/* Action Buttons for Scheduled Sessions */}
              {session.status === 'scheduled' && (
                <div className="flex flex-row justify-end gap-2 pt-4 border-t">
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancel Session
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setShowCompleteDialog(true)}
                  >
                    Complete Session
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </main>
      </div>

      {/* Cancel Session Confirmation Dialog */}
      <ConfirmationDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        title="Cancel Session"
        description="Are you sure you want to cancel this session? This action will mark the session as canceled without affecting student balances."
        confirmText="Confirm"
        cancelText="No"
        variant="destructive"
        onConfirm={handleCancelSession}
      />

      {/* Complete Session Dialog */}
      <CompleteSessionDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        session={session}
        onConfirm={handleCompleteSession}
      />

      {/* Delete Session Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Session"
        description="Are you sure you want to delete this session? This action will permanently remove the session and all associated records (attendances, tags/goals, balance adjustments, etc.). This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteSession}
      />
    </div>
  );
}

