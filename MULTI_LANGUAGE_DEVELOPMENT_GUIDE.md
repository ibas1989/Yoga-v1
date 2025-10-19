# Multi-Language Development Best Practices Guide

## Overview
This guide outlines best practices for developing multi-language applications, specifically tailored to our Yoga Tracker app using React i18next.

## Current Implementation Status ✅
Our app already implements many best practices:
- ✅ React i18next integration
- ✅ TypeScript support
- ✅ Automatic language detection
- ✅ Persistent language selection
- ✅ Russian pluralization handling
- ✅ Organized translation structure

## 1. Translation Key Organization

### Current Structure (Good ✅)
```
lib/i18n/
├── index.ts          # i18n configuration
├── types.ts          # TypeScript definitions
├── en.json           # English translations
└── ru.json           # Russian translations
```

### Best Practices for Key Naming
```typescript
// ✅ Good - Hierarchical and descriptive
"studentDetails.personalInformation"
"calendar.sessions.completed"
"validation.enterStudentName"

// ❌ Bad - Flat and unclear
"personalInfo"
"completedSession"
"enterName"
```

### Namespace Organization
```typescript
{
  "navigation": {        // App navigation
    "calendar": "...",
    "students": "..."
  },
  "calendar": {          // Calendar-specific
    "months": {...},
    "sessions": {...}
  },
  "students": {          // Student management
    "title": "...",
    "form": {...}
  },
  "common": {            // Reusable UI elements
    "save": "...",
    "cancel": "..."
  },
  "validation": {        // Error messages
    "required": "...",
    "invalid": "..."
  }
}
```

## 2. Type Safety Implementation

### Translation Key Types
```typescript
// lib/i18n/types.ts
export type TranslationKeys = 
  | 'navigation.calendar'
  | 'students.title'
  | 'common.save'
  // ... all possible keys

export type SupportedLanguages = 'en' | 'ru';
```

### Type-Safe Translation Function
```typescript
// Enhanced useTranslation hook
const translate = (key: TranslationKeys, params?: TranslationParams) => {
  return t(key, params);
};
```

## 3. Pluralization Best Practices

### Russian Pluralization Rules
```typescript
// Russian has complex pluralization rules
const pluralize = (count: number, singular: string, plural: string, genitive?: string) => {
  if (isRussian()) {
    if (count === 1) return singular;           // 1 день
    if (count >= 2 && count <= 4) return plural; // 2-4 дня
    if (genitive) return genitive;              // 5+ дней
    return plural;
  }
  return count === 1 ? singular : plural;
};
```

### Usage Examples
```typescript
// In components
const sessionText = pluralize(
  count, 
  t('calendar.sessions.session'), 
  t('calendar.sessions.sessions')
);
```

## 4. Development Workflow

### Adding New Translations

1. **Add to English first** (`en.json`)
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

2. **Add to Russian** (`ru.json`)
```json
{
  "newFeature": {
    "title": "Новая функция",
    "description": "Это новая функция"
  }
}
```

3. **Update TypeScript types** (`types.ts`)
```typescript
export type TranslationKeys = 
  | 'newFeature.title'
  | 'newFeature.description'
  // ... existing keys
```

4. **Use in components**
```typescript
const { t } = useTranslation();
return <h1>{t('newFeature.title')}</h1>;
```

### Translation Key Naming Conventions

```typescript
// ✅ Good patterns
"feature.action"           // student.create
"feature.state"           // session.completed
"feature.validation"      // form.required
"ui.element"              // button.save
"message.type"            // error.network

// ❌ Avoid
"title"                   // Too generic
"text"                    // Too vague
"msg"                     // Abbreviations
```

## 5. Component Integration Patterns

### Basic Usage
```typescript
import { useTranslation } from '@/lib/hooks/useTranslation';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('students.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### With Parameters
```typescript
// Translation with variables
const message = t('completeSession.description', { 
  count: 2, 
  sessionText: t('calendar.sessions.sessions') 
});
```

### Conditional Rendering
```typescript
const { t, isRussian } = useTranslation();

return (
  <div>
    {isRussian() && <RussianSpecificContent />}
    <h1>{t('students.title')}</h1>
  </div>
);
```

## 6. Language Switching Implementation

### Current Implementation ✅
```typescript
// components/ui/language-switcher.tsx
export function LanguageSwitcher({ variant = 'select' }) {
  const { getCurrentLanguage, changeLanguage } = useTranslation();
  
  return (
    <Select value={getCurrentLanguage()} onValueChange={changeLanguage}>
      {/* Language options */}
    </Select>
  );
}
```

### Best Practices
- Store language preference in localStorage
- Provide visual feedback during language switch
- Maintain user context during language change
- Test all UI elements after language switch

## 7. Testing Multi-Language Features

### Unit Testing
```typescript
// Test translation loading
import { renderHook } from '@testing-library/react';
import { useTranslation } from '@/lib/hooks/useTranslation';

test('should load English translations', () => {
  const { result } = renderHook(() => useTranslation());
  expect(result.current.t('students.title')).toBe('Students');
});
```

### Integration Testing
```typescript
// Test language switching
test('should switch to Russian', async () => {
  const { result } = renderHook(() => useTranslation());
  
  act(() => {
    result.current.changeLanguage('ru');
  });
  
  expect(result.current.getCurrentLanguage()).toBe('ru');
  expect(result.current.t('students.title')).toBe('Студенты');
});
```

## 8. Performance Considerations

### Lazy Loading Translations
```typescript
// For large apps, consider lazy loading
const loadTranslations = async (language: string) => {
  const translations = await import(`./locales/${language}.json`);
  return translations.default;
};
```

### Bundle Size Optimization
- Keep translation files separate from main bundle
- Use dynamic imports for non-critical languages
- Consider translation service for large-scale apps

## 9. Common Pitfalls to Avoid

### ❌ Hardcoded Strings
```typescript
// Bad
return <h1>Students</h1>;

// Good
return <h1>{t('students.title')}</h1>;
```

### ❌ Missing Fallbacks
```typescript
// Bad - no fallback
const text = t('nonexistent.key');

// Good - with fallback
const text = t('nonexistent.key', 'Default text');
```

### ❌ Inconsistent Key Structure
```typescript
// Bad - inconsistent naming
"studentName"
"student_name"
"StudentName"

// Good - consistent camelCase
"studentName"
```

## 10. Advanced Features

### Date/Time Localization
```typescript
// Use Intl API for date formatting
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat(getCurrentLanguage(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};
```

### Number Formatting
```typescript
// Localized number formatting
const formatNumber = (num: number) => {
  return new Intl.NumberFormat(getCurrentLanguage()).format(num);
};
```

### RTL Support (Future)
```typescript
// For Arabic/Hebrew support
const isRTL = () => getCurrentLanguage() === 'ar' || getCurrentLanguage() === 'he';
```

## 11. Maintenance Guidelines

### Regular Tasks
- [ ] Review unused translation keys
- [ ] Update translations when UI changes
- [ ] Test all languages after major updates
- [ ] Validate translation completeness
- [ ] Check for missing pluralization

### Quality Assurance
- [ ] Native speaker review
- [ ] Context validation
- [ ] UI layout testing in all languages
- [ ] Performance testing with translations

## 12. Tools and Resources

### Development Tools
- **i18next-browser-languagedetector** - Auto language detection
- **react-i18next** - React integration
- **TypeScript** - Type safety
- **ESLint i18n plugin** - Detect hardcoded strings

### Translation Management
- Consider tools like Lokalise, Crowdin, or Phrase for larger projects
- Use translation memory for consistency
- Implement translation validation in CI/CD

## Conclusion

Your current implementation already follows many best practices. The key areas for improvement are:

1. **Type Safety** - Enhanced TypeScript support (✅ Implemented)
2. **Testing** - Comprehensive test coverage
3. **Documentation** - Keep this guide updated
4. **Validation** - Automated translation completeness checks
5. **Performance** - Monitor bundle size impact

Your multi-language setup is solid and production-ready! 🎉
