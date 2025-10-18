'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <WifiOff className="h-24 w-24 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're Offline
          </h1>
          <p className="text-gray-600">
            It looks like you're not connected to the internet. 
            Some features may be limited, but you can still access your cached data.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <p className="text-sm text-gray-500">
            Your data is safely stored locally and will sync when you're back online.
          </p>
        </div>
      </div>
    </div>
  );
}
