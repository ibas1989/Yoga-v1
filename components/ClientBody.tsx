'use client';

import { useEffect } from 'react';
import { suppressHydrationWarnings } from '@/lib/hydrationUtils';

interface ClientBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ClientBody({ children, className }: ClientBodyProps) {
  useEffect(() => {
    // Suppress hydration warnings for browser extension attributes
    const cleanup = suppressHydrationWarnings();
    
    // Handle unhandled promise rejections (like RSC fetch errors)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === 'string' && 
          (event.reason.includes('Failed to fetch RSC payload') ||
           event.reason.includes('Failed to fetch'))) {
        console.warn('RSC fetch error suppressed:', event.reason);
        event.preventDefault();
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      cleanup();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <body className={className} suppressHydrationWarning>
      {children}
    </body>
  );
}
