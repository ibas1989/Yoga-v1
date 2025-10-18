'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Edit, User, Phone, Wallet, Target, Calendar, Clock, Plus, Trash2, Weight, Ruler, Cake, FileText, Loader2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ContextualBar } from '@/components/ui/contextual-bar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label as UILabel } from '@/components/ui/label';
import { Student, Session, StudentNote, BalanceTransaction } from '@/lib/types';
import { getStudents, getSessions, addBalanceTransaction, addStudentNote, updateStudentNote, deleteStudentNote, deleteStudent } from '@/lib/storage';
import { useStudent } from '@/lib/hooks/useStudent';
import { SessionDetailsDialog } from '@/components/SessionDetailsDialog';
import { TransactionDetailsDialog } from '@/components/TransactionDetailsDialog';
import { NoteDetailsDialog } from '@/components/ui/note-details-dialog';
import { DeleteConfirmationDialog, UpdateConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { NewNoteDialog } from '@/components/NewNoteDialog';
import { formatBalanceForDisplay, getAgeInYearsAndMonths, getMemberSinceAge, getSessionTypeDisplayName, getSessionCount } from '@/lib/utils/dateUtils';
import { useMobileSwipe } from '@/lib/hooks/useMobileSwipe';

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const { 
    student: currentStudent, 
    sessions: studentSessions, 
    isLoading: studentLoading, 
    error: studentError,
    forceRefresh
  } = useStudent(studentId);

  // Mobile swipe navigation - swipe right to go back
  const swipeRef = useMobileSwipe({
    onSwipeRight: () => router.push('/?view=students')
  });

  const [showSessionDetailsDialog, setShowSessionDetailsDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showTransactionDetailsDialog, setShowTransactionDetailsDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BalanceTransaction | null>(null);
  const [showNoteDetailsDialog, setShowNoteDetailsDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  
  // Note management states
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [showDeleteNoteConfirm, setShowDeleteNoteConfirm] = useState(false);
  const [showUpdateNoteConfirm, setShowUpdateNoteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [noteToUpdate, setNoteToUpdate] = useState<string | null>(null);
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  
  // Balance transaction states
  const [showBalanceTransactionDialog, setShowBalanceTransactionDialog] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionReason, setTransactionReason] = useState('');
  const [isBalanceSaving, setIsBalanceSaving] = useState(false);
  
  // Student deletion states
  const [showDeleteStudentConfirm, setShowDeleteStudentConfirm] = useState(false);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  
  // Pagination states
  const [sessionPage, setSessionPage] = useState(1);
  const [balanceTransactionPage, setBalanceTransactionPage] = useState(1);
  const sessionsPerPage = 4;
  const transactionsPerPage = 4;

  useEffect(() => {
    if (currentStudent) {
      // Force refresh when student ID changes
      forceRefresh();
    }
  }, [studentId]);


  const handleEdit = () => {
    router.push(`/students/${studentId}/edit`);
  };

  const handleDeleteStudent = () => {
    setShowDeleteStudentConfirm(true);
  };

  const confirmDeleteStudent = async () => {
    if (!currentStudent) return;
    
    setIsDeletingStudent(true);
    try {
      // Delete the student (this will also remove all associated records)
      deleteStudent(currentStudent.id);
      
      // Navigate back to students list
      router.push('/?view=students');
    } catch (error) {
      console.error('Error deleting student:', error);
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setShowSessionDetailsDialog(true);
  };

  const handleTransactionClick = (transaction: BalanceTransaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDetailsDialog(true);
  };

  const handleNoteClick = (note: any) => {
    setSelectedNote(note);
    setShowNoteDetailsDialog(true);
  };

  const handleNoteChanged = (updatedNote: StudentNote) => {
    setSelectedNote(updatedNote);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Not specified';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  };

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return 'Not specified';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid time';
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700';
      case 'cancelled':
        return 'bg-red-50 text-red-700';
      case 'scheduled':
        return 'bg-blue-50 text-blue-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };


  const getPaginatedSessions = () => {
    const startIndex = (sessionPage - 1) * sessionsPerPage;
    const endIndex = startIndex + sessionsPerPage;
    return studentSessions.slice(startIndex, endIndex);
  };

  const getPaginatedBalanceTransactions = () => {
    if (!currentStudent?.balanceTransactions) return [];
    const sortedTransactions = [...currentStudent.balanceTransactions].sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    );
    const startIndex = (balanceTransactionPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    return sortedTransactions.slice(startIndex, endIndex);
  };

  const getTotalSessionPages = () => {
    return Math.ceil(studentSessions.length / sessionsPerPage);
  };

  const getTotalTransactionPages = () => {
    if (!currentStudent?.balanceTransactions) return 0;
    return Math.ceil(currentStudent.balanceTransactions.length / transactionsPerPage);
  };

  // Note management handlers
  const handleNewNoteSave = async (content: string) => {
    if (!content.trim() || !currentStudent) return;
    
    setIsNoteSaving(true);
    try {
      addStudentNote(currentStudent.id, content.trim());
      // Force refresh to show the new note
      setTimeout(() => {
        forceRefresh();
      }, 100);
    } finally {
      setIsNoteSaving(false);
    }
  };


  const handleEditNote = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setEditingNoteContent(content);
  };

  const handleSaveNote = async () => {
    if (!editingNoteId || !currentStudent) return;
    setNoteToUpdate(editingNoteId);
    setShowUpdateNoteConfirm(true);
  };

  const confirmUpdateNote = async () => {
    if (!currentStudent || !noteToUpdate) return;
    setIsNoteSaving(true);
    try {
      updateStudentNote(currentStudent.id, noteToUpdate, editingNoteContent);
      setEditingNoteId(null);
      setEditingNoteContent('');
      setNoteToUpdate(null);
      // Force refresh to show the updated note
      setTimeout(() => {
        forceRefresh();
      }, 100);
    } finally {
      setIsNoteSaving(false);
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleDeleteNote = async (noteId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation(); // Prevent triggering note click
    if (!currentStudent) return;
    setNoteToDelete(noteId);
    setShowDeleteNoteConfirm(true);
  };

  const confirmDeleteNote = async () => {
    if (!currentStudent || !noteToDelete) return;
    setIsNoteSaving(true);
    try {
      deleteStudentNote(currentStudent.id, noteToDelete);
      setNoteToDelete(null);
      // Force refresh to update the notes list
      setTimeout(() => {
        forceRefresh();
      }, 100);
    } finally {
      setIsNoteSaving(false);
    }
  };

  // Balance transaction handlers
  const handleAddBalanceTransaction = () => {
    if (!currentStudent || !transactionAmount.trim() || !transactionReason.trim()) return;
    
    const amount = parseInt(transactionAmount);
    if (isNaN(amount)) return;
    
    setIsBalanceSaving(true);
    try {
      addBalanceTransaction(currentStudent.id, amount, transactionReason);
      
      setTransactionAmount('');
      setTransactionReason('');
      setShowBalanceTransactionDialog(false);
      
      // Force refresh to show the updated balance and transaction history
      setTimeout(() => {
        forceRefresh();
      }, 100);
    } finally {
      setIsBalanceSaving(false);
    }
  };

  // Utility functions for note truncation
  const truncateToLines = (text: string, maxLines: number = 3): { truncated: string; isTruncated: boolean } => {
    const lines = text.split('\n');
    if (lines.length <= maxLines) {
      return { truncated: text, isTruncated: false };
    }
    const truncatedLines = lines.slice(0, maxLines);
    return { truncated: truncatedLines.join('\n'), isTruncated: true };
  };


  if (studentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Loading student details...</h3>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch the student information.
          </p>
        </div>
      </div>
    );
  }

  if (studentError || !currentStudent) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile-friendly header with back button */}
        <div className="sticky top-0 z-40 bg-background border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/?view=students')}
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
                  <p className="text-muted-foreground">
                    {studentError ? `Error: ${studentError}` : 'Student not found. It may have been deleted.'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Student ID: {studentId}
                  </p>
                  <Button onClick={() => router.push('/?view=students')} className="mt-4">
                    Return to Students
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" ref={swipeRef}>
      {/* Mobile-friendly header with back button */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/?view=students')}
              className="flex items-center gap-2"
            >
              ← Back
            </Button>
            <div className="flex items-center gap-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleDeleteStudent}
                disabled={isDeletingStudent}
              >
                {isDeletingStudent ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </Button>
              <Button onClick={handleEdit} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div>
        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <h1 className="text-xl font-semibold">{currentStudent.name}</h1>
            </div>
          </div>
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-sm">{currentStudent.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-sm flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    {currentStudent.phone || 'No phone'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Weight</Label>
                  <p className="text-sm flex items-center">
                    <Weight className="h-4 w-4 mr-2 text-muted-foreground" />
                    {currentStudent.weight ? `${currentStudent.weight} kg` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Height</Label>
                  <p className="text-sm flex items-center">
                    <Ruler className="h-4 w-4 mr-2 text-muted-foreground" />
                    {currentStudent.height ? `${currentStudent.height} cm` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Age</Label>
                  <p className="text-sm">
                    {getAgeInYearsAndMonths(currentStudent.birthday)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Birthday</Label>
                  <p className="text-sm flex items-center">
                    <Cake className="h-4 w-4 mr-2 text-muted-foreground" />
                    {currentStudent.birthday ? formatDate(currentStudent.birthday) : 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                  <p className="text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    {currentStudent.memberSince ? formatDate(currentStudent.memberSince) : 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Member Since Age</Label>
                  <p className="text-sm">
                    {getMemberSinceAge(currentStudent.memberSince)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Current Balance</Label>
                  <p className={`text-sm font-medium ${
                    currentStudent.balance > 0 ? 'text-red-600' : currentStudent.balance < 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {currentStudent.balance > 0 ? `+${formatBalanceForDisplay(currentStudent.balance)}` : formatBalanceForDisplay(currentStudent.balance)} sessions
                  </p>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowBalanceTransactionDialog(true)}
                    className="mt-2"
                    disabled={isBalanceSaving}
                  >
                    {isBalanceSaving ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-3 w-3 mr-1" />
                    )}
                    Add Balance Transaction
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-3 bg-gray-50">
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {currentStudent.description || 'No description provided'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Note Button */}
              <div className="flex justify-start">
                <Button 
                  onClick={() => setShowNewNoteModal(true)}
                  className="flex items-center gap-2"
                  disabled={isNoteSaving}
                >
                  <Plus className="h-4 w-4" />
                  Add a Note
                </Button>
              </div>

              {/* Notes List */}
              <div className="space-y-3">
                {currentStudent.notes.length > 0 ? (
                  currentStudent.notes
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((note) => (
                      <div key={note.id} className="border rounded-lg p-3 bg-gray-50">
                        {editingNoteId === note.id ? (
                          <div className="space-y-2">
                            <textarea
                              id="edit-note-content"
                              name="edit-note-content"
                              value={editingNoteContent}
                              onChange={(e) => setEditingNoteContent(e.target.value)}
                              className="w-full min-h-[60px] px-3 py-2 border border-input bg-background rounded-md text-sm"
                              placeholder="Edit note content..."
                            />
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={handleSaveNote} disabled={isNoteSaving}>
                                {isNoteSaving ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3 mr-1" />
                                )}
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEditNote} disabled={isNoteSaving}>
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Note content with 3-line truncation */}
                            <div 
                              className="text-sm text-gray-700 cursor-pointer hover:bg-gray-100 p-3 rounded transition-colors min-h-[60px]"
                              onClick={() => handleNoteClick(note)}
                            >
                              <div className="whitespace-pre-wrap break-words">
                                {(() => {
                                  const { truncated, isTruncated } = truncateToLines(note.content, 3);
                                  
                                  return (
                                    <>
                                      {truncated}
                                      {isTruncated && (
                                        <div className="text-blue-600 text-xs mt-2 font-medium">
                                          Click to view full content...
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            
                            {/* Created and Updated dates */}
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Created: {formatDate(note.timestamp)} at {formatTime(note.timestamp)}
                              </p>
                              {note.updatedAt && (
                                <p className="text-xs text-muted-foreground">
                                  Updated: {formatDate(note.updatedAt)} at {formatTime(note.updatedAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notes yet. Click &quot;Add a Note&quot; to create your first note.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Goals & Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {currentStudent.goals && currentStudent.goals.length > 0 ? (
                  currentStudent.goals.map((goal) => (
                    <span
                      key={goal}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                    >
                      {goal}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No goals set</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Balance Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                Balance Transaction History ({currentStudent.balanceTransactions?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentStudent.balanceTransactions && currentStudent.balanceTransactions.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Date & Time</th>
                          <th className="text-left p-3 font-medium">Change Amount</th>
                          <th className="text-left p-3 font-medium">Updated Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedBalanceTransactions().map((transaction) => (
                          <tr key={transaction.id} className="border-b hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleTransactionClick(transaction)}>
                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="flex items-center text-sm">
                                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                  {formatDate(transaction.date)}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {formatTime(transaction.date)}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className={`text-sm font-medium ${
                                transaction.changeAmount > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.changeAmount > 0 ? `+${transaction.changeAmount}` : transaction.changeAmount} sessions
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`text-sm font-medium ${
                                transaction.balanceAfter > 0 ? 'text-green-600' : transaction.balanceAfter < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {transaction.balanceAfter > 0 ? `+${transaction.balanceAfter}` : transaction.balanceAfter} sessions
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination for Balance Transactions */}
                  {getTotalTransactionPages() > 1 && (
                    <div className="flex items-center justify-center">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBalanceTransactionPage(prev => Math.max(1, prev - 1))}
                          disabled={balanceTransactionPage === 1}
                        >
                          ←
                        </Button>
                        <span className="text-sm text-muted-foreground px-2 py-1">
                          Page {balanceTransactionPage} of {getTotalTransactionPages()}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBalanceTransactionPage(prev => Math.min(getTotalTransactionPages(), prev + 1))}
                          disabled={balanceTransactionPage === getTotalTransactionPages()}
                        >
                          →
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No balance transactions recorded yet</p>
              )}
            </CardContent>
          </Card>

          {/* Session History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Session History ({studentSessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentSessions.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Date & Time</th>
                          <th className="text-left p-3 font-medium">Session Type</th>
                          <th className="text-left p-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedSessions().map((session) => (
                          <tr 
                            key={session.id} 
                            className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleSessionClick(session)}
                          >
                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="flex items-center text-sm">
                                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                                  {formatDate(session.date)}
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {session.startTime} - {session.endTime}
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                                {getSessionTypeDisplayName(session.sessionType)} ({getSessionCount(session.sessionType)} session{getSessionCount(session.sessionType) !== 1 ? 's' : ''})
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionStatusColor(session.status)}`}>
                                {session.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination for Sessions */}
                  {getTotalSessionPages() > 1 && (
                    <div className="flex items-center justify-center">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSessionPage(prev => Math.max(1, prev - 1))}
                          disabled={sessionPage === 1}
                        >
                          ←
                        </Button>
                        <span className="text-sm text-muted-foreground px-2 py-1">
                          Page {sessionPage} of {getTotalSessionPages()}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSessionPage(prev => Math.min(getTotalSessionPages(), prev + 1))}
                          disabled={sessionPage === getTotalSessionPages()}
                        >
                          →
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No sessions recorded yet</p>
              )}
            </CardContent>
          </Card>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <SessionDetailsDialog
        open={showSessionDetailsDialog}
        onOpenChange={setShowSessionDetailsDialog}
        session={selectedSession}
      />

      <TransactionDetailsDialog
        open={showTransactionDetailsDialog}
        onOpenChange={setShowTransactionDetailsDialog}
        transaction={selectedTransaction}
      />

      <NoteDetailsDialog
        open={showNoteDetailsDialog}
        onOpenChange={setShowNoteDetailsDialog}
        note={selectedNote}
        studentId={studentId}
        onNoteUpdated={forceRefresh}
        onNoteChanged={handleNoteChanged}
      />

      {/* New Note Modal */}
      <NewNoteDialog
        open={showNewNoteModal}
        onOpenChange={setShowNewNoteModal}
        onSave={handleNewNoteSave}
        isLoading={isNoteSaving}
      />

      {/* Confirmation Dialogs */}
      <DeleteConfirmationDialog
        open={showDeleteNoteConfirm}
        onOpenChange={setShowDeleteNoteConfirm}
        itemName="note"
        onConfirm={confirmDeleteNote}
        isLoading={isNoteSaving}
      />

      <UpdateConfirmationDialog
        open={showUpdateNoteConfirm}
        onOpenChange={setShowUpdateNoteConfirm}
        itemName="note"
        onConfirm={confirmUpdateNote}
        isLoading={isNoteSaving}
      />

      {/* Student Deletion Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteStudentConfirm}
        onOpenChange={setShowDeleteStudentConfirm}
        itemName="student"
        onConfirm={confirmDeleteStudent}
        isLoading={isDeletingStudent}
      />

      {/* Balance Transaction Dialog */}
      {showBalanceTransactionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add Balance Transaction</h3>
              <div className="space-y-4">
                <div>
                  <UILabel htmlFor="transactionAmount">Amount</UILabel>
                  <Input
                    id="transactionAmount"
                    type="number"
                    step="1"
                    value={transactionAmount}
                    onChange={(e) => setTransactionAmount(e.target.value)}
                    placeholder="Enter amount (positive to add, negative to deduct)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Positive values add to balance, negative values deduct from balance
                  </p>
                </div>
                <div>
                  <UILabel htmlFor="transactionReason">Reason / Description</UILabel>
                  <Input
                    id="transactionReason"
                    value={transactionReason}
                    onChange={(e) => setTransactionReason(e.target.value)}
                    placeholder="Enter reason for this transaction"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBalanceTransactionDialog(false);
                    setTransactionAmount('');
                    setTransactionReason('');
                  }}
                  disabled={isBalanceSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddBalanceTransaction}
                  disabled={!transactionAmount.trim() || !transactionReason.trim() || isBalanceSaving}
                >
                  {isBalanceSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Add Transaction
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add this helper component at the bottom of the file for consistent labeling
function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium ${className}`}>{children}</label>;
}

