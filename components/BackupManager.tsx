'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Shield, AlertCircle, CheckCircle, FileText, FolderOpen, Cloud } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { 
  generateBackup, 
  exportBackup, 
  importBackup, 
  restoreBackup, 
  validateBackup,
  getBackupStats,
  BackupData 
} from '../lib/backup';
import { 
  getAutoBackupConfig, 
  saveAutoBackupConfig, 
  getBackupHistory,
  performAutoBackup,
  initializeAutoBackup,
  stopAutoBackup,
  AutoBackupConfig 
} from '../lib/autoBackup';
import { 
  getGoogleDriveService, 
  initializeGoogleDriveService,
  GoogleDriveAuthState,
  GoogleDriveFile 
} from '../lib/googleDriveBackup';

interface BackupManagerProps {
  onDataRestored?: () => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ onDataRestored }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [stats, setStats] = useState(getBackupStats());
  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupConfig>(getAutoBackupConfig());
  const [backupHistory, setBackupHistory] = useState(getBackupHistory());
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('');
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [showGoogleDriveConfig, setShowGoogleDriveConfig] = useState(false);
  const [googleDriveAuthState, setGoogleDriveAuthState] = useState<GoogleDriveAuthState>({ isAuthenticated: false });
  const [googleDriveFiles, setGoogleDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [googleDriveConfig, setGoogleDriveConfig] = useState({
    clientId: '',
    apiKey: '',
    folderName: 'Yoga Tracker Backups'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate next backup time
  const getNextBackupTime = () => {
    if (!autoBackupConfig.enabled || backupHistory.length === 0) {
      return null;
    }
    
    const lastBackup = new Date(backupHistory[0].timestamp);
    const nextBackup = new Date(lastBackup.getTime() + (autoBackupConfig.interval * 60 * 60 * 1000));
    return nextBackup;
  };

  // Initialize component
  useEffect(() => {
    // Initialize auto backup system
    initializeAutoBackup();
    
    // Check Google Drive auth status if configured
    const checkGoogleDriveStatus = async () => {
      if (autoBackupConfig.googleDriveConfig) {
        try {
          const googleDriveService = initializeGoogleDriveService(autoBackupConfig.googleDriveConfig);
          const authState = await googleDriveService.checkAuthStatus();
          setGoogleDriveAuthState(authState);
          
          if (authState.isAuthenticated) {
            await loadGoogleDriveBackups();
          }
        } catch (error) {
          console.error('Failed to check Google Drive status:', error);
        }
      }
    };
    
    checkGoogleDriveStatus();
    
    // Set up event listener for auto backup completion
    const handleAutoBackupCompleted = () => {
      setBackupHistory(getBackupHistory());
    };
    
    window.addEventListener('autoBackupCompleted', handleAutoBackupCompleted);
    
    return () => {
      window.removeEventListener('autoBackupCompleted', handleAutoBackupCompleted);
    };
  }, []);

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      await exportBackup();
      showMessage('success', 'Backup exported successfully!');
      setStats(getBackupStats());
    } catch (error) {
      showMessage('error', 'Failed to export backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    setIsLoading(true);
    try {
      const result = await importBackup(file);
      if (result.success && result.data) {
        const validation = validateBackup(result.data);
        if (validation.valid) {
          const restoreResult = restoreBackup(result.data);
          if (restoreResult.success) {
            showMessage('success', 'Data restored successfully!');
            setStats(getBackupStats());
            onDataRestored?.();
          } else {
            showMessage('error', restoreResult.message);
          }
        } else {
          showMessage('error', `Backup validation failed: ${validation.issues.join(', ')}`);
        }
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to import backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };


  const handleAutoBackupToggle = () => {
    if (!autoBackupConfig.enabled) {
      // Trying to enable - check if Google Drive is available
      if (googleDriveAuthState.isAuthenticated) {
        // Enable with Google Drive
        const newConfig = { 
          ...autoBackupConfig, 
          enabled: true,
          storageLocation: 'google_drive' as const,
          googleDriveConfig: autoBackupConfig.googleDriveConfig
        };
        setAutoBackupConfig(newConfig);
        saveAutoBackupConfig(newConfig);
        initializeAutoBackup();
        showMessage('success', 'Auto backup enabled with Google Drive');
      } else {
        // Show folder picker for local storage
        setShowFolderPicker(true);
      }
    } else {
      // Disabling - turn off auto backup
      const newConfig = { ...autoBackupConfig, enabled: false };
      setAutoBackupConfig(newConfig);
      saveAutoBackupConfig(newConfig);
      stopAutoBackup();
      setSelectedFolderPath('');
      setDirectoryHandle(null);
      showMessage('info', 'Auto backup disabled');
    }
  };

  const handleFolderSelect = async () => {
    try {
      // Check if File System Access API is supported
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        const folderName = handle.name;
        setSelectedFolderPath(folderName);
        setDirectoryHandle(handle); // Store the directory handle
        
        // Enable auto backup with selected folder
        const newConfig = { 
          ...autoBackupConfig, 
          enabled: true,
          storageLocation: 'custom' as const,
          customPath: folderName
        };
        setAutoBackupConfig(newConfig);
        saveAutoBackupConfig(newConfig);
        initializeAutoBackup();
        setShowFolderPicker(false);
        showMessage('success', 'Auto backup enabled with selected folder');
      } else {
        // Fallback for browsers that don't support File System Access API
        showMessage('error', 'Folder selection not supported in this browser. Please use Chrome or Edge.');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the folder selection
        return;
      }
      console.error('Error selecting folder:', error);
      showMessage('error', 'Failed to select folder');
    }
  };

  const handleCancelFolderSelection = () => {
    setShowFolderPicker(false);
  };

  const handleOpenFolder = async () => {
    try {
      if (directoryHandle) {
        // Try to open the folder using the stored directory handle
        // This will open the folder in the system file manager
        await directoryHandle.requestPermission({ mode: 'readwrite' });
        
        // For now, we'll show the folder path since direct opening isn't fully supported
        showMessage('info', `Folder location: ${selectedFolderPath}`);
        
        // In a real implementation, you might want to:
        // 1. Create a file in the folder to "open" it
        // 2. Use a different approach to open the system file manager
        // 3. Provide instructions to the user on how to navigate to the folder
      } else {
        showMessage('error', 'Folder handle not available. Please reselect the folder.');
      }
    } catch (error) {
      console.error('Error opening folder:', error);
      showMessage('error', 'Could not open folder. Please check the folder path manually.');
    }
  };

  const handleAutoBackupNow = async () => {
    setIsLoading(true);
    try {
      console.log('Starting manual auto backup...');
      const result = await performAutoBackup();
      console.log('Auto backup result:', result);
      
      if (result.success) {
        showMessage('success', 'Manual backup completed successfully!');
        // Refresh the backup history
        const newHistory = getBackupHistory();
        setBackupHistory(newHistory);
        console.log('Updated backup history:', newHistory);
      } else {
        showMessage('error', result.message);
        console.error('Auto backup failed:', result.message);
      }
    } catch (error) {
      console.error('Auto backup error:', error);
      showMessage('error', 'Failed to perform automatic backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAutoBackup = async () => {
    if (backupHistory.length === 0) {
      showMessage('error', 'No auto backups available. Create a backup first.');
      return;
    }

    setIsLoading(true);
    try {
      // Get the latest auto backup from localStorage
      const latestBackup = backupHistory[0];
      const backupKey = `yoga_tracker_auto_backup_${latestBackup.id}`;
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        showMessage('error', 'Auto backup data not found');
        return;
      }

      // Create downloadable file
      const dataBlob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yoga-auto-backup-${new Date(latestBackup.timestamp).toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showMessage('success', 'Auto backup exported successfully!');
    } catch (error) {
      showMessage('error', 'Failed to export auto backup');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Drive functions
  const handleGoogleDriveSetup = () => {
    setShowGoogleDriveConfig(true);
  };

  const handleGoogleDriveConfigSave = async () => {
    if (!googleDriveConfig.clientId || !googleDriveConfig.apiKey) {
      showMessage('error', 'Please provide both Client ID and API Key');
      return;
    }

    setIsLoading(true);
    try {
      // Initialize Google Drive service
      const googleDriveService = initializeGoogleDriveService({
        clientId: googleDriveConfig.clientId,
        apiKey: googleDriveConfig.apiKey,
        folderName: googleDriveConfig.folderName
      });

      // Test authentication
      const authState = await googleDriveService.authenticate();
      setGoogleDriveAuthState(authState);

      if (authState.isAuthenticated) {
        // Update auto backup config
        const newConfig = {
          ...autoBackupConfig,
          storageLocation: 'google_drive' as const,
          googleDriveConfig: {
            clientId: googleDriveConfig.clientId,
            apiKey: googleDriveConfig.apiKey,
            folderName: googleDriveConfig.folderName
          }
        };
        setAutoBackupConfig(newConfig);
        saveAutoBackupConfig(newConfig);
        
        setShowGoogleDriveConfig(false);
        showMessage('success', 'Google Drive connected successfully!');
        
        // Load existing backups
        await loadGoogleDriveBackups();
      } else {
        showMessage('error', 'Failed to authenticate with Google Drive');
      }
    } catch (error) {
      showMessage('error', 'Failed to setup Google Drive: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoogleDriveBackups = async () => {
    try {
      const googleDriveService = getGoogleDriveService();
      const files = await googleDriveService.listBackups();
      setGoogleDriveFiles(files);
    } catch (error) {
      console.error('Failed to load Google Drive backups:', error);
    }
  };

  const handleGoogleDriveSignOut = async () => {
    try {
      const googleDriveService = getGoogleDriveService();
      await googleDriveService.signOut();
      
      setGoogleDriveAuthState({ isAuthenticated: false });
      setGoogleDriveFiles([]);
      
      // Update auto backup config to remove Google Drive
      const newConfig = {
        ...autoBackupConfig,
        storageLocation: 'downloads' as const,
        googleDriveConfig: undefined
      };
      setAutoBackupConfig(newConfig);
      saveAutoBackupConfig(newConfig);
      
      showMessage('info', 'Signed out from Google Drive');
    } catch (error) {
      showMessage('error', 'Failed to sign out from Google Drive');
    }
  };

  const handleUploadToGoogleDrive = async () => {
    setIsLoading(true);
    try {
      const backup = generateBackup();
      const googleDriveService = getGoogleDriveService();
      const result = await googleDriveService.uploadBackup(backup);
      
      if (result.success) {
        showMessage('success', 'Backup uploaded to Google Drive successfully!');
        await loadGoogleDriveBackups();
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', 'Failed to upload to Google Drive: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Backup & Restore</h2>
        <p className="text-gray-600">Protect your data with automated backups</p>
      </div>

      {/* Statistics */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Current Data</span>
          </div>
          <div className="text-sm text-gray-600">
            {stats.students} students • {stats.sessions} sessions
          </div>
        </div>
      </Card>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' :
          message.type === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : message.type === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <Shield className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Backup Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Export Backup */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Export Backup</h3>
              <p className="text-sm text-gray-600">Download your data as a file</p>
            </div>
          </div>
          <Button 
            onClick={handleExport}
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            {isLoading ? 'Exporting...' : 'Export Data'}
          </Button>
        </Card>

        {/* Import Backup */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Import Backup</h3>
              <p className="text-sm text-gray-600">Restore from a backup file</p>
            </div>
          </div>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? 'Importing...' : 'Choose File'}
            </Button>
          </div>
        </Card>


        {/* Google Drive Backup */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cloud className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Google Drive</h3>
              <p className="text-sm text-gray-600">Cloud backup to Google Drive</p>
            </div>
          </div>
          
          {/* Google Drive Status */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                googleDriveAuthState.isAuthenticated 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {googleDriveAuthState.isAuthenticated ? `Connected as ${googleDriveAuthState.userEmail}` : 'Not Connected'}
              </span>
            </div>
            {googleDriveAuthState.isAuthenticated && (
              <div className="text-xs text-gray-600 space-y-1">
                <div>• {googleDriveFiles.length} backup files in Google Drive</div>
                <div>• Auto backup: {autoBackupConfig.storageLocation === 'google_drive' ? 'Enabled' : 'Disabled'}</div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {!googleDriveAuthState.isAuthenticated ? (
              <Button 
                onClick={handleGoogleDriveSetup}
                className="w-full"
                variant="outline"
              >
                <Cloud className="h-4 w-4 mr-2" />
                Connect Google Drive
              </Button>
            ) : (
              <div className="space-y-2">
                <Button 
                  onClick={handleUploadToGoogleDrive}
                  disabled={isLoading}
                  className="w-full"
                  variant="default"
                >
                  {isLoading ? 'Uploading...' : 'Upload Backup Now'}
                </Button>
                <Button 
                  onClick={handleGoogleDriveSignOut}
                  className="w-full"
                  variant="outline"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Auto Backup */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Auto Backup</h3>
              <p className="text-sm text-gray-600">Automatic scheduled backups</p>
            </div>
          </div>
          
          {/* Auto Backup Status */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                autoBackupConfig.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {autoBackupConfig.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Backs up every {autoBackupConfig.interval} hours</div>
              <div>• Keeps {autoBackupConfig.maxBackups} recent backups</div>
              {autoBackupConfig.enabled && backupHistory.length > 0 && getNextBackupTime() && (
                <div className="text-blue-600 font-medium">
                  Next backup: {getNextBackupTime()!.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Enable Auto Backup</span>
              <button
                onClick={handleAutoBackupToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoBackupConfig.enabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoBackupConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Selected Folder Path - Only shown when auto backup is enabled */}
            {autoBackupConfig.enabled && selectedFolderPath && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Backup Location</label>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800 font-medium">{selectedFolderPath}</span>
                    </div>
                    <button
                      onClick={handleOpenFolder}
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Open Folder
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Backup History */}
      {backupHistory.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Recent Backups</h3>
          <div className="space-y-2">
            {backupHistory.slice(0, 5).map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(backup.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    {backup.studentCount} students • {backup.sessionCount} sessions
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {(backup.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}


      {/* How Auto Backup Works */}
      <Card className="p-4 bg-blue-50">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-2">How Auto Backup Works</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <div>
                <strong>⚠️ Required:</strong> You must select a storage location before enabling auto backup
              </div>
              <div>
                <strong>When it runs:</strong> Every 24 hours while you're using the app
              </div>
              <div>
                <strong>What it does:</strong> Creates a complete copy of all your data (students, sessions, settings)
              </div>
              <div>
                <strong>Storage options:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• <strong>Google Drive:</strong> Uploads backups to your Google Drive (recommended)</li>
                  <li>• <strong>Downloads folder:</strong> Automatically downloads backup files</li>
                  <li>• <strong>Custom location:</strong> Downloads to your chosen folder</li>
                  <li>• <strong>Browser storage:</strong> Not recommended for auto backup</li>
                </ul>
              </div>
              <div>
                <strong>How many backups:</strong> Keeps the 7 most recent backups, automatically deletes older ones
              </div>
              <div>
                <strong>Manual backup:</strong> Use "Backup Now" to create a backup immediately
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Backup Tips */}
      <Card className="p-4 bg-green-50">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900 mb-1">Backup Tips</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Export backups regularly to avoid data loss</li>
              <li>• Store backup files in a safe location (cloud storage, external drive)</li>
              <li>• Test your backups by importing them</li>
              <li>• Auto backup stores locally - use "Export Auto Backup" to download files</li>
              <li>• Manual export creates immediate downloadable files</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Folder Picker Dialog */}
      <Dialog open={showFolderPicker} onOpenChange={setShowFolderPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Backup Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Choose the folder where auto backup files will be stored.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={handleFolderSelect}
                className="w-full"
                variant="outline"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Select Folder
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Note: Folder selection requires Chrome, Edge, or other modern browsers that support the File System Access API
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleCancelFolderSelection}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Drive Configuration Dialog */}
      <Dialog open={showGoogleDriveConfig} onOpenChange={setShowGoogleDriveConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Google Drive</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              To use Google Drive backup, you need to provide your Google API credentials. 
              <a 
                href="https://console.developers.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline ml-1"
              >
                Get them here
              </a>
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  value={googleDriveConfig.clientId}
                  onChange={(e) => setGoogleDriveConfig({ ...googleDriveConfig, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Google API Client ID"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="text"
                  value={googleDriveConfig.apiKey}
                  onChange={(e) => setGoogleDriveConfig({ ...googleDriveConfig, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Google API Key"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folder Name (Optional)
                </label>
                <input
                  type="text"
                  value={googleDriveConfig.folderName}
                  onChange={(e) => setGoogleDriveConfig({ ...googleDriveConfig, folderName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Yoga Tracker Backups"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Setup Instructions:</h4>
              <ol className="text-xs text-blue-800 space-y-1">
                <li>1. Go to Google Cloud Console</li>
                <li>2. Create a new project or select existing</li>
                <li>3. Enable Google Drive API</li>
                <li>4. Create OAuth 2.0 credentials (Client ID)</li>
                <li>5. Create API Key</li>
                <li>6. Add your domain to authorized origins</li>
              </ol>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowGoogleDriveConfig(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleGoogleDriveConfigSave}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
