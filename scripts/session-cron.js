/**
 * Browser-based cron job for checking completed sessions
 * This script runs in the browser and checks for sessions that should be added to tasks
 * It integrates with the existing event system to trigger UI updates
 */

(function() {
  'use strict';
  
  // Configuration
  const CRON_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
  const CHECK_INTERVAL = 2 * 60 * 1000; // Check every 2 minutes for sessions becoming overdue
  const STORAGE_KEY = 'yoga_tracker_sessions';
  
  let cronJobRunning = false;
  let checkIntervalId = null;
  
  /**
   * Log a message with timestamp
   */
  function log(message, forceLog = false) {
    const timestamp = new Date().toISOString();
    // Only log important messages to reduce console spam
    if (forceLog || message.includes('Starting') || message.includes('Stopping') || message.includes('Found') || message.includes('Error')) {
      console.log(`[Session Cron ${timestamp}] ${message}`);
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
   * Get sessions from localStorage
   * @returns {Array} Array of sessions
   */
  function getSessions() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      
      const sessions = JSON.parse(data);
      return sessions.map(s => ({
        ...s,
        date: new Date(s.date),
        createdAt: new Date(s.createdAt)
      }));
    } catch (error) {
      log(`Error getting sessions: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Check for overdue sessions and trigger updates
   */
  function checkForOverdueSessions() {
    try {
      const sessions = getSessions();
      const now = new Date();
      
      // Filter sessions that are scheduled and whose end time has passed
      const overdueSessions = sessions.filter(session => 
        session.status === 'scheduled' && 
        isSessionEndTimePassed(session)
      );
      
      if (overdueSessions.length > 0) {
        log(`Found ${overdueSessions.length} overdue sessions`);
        
        // Dispatch custom event to trigger UI updates
        // The existing TasksView and BottomNavigation components listen for these events
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('sessionChanged', { 
            detail: { 
              message: 'Overdue sessions detected',
              overdueCount: overdueSessions.length,
              timestamp: now.toISOString()
            } 
          }));
          
          // Also dispatch a specific event for task updates
          window.dispatchEvent(new CustomEvent('taskListUpdate', { 
            detail: { 
              overdueSessions: overdueSessions.map(s => s.id),
              timestamp: now.toISOString()
            } 
          }));
        }
      }
      
    } catch (error) {
      log(`Error checking for overdue sessions: ${error.message}`);
    }
  }
  
  /**
   * Start the cron job
   */
  function startCronJob() {
    if (cronJobRunning) {
      log('Cron job is already running');
      return;
    }
    
    log('Starting session cron job...');
    cronJobRunning = true;
    
    // Initial check
    checkForOverdueSessions();
    
    // Set up interval to check every minute
    checkIntervalId = setInterval(() => {
      checkForOverdueSessions();
    }, CHECK_INTERVAL);
    
    log(`Cron job started - checking every ${CHECK_INTERVAL / 1000} seconds`);
  }
  
  /**
   * Stop the cron job
   */
  function stopCronJob() {
    if (!cronJobRunning) {
      log('Cron job is not running');
      return;
    }
    
    log('Stopping session cron job...');
    cronJobRunning = false;
    
    if (checkIntervalId) {
      clearInterval(checkIntervalId);
      checkIntervalId = null;
    }
    
    log('Cron job stopped');
  }
  
  /**
   * Initialize the cron job when the page loads
   */
  function initializeCronJob() {
    // Only start if we're in a browser environment
    if (typeof window === 'undefined') {
      log('Not in browser environment, skipping cron job initialization');
      return;
    }
    
    // Wait for the page to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startCronJob);
    } else {
      startCronJob();
    }
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        log('Page hidden, continuing cron job in background');
      } else {
        log('Page visible, refreshing session check');
        checkForOverdueSessions();
      }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', stopCronJob);
  }
  
  // Initialize when script loads
  initializeCronJob();
  
  // Expose functions globally for debugging
  if (typeof window !== 'undefined') {
    window.sessionCron = {
      start: startCronJob,
      stop: stopCronJob,
      check: checkForOverdueSessions,
      isRunning: () => cronJobRunning
    };
  }
  
})();
