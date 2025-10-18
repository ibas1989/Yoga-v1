#!/usr/bin/env node

/**
 * Health Check Script
 * 
 * This script monitors the application health after deployment:
 * 1. Checks critical routes
 * 2. Validates component functionality
 * 3. Tests navigation flows
 * 4. Monitors for common issues
 */

const http = require('http');
const https = require('https');

// Configuration
const BASE_URL = process.env.VERCEL_URL || process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const USE_HTTPS = BASE_URL.startsWith('https://');
const client = USE_HTTPS ? https : http;

// Critical routes to monitor
const CRITICAL_ROUTES = [
  { path: '/', name: 'Home Page' },
  { path: '/?view=calendar', name: 'Calendar View' },
  { path: '/?view=students', name: 'Students View' },
  { path: '/?view=tasks', name: 'Tasks View' },
  { path: '/?view=settings', name: 'Settings View' },
  { path: '/sessions/new', name: 'New Session' },
  { path: '/students/new', name: 'New Student' }
];

// Navigation flow tests
const NAVIGATION_FLOWS = [
  {
    name: 'Session Creation Flow',
    steps: [
      { path: '/sessions/new', expectedStatus: 200 },
      { path: '/?view=calendar', expectedStatus: 200 }
    ]
  },
  {
    name: 'Student Management Flow', 
    steps: [
      { path: '/students/new', expectedStatus: 200 },
      { path: '/?view=students', expectedStatus: 200 }
    ]
  },
  {
    name: 'Task Management Flow',
    steps: [
      { path: '/?view=tasks', expectedStatus: 200 },
      { path: '/?view=calendar', expectedStatus: 200 }
    ]
  }
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
 * Make HTTP request
 */
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${url}`;
    
    client.get(fullUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url: fullUrl,
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 500) // First 500 chars for analysis
        });
      });
    }).on('error', reject);
  });
}

/**
 * Test a single route
 */
async function testRoute(route) {
  try {
    const result = await makeRequest(route.path);
    
    if (result.status === 200) {
      logSuccess(`${route.name}: OK (${result.status})`);
      
      // Check for common issues in response
      if (result.data.includes('Error:') || result.data.includes('TypeError:')) {
        logWarning(`${route.name}: Contains error messages in response`);
      }
      
      if (result.data.includes('undefined') && result.data.includes('null')) {
        logWarning(`${route.name}: Contains undefined/null values`);
      }
      
      return { success: true, route: route.name };
    } else {
      logError(`${route.name}: FAILED (${result.status})`);
      return { success: false, route: route.name, status: result.status };
    }
  } catch (error) {
    logError(`${route.name}: ERROR - ${error.message}`);
    return { success: false, route: route.name, error: error.message };
  }
}

/**
 * Test navigation flow
 */
async function testNavigationFlow(flow) {
  logInfo(`Testing ${flow.name}...`);
  let allStepsPassed = true;
  
  for (const step of flow.steps) {
    try {
      const result = await makeRequest(step.path);
      if (result.status === step.expectedStatus) {
        logSuccess(`  ${step.path} - OK`);
      } else {
        logError(`  ${step.path} - Expected ${step.expectedStatus}, got ${result.status}`);
        allStepsPassed = false;
      }
    } catch (error) {
      logError(`  ${step.path} - ERROR: ${error.message}`);
      allStepsPassed = false;
    }
  }
  
  return allStepsPassed;
}

/**
 * Check for common deployment issues
 */
async function checkCommonIssues() {
  logInfo('Checking for common deployment issues...');
  let issuesFound = 0;
  
  try {
    // Test home page for common issues
    const homeResult = await makeRequest('/');
    
    // Check for hydration errors
    if (homeResult.data.includes('hydration') && homeResult.data.includes('error')) {
      logWarning('Potential hydration errors detected');
      issuesFound++;
    }
    
    // Check for missing components
    if (homeResult.data.includes('Cannot read properties of undefined')) {
      logWarning('Potential undefined component errors');
      issuesFound++;
    }
    
    // Check for navigation issues
    if (homeResult.data.includes('router.push') && homeResult.data.includes('undefined')) {
      logWarning('Potential navigation issues detected');
      issuesFound++;
    }
    
    if (issuesFound === 0) {
      logSuccess('No common deployment issues detected');
    } else {
      logWarning(`${issuesFound} potential issues detected`);
    }
    
  } catch (error) {
    logError(`Error checking common issues: ${error.message}`);
    return false;
  }
  
  return issuesFound === 0;
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  log('🏥 Starting Health Check', 'magenta');
  log(`Target: ${BASE_URL}`, 'blue');
  
  let allChecksPassed = true;
  
  // Test critical routes
  log('\n📄 Testing Critical Routes:');
  for (const route of CRITICAL_ROUTES) {
    const result = await testRoute(route);
    if (!result.success) {
      allChecksPassed = false;
    }
  }
  
  // Test navigation flows
  log('\n🧭 Testing Navigation Flows:');
  for (const flow of NAVIGATION_FLOWS) {
    const flowPassed = await testNavigationFlow(flow);
    if (!flowPassed) {
      allChecksPassed = false;
    }
  }
  
  // Check for common issues
  log('\n🔍 Checking for Common Issues:');
  const noIssues = await checkCommonIssues();
  if (!noIssues) {
    allChecksPassed = false;
  }
  
  // Final result
  console.log('\n' + '='.repeat(60));
  if (allChecksPassed) {
    log('🎉 Health Check PASSED!', 'green');
    log('✅ Application is healthy', 'green');
    process.exit(0);
  } else {
    log('💥 Health Check FAILED!', 'red');
    log('❌ Application has issues that need attention', 'red');
    process.exit(1);
  }
}

// Run health check
runHealthCheck().catch(error => {
  logError(`Health check failed: ${error.message}`);
  process.exit(1);
});
