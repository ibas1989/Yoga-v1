'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n'; // Initialize i18n (guarded in i18n/index.ts)

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { ready } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (ready) {
      setIsReady(true);
    }
  }, [ready]);

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
