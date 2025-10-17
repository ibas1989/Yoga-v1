// Early error suppression - loaded before React hydration
(function() {
  if (typeof window === 'undefined') return;
  
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = function(...args) {
    const firstArg = args[0];
    const stringArg = typeof firstArg === 'string' ? firstArg : (firstArg?.message || String(firstArg || ''));
    
    // Suppress Next.js RSC fetch errors and hydration warnings
    if (
      stringArg.includes('Failed to fetch RSC payload') ||
      stringArg.includes('Falling back to browser navigation') ||
      stringArg.includes('RSC payload') ||
      stringArg.includes('data-new-gr-c-s-check-loaded') ||
      stringArg.includes('data-gr-ext-installed') ||
      stringArg.includes('Grammarly') ||
      stringArg.includes('browser extension') ||
      (firstArg instanceof Error && firstArg.message && firstArg.message.includes('Failed to fetch'))
    ) {
      return; // Suppress
    }
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    const firstArg = args[0];
    const stringArg = typeof firstArg === 'string' ? firstArg : String(firstArg || '');
    
    if (
      stringArg.includes('Failed to fetch RSC payload') ||
      stringArg.includes('Falling back to browser navigation') ||
      stringArg.includes('RSC payload')
    ) {
      return; // Suppress
    }
    originalWarn.apply(console, args);
  };
})();

