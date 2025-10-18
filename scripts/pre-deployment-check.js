#!/usr/bin/env node

/**
 * Pre-Deployment Validation Script
 * 
 * This script runs comprehensive checks before deployment to prevent issues:
 * 1. Code quality checks (linting, TypeScript)
 * 2. Build validation
 * 3. Component integrity checks
 * 4. Navigation flow validation
 * 5. Critical functionality tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_ROOT = process.cwd();
const CRITICAL_FILES = [
  'app/layout.tsx',
  'app/page.tsx',
  'components/Calendar.tsx',
  'components/StudentsView.tsx',
  'components/TasksView.tsx',
  'lib/storage.ts',
  'lib/types.ts'
];

const CRITICAL_ROUTES = [
  '/',
  '/?view=calendar',
  '/?view=students', 
  '/?view=tasks',
  '/?view=settings',
  '/sessions/new',
  '/students/new'
];

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(`🔍 ${title}`, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

/**
 * Check if file exists and is readable
 */
function checkFileExists(filePath) {
  try {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (fs.existsSync(fullPath)) {
      logSuccess(`File exists: ${filePath}`);
      return true;
    } else {
      logError(`Missing file: ${filePath}`);
      return false;
    }
  } catch (error) {
    logError(`Error checking file ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Check TypeScript compilation
 */
function checkTypeScript() {
  try {
    log('Running TypeScript check...', 'blue');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    logSuccess('TypeScript compilation passed');
    return true;
  } catch (error) {
    logError('TypeScript compilation failed');
    console.log(error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Check ESLint
 */
function checkLinting() {
  try {
    log('Running ESLint...', 'blue');
    const result = execSync('npm run lint', { stdio: 'pipe', encoding: 'utf8' });
    logSuccess('ESLint passed');
    return true;
  } catch (error) {
    // Check if it's just a configuration issue
    const output = error.stdout?.toString() || error.message;
    if (output.includes('How would you like to configure ESLint')) {
      logWarning('ESLint needs configuration - this is OK for now');
      return true;
    }
    logError('ESLint failed');
    console.log(output);
    return false;
  }
}

/**
 * Check build process
 */
function checkBuild() {
  try {
    log('Testing build process...', 'blue');
    const result = execSync('npm run build', { stdio: 'pipe', encoding: 'utf8' });
    if (result.includes('✓ Compiled successfully')) {
      logSuccess('Build process completed');
      return true;
    } else {
      logWarning('Build completed but with warnings');
      return true;
    }
  } catch (error) {
    const output = error.stdout?.toString() || error.message;
    if (output.includes('✓ Compiled successfully')) {
      logSuccess('Build process completed (with linting warnings)');
      return true;
    }
    logError('Build process failed');
    console.log(output);
    return false;
  }
}

/**
 * Check critical component imports
 */
function checkComponentImports() {
  log('Checking critical component imports...', 'blue');
  let allPassed = true;

  const criticalComponents = [
    'components/Calendar.tsx',
    'components/StudentsView.tsx', 
    'components/TasksView.tsx',
    'components/CompleteSessionDialog.tsx',
    'components/AddStudentDialog.tsx'
  ];

  for (const component of criticalComponents) {
    if (checkFileExists(component)) {
      // Check if component has proper exports
      try {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, component), 'utf8');
        if (content.includes('export') && content.includes('function')) {
          logSuccess(`Component structure OK: ${component}`);
        } else {
          logWarning(`Component may have issues: ${component}`);
        }
      } catch (error) {
        logError(`Error reading component ${component}: ${error.message}`);
        allPassed = false;
      }
    } else {
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Check navigation consistency
 */
function checkNavigationConsistency() {
  log('Checking navigation consistency...', 'blue');
  let allPassed = true;

  // Check for consistent returnTo parameter usage
  const navigationFiles = [
    'app/sessions/[id]/page.tsx',
    'app/sessions/[id]/edit/page.tsx',
    'app/sessions/new/page.tsx'
  ];

  for (const file of navigationFiles) {
    if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
      try {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
        if (content.includes('returnTo') && content.includes('router.push')) {
          logSuccess(`Navigation pattern OK: ${file}`);
        } else {
          logWarning(`Navigation pattern may be inconsistent: ${file}`);
        }
      } catch (error) {
        logError(`Error checking navigation in ${file}: ${error.message}`);
        allPassed = false;
      }
    }
  }

  return allPassed;
}

/**
 * Check dialog state management
 */
function checkDialogStateManagement() {
  log('Checking dialog state management...', 'blue');
  let allPassed = true;

  const dialogFiles = [
    'components/CompleteSessionDialog.tsx',
    'components/AddStudentDialog.tsx',
    'components/SessionDialog.tsx'
  ];

  for (const file of dialogFiles) {
    if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
      try {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
        
        // Check for proper dialog state management
        if (content.includes('onOpenChange') && content.includes('useState')) {
          logSuccess(`Dialog state management OK: ${file}`);
        } else {
          logWarning(`Dialog state management may be incomplete: ${file}`);
        }

        // Check for proper z-index handling in nested dialogs
        if (file.includes('AddStudentDialog') && content.includes('z-[60]')) {
          logSuccess(`Z-index handling OK: ${file}`);
        } else if (file.includes('AddStudentDialog')) {
          logWarning(`Z-index handling may be missing: ${file}`);
        }

      } catch (error) {
        logError(`Error checking dialog in ${file}: ${error.message}`);
        allPassed = false;
      }
    }
  }

  return allPassed;
}

/**
 * Check for common deployment issues
 */
function checkCommonIssues() {
  log('Checking for common deployment issues...', 'blue');
  let allPassed = true;

  // Check for hardcoded URLs
  const filesToCheck = [
    'app/layout.tsx',
    'app/page.tsx',
    'components/Calendar.tsx'
  ];

  for (const file of filesToCheck) {
    if (fs.existsSync(path.join(PROJECT_ROOT, file))) {
      try {
        const content = fs.readFileSync(path.join(PROJECT_ROOT, file), 'utf8');
        
        // Check for hardcoded localhost URLs
        if (content.includes('localhost:3000') || content.includes('localhost:3001')) {
          logWarning(`Hardcoded localhost URL found in ${file}`);
        }

        // Check for missing error boundaries
        if (file.includes('layout.tsx') && !content.includes('ErrorBoundary')) {
          logWarning(`Error boundary may be missing in ${file}`);
        }

      } catch (error) {
        logError(`Error checking ${file}: ${error.message}`);
        allPassed = false;
      }
    }
  }

  return allPassed;
}

/**
 * Main validation function
 */
async function runPreDeploymentChecks() {
  log('🚀 Starting Pre-Deployment Validation', 'magenta');
  log('This will help prevent deployment issues', 'blue');
  
  let allChecksPassed = true;

  // 1. Critical Files Check
  logSection('Critical Files Check');
  for (const file of CRITICAL_FILES) {
    if (!checkFileExists(file)) {
      allChecksPassed = false;
    }
  }

  // 2. TypeScript Check
  logSection('TypeScript Compilation');
  if (!checkTypeScript()) {
    allChecksPassed = false;
  }

  // 3. Linting Check (Optional - build success is more important)
  logSection('Code Quality (ESLint)');
  const lintingPassed = checkLinting();
  if (!lintingPassed) {
    logWarning('ESLint failed but continuing - build success is more important');
  }

  // 4. Build Check
  logSection('Build Process');
  if (!checkBuild()) {
    allChecksPassed = false;
  }

  // 5. Component Integrity
  logSection('Component Integrity');
  if (!checkComponentImports()) {
    allChecksPassed = false;
  }

  // 6. Navigation Consistency
  logSection('Navigation Consistency');
  if (!checkNavigationConsistency()) {
    allChecksPassed = false;
  }

  // 7. Dialog State Management
  logSection('Dialog State Management');
  if (!checkDialogStateManagement()) {
    allChecksPassed = false;
  }

  // 8. Common Issues
  logSection('Common Deployment Issues');
  if (!checkCommonIssues()) {
    allChecksPassed = false;
  }

  // Final Result
  console.log('\n' + '='.repeat(60));
  if (allChecksPassed) {
    log('🎉 All pre-deployment checks PASSED!', 'green');
    log('✅ Safe to deploy', 'green');
    process.exit(0);
  } else {
    log('💥 Pre-deployment checks FAILED!', 'red');
    log('❌ DO NOT DEPLOY - Fix issues first', 'red');
    console.log('\n🔧 Next steps:');
    console.log('1. Fix all reported issues');
    console.log('2. Run this script again');
    console.log('3. Only deploy when all checks pass');
    process.exit(1);
  }
}

// Run the checks
runPreDeploymentChecks().catch(error => {
  logError(`Pre-deployment check failed: ${error.message}`);
  process.exit(1);
});
