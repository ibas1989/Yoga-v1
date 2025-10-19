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
import { useTranslation } from '../lib/hooks/useTranslation';

interface BackupManagerProps {
  onDataRestored?: () => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ onDataRestored }) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Initialize state with error handling
  const [stats, setStats] = useState(() => {
    try {
      return getBackupStats();
    } catch (error) {
      console.error('Error getting backup stats:', error);
      return { students: 0, sessions: 0 };
    }
  });
  
  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupConfig>(() => {
    try {
      return getAutoBackupConfig();
    } catch (error) {
      console.error('Error getting auto backup config:', error);
      return {
        enabled: false,
        interval: 24,
        maxBackups: 7,
        notifyOnBackup: true,
        storageLocation: 'downloads'
      };
    }
  });
  
  const [backupHistory, setBackupHistory] = useState(() => {
    try {
      return getBackupHistory();
    } catch (error) {
      console.error('Error getting backup history:', error);
      return [];
    }
  });
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('');
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
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
    try {
      // Detect mobile device
      const detectMobileDevice = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        setIsMobileDevice(isMobile);
      };
      
      detectMobileDevice();
    } catch (error) {
      console.error('Error in BackupManager initialization:', error);
    }
    
    // Initialize auto backup system
    try {
      initializeAutoBackup();
    } catch (error) {
      console.error('Error initializing auto backup:', error);
    }
    
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
      try {
        setBackupHistory(getBackupHistory());
      } catch (error) {
        console.error('Error updating backup history:', error);
      }
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
      showMessage('success', t('backup.exportBackup.success'));
      setStats(getBackupStats());
    } catch (error) {
      showMessage('error', t('backup.exportBackup.error'));
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
            showMessage('success', t('backup.importBackup.success'));
            setStats(getBackupStats());
            onDataRestored?.();
          } else {
            showMessage('error', restoreResult.message);
          }
        } else {
          showMessage('error', t('backup.importBackup.validationFailed', { issues: validation.issues.join(', ') }));
        }
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', t('backup.importBackup.error'));
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
        showMessage('success', t('backup.autoBackup.enableSuccess'));
      } else {
        // Show folder picker for local storage - enhanced for mobile
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
      showMessage('info', t('backup.autoBackup.disableSuccess'));
    }
  };

  const handleFolderSelect = async () => {
    try {
      // Check if File System Access API is supported
      if ('showDirectoryPicker' in window && typeof (window as any).showDirectoryPicker === 'function') {
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
        
        // Create immediate backup to the selected folder
        setIsLoading(true);
        try {
          const backup = generateBackup();
          const backupData = JSON.stringify(backup, null, 2);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const fileName = `yoga-backup-${timestamp}.json`;
          
          // Create file in the selected folder
          if (handle && typeof handle.getFileHandle === 'function') {
            const fileHandle = await handle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(backupData);
            await writable.close();
            
            // Update backup history
            const newHistory = getBackupHistory();
            setBackupHistory(newHistory);
            
            showMessage('success', t('backup.autoBackup.enableFolderSuccessWithBackup'));
          } else {
            throw new Error('File System Access API not fully supported');
          }
        } catch (backupError) {
          console.error('Error creating immediate backup:', backupError);
          showMessage('info', t('backup.autoBackup.enableFolderSuccessNoBackup'));
        } finally {
          setIsLoading(false);
        }
        
        setShowFolderPicker(false);
      } else {
        // Fallback for browsers that don't support File System Access API
        showMessage('error', t('backup.folderPicker.folderNotSupported'));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the folder selection
        return;
      }
      console.error('Error selecting folder:', error);
      showMessage('error', t('backup.folderPicker.selectFolderError'));
    }
  };

  const handleCancelFolderSelection = () => {
    setShowFolderPicker(false);
  };

  const handleOpenFolder = async () => {
    try {
      if (directoryHandle) {
        // Request permission to access the folder
        await directoryHandle.requestPermission({ mode: 'readwrite' });
        
        // Create a temporary file to trigger folder opening
        const tempFileName = `yoga-backup-folder-${Date.now()}.txt`;
        const tempContent = `Yoga Tracker Backup Folder\nCreated: ${new Date().toLocaleString()}\n\nThis file was created to open the backup folder.\nYou can safely delete this file.`;
        
        try {
          // Create a temporary file in the folder
          const fileHandle = await directoryHandle.getFileHandle(tempFileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(tempContent);
          await writable.close();
          
          // Try multiple approaches to open the folder
          try {
            // Approach 1: Create a download link to trigger folder opening
            const blob = new Blob([tempContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = tempFileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showMessage('success', t('backup.autoBackup.folderOpened', { path: selectedFolderPath }));
          } catch (downloadError) {
            // Approach 2: Show folder path with instructions
            showMessage('info', t('backup.autoBackup.folderLocationWithInstructions', { 
              path: selectedFolderPath,
              fileName: tempFileName
            }));
          }
        } catch (fileError) {
          // If we can't create a file, show the folder path
          showMessage('info', t('backup.autoBackup.folderLocation', { path: selectedFolderPath }));
        }
      } else {
        showMessage('error', t('backup.autoBackup.folderHandleError'));
      }
    } catch (error) {
      console.error('Error opening folder:', error);
      showMessage('error', t('backup.autoBackup.openFolderError'));
    }
  };

  const handleAutoBackupNow = async () => {
    setIsLoading(true);
    try {
      console.log('Starting manual auto backup...');
      const result = await performAutoBackup();
      console.log('Auto backup result:', result);
      
      if (result.success) {
        showMessage('success', t('backup.autoBackup.manualSuccess'));
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
      showMessage('error', t('backup.autoBackup.manualError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAutoBackup = async () => {
    if (backupHistory.length === 0) {
      showMessage('error', t('backup.autoBackup.noBackups'));
      return;
    }

    setIsLoading(true);
    try {
      // Get the latest auto backup from localStorage
      const latestBackup = backupHistory[0];
      const backupKey = `yoga_tracker_auto_backup_${latestBackup.id}`;
      const backupData = localStorage.getItem(backupKey);
      
      if (!backupData) {
        showMessage('error', t('backup.autoBackup.dataNotFound'));
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
      
      showMessage('success', t('backup.autoBackup.exportSuccess'));
    } catch (error) {
      showMessage('error', t('backup.autoBackup.exportError'));
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
      showMessage('error', t('backup.googleDrive.provideCredentials'));
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
        showMessage('success', t('backup.googleDrive.success'));
        
        // Load existing backups
        await loadGoogleDriveBackups();
      } else {
        showMessage('error', t('backup.googleDrive.authError'));
      }
    } catch (error) {
      showMessage('error', t('backup.googleDrive.error', { error: error instanceof Error ? error.message : 'Unknown error' }));
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
      
      showMessage('info', t('backup.googleDrive.signOutSuccess'));
    } catch (error) {
      showMessage('error', t('backup.googleDrive.signOutError'));
    }
  };

  const handleUploadToGoogleDrive = async () => {
    setIsLoading(true);
    try {
      const backup = generateBackup();
      const googleDriveService = getGoogleDriveService();
      const result = await googleDriveService.uploadBackup(backup);
      
      if (result.success) {
        showMessage('success', t('backup.googleDrive.uploadSuccess'));
        await loadGoogleDriveBackups();
      } else {
        showMessage('error', result.message);
      }
    } catch (error) {
      showMessage('error', t('backup.googleDrive.uploadError', { error: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pt-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('backup.title')}</h2>
        <p className="text-gray-600">{t('backup.subtitle')}</p>
      </div>

      {/* Statistics */}
      <Card className="p-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="font-medium">{t('backup.currentData')}</span>
          </div>
          <div className="text-sm text-gray-600">
            {stats.students} {t('backup.students')} • {stats.sessions} {t('backup.sessions')}
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
              <h3 className="font-semibold text-gray-900">{t('backup.exportBackup.title')}</h3>
              <p className="text-sm text-gray-600">{t('backup.exportBackup.description')}</p>
            </div>
          </div>
          <Button 
            onClick={handleExport}
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            {isLoading ? t('backup.exportBackup.exporting') : t('backup.exportBackup.button')}
          </Button>
        </Card>

        {/* Import Backup */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('backup.importBackup.title')}</h3>
              <p className="text-sm text-gray-600">{t('backup.importBackup.description')}</p>
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
              {isLoading ? t('backup.importBackup.importing') : t('backup.importBackup.button')}
            </Button>
          </div>
        </Card>


        {/* Auto Backup */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('backup.autoBackup.title')}</h3>
              <p className="text-sm text-gray-600">{t('backup.autoBackup.description')}</p>
            </div>
          </div>
          
          {/* Auto Backup Status */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('backup.autoBackup.status')}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                autoBackupConfig.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {autoBackupConfig.enabled ? t('backup.autoBackup.enabled') : t('backup.autoBackup.disabled')}
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• {t('backup.autoBackup.backsUpEvery', { hours: autoBackupConfig.interval })}</div>
              <div>• {t('backup.autoBackup.keepsBackups', { count: autoBackupConfig.maxBackups })}</div>
              {autoBackupConfig.enabled && backupHistory.length > 0 && getNextBackupTime() && (
                <div className="text-blue-600 font-medium">
                  {t('backup.autoBackup.nextBackup', { time: getNextBackupTime()!.toLocaleString() })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('backup.autoBackup.enableToggle')}</span>
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
                <label className="text-sm font-medium text-gray-700">{t('backup.autoBackup.backupLocation')}</label>
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
                      {t('backup.autoBackup.openFolder')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Google Drive Backup */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Cloud className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{t('backup.googleDrive.title')}</h3>
              <p className="text-sm text-gray-600">{t('backup.googleDrive.description')}</p>
            </div>
          </div>
          
          {/* Google Drive Status */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{t('backup.googleDrive.status')}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                googleDriveAuthState.isAuthenticated 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {googleDriveAuthState.isAuthenticated ? t('backup.googleDrive.connected', { email: googleDriveAuthState.userEmail || '' }) : t('backup.googleDrive.notConnected')}
              </span>
            </div>
            {googleDriveAuthState.isAuthenticated && (
              <div className="text-xs text-gray-600 space-y-1">
                <div>• {t('backup.googleDrive.backupFiles', { count: googleDriveFiles.length })}</div>
                <div>• {t('backup.googleDrive.autoBackup', { status: autoBackupConfig.storageLocation === 'google_drive' ? t('backup.googleDrive.enabled') : t('backup.googleDrive.disabled') })}</div>
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
                {t('backup.googleDrive.connectButton')}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button 
                  onClick={handleUploadToGoogleDrive}
                  disabled={isLoading}
                  className="w-full"
                  variant="default"
                >
                  {isLoading ? t('backup.googleDrive.uploading') : t('backup.googleDrive.uploadButton')}
                </Button>
                <Button 
                  onClick={handleGoogleDriveSignOut}
                  className="w-full"
                  variant="outline"
                >
                  {t('backup.googleDrive.signOut')}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Backup History */}
      {backupHistory.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">{t('backup.recentBackups')}</h3>
          <div className="space-y-2">
            {backupHistory.slice(0, 5).map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-sm font-medium">
                    {new Date(backup.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-600">
                    {backup.studentCount} {t('backup.students')} • {backup.sessionCount} {t('backup.sessions')}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  {t('backup.backupSize', { size: (backup.size / 1024).toFixed(1) })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}



      {/* Folder Picker Dialog */}
      <Dialog open={showFolderPicker} onOpenChange={setShowFolderPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('backup.folderPicker.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Critical importance warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800 mb-1">
                    {t('backup.folderPicker.criticalImportance')}
                  </h4>
                  <p className="text-sm text-red-700">
                    {t('backup.folderPicker.criticalDescription')}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              {t('backup.folderPicker.description')}
            </p>

            {/* Mobile-specific instructions */}
            {isMobileDevice && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">
                      {t('backup.folderPicker.mobileInstructions.title')}
                    </h4>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p>{t('backup.folderPicker.mobileInstructions.step1')}</p>
                      <p>{t('backup.folderPicker.mobileInstructions.step2')}</p>
                      <p>{t('backup.folderPicker.mobileInstructions.step3')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={handleFolderSelect}
                className="w-full"
                variant="outline"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                {t('backup.folderPicker.selectButton')}
              </Button>
              <p className="text-xs text-gray-500 text-center">
                {t('backup.folderPicker.browserNote')}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleCancelFolderSelection}
                variant="outline"
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Drive Configuration Dialog */}
      <Dialog open={showGoogleDriveConfig} onOpenChange={setShowGoogleDriveConfig}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('backup.googleDrive.setupTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t('backup.googleDrive.setupDescription')}
              <a 
                href="https://console.developers.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline ml-1"
              >
                {t('backup.googleDrive.getCredentials')}
              </a>
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('backup.googleDrive.clientId')}
                </label>
                <input
                  type="text"
                  value={googleDriveConfig.clientId}
                  onChange={(e) => setGoogleDriveConfig({ ...googleDriveConfig, clientId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('backup.googleDrive.clientIdPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('backup.googleDrive.apiKey')}
                </label>
                <input
                  type="text"
                  value={googleDriveConfig.apiKey}
                  onChange={(e) => setGoogleDriveConfig({ ...googleDriveConfig, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('backup.googleDrive.apiKeyPlaceholder')}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('backup.googleDrive.folderName')}
                </label>
                <input
                  type="text"
                  value={googleDriveConfig.folderName}
                  onChange={(e) => setGoogleDriveConfig({ ...googleDriveConfig, folderName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('backup.googleDrive.folderNamePlaceholder')}
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">{t('backup.googleDrive.setupInstructions')}</h4>
              <ol className="text-xs text-blue-800 space-y-1">
                <li>1. {t('backup.googleDrive.setupSteps.1')}</li>
                <li>2. {t('backup.googleDrive.setupSteps.2')}</li>
                <li>3. {t('backup.googleDrive.setupSteps.3')}</li>
                <li>4. {t('backup.googleDrive.setupSteps.4')}</li>
                <li>5. {t('backup.googleDrive.setupSteps.5')}</li>
                <li>6. {t('backup.googleDrive.setupSteps.6')}</li>
              </ol>
            </div>
            
            <div className="flex space-x-2">
              <Button 
                onClick={() => setShowGoogleDriveConfig(false)}
                variant="outline"
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleGoogleDriveConfigSave}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? t('backup.googleDrive.connecting') : t('backup.googleDrive.connect')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};
