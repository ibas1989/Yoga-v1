import { generateBackup, BackupData } from './backup';
import { getGoogleDriveService, GoogleDriveConfig } from './googleDriveBackup';
import { safeStorage } from './hydrationUtils';

export interface AutoBackupConfig {
  enabled: boolean;
  interval: number; // in hours
  maxBackups: number;
  notifyOnBackup: boolean;
  storageLocation: 'browser' | 'downloads' | 'custom' | 'google_drive';
  customPath?: string;
  googleDriveConfig?: {
    clientId: string;
    apiKey: string;
    folderId?: string;
    folderName?: string;
  };
}

const AUTO_BACKUP_KEY = 'yoga_tracker_auto_backup_config';
const BACKUP_HISTORY_KEY = 'yoga_tracker_backup_history';

export const defaultAutoBackupConfig: AutoBackupConfig = {
  enabled: false,
  interval: 24, // 24 hours
  maxBackups: 7, // Keep 7 backups
  notifyOnBackup: true,
  storageLocation: 'downloads'
};

export interface BackupHistoryItem {
  id: string;
  timestamp: string;
  size: number;
  studentCount: number;
  sessionCount: number;
}

/**
 * Get auto backup configuration
 */
export const getAutoBackupConfig = (): AutoBackupConfig => {
  if (typeof window === 'undefined') return defaultAutoBackupConfig;
  
  const stored = safeStorage.getItem(AUTO_BACKUP_KEY);
  if (!stored) return defaultAutoBackupConfig;
  
  return { ...defaultAutoBackupConfig, ...JSON.parse(stored) };
};

/**
 * Save auto backup configuration
 */
export const saveAutoBackupConfig = (config: AutoBackupConfig): void => {
  safeStorage.setItem(AUTO_BACKUP_KEY, JSON.stringify(config));
};

/**
 * Get backup history
 */
export const getBackupHistory = (): BackupHistoryItem[] => {
  if (typeof window === 'undefined') return [];
  
  const stored = safeStorage.getItem(BACKUP_HISTORY_KEY);
  if (!stored) return [];
  
  return JSON.parse(stored);
};

/**
 * Add backup to history
 */
export const addBackupToHistory = (backup: BackupData): void => {
  const history = getBackupHistory();
  const config = getAutoBackupConfig();
  
  const historyItem: BackupHistoryItem = {
    id: Date.now().toString(),
    timestamp: backup.timestamp,
    size: JSON.stringify(backup).length,
    studentCount: backup.students.length,
    sessionCount: backup.sessions.length
  };
  
  history.unshift(historyItem);
  
  // Keep only the most recent backups
  const trimmedHistory = history.slice(0, config.maxBackups);
  safeStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(trimmedHistory));
};

/**
 * Clear old backups
 */
export const clearOldBackups = (): void => {
  const config = getAutoBackupConfig();
  const history = getBackupHistory();
  
  if (history.length > config.maxBackups) {
    const trimmedHistory = history.slice(0, config.maxBackups);
    safeStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(trimmedHistory));
  }
};

/**
 * Check if auto backup is due
 */
export const isBackupDue = (): boolean => {
  const config = getAutoBackupConfig();
  if (!config.enabled) return false;
  
  const history = getBackupHistory();
  if (history.length === 0) return true;
  
  const lastBackup = new Date(history[0].timestamp);
  const now = new Date();
  const hoursSinceLastBackup = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastBackup >= config.interval;
};

/**
 * Perform automatic backup
 */
export const performAutoBackup = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const config = getAutoBackupConfig();
    const backup = generateBackup();
    addBackupToHistory(backup);
    clearOldBackups();
    
    // Store backup based on storage location
    if (config.storageLocation === 'browser') {
      // Store in browser localStorage
      const backupKey = `yoga_tracker_auto_backup_${Date.now()}`;
      if (!safeStorage.setItem(backupKey, JSON.stringify(backup))) {
        // Fallback to download when storage is not available
        await downloadBackupFile(backup);
        return { success: true, message: 'Auto backup saved as download (storage unavailable)' };
      }
    } else if (config.storageLocation === 'downloads') {
      // Download backup file
      await downloadBackupFile(backup);
    } else if (config.storageLocation === 'custom' && config.customPath) {
      // This would require File System Access API (limited browser support)
      // For now, fall back to downloads
      await downloadBackupFile(backup);
    } else if (config.storageLocation === 'google_drive' && config.googleDriveConfig) {
      // Upload to Google Drive
      try {
        const googleDriveService = getGoogleDriveService(config.googleDriveConfig as GoogleDriveConfig);
        const result = await googleDriveService.uploadBackup(backup);
        
        if (!result.success) {
          console.error('Google Drive upload failed:', result.message);
          // Fall back to downloads if Google Drive upload fails
          await downloadBackupFile(backup);
          return { 
            success: true, 
            message: `Backup completed but Google Drive upload failed: ${result.message}. File downloaded instead.` 
          };
        }
        
        console.log('Backup uploaded to Google Drive successfully:', result.fileId);
      } catch (error) {
        console.error('Google Drive service error:', error);
        // Fall back to downloads if Google Drive service fails
        await downloadBackupFile(backup);
        return { 
          success: true, 
          message: `Backup completed but Google Drive upload failed. File downloaded instead.` 
        };
      }
    }
    
    // Dispatch event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('autoBackupCompleted', {
        detail: { backup, timestamp: backup.timestamp }
      }));
    }
    
    return { success: true, message: 'Automatic backup completed successfully' };
  } catch (error) {
    return { success: false, message: 'Failed to perform automatic backup' };
  }
};

/**
 * Format date and time as DD-MM-YYYY_HH-MM-SS
 */
const formatBackupDateTime = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
};

/**
 * Download backup file
 */
const downloadBackupFile = async (backup: BackupData): Promise<void> => {
  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${formatBackupDateTime(new Date(backup.timestamp))}_Yoga_Backup.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Initialize auto backup system
 */
export const initializeAutoBackup = (): void => {
  if (typeof window === 'undefined') return;
  
  const config = getAutoBackupConfig();
  if (!config.enabled) return;
  
  // Check if backup is due
  if (isBackupDue()) {
    performAutoBackup().then(result => {
      if (result.success && config.notifyOnBackup) {
        // Show notification (you could integrate with a notification system)
        console.log('Auto backup completed:', result.message);
      }
    }).catch(error => {
      console.error('Auto backup failed:', error);
    });
  }
  
  // Set up interval for checking backup status
  const checkInterval = setInterval(() => {
    if (isBackupDue()) {
      performAutoBackup().then(result => {
        if (result.success && config.notifyOnBackup) {
          console.log('Auto backup completed:', result.message);
        }
      }).catch(error => {
        console.error('Auto backup failed:', error);
      });
    }
  }, 60 * 60 * 1000); // Check every hour
  
  // Store interval ID for cleanup
  (window as any).autoBackupInterval = checkInterval;
};

/**
 * Stop auto backup system
 */
export const stopAutoBackup = (): void => {
  if (typeof window === 'undefined') return;
  
  const intervalId = (window as any).autoBackupInterval;
  if (intervalId) {
    clearInterval(intervalId);
    delete (window as any).autoBackupInterval;
  }
};

/**
 * Get backup statistics
 */
export const getBackupStats = () => {
  const history = getBackupHistory();
  const config = getAutoBackupConfig();
  
  return {
    totalBackups: history.length,
    lastBackup: history[0]?.timestamp || null,
    nextBackupDue: isBackupDue(),
    autoBackupEnabled: config.enabled,
    backupInterval: config.interval,
    maxBackups: config.maxBackups
  };
};
