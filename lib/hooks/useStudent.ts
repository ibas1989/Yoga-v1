import { useState, useEffect, useCallback, useRef } from 'react';
import { Student, Session } from '@/lib/types';
import { getStudents, getSessionsForStudent } from '@/lib/storage';

export function useStudent(studentId: string | null) {
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudent = useCallback(async () => {
    if (!studentId) {
      setStudent(null);
      setSessions([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const students = getStudents();
      const foundStudent = students.find(s => s.id === studentId);
      if (foundStudent) {
        setStudent(foundStudent);
        const studentSessions = getSessionsForStudent(studentId)
          .sort((a, b) => b.date.getTime() - a.date.getTime());
        setSessions(studentSessions);
      } else {
        setError(`Student with ID "${studentId}" not found in database`);
      }
    } catch (err) {
      console.error('Error loading student:', err);
      setError(err instanceof Error ? err.message : 'Failed to load student');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  const refreshStudent = useCallback(() => {
    loadStudent();
  }, [loadStudent]);

  // Force refresh function to ensure latest data is displayed while preserving student context
  const forceRefresh = useCallback(() => {
    if (!studentId) {
      return;
    }
    
    // Set loading state to trigger re-render
    setIsLoading(true);
    
    // Reload student data from storage while preserving the same student context
    const students = getStudents();
    const foundStudent = students.find(s => s.id === studentId);
    
    if (foundStudent) {
      // Force a complete state update to trigger re-render
      setStudent(null); // Clear first to force re-render
      setTimeout(() => {
        setStudent(foundStudent);
        
        // Also refresh sessions to ensure complete data consistency
        const studentSessions = getSessionsForStudent(studentId)
          .sort((a, b) => b.date.getTime() - a.date.getTime());
        setSessions(studentSessions);
        
        setIsLoading(false);
      }, 50);
    } else {
      setIsLoading(false);
    }
  }, [studentId]);

  const updateStudent = useCallback((updatedStudent: Student) => {
    setStudent(updatedStudent);
    // Force a refresh of sessions as well to ensure complete data update
    const studentSessions = getSessionsForStudent(updatedStudent.id)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    setSessions(studentSessions);
  }, []);

  const addNote = useCallback((note: any) => {
    if (!studentId) return;
    setStudent(prev => {
      if (!prev) return null;
      // Check if note already exists to prevent duplicates
      const noteExists = prev.notes.some(n => n.id === note.id);
      if (noteExists) return prev;
      return { ...prev, notes: [...prev.notes, note] };
    });
  }, [studentId]);

  const updateNote = useCallback((noteId: string, updatedNote: any) => {
    if (!studentId) return;
    setStudent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        notes: prev.notes.map(note => note.id === noteId ? updatedNote : note)
      };
    });
  }, [studentId]);

  const removeNote = useCallback((noteId: string) => {
    if (!studentId) return;
    setStudent(prev => {
      if (!prev) return null;
      return {
        ...prev,
        notes: prev.notes.filter(note => note.id !== noteId)
      };
    });
  }, [studentId]);

  // Use refs to store the latest functions to avoid stale closures
  const updateStudentRef = useRef(updateStudent);
  const addNoteRef = useRef(addNote);
  const updateNoteRef = useRef(updateNote);
  const removeNoteRef = useRef(removeNote);

  // Update refs when functions change
  updateStudentRef.current = updateStudent;
  addNoteRef.current = addNote;
  updateNoteRef.current = updateNote;
  removeNoteRef.current = removeNote;

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  useEffect(() => {
    if (!studentId) return;

    // Set up real-time updates
    const handleStudentUpdated = (event: CustomEvent) => {
      const { studentId: updatedStudentId, student: updatedStudent } = event.detail;
      if (updatedStudentId === studentId) {
        // Force a complete data refresh to ensure UI shows latest data
        updateStudentRef.current(updatedStudent);
        // Also refresh sessions to ensure complete data consistency
        const studentSessions = getSessionsForStudent(studentId)
          .sort((a, b) => b.date.getTime() - a.date.getTime());
        setSessions(studentSessions);
        
        // Force a re-render by updating the state
        setStudent(updatedStudent);
      }
    };

    const handleNoteAdded = (event: CustomEvent) => {
      const { studentId: noteStudentId, note } = event.detail;
      if (noteStudentId === studentId) {
        addNoteRef.current(note);
      }
    };

    const handleNoteUpdated = (event: CustomEvent) => {
      const { studentId: noteStudentId, noteId, note } = event.detail;
      if (noteStudentId === studentId) {
        updateNoteRef.current(noteId, note);
      }
    };

    const handleNoteDeleted = (event: CustomEvent) => {
      const { studentId: noteStudentId, noteId } = event.detail;
      if (noteStudentId === studentId) {
        removeNoteRef.current(noteId);
      }
    };

    window.addEventListener('studentUpdated', handleStudentUpdated as EventListener);
    window.addEventListener('noteAdded', handleNoteAdded as EventListener);
    window.addEventListener('noteUpdated', handleNoteUpdated as EventListener);
    window.addEventListener('noteDeleted', handleNoteDeleted as EventListener);
    
    return () => {
      window.removeEventListener('studentUpdated', handleStudentUpdated as EventListener);
      window.removeEventListener('noteAdded', handleNoteAdded as EventListener);
      window.removeEventListener('noteUpdated', handleNoteUpdated as EventListener);
      window.removeEventListener('noteDeleted', handleNoteDeleted as EventListener);
    };
  }, [studentId]); // Only depend on studentId to prevent re-registration

  return {
    student,
    sessions,
    isLoading,
    error,
    refreshStudent,
    forceRefresh,
    updateStudent,
    addNote,
    updateNote,
    removeNote
  };
}
