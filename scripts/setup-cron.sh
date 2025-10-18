#!/bin/bash

# Setup script for session cron job
# This script sets up a system cron job to run every 30 minutes starting at :02 and :32

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CRON_SCRIPT="$SCRIPT_DIR/check-completed-sessions.js"
LOG_FILE="$SCRIPT_DIR/cron-job.log"

echo "Setting up session cron job..."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Make the cron script executable
chmod +x "$CRON_SCRIPT"

# Create the cron job entry (runs at :02 and :32 minutes)
CRON_ENTRY="2,32 * * * * cd $PROJECT_DIR && node $CRON_SCRIPT >> $LOG_FILE 2>&1"

echo "Cron job entry to add:"
echo "$CRON_ENTRY"
echo ""

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "check-completed-sessions.js"; then
    echo "Cron job already exists. Current crontab:"
    crontab -l | grep "check-completed-sessions.js"
    echo ""
    echo "To remove existing cron job, run:"
    echo "crontab -e"
    echo "Then delete the line containing 'check-completed-sessions.js'"
else
    echo "To add this cron job, run:"
    echo "crontab -e"
    echo "Then add this line:"
    echo "$CRON_ENTRY"
    echo ""
    echo "Or run this command to add it automatically:"
    echo "(crontab -l 2>/dev/null; echo \"$CRON_ENTRY\") | crontab -"
fi

echo ""
echo "Cron job will run every 30 minutes at:"
echo "- :02 and :32 of each hour (e.g., 6:02, 6:32, 7:02, 7:32)"
echo "- Logs will be written to: $LOG_FILE"
echo ""
echo "To view logs: tail -f $LOG_FILE"
echo "To stop the cron job: crontab -e (then remove the line)"
