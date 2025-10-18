import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getSessions } from './storage';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Check if a session's end time has passed
 * @param session - The session to check
 * @returns True if the session's end time has passed
 */
export function isSessionEndTimePassed(session: any): boolean {
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
    console.error('Error checking session end time:', error);
    return false;
  }
}

/**
 * Get the count of pending tasks (scheduled sessions whose end time has passed)
 * @returns Number of pending tasks
 */
export function getPendingTasksCount(): number {
  if (typeof window === 'undefined') return 0;
  
  try {
    const sessions = getSessions();
    
    // Filter sessions that are scheduled and whose end time has passed
    const pendingSessions = sessions.filter(session => 
      session.status === 'scheduled' && 
      isSessionEndTimePassed(session)
    );
    
    return pendingSessions.length;
  } catch (error) {
    console.error('Error getting pending tasks count:', error);
    return 0;
  }
}

