# Google Drive Backup Setup Guide

This guide will walk you through setting up Google Drive integration for automatic backup of your Yoga Tracker data.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Your Yoga Tracker app deployed or running locally

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.developers.google.com/)
2. Click "Select a project" and then "New Project"
3. Enter a project name (e.g., "Yoga Tracker Backup")
4. Click "Create"

## Step 2: Enable Google Drive API

1. In your project dashboard, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on "Google Drive API" and then "Enable"

## Step 3: Create API Credentials

### Create an API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Click "Restrict Key" to add restrictions for security

### Create OAuth 2.0 Client ID

1. In the Credentials page, click "Create Credentials" > "OAuth client ID"
2. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: "Yoga Tracker"
     - User support email: Your email
     - Developer contact: Your email
   - Add your domain to "Authorized domains" (e.g., `localhost` for development)
3. For Application type, select "Web application"
4. Add authorized JavaScript origins:
   - For development: `http://localhost:3000`
   - For production: Your app's domain (e.g., `https://yourdomain.com`)
5. Click "Create"
6. Copy the generated Client ID

## Step 4: Configure Your Yoga Tracker App

1. Open your Yoga Tracker app
2. Go to the Backup & Restore section
3. Click "Connect Google Drive"
4. Enter the credentials you created:
   - **Client ID**: The OAuth 2.0 Client ID from Step 3
   - **API Key**: The API Key from Step 3
   - **Folder Name**: (Optional) Custom name for backup folder (default: "Yoga Tracker Backups")
5. Click "Connect"

## Step 5: Authorize Access

1. A Google sign-in popup will appear
2. Sign in with your Google account
3. Grant permission to access Google Drive
4. The app will create a backup folder in your Google Drive

## Step 6: Enable Auto Backup

1. After connecting to Google Drive, you can enable automatic backups:
   - Toggle "Enable Auto Backup" to ON
   - The system will automatically use Google Drive as the storage location
   - Backups will be created every 24 hours (configurable)

## Features

### Manual Backup
- Click "Upload Backup Now" to create an immediate backup
- Backups are uploaded directly to your Google Drive

### Auto Backup
- Automatic backups every 24 hours (when app is in use)
- Keeps the 7 most recent backups
- Automatically deletes older backups to save space

### Backup Management
- View all backup files in your Google Drive folder
- Download backups for local storage
- Restore data from any backup file

## Security Notes

- Your backup files are stored in your personal Google Drive
- Only you have access to these files
- The app only requests permission to create files in the designated backup folder
- Your Google API credentials are stored locally in your browser

## Troubleshooting

### "Failed to authenticate with Google Drive"
- Check that your Client ID and API Key are correct
- Ensure your domain is added to authorized origins
- Make sure Google Drive API is enabled in your project

### "Upload failed" errors
- Check your internet connection
- Verify you have sufficient Google Drive storage space
- Ensure the OAuth consent screen is properly configured

### "Folder not found" errors
- The app will automatically create the backup folder
- Make sure you have permission to create folders in Google Drive

## Backup File Format

Backup files are stored as JSON files with the following naming convention:
```
yoga-tracker-backup-YYYY-MM-DD.json
```

Each backup contains:
- All student data
- All session data
- App settings
- Metadata (version, timestamp, device info)

## Restoring from Backup

1. Go to Backup & Restore section
2. Click "Import Backup"
3. Select a backup file from your computer or Google Drive
4. The app will validate and restore the data
5. Your app will refresh with the restored data

## Storage Management

- Each backup file is typically 1-10 KB depending on your data size
- Google Drive provides 15 GB free storage
- The app automatically manages backup retention (keeps 7 most recent)

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Google Cloud Console configuration
3. Ensure your API credentials are correct
4. Check that Google Drive API is enabled

For additional help, refer to the [Google Drive API documentation](https://developers.google.com/drive/api/v3/about-sdk).
