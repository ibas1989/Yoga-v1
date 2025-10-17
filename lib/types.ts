export interface StudentNote {
  id: string;
  name?: string; // Optional - auto-generated if not provided
  content: string;
  timestamp: Date; // Created date
  updatedAt?: Date; // Updated date (optional for backward compatibility)
}

export interface BalanceTransaction {
  id: string;
  date: Date;
  transactionType: 'added' | 'deducted';
  changeAmount: number; // Positive for added, negative for deducted
  reason: string;
  balanceAfter: number;
}

export interface Student {
  id: string;
  name: string;
  phone: string;
  balance: number; // Number of sessions (positive means they owe sessions, negative means credit)
  goals: string[];
  weight?: number; // in kg
  height?: number; // in cm
  age?: number; // Computed from birthday, read-only
  description?: string;
  birthday?: Date;
  memberSince?: Date; // Date when student was first registered
  notes: StudentNote[];
  balanceTransactions: BalanceTransaction[]; // History of balance changes
  createdAt: Date;
}

export interface Session {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  studentIds: string[];
  goals: string[]; // Session goals/tags
  pricePerStudent: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  balanceEntries: Record<string, number | null>; // studentId -> balance paid (null if not entered)
  notes: string;
  sessionType: 'team' | 'individual'; // Team = 1 session, Individual = 2 sessions
  createdAt: Date;
}

export interface AppSettings {
  defaultTeamSessionCharge: number;
  defaultIndividualSessionCharge: number;
  availableGoals: string[];
}

