import { Student, Session, AppSettings, StudentNote, BalanceTransaction } from './types';
import { calculateAge, formatBalanceAsInteger } from './utils/dateUtils';

const STUDENTS_KEY = 'yoga_tracker_students';
const SESSIONS_KEY = 'yoga_tracker_sessions';
const SETTINGS_KEY = 'yoga_tracker_settings';

// Default settings
const defaultSettings: AppSettings = {
  defaultTeamSessionCharge: 1,
  defaultIndividualSessionCharge: 2,
  availableGoals: [
    'Flexibility',
    'Strength',
    'Balance',
    'Stress Relief',
    'Weight Loss',
    'Meditation',
    'Core Work',
    'Back Pain Relief'
  ]
};

// Students
export const getStudents = (): Student[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STUDENTS_KEY);
  if (!data) return [];
  const students = JSON.parse(data);
  return students.map((s: any) => {
    const birthday = s.birthday ? new Date(s.birthday) : undefined;
    const memberSince = s.memberSince ? new Date(s.memberSince) : undefined;
    const age = calculateAge(birthday);
    const balance = formatBalanceAsInteger(s.balance || 0);
    
    return {
      ...s,
      createdAt: new Date(s.createdAt),
      birthday,
      memberSince,
      age,
      balance,
      notes: s.notes ? s.notes.map((note: any) => ({
        ...note,
        timestamp: new Date(note.timestamp),
        updatedAt: note.updatedAt ? new Date(note.updatedAt) : undefined
      })) : [],
      balanceTransactions: s.balanceTransactions ? s.balanceTransactions.map((transaction: any) => ({
        ...transaction,
        date: new Date(transaction.date)
      })) : []
    };
  });
};

export const saveStudent = (student: Student): void => {
  // Calculate age and format balance before saving
  const birthday = student.birthday;
  const age = calculateAge(birthday);
  const balance = formatBalanceAsInteger(student.balance);
  
  const studentToSave: Student = {
    ...student,
    age: age || undefined,
    balance,
    balanceTransactions: student.balanceTransactions || []
  };
  
  const students = getStudents();
  const index = students.findIndex(s => s.id === student.id);
  if (index >= 0) {
    students[index] = studentToSave;
  } else {
    students.push(studentToSave);
  }
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  
  // Dispatch custom events for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('studentsUpdated', { detail: { student: studentToSave } }));
    window.dispatchEvent(new CustomEvent('studentUpdated', { detail: { studentId: student.id, student: studentToSave } }));
  }
};

export const addBalanceTransaction = (studentId: string, changeAmount: number, reason: string): void => {
  const students = getStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return;
  
  const newBalance = student.balance + changeAmount;
  const transaction: BalanceTransaction = {
    id: Date.now().toString(),
    date: new Date(),
    transactionType: changeAmount > 0 ? 'added' : 'deducted',
    changeAmount,
    reason,
    balanceAfter: newBalance
  };
  
  student.balance = newBalance;
  student.balanceTransactions = student.balanceTransactions || [];
  student.balanceTransactions.push(transaction);
  
  saveStudent(student);
  
  // Dispatch specific balance transaction event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('balanceTransactionAdded', { 
      detail: { studentId, transaction, newBalance } 
    }));
  }
};

export const deleteStudent = (studentId: string): void => {
  const students = getStudents().filter(s => s.id !== studentId);
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
};

// Sessions
export const getSessions = (): Session[] => {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(SESSIONS_KEY);
  if (!data) return [];
  const sessions = JSON.parse(data);
  return sessions.map((s: any) => {
    const date = new Date(s.date);
    const createdAt = new Date(s.createdAt);
    
    return {
      ...s,
      date: isNaN(date.getTime()) ? new Date() : date, // Use current date if invalid
      createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt, // Use current date if invalid
      goals: s.goals || [], // Ensure goals array exists for older data
      sessionType: s.sessionType || 'team' // Default to team if not specified
    };
  });
};

export const saveSession = (session: Session): void => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  const isNewSession = index < 0;
  
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.push(session);
  }
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  
  // Dispatch custom events for real-time updates
  if (typeof window !== 'undefined') {
    if (isNewSession) {
      window.dispatchEvent(new CustomEvent('sessionCreated', { detail: { session } }));
    } else {
      window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId: session.id, session } }));
    }
    // Also dispatch a general session change event for badge updates
    window.dispatchEvent(new CustomEvent('sessionChanged', { detail: { session } }));
  }
};

export const deleteSession = (sessionId: string): void => {
  const sessions = getSessions().filter(s => s.id !== sessionId);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  
  // Dispatch custom event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sessionDeleted', { detail: { sessionId } }));
    window.dispatchEvent(new CustomEvent('sessionChanged', { detail: { sessionId } }));
  }
};

export const getSessionsForStudent = (studentId: string): Session[] => {
  const allSessions = getSessions();
  return allSessions.filter(session => session.studentIds.includes(studentId));
};

// Student Notes
export const checkDuplicateNoteName = (studentId: string, noteName: string): boolean => {
  const students = getStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return false;
  
  return student.notes.some(note => note.name === noteName);
};

export const addStudentNote = (studentId: string, content: string): void => {
  const students = getStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return;
  
  // Use user-entered content as note name (no automatic date stamp)
  const timestamp = new Date();
  
  const newNote: StudentNote = {
    id: Date.now().toString(),
    name: content, // Use the content as the note name
    content,
    timestamp
  };
  
  student.notes.push(newNote);
  saveStudent(student);
  
  // Dispatch specific note event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('noteAdded', { 
      detail: { studentId, note: newNote } 
    }));
  }
};

export const deleteStudentNote = (studentId: string, noteId: string): void => {
  const students = getStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return;
  
  student.notes = student.notes.filter(note => note.id !== noteId);
  saveStudent(student);
  
  // Dispatch specific note event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('noteDeleted', { 
      detail: { studentId, noteId } 
    }));
  }
};

export const updateStudentNote = (studentId: string, noteId: string, content: string): void => {
  const students = getStudents();
  const student = students.find(s => s.id === studentId);
  if (!student) return;
  
  const note = student.notes.find(n => n.id === noteId);
  if (!note) return;
  
  // Update content and use content as name (no date stamps)
  note.content = content;
  note.name = content; // Use the content as the note name
  note.updatedAt = new Date(); // Set the updated timestamp
  
  saveStudent(student);
  
  // Dispatch specific note event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('noteUpdated', { 
      detail: { studentId, noteId, note } 
    }));
  }
};

// Settings
export const getSettings = (): AppSettings => {
  if (typeof window === 'undefined') return defaultSettings;
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) {
    // Initialize settings on first load
    saveSettings(defaultSettings);
    return defaultSettings;
  }
  const parsedSettings = JSON.parse(data);
  // Merge with defaults to ensure all properties exist
  return {
    ...defaultSettings,
    ...parsedSettings
  };
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Close session and update student balances
export const closeSession = (sessionId: string): void => {
  const sessions = getSessions();
  const students = getStudents();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session || session.status === 'completed') return;
  
  const settings = getSettings();
  
  // Update student balances
  session.studentIds.forEach(studentId => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    const balancePaid = session.balanceEntries[studentId];
    if (balancePaid === null || balancePaid === undefined) {
      // No balance entered, deduct default charge based on session type
      const defaultCharge = session.sessionType === 'individual' ? settings.defaultIndividualSessionCharge : settings.defaultTeamSessionCharge;
      student.balance += session.pricePerStudent || defaultCharge;
    } else {
      // Balance was entered, add the difference
      const defaultCharge = session.sessionType === 'individual' ? settings.defaultIndividualSessionCharge : settings.defaultTeamSessionCharge;
      const priceOwed = session.pricePerStudent || defaultCharge;
      student.balance += priceOwed - balancePaid;
    }
    
    saveStudent(student);
  });
  
  // Mark session as completed
  session.status = 'completed';
  saveSession(session);
};

// Cancel session without updating student balances
export const cancelSession = (sessionId: string): void => {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session || session.status !== 'scheduled') return;
  
  // Mark session as cancelled without affecting student balances
  session.status = 'cancelled';
  saveSession(session);
  
  // Dispatch custom event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sessionCancelled', { detail: { sessionId, session } }));
    window.dispatchEvent(new CustomEvent('sessionChanged', { detail: { session } }));
  }
};

// Complete session and update student balances based on session type
export const completeSession = (sessionId: string, confirmedAttendeeIds: string[]): void => {
  const sessions = getSessions();
  const students = getStudents();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session || session.status !== 'scheduled') return;
  
  // Determine how many sessions to deduct based on session type and settings
  const settings = getSettings();
  const sessionDeduction = session.sessionType === 'individual' ? settings.defaultIndividualSessionCharge : settings.defaultTeamSessionCharge;
  
  // Update student balances for confirmed attendees
  confirmedAttendeeIds.forEach(studentId => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    
    // Deduct sessions from balance
    const reason = `Session completed on ${new Date(session.date).toLocaleDateString()} (${session.sessionType})`;
    addBalanceTransaction(studentId, -sessionDeduction, reason);
  });
  
  // Update session with confirmed attendees and mark as completed
  session.studentIds = confirmedAttendeeIds;
  session.status = 'completed';
  saveSession(session);
  
  // Dispatch custom event for real-time updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sessionUpdated', { detail: { sessionId, session } }));
    window.dispatchEvent(new CustomEvent('sessionCompleted', { detail: { sessionId, session } }));
    window.dispatchEvent(new CustomEvent('sessionChanged', { detail: { session } }));
  }
};

