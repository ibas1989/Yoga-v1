import { BackupData } from './backup';

export interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  folderId?: string; // Optional: specific folder ID in Google Drive
  folderName?: string; // Optional: folder name to create/find
}

export interface GoogleDriveAuthState {
  isAuthenticated: boolean;
  accessToken?: string;
  userEmail?: string;
  expiresAt?: number;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  createdTime: string;
  modifiedTime: string;
  size: string;
  webViewLink?: string;
}

export interface GoogleDriveUploadResult {
  success: boolean;
  message: string;
  fileId?: string;
  webViewLink?: string;
}

class GoogleDriveBackupService {
  private config: GoogleDriveConfig;
  private authState: GoogleDriveAuthState = { isAuthenticated: false };
  private gapi: any = null;
  private isGapiLoaded = false;

  constructor(config: GoogleDriveConfig) {
    this.config = config;
  }

  /**
   * Initialize Google Drive API
   */
  async initialize(): Promise<boolean> {
    try {
      // Load Google API script if not already loaded
      if (!this.isGapiLoaded) {
        await this.loadGapiScript();
      }

      // Initialize gapi
      await new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
          reject(new Error('Google Drive API can only be used in browser environment'));
          return;
        }

        (window as any).gapi.load('client:auth2', {
          callback: resolve,
          onerror: reject
        });
      });

      // Initialize the client
      await (window as any).gapi.client.init({
        apiKey: this.config.apiKey,
        clientId: this.config.clientId,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        scope: 'https://www.googleapis.com/auth/drive.file'
      });

      this.gapi = (window as any).gapi;
      return true;
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      return false;
    }
  }

  /**
   * Load Google API script dynamically
   */
  private loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Drive API can only be used in browser environment'));
        return;
      }

      // Check if script is already loaded
      if ((window as any).gapi) {
        this.isGapiLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.isGapiLoaded = true;
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Authenticate with Google Drive
   */
  async authenticate(): Promise<GoogleDriveAuthState> {
    try {
      if (!this.gapi) {
        await this.initialize();
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      
      const authResponse = user.getAuthResponse();
      
      this.authState = {
        isAuthenticated: true,
        accessToken: authResponse.access_token,
        userEmail: user.getBasicProfile().getEmail(),
        expiresAt: Date.now() + (authResponse.expires_in * 1000)
      };

      // Store auth state in localStorage for persistence
      localStorage.setItem('google_drive_auth_state', JSON.stringify(this.authState));
      
      return this.authState;
    } catch (error) {
      console.error('Google Drive authentication failed:', error);
      this.authState = { isAuthenticated: false };
      return this.authState;
    }
  }

  /**
   * Check if user is authenticated and token is valid
   */
  async checkAuthStatus(): Promise<GoogleDriveAuthState> {
    try {
      // Try to restore auth state from localStorage
      const stored = localStorage.getItem('google_drive_auth_state');
      if (stored) {
        this.authState = JSON.parse(stored);
        
        // Check if token is expired
        if (this.authState.expiresAt && this.authState.expiresAt < Date.now()) {
          this.authState = { isAuthenticated: false };
          localStorage.removeItem('google_drive_auth_state');
          return this.authState;
        }
      }

      if (!this.gapi) {
        await this.initialize();
      }

      const authInstance = this.gapi.auth2.getAuthInstance();
      const user = authInstance.isSignedIn.get();
      
      if (user) {
        const authResponse = authInstance.currentUser.get().getAuthResponse();
        this.authState = {
          isAuthenticated: true,
          accessToken: authResponse.access_token,
          userEmail: authInstance.currentUser.get().getBasicProfile().getEmail(),
          expiresAt: Date.now() + (authResponse.expires_in * 1000)
        };
        
        // Update stored auth state
        localStorage.setItem('google_drive_auth_state', JSON.stringify(this.authState));
      } else {
        this.authState = { isAuthenticated: false };
      }

      return this.authState;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      this.authState = { isAuthenticated: false };
      return this.authState;
    }
  }

  /**
   * Sign out from Google Drive
   */
  async signOut(): Promise<void> {
    try {
      if (this.gapi) {
        const authInstance = this.gapi.auth2.getAuthInstance();
        await authInstance.signOut();
      }
      
      this.authState = { isAuthenticated: false };
      localStorage.removeItem('google_drive_auth_state');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }

  /**
   * Get or create backup folder in Google Drive
   */
  private async getBackupFolder(): Promise<string | null> {
    try {
      const folderName = this.config.folderName || 'Yoga Tracker Backups';
      
      // If specific folder ID is provided, use it
      if (this.config.folderId) {
        return this.config.folderId;
      }

      // Search for existing folder
      const response = await this.gapi.client.drive.files.list({
        q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)'
      });

      if (response.result.files.length > 0) {
        return response.result.files[0].id;
      }

      // Create new folder if not found
      const folderResponse = await this.gapi.client.drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        },
        fields: 'id'
      });

      return folderResponse.result.id;
    } catch (error) {
      console.error('Failed to get backup folder:', error);
      return null;
    }
  }

  /**
   * Format date and time as DD-MM-YYYY_HH-MM-SS
   */
  private formatBackupDateTime(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
  }

  /**
   * Upload backup file to Google Drive
   */
  async uploadBackup(backup: BackupData, fileName?: string): Promise<GoogleDriveUploadResult> {
    try {
      // Check authentication
      const authState = await this.checkAuthStatus();
      if (!authState.isAuthenticated) {
        return {
          success: false,
          message: 'Not authenticated with Google Drive. Please sign in first.'
        };
      }

      // Get backup folder
      const folderId = await this.getBackupFolder();
      if (!folderId) {
        return {
          success: false,
          message: 'Failed to create or find backup folder'
        };
      }

      // Prepare file data
      const backupJson = JSON.stringify(backup, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      
      const finalFileName = fileName || `${this.formatBackupDateTime(new Date(backup.timestamp))}_Yoga_Backup.json`;

      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('metadata', JSON.stringify({
        name: finalFileName,
        parents: [folderId]
      }));
      formData.append('file', blob);

      // Upload file using fetch API with access token
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authState.accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        message: 'Backup uploaded to Google Drive successfully',
        fileId: result.id,
        webViewLink: `https://drive.google.com/file/d/${result.id}/view`
      };
    } catch (error) {
      console.error('Failed to upload backup to Google Drive:', error);
      return {
        success: false,
        message: `Failed to upload backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * List backup files from Google Drive
   */
  async listBackups(): Promise<GoogleDriveFile[]> {
    try {
      const authState = await this.checkAuthStatus();
      if (!authState.isAuthenticated) {
        throw new Error('Not authenticated with Google Drive');
      }

      const folderId = await this.getBackupFolder();
      if (!folderId) {
        return [];
      }

      const response = await this.gapi.client.drive.files.list({
        q: `'${folderId}' in parents and name contains 'yoga-tracker-backup' and trashed=false`,
        fields: 'files(id, name, createdTime, modifiedTime, size, webViewLink)',
        orderBy: 'createdTime desc'
      });

      return response.result.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        size: file.size || '0',
        webViewLink: file.webViewLink
      }));
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Delete backup file from Google Drive
   */
  async deleteBackup(fileId: string): Promise<{ success: boolean; message: string }> {
    try {
      const authState = await this.checkAuthStatus();
      if (!authState.isAuthenticated) {
        return {
          success: false,
          message: 'Not authenticated with Google Drive'
        };
      }

      await this.gapi.client.drive.files.delete({
        fileId: fileId
      });

      return {
        success: true,
        message: 'Backup deleted successfully'
      };
    } catch (error) {
      console.error('Failed to delete backup:', error);
      return {
        success: false,
        message: `Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Download backup file from Google Drive
   */
  async downloadBackup(fileId: string): Promise<{ success: boolean; data?: BackupData; message: string }> {
    try {
      const authState = await this.checkAuthStatus();
      if (!authState.isAuthenticated) {
        return {
          success: false,
          message: 'Not authenticated with Google Drive'
        };
      }

      const response = await this.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      const backupData: BackupData = JSON.parse(response.body);
      
      return {
        success: true,
        data: backupData,
        message: 'Backup downloaded successfully'
      };
    } catch (error) {
      console.error('Failed to download backup:', error);
      return {
        success: false,
        message: `Failed to download backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Singleton instance
let googleDriveService: GoogleDriveBackupService | null = null;

/**
 * Get Google Drive backup service instance
 */
export const getGoogleDriveService = (config?: GoogleDriveConfig): GoogleDriveBackupService => {
  if (!googleDriveService && config) {
    googleDriveService = new GoogleDriveBackupService(config);
  }
  
  if (!googleDriveService) {
    throw new Error('Google Drive service not initialized. Please provide configuration.');
  }
  
  return googleDriveService;
};

/**
 * Initialize Google Drive backup service
 */
export const initializeGoogleDriveService = (config: GoogleDriveConfig): GoogleDriveBackupService => {
  googleDriveService = new GoogleDriveBackupService(config);
  return googleDriveService;
};

export default GoogleDriveBackupService;
