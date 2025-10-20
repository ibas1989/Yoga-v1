/**
 * Utility functions to handle hydration mismatches caused by browser extensions
 */

export const suppressHydrationWarnings = () => {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    const firstArg = args[0];
    const stringArg = typeof firstArg === 'string' ? firstArg : (firstArg?.message || '');
    
    if (
      stringArg.includes('Warning: A tree hydrated but some attributes of the server rendered HTML didn\'t match the client properties') ||
      stringArg.includes('data-new-gr-c-s-check-loaded') ||
      stringArg.includes('data-gr-ext-installed') ||
      stringArg.includes('Grammarly') ||
      stringArg.includes('browser extension') ||
      stringArg.includes('Failed to fetch RSC payload') ||
      stringArg.includes('Falling back to browser navigation') ||
      stringArg.includes('RSC payload') ||
      (firstArg instanceof TypeError && firstArg.message.includes('Failed to fetch'))
    ) {
      // Suppress hydration warnings caused by browser extensions and RSC fetch errors
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Failed to fetch RSC payload') ||
       args[0].includes('Falling back to browser navigation') ||
       args[0].includes('Failed to fetch'))
    ) {
      // Suppress RSC-related warnings
      return;
    }
    originalWarn.apply(console, args);
  };

  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
};

export const isBrowserExtensionPresent = () => {
  if (typeof window === 'undefined') return false;
  
  return !!(
    document.body.getAttribute('data-new-gr-c-s-check-loaded') ||
    document.body.getAttribute('data-gr-ext-installed') ||
    document.body.getAttribute('data-grammarly-shadow-root') ||
    // Check for other common browser extensions
    document.body.getAttribute('data-lastpass-icon-root') ||
    document.body.getAttribute('data-1password-root')
  );
};

/**
 * Safe Web Storage guard to prevent crashes when localStorage is unavailable
 * (iOS Safari Private mode, blocked cookies, etc.).
 */
export const safeStorage = {
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const k = '__storage_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  },
  getItem(key: string): string | null {
    if (!this.isAvailable()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): boolean {
    if (!this.isAvailable()) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  removeItem(key: string): void {
    if (!this.isAvailable()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};
