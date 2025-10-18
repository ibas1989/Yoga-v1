# Session Cron Job Setup

This document explains the automated session completion checking system that runs every 30 minutes starting at the 2nd minute of each hour (e.g., 6:02, 6:32, 7:02, 7:32) to identify sessions that should be added to the Task list.

## Overview

The cron job system consists of two components:

1. **Browser-based cron job** (`session-cron.js`) - Runs in the browser and provides real-time updates
2. **System cron job** (`check-completed-sessions.js`) - Runs every 30 minutes starting at :02 and :32 minutes as a system service

## How It Works

### Session Qualification Logic

A session qualifies to be added to the Task list when:
- **Current time** > **Session start time + Session length**
- Session status is "scheduled" (not completed or cancelled)

### Browser-based Cron Job

**File**: `public/scripts/session-cron.js`

- Automatically starts when the page loads
- Checks for overdue sessions every minute
- Dispatches custom events to trigger UI updates
- Works in the background even when the page is hidden
- Integrates with existing event system

**Events dispatched**:
- `sessionChanged` - General session change event
- `taskListUpdate` - Specific event for task list updates

### System Cron Job

**File**: `scripts/check-completed-sessions.js`

- Runs every 30 minutes (at :00 and :30 of each hour)
- Checks for sessions that have passed their end time
- Logs activity to `scripts/cron-job.log`
- Can be configured as a system cron job

## Setup Instructions

### 1. Browser-based Cron Job (Automatic)

The browser-based cron job is automatically included in the application layout and will start when the page loads. No additional setup required.

### 2. System Cron Job (Optional)

To set up the system cron job:

```bash
# Navigate to the project directory
cd /path/to/Yoga

# Run the setup script
./scripts/setup-cron.sh

# Follow the instructions to add the cron job
crontab -e
# Add this line:
2,32 * * * * cd /path/to/Yoga && node scripts/check-completed-sessions.js >> scripts/cron-job.log 2>&1
```

### 3. Verify Setup

Check that the cron job is working:

```bash
# View cron job logs
tail -f scripts/cron-job.log

# Check if cron job is scheduled
crontab -l | grep check-completed-sessions
```

## Integration with Existing System

### TasksView Component

The `TasksView` component automatically listens for:
- `sessionCreated`
- `sessionUpdated` 
- `sessionCompleted`
- `sessionCancelled`
- `sessionDeleted`
- `sessionChanged`
- `taskListUpdate` (new)

### Bottom Navigation Badge

The task badge in the bottom navigation automatically updates when:
- Sessions are completed/cancelled
- New sessions are created
- Sessions become overdue
- Cron job detects overdue sessions

### Event Flow

1. **Cron job detects overdue session** → Dispatches `taskListUpdate` event
2. **TasksView receives event** → Refreshes task list
3. **Bottom navigation receives event** → Updates badge count
4. **UI updates automatically** → No page reload needed

## Configuration

### Cron Job Timing

- **Browser cron**: Checks every 60 seconds, runs at :02 and :32 minutes
- **System cron**: Runs every 30 minutes (at :02 and :32 minutes)

### Logging

- **Browser cron**: Logs to browser console
- **System cron**: Logs to `scripts/cron-job.log`

### Debugging

Access the browser cron job controls:

```javascript
// In browser console
window.sessionCron.start()    // Start cron job
window.sessionCron.stop()     // Stop cron job  
window.sessionCron.check()    // Manual check
window.sessionCron.isRunning() // Check status
```

## Troubleshooting

### Browser Cron Job Not Working

1. Check browser console for errors
2. Verify script is loaded: `document.querySelector('script[src*="session-cron.js"]`)`
3. Check if cron job is running: `window.sessionCron.isRunning()`

### System Cron Job Not Working

1. Check cron job is scheduled: `crontab -l`
2. Check logs: `tail -f scripts/cron-job.log`
3. Verify Node.js path in cron job entry
4. Check file permissions: `ls -la scripts/check-completed-sessions.js`

### Tasks Not Appearing

1. Verify session has `status: 'scheduled'`
2. Check session end time has passed
3. Verify event listeners are working
4. Check browser console for errors

## Files Modified

- `app/layout.tsx` - Added cron job script
- `components/TasksView.tsx` - Added taskListUpdate event listener
- `components/ui/bottom-navigation.tsx` - Added taskListUpdate event listener
- `public/scripts/session-cron.js` - Browser cron job script
- `scripts/check-completed-sessions.js` - System cron job script
- `scripts/setup-cron.sh` - Setup script

## Benefits

1. **Automatic Detection**: Sessions are automatically added to tasks when overdue
2. **Real-time Updates**: UI updates immediately when sessions become overdue
3. **No Manual Intervention**: System works automatically in the background
4. **Reliable**: Both browser and system cron jobs provide redundancy
5. **Integrated**: Works seamlessly with existing task management system
