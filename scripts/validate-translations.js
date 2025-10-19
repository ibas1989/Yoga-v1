#!/usr/bin/env node

/**
 * Translation Validation Script
 * 
 * This script validates that all translation keys exist in both languages
 * and checks for common translation issues.
 */

const fs = require('fs');
const path = require('path');

// Load translation files
const enTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/i18n/en.json'), 'utf8'));
const ruTranslations = JSON.parse(fs.readFileSync(path.join(__dirname, '../lib/i18n/ru.json'), 'utf8'));

// Helper function to get all keys from nested object
function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], prefix ? `${prefix}.${key}` : key));
    } else {
      keys.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  
  return keys;
}

// Get all keys from both translation files
const enKeys = getAllKeys(enTranslations);
const ruKeys = getAllKeys(ruTranslations);

console.log('🔍 Translation Validation Report\n');

// Check for missing keys
const missingInRussian = enKeys.filter(key => !ruKeys.includes(key));
const missingInEnglish = ruKeys.filter(key => !enKeys.includes(key));

if (missingInRussian.length > 0) {
  console.log('❌ Missing in Russian translations:');
  missingInRussian.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

if (missingInEnglish.length > 0) {
  console.log('❌ Missing in English translations:');
  missingInEnglish.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

// Check for empty translations
function findEmptyTranslations(obj, prefix = '') {
  let emptyKeys = [];
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      emptyKeys = emptyKeys.concat(findEmptyTranslations(obj[key], prefix ? `${prefix}.${key}` : key));
    } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
      emptyKeys.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  
  return emptyKeys;
}

const emptyEnKeys = findEmptyTranslations(enTranslations);
const emptyRuKeys = findEmptyTranslations(ruTranslations);

if (emptyEnKeys.length > 0) {
  console.log('⚠️  Empty English translations:');
  emptyEnKeys.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

if (emptyRuKeys.length > 0) {
  console.log('⚠️  Empty Russian translations:');
  emptyRuKeys.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

// Check for potential hardcoded strings (basic check)
function findHardcodedStrings(obj, prefix = '') {
  let hardcodedKeys = [];
  
        // Common words that are legitimate translations
        const legitimateWords = ['session', 'sessions', 'day', 'days', 'save', 'cancel', 'edit', 'delete', 'add', 'remove', 'of', 'page', 'back', 'yes', 'no'];
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      hardcodedKeys = hardcodedKeys.concat(findHardcodedStrings(obj[key], prefix ? `${prefix}.${key}` : key));
    } else if (typeof obj[key] === 'string') {
      // Check for common hardcoded patterns
      const value = obj[key];
      const keyName = key.split('.').pop();
      
      // Skip if it's a legitimate word that could be the same in both languages
      if (legitimateWords.includes(keyName.toLowerCase())) {
        continue;
      }
      
      if (value === key || value === keyName) {
        hardcodedKeys.push(prefix ? `${prefix}.${key}` : key);
      }
    }
  }
  
  return hardcodedKeys;
}

const hardcodedEnKeys = findHardcodedStrings(enTranslations);
const hardcodedRuKeys = findHardcodedStrings(ruTranslations);

if (hardcodedEnKeys.length > 0) {
  console.log('⚠️  Potential hardcoded English translations:');
  hardcodedEnKeys.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

if (hardcodedRuKeys.length > 0) {
  console.log('⚠️  Potential hardcoded Russian translations:');
  hardcodedRuKeys.forEach(key => console.log(`   - ${key}`));
  console.log('');
}

// Summary
const totalKeys = Math.max(enKeys.length, ruKeys.length);
const missingKeys = missingInRussian.length + missingInEnglish.length;
const emptyKeys = emptyEnKeys.length + emptyRuKeys.length;
const hardcodedKeys = hardcodedEnKeys.length + hardcodedRuKeys.length;

console.log('📊 Summary:');
console.log(`   Total keys: ${totalKeys}`);
console.log(`   Missing keys: ${missingKeys}`);
console.log(`   Empty translations: ${emptyKeys}`);
console.log(`   Potential hardcoded: ${hardcodedKeys}`);

if (missingKeys === 0 && emptyKeys === 0 && hardcodedKeys === 0) {
  console.log('\n✅ All translations look good!');
  process.exit(0);
} else {
  console.log('\n❌ Translation issues found. Please fix them before deployment.');
  process.exit(1);
}
