#!/usr/bin/env node

/**
 * Auto-Validation Script
 * 
 * This script automatically runs comprehensive validation after any changes.
 * It's designed to be called automatically by the AI assistant after making changes.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Run a command and return success status
 */
function runCommand(command, description) {
  try {
    logInfo(`Running: ${description}`);
    execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    logSuccess(`${description} - PASSED`);
    return true;
  } catch (error) {
    logError(`${description} - FAILED`);
    console.log(error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Check if files were modified recently
 */
function checkRecentChanges() {
  try {
    // Check git status for modified files
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
      logInfo('Recent changes detected - running validation');
      return true;
    } else {
      logInfo('No recent changes detected');
      return false;
    }
  } catch (error) {
    logWarning('Could not check git status - proceeding with validation');
    return true;
  }
}

/**
 * Test application runtime
 */
async function testApplicationRuntime() {
  log('\n🔍 Runtime Application Test');
  
  try {
    // Test if dev server is running
    const response = await fetch('http://localhost:3001/');
    if (response.ok) {
      logSuccess('Application is running - OK');
      return true;
    } else {
      logError(`Application returned ${response.status} - FAILED`);
      return false;
    }
  } catch (error) {
    logError(`Application runtime test failed: ${error.message}`);
    logWarning('Make sure the dev server is running: npm run dev');
    return false;
  }
}

/**
 * Test critical routes
 */
async function testCriticalRoutes() {
  log('\n🔍 Critical Routes Test');
  
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/?view=calendar', name: 'Calendar' },
    { path: '/?view=students', name: 'Students' },
    { path: '/?view=tasks', name: 'Tasks' }
  ];
  
  let allRoutesPassed = true;
  
  for (const route of routes) {
    try {
      const response = await fetch(`http://localhost:3001${route.path}`);
      if (response.ok) {
        logSuccess(`${route.name} route - OK`);
      } else {
        logError(`${route.name} route - FAILED (${response.status})`);
        allRoutesPassed = false;
      }
    } catch (error) {
      logError(`${route.name} route - ERROR: ${error.message}`);
      allRoutesPassed = false;
    }
  }
  
  return allRoutesPassed;
}

/**
 * Run comprehensive validation
 */
async function runAutoValidation() {
  log('🤖 Starting Auto-Validation', 'magenta');
  log('This runs automatically after any changes', 'blue');
  
  let allChecksPassed = true;
  
  // Check if there are recent changes
  const hasChanges = checkRecentChanges();
  
  // 1. TypeScript Check
  log('\n🔍 TypeScript Compilation Check');
  if (!runCommand('npx tsc --noEmit', 'TypeScript compilation')) {
    allChecksPassed = false;
  }
  
  // 2. Linting Check (with warnings allowed)
  log('\n🔍 Code Quality Check');
  try {
    execSync('npm run lint', { stdio: 'pipe', encoding: 'utf8' });
    logSuccess('ESLint - PASSED');
  } catch (error) {
    logWarning('ESLint - WARNINGS (continuing)');
  }
  
  // 3. Build Check
  log('\n🔍 Build Process Check');
  try {
    execSync('npm run build', { stdio: 'pipe', encoding: 'utf8' });
    logSuccess('Build process - PASSED');
  } catch (error) {
    const output = error.stdout?.toString() || error.message;
    if (output.includes('✓ Compiled successfully')) {
      logSuccess('Build process - PASSED (with linting warnings)');
    } else {
      logError('Build process - FAILED');
      console.log(output);
      allChecksPassed = false;
    }
  }
  
  // 4. Critical Files Check
  log('\n🔍 Critical Files Check');
  const criticalFiles = [
    'app/layout.tsx',
    'app/page.tsx',
    'components/Calendar.tsx',
    'components/StudentsView.tsx',
    'components/TasksView.tsx',
    'lib/storage.ts',
    'lib/types.ts'
  ];
  
  for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
      logSuccess(`File exists: ${file}`);
    } else {
      logError(`Missing file: ${file}`);
      allChecksPassed = false;
    }
  }
  
  // 5. Component Integrity Check
  log('\n🔍 Component Integrity Check');
  const components = [
    'components/CompleteSessionDialog.tsx',
    'components/AddStudentDialog.tsx',
    'components/SessionDialog.tsx'
  ];
  
  for (const component of components) {
    if (fs.existsSync(component)) {
      try {
        const content = fs.readFileSync(component, 'utf8');
        if (content.includes('export') && content.includes('function')) {
          logSuccess(`Component OK: ${component}`);
        } else {
          logWarning(`Component may have issues: ${component}`);
        }
      } catch (error) {
        logError(`Error reading component ${component}: ${error.message}`);
        allChecksPassed = false;
      }
    } else {
      logError(`Missing component: ${component}`);
      allChecksPassed = false;
    }
  }
  
  // 6. Dialog State Management Check
  log('\n🔍 Dialog State Management Check');
  if (fs.existsSync('components/CompleteSessionDialog.tsx')) {
    const content = fs.readFileSync('components/CompleteSessionDialog.tsx', 'utf8');
    if (content.includes('onOpenChange') && content.includes('showAddStudentDialog')) {
      logSuccess('Dialog state management - OK');
    } else {
      logWarning('Dialog state management - May need attention');
    }
  }
  
  // 7. Navigation Consistency Check
  log('\n🔍 Navigation Consistency Check');
  const navFiles = [
    'app/sessions/[id]/page.tsx',
    'app/sessions/[id]/edit/page.tsx',
    'app/sessions/new/page.tsx'
  ];
  
  for (const file of navFiles) {
    if (fs.existsSync(file)) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('returnTo') && content.includes('router.push')) {
          logSuccess(`Navigation OK: ${file}`);
        } else {
          logWarning(`Navigation may be inconsistent: ${file}`);
        }
      } catch (error) {
        logError(`Error checking navigation in ${file}: ${error.message}`);
        allChecksPassed = false;
      }
    }
  }
  
  // 8. Runtime Application Test (CRITICAL)
  log('\n🔍 Runtime Application Test');
  const runtimeTest = await testApplicationRuntime();
  if (!runtimeTest) {
    allChecksPassed = false;
    logError('CRITICAL: Application is not running properly!');
    logWarning('This is exactly the kind of issue that should be caught!');
  }
  
  // 9. Critical Routes Test (CRITICAL)
  const routesTest = await testCriticalRoutes();
  if (!routesTest) {
    allChecksPassed = false;
    logError('CRITICAL: Critical routes are failing!');
    logWarning('This indicates serious runtime issues!');
  }
  
  // Final Result
  console.log('\n' + '='.repeat(60));
  if (allChecksPassed) {
    log('🎉 Auto-Validation PASSED!', 'green');
    log('✅ All changes are safe', 'green');
    log('✅ Ready for deployment', 'green');
    return true;
  } else {
    log('💥 Auto-Validation FAILED!', 'red');
    log('❌ Issues detected that need attention', 'red');
    log('🔧 Please fix issues before proceeding', 'yellow');
    return false;
  }
}

// Run auto-validation
runAutoValidation().then(success => {
  if (success) {
    log('\n🎯 Next Steps:', 'cyan');
    log('1. Changes are validated and safe', 'green');
    log('2. You can proceed with confidence', 'green');
    log('3. Run "npm run deploy" when ready', 'blue');
    process.exit(0);
  } else {
    log('\n🚨 Action Required:', 'red');
    log('1. Fix the reported issues', 'yellow');
    log('2. Run this validation again', 'yellow');
    log('3. Only proceed when all checks pass', 'red');
    process.exit(1);
  }
}).catch(error => {
  logError(`Auto-validation failed: ${error.message}`);
  process.exit(1);
});
