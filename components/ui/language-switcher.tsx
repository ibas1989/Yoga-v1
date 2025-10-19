'use client';

import React from 'react';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  variant?: 'select' | 'buttons';
  className?: string;
}

export function LanguageSwitcher({ variant = 'select', className }: LanguageSwitcherProps) {
  const { getCurrentLanguage, changeLanguage } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ] as const;

  const currentLang = getCurrentLanguage();

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-1 ${className}`}>
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant={currentLang === lang.code ? 'default' : 'outline'}
            size="sm"
            onClick={() => changeLanguage(lang.code)}
            className="flex items-center gap-2"
          >
            <span>{lang.flag}</span>
            <span className="hidden sm:inline">{lang.name}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <Select value={currentLang} onValueChange={changeLanguage}>
        <SelectTrigger className="w-[80px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.code === 'en' ? 'En' : 'Ru'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
