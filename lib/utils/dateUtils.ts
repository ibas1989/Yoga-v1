/**
 * Utility functions for date calculations and formatting
 */

/**
 * Calculate age based on birth date
 * @param birthDate - The birth date
 * @returns Age in years or null if birthDate is invalid
 */
export function calculateAge(birthDate: Date | undefined): number | null {
  if (!birthDate || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  const birth = new Date(birthDate);
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  // If birthday hasn't occurred this year, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Format age for display
 * @param age - The calculated age
 * @returns Formatted age string or "N/A" if age is null
 */
export function formatAge(age: number | null): string {
  return age !== null ? age.toString() : 'N/A';
}

/**
 * Calculate age from birth date and return formatted string
 * @param birthDate - The birth date
 * @returns Formatted age string
 */
export function getAgeFromBirthDate(birthDate: Date | undefined): string {
  const age = calculateAge(birthDate);
  return formatAge(age);
}

/**
 * Calculate age in years and months from birth date
 * @param birthDate - The birth date
 * @returns Formatted age string in "X years and Y months" format
 */
export function getAgeInYearsAndMonths(birthDate: Date | undefined): string {
  if (!birthDate || !(birthDate instanceof Date) || isNaN(birthDate.getTime())) {
    return 'Not specified';
  }

  const today = new Date();
  const birth = new Date(birthDate);
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  
  // If birthday hasn't occurred this year, subtract 1 year and add 12 months
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  
  // If the day hasn't occurred this month, subtract 1 month
  if (today.getDate() < birth.getDate()) {
    months--;
  }
  
  if (years === 0 && months === 0) {
    return 'Less than 1 month';
  } else if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`;
  }
}

/**
 * Calculate member since age in years and months
 * @param memberSinceDate - The member since date
 * @returns Formatted member since age string in "X years and Y months" format
 */
export function getMemberSinceAge(memberSinceDate: Date | undefined): string {
  if (!memberSinceDate || !(memberSinceDate instanceof Date) || isNaN(memberSinceDate.getTime())) {
    return 'Not specified';
  }

  const today = new Date();
  const memberSince = new Date(memberSinceDate);
  
  let years = today.getFullYear() - memberSince.getFullYear();
  let months = today.getMonth() - memberSince.getMonth();
  
  // If the date hasn't occurred this year, subtract 1 year and add 12 months
  if (months < 0 || (months === 0 && today.getDate() < memberSince.getDate())) {
    years--;
    months += 12;
  }
  
  // If the day hasn't occurred this month, subtract 1 month
  if (today.getDate() < memberSince.getDate()) {
    months--;
  }
  
  if (years === 0 && months === 0) {
    return 'Less than 1 month';
  } else if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  } else if (months === 0) {
    return `${years} year${years !== 1 ? 's' : ''}`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''} and ${months} month${months !== 1 ? 's' : ''}`;
  }
}

/**
 * Format balance as integer
 * @param balance - The balance value
 * @returns Integer balance value
 */
export function formatBalanceAsInteger(balance: number): number {
  return Math.round(balance);
}

/**
 * Format balance for display (integer only)
 * @param balance - The balance value
 * @returns Formatted balance string
 */
export function formatBalanceForDisplay(balance: number): string {
  return formatBalanceAsInteger(balance).toString();
}

/**
 * Calculate session count based on session type
 * @param sessionType - The type of session (individual or team)
 * @returns Number of sessions based on settings
 */
export function getSessionCount(sessionType: 'individual' | 'team'): number {
  // Import settings dynamically to avoid SSR issues
  if (typeof window === 'undefined') {
    // Fallback for server-side rendering
    return sessionType === 'individual' ? 2 : 1;
  }
  
  try {
    const { getSettings } = require('@/lib/storage');
    const settings = getSettings();
    return sessionType === 'individual' 
      ? settings.defaultIndividualSessionCharge 
      : settings.defaultTeamSessionCharge;
  } catch (error) {
    // Fallback if settings can't be loaded
    return sessionType === 'individual' ? 2 : 1;
  }
}

/**
 * Get session type display name
 * @param sessionType - The type of session
 * @returns Display name for the session type
 */
export function getSessionTypeDisplayName(sessionType: 'individual' | 'team'): string {
  return sessionType === 'individual' ? 'Individual' : 'Team';
}

/**
 * Format a Date object to YYYY-MM-DD string using local timezone
 * @param date - The date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForUrl(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object using local timezone
 * @param dateStr - The date string to parse
 * @returns Date object in local timezone
 */
export function parseDateFromUrl(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Format a date for display
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Not specified';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format a time for display
 * @param date - The date/time to format
 * @returns Formatted time string
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return 'Not specified';
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid time';
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Format a time string for display (handles time strings like "14:30" or "2:30 PM")
 * @param timeString - The time string to format
 * @returns Formatted time string
 */
export function formatTimeString(timeString: string | null | undefined): string {
  if (!timeString) return 'Not specified';
  
  // If it's already a formatted time string, return as is
  if (timeString.includes(':')) {
    // Handle 24-hour format (e.g., "14:30")
    if (timeString.length === 5 && timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        // Convert to 12-hour format
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${displayHour}:${minutes} ${ampm}`;
      }
    }
    
    // Handle 12-hour format (e.g., "2:30 PM")
    if (timeString.includes('AM') || timeString.includes('PM')) {
      return timeString;
    }
  }
  
  // If we can't parse it, try to create a date object
  const dateObj = new Date(timeString);
  if (!isNaN(dateObj.getTime())) {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  }
  
  return 'Invalid time';
}
