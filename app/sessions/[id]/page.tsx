'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Clock, User, Tag, FileText, Calendar as CalendarIcon, Users, Edit, Loader2, Trash2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContextualBar } from '@/components/ui/contextual-bar';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { CompleteSessionDialog } from '@/components/CompleteSessionDialog';
import { Session, Student } from '@/lib/types';
import { getStudents, getSessions, cancelSession, completeSession, completeSessionTranslated, deleteSession, getSettings } from '@/lib/storage';
import { useMobileSwipe } from '@/lib/hooks/useMobileSwipe';
import { useTranslation } from '@/lib/hooks/useTranslation';

function SessionDetailsPageWithParams() {
  const params = useParams();
  const sessionId = params.id as string;
  
  // Get return URL from query parameters if provided
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const returnToParam = searchParams.get('returnTo');
  
  // Decode the returnTo parameter and provide smart fallback
  let returnTo = '/?view=calendar'; // Default fallback to calendar
  
  if (returnToParam) {
    try {
      // Decode the URL-encoded returnTo parameter
      returnTo = decodeURIComponent(returnToParam);
    } catch (error) {
      console.warn('Failed to decode returnTo parameter:', error);
      // Keep default fallback
    }
  }
  
  return <SessionDetailsPage sessionId={sessionId} returnTo={returnTo} />;
}

function SessionDetailsPage({ sessionId, returnTo }: { sessionId: string; returnTo: string }) {
  const router = useRouter();
  const { t, getCurrentLanguage } = useTranslation();

  const [session, setSession] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  // Mobile swipe navigation - swipe right to go back
  const swipeRef = useMobileSwipe({
    onSwipeRight: () => handleBackNavigation()
  });

  const handleBackNavigation = () => {
    router.push(returnTo);
  };

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = () => {
    setIsLoading(true);
    try {
      const sessions = getSessions();
      const foundSession = sessions.find(s => s.id === sessionId);
      
      if (foundSession) {
        setSession(foundSession);
        const allStudents = getStudents();
        setStudents(allStudents);
      } else {
        // Session not found - set session to null explicitly
        setSession(null);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      setSession(null);
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
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
    completeSessionTranslated(session.id, confirmedAttendeeIds, t);
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

    const statusTranslations = {
      scheduled: t('sessionDetails.scheduled'),
      completed: t('sessionDetails.completed'),
      cancelled: t('sessionDetails.cancelled'),
    };

    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>
        {statusTranslations[status]}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <h3 className="text-lg font-semibold mb-2">{t('sessions.loadingSessionDetails')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('sessions.loadingSessionDescription')}
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile-friendly header with back button */}
        <div className="sticky top-0 z-40 bg-background border-b safe-top-bar">
          <div className="container mx-auto px-4 pb-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push(returnTo)}
                className="flex items-center gap-2"
              >
                ← {t('sessions.back')}
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
                  <p className="text-muted-foreground">{t('sessions.sessionNotFound')}</p>
                  <Button onClick={() => router.push(returnTo)} className="mt-4">
                    {t('sessions.returnToCalendar')}
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
      <div className="sticky top-0 z-40 bg-background border-b safe-top-bar">
        <div className="container mx-auto px-4 pb-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackNavigation}
              className="flex items-center gap-2"
            >
              ← {t('sessions.back')}
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
                  {t('sessions.delete')}
                </Button>
              )}
              {session.status === 'scheduled' && (
                <Button onClick={handleEdit} size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  {t('sessions.edit')}
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
              {/* Session Details Title */}
              <div className="flex items-center justify-between pb-4 border-b">
                <h1 className="text-lg font-semibold text-foreground">{t('sessionDetails.title')}</h1>
                {getStatusBadge(session.status)}
              </div>
              {/* Date and Time Information */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('sessionDetails.date')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(session.date).toLocaleDateString(getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('sessionDetails.time')}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.startTime} - {session.endTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t('sessionDetails.sessionType')}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.sessionType === 'team' ? t('sessionDetails.team') : t('sessionDetails.individual')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Students Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {t('sessions.attendeesLabel')} ({sessionStudents.length})
                  </p>
                </div>
                <div className="space-y-2 pl-7 max-h-[300px] overflow-y-auto">
                  {sessionStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('sessions.noStudentsAssigned')}</p>
                  ) : (
                    sessionStudents.map((student) => (
                      <Card 
                        key={student.id} 
                        className="hover:shadow-sm transition-shadow cursor-pointer" 
                        onClick={() => handleAttendeeClick(student.id)}
                      >
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
                                {t('sessions.currentBalance')}: {student.balance > 0 ? `+${student.balance}` : student.balance} {Math.abs(student.balance) === 1 ? t('calendar.sessions.session') : t('calendar.sessions.sessions')}
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
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm font-medium">{t('sessions.sessionGoalsLabel')}</p>
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
                    <p className="text-sm font-medium">{t('sessions.notesLabel')}</p>
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
                    {t('sessions.createdOn')} {new Date(session.createdAt).toLocaleDateString(getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
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
                    {t('sessions.cancelSession')}
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setShowCompleteDialog(true)}
                  >
                    {t('sessions.completeSession')}
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
        title={t('sessions.cancelSessionTitle')}
        description={t('sessions.cancelSessionDescription')}
        confirmText={t('sessions.confirm')}
        cancelText={t('sessions.no')}
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
        title={t('sessions.deleteSession')}
        description={t('sessions.deleteSessionDescription')}
        confirmText={t('sessions.deleteConfirm')}
        cancelText={t('sessions.cancelConfirm')}
        variant="destructive"
        onConfirm={confirmDeleteSession}
      />
    </div>
  );
}

export default function SessionDetailsPageWrapper() {
  return <SessionDetailsPageWithParams />;
}

