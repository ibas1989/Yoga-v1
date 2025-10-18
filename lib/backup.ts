import { Student, Session, AppSettings } from './types';
import { getStudents, getSessions, getSettings } from './storage';

export interface BackupData {
  version: string;
  timestamp: string;
  appName: string;
  students: Student[];
  sessions: Session[];
  settings: AppSettings;
  metadata: {
    totalStudents: number;
    totalSessions: number;
    lastBackup: string;
    deviceInfo?: string;
  };
}

export interface BackupOptions {
  includeMetadata?: boolean;
  compress?: boolean;
  format?: 'json' | 'csv';
}

/**
 * Generate a complete backup of all application data
 */
export const generateBackup = (options: BackupOptions = {}): BackupData => {
  const students = getStudents();
  const sessions = getSessions();
  const settings = getSettings();
  
  const backup: BackupData = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    appName: 'Yoga Class Tracker',
    students,
    sessions,
    settings,
    metadata: {
      totalStudents: students.length,
      totalSessions: sessions.length,
      lastBackup: new Date().toISOString(),
      deviceInfo: options.includeMetadata ? getDeviceInfo() : undefined
    }
  };

  return backup;
};

/**
 * Export backup data as downloadable file
 */
export const exportBackup = async (options: BackupOptions = {}): Promise<void> => {
  const backup = generateBackup(options);
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `yoga-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import backup data from file
 */
export const importBackup = async (file: File): Promise<{ success: boolean; message: string; data?: BackupData }> => {
  try {
    const text = await file.text();
    const backup: BackupData = JSON.parse(text);
    
    // Validate backup structure
    if (!backup.students || !backup.sessions || !backup.settings) {
      return { success: false, message: 'Invalid backup file format' };
    }
    
    // Validate version compatibility
    if (backup.version && backup.version !== '1.0.0') {
      return { success: false, message: 'Backup version not supported' };
    }
    
    return { success: true, message: 'Backup file is valid', data: backup };
  } catch (error) {
    return { success: false, message: 'Failed to parse backup file' };
  }
};

/**
 * Restore data from backup
 */
export const restoreBackup = (backup: BackupData): { success: boolean; message: string } => {
  try {
    // Clear existing data
    localStorage.removeItem('yoga_tracker_students');
    localStorage.removeItem('yoga_tracker_sessions');
    localStorage.removeItem('yoga_tracker_settings');
    
    // Restore data
    localStorage.setItem('yoga_tracker_students', JSON.stringify(backup.students));
    localStorage.setItem('yoga_tracker_sessions', JSON.stringify(backup.sessions));
    localStorage.setItem('yoga_tracker_settings', JSON.stringify(backup.settings));
    
    // Dispatch events to refresh UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dataRestored', { 
        detail: { 
          studentsCount: backup.students.length,
          sessionsCount: backup.sessions.length 
        } 
      }));
    }
    
    return { success: true, message: 'Data restored successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to restore data' };
  }
};


/**
 * Get device information for backup metadata
 */
const getDeviceInfo = (): string => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  
  return `${platform} - ${language} - ${userAgent.split(' ')[0]}`;
};

/**
 * Validate backup data integrity
 */
export const validateBackup = (backup: BackupData): { valid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!backup.students || !Array.isArray(backup.students)) {
    issues.push('Invalid students data');
  }
  
  if (!backup.sessions || !Array.isArray(backup.sessions)) {
    issues.push('Invalid sessions data');
  }
  
  if (!backup.settings || typeof backup.settings !== 'object') {
    issues.push('Invalid settings data');
  }
  
  if (!backup.timestamp) {
    issues.push('Missing timestamp');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

/**
 * Get backup statistics
 */
export const getBackupStats = (): { students: number; sessions: number; lastModified: string } => {
  const students = getStudents();
  const sessions = getSessions();
  
  return {
    students: students.length,
    sessions: sessions.length,
    lastModified: new Date().toISOString()
  };
};
