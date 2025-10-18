'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '@/lib/hooks/usePWA';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const { isInstalled, isIOS, isStandalone } = usePWA();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after a delay if not already installed
      if (!isInstalled) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000); // Show after 3 seconds
      }
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed in this session
  if (isInstalled || !showInstallPrompt || sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  // iOS specific install instructions
  if (isIOS && !isStandalone) {
    return (
      <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-green-600" />
              Install Yoga Tracker
            </DialogTitle>
            <DialogDescription>
              Add this app to your home screen for quick access and a better experience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">To install this app on your iPhone or iPad:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600">
                <li>Tap the Share button at the bottom of your screen</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDismiss} variant="outline" className="flex-1">
                Maybe Later
              </Button>
              <Button onClick={() => setShowInstallPrompt(false)} className="flex-1">
                Got it!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Android/Chrome install prompt
  if (deferredPrompt) {
    return (
      <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Install Yoga Tracker
            </DialogTitle>
            <DialogDescription>
              Install this app on your device for quick access, offline use, and a better experience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Get the full app experience with offline access, push notifications, and faster loading.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleDismiss} variant="outline" className="flex-1">
                Not now
              </Button>
              <Button onClick={handleInstallClick} className="flex-1">
                Install
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
