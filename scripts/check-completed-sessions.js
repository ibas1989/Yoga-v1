#!/usr/bin/env node

/**
 * Cron job script to check for completed sessions and update task list
 * Runs every 30 minutes starting at the 2nd minute of each hour (e.g., 6:02, 6:32, 7:02, 7:32)
 * to check for sessions that have passed their end time and should be added to the Task list.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STORAGE_DIR = path.join(__dirname, '..');
const SESSIONS_KEY = 'yoga_tracker_sessions';
const LOG_FILE = path.join(__dirname, 'cron-job.log');

/**
 * Log a message with timestamp
 */
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  
  // Append to log file
  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error.message);
  }
}

/**
 * Check if a session's end time has passed
 * @param {Object} session - The session to check
 * @returns {boolean} True if the session's end time has passed
 */
function isSessionEndTimePassed(session) {
  if (!session || !session.date || !session.endTime) return false;
  
  try {
    const now = new Date();
    const sessionDate = new Date(session.date);
    
    // Create a date object for the session's end time on the session date
    const [endHours, endMinutes] = session.endTime.split(':').map(Number);
    const sessionEndDateTime = new Date(sessionDate);
    sessionEndDateTime.setHours(endHours, endMinutes, 0, 0);
    
    // Check if current time is past the session's end time
    return now > sessionEndDateTime;
  } catch (error) {
    log(`Error checking session end time for session ${session.id}: ${error.message}`);
    return false;
  }
}

/**
 * Get sessions from localStorage data
 * @returns {Array} Array of sessions
 */
function getSessions() {
  try {
    // In a real cron job, we can't access localStorage directly
    // This script would need to be run in a browser context or use a different storage mechanism
    // For now, we'll simulate the check and log what would happen
    
    log('Cron job started - checking for completed sessions');
    log('Note: This script simulates the check. In production, this would need to run in a browser context or use server-side storage.');
    
    // Simulate checking sessions
    const now = new Date();
    log(`Current time: ${now.toISOString()}`);
    
    // In a real implementation, we would:
    // 1. Access the actual session data (from localStorage or database)
    // 2. Check each session against the isSessionEndTimePassed function
    // 3. Trigger the existing event system to update the UI
    
    log('Cron job completed - session check simulated');
    return [];
  } catch (error) {
    log(`Error getting sessions: ${error.message}`);
    return [];
  }
}

/**
 * Trigger task list update by dispatching events
 * This would be called when sessions are found that need to be added to tasks
 */
function triggerTaskListUpdate() {
  log('Triggering task list update...');
  
  // In a real implementation, this would:
  // 1. Dispatch the existing custom events that the UI listens to
  // 2. Update the task badge count
  // 3. Refresh the Tasks page if it's currently open
  
  log('Task list update triggered');
}

/**
 * Main cron job function
 */
function runCronJob() {
  try {
    log('=== CRON JOB STARTED ===');
    
    // Get all sessions
    const sessions = getSessions();
    
    if (sessions.length === 0) {
      log('No sessions found or unable to access session data');
      log('=== CRON JOB COMPLETED ===');
      return;
    }
    
    // Check for sessions that should be added to tasks
    const overdueSessions = sessions.filter(session => 
      session.status === 'scheduled' && 
      isSessionEndTimePassed(session)
    );
    
    if (overdueSessions.length > 0) {
      log(`Found ${overdueSessions.length} overdue sessions:`);
      overdueSessions.forEach(session => {
        log(`- Session ${session.id}: ${session.date} ${session.startTime}-${session.endTime}`);
      });
      
      // Trigger task list update
      triggerTaskListUpdate();
    } else {
      log('No overdue sessions found');
    }
    
    log('=== CRON JOB COMPLETED ===');
    
  } catch (error) {
    log(`Cron job error: ${error.message}`);
    log(`Stack trace: ${error.stack}`);
  }
}

// Run the cron job
runCronJob();
