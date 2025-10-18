'use client';

import { usePWA } from '@/lib/hooks/usePWA';
// import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Download, Smartphone } from 'lucide-react';

export function PWAStatus() {
  const { 
    isOnline, 
    isInstalled, 
    canInstall, 
    isIOS, 
    isStandalone,
    requestNotificationPermission,
    showNotification 
  } = usePWA();

  const handleRequestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      showNotification('Notifications enabled!', {
        body: 'You will now receive notifications from Yoga Tracker.',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Connection Status</span>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3 mr-1 inline" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 mr-1 inline" />
              Offline
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">App Status</span>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isInstalled 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-orange-100 text-orange-800'
        }`}>
          {isInstalled ? (
            <>
              <Smartphone className="h-3 w-3 mr-1 inline" />
              Installed
            </>
          ) : (
            <>
              <Download className="h-3 w-3 mr-1 inline" />
              Web App
            </>
          )}
        </div>
      </div>

      {!isInstalled && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800 mb-2">
            {isIOS 
              ? "Install this app on your device for a better experience. Tap the Share button and select 'Add to Home Screen'."
              : "Install this app on your device for offline access and better performance."
            }
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Button 
          onClick={handleRequestNotification}
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          Enable Notifications
        </Button>
      </div>
    </div>
  );
}
