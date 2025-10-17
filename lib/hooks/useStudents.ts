import { useState, useEffect, useCallback, useRef } from 'react';
import { Student } from '@/lib/types';
import { getStudents } from '@/lib/storage';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const studentsData = getStudents();
      setStudents(studentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStudents = useCallback(() => {
    loadStudents();
  }, [loadStudents]);

  const updateStudent = useCallback((updatedStudent: Student) => {
    setStudents(prevStudents => 
      prevStudents.map(s => s.id === updatedStudent.id ? updatedStudent : s)
    );
  }, []);

  const addStudent = useCallback((newStudent: Student) => {
    setStudents(prevStudents => [...prevStudents, newStudent]);
  }, []);

  const removeStudent = useCallback((studentId: string) => {
    setStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
  }, []);

  // Use refs to store the latest functions to avoid stale closures
  const updateStudentRef = useRef(updateStudent);
  const addStudentRef = useRef(addStudent);
  const removeStudentRef = useRef(removeStudent);
  const loadStudentsRef = useRef(loadStudents);

  // Update refs when functions change
  updateStudentRef.current = updateStudent;
  addStudentRef.current = addStudent;
  removeStudentRef.current = removeStudent;
  loadStudentsRef.current = loadStudents;

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    // Set up real-time updates using storage events and custom events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'yoga_tracker_students' && e.newValue) {
        loadStudentsRef.current();
      }
    };
    
    const handleStudentsUpdated = () => {
      loadStudentsRef.current();
    };
    
    const handleStudentUpdated = (event: CustomEvent) => {
      const { studentId, student } = event.detail;
      updateStudentRef.current(student);
    };

    const handleStudentAdded = (event: CustomEvent) => {
      const { student } = event.detail;
      addStudentRef.current(student);
    };

    const handleStudentDeleted = (event: CustomEvent) => {
      const { studentId } = event.detail;
      removeStudentRef.current(studentId);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('studentsUpdated', handleStudentsUpdated);
    window.addEventListener('studentUpdated', handleStudentUpdated as EventListener);
    window.addEventListener('studentAdded', handleStudentAdded as EventListener);
    window.addEventListener('studentDeleted', handleStudentDeleted as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('studentsUpdated', handleStudentsUpdated);
      window.removeEventListener('studentUpdated', handleStudentUpdated as EventListener);
      window.removeEventListener('studentAdded', handleStudentAdded as EventListener);
      window.removeEventListener('studentDeleted', handleStudentDeleted as EventListener);
    };
  }, []); // Empty dependency array to prevent re-registration

  return {
    students,
    isLoading,
    error,
    refreshStudents,
    updateStudent,
    addStudent,
    removeStudent
  };
}
