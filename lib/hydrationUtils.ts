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
