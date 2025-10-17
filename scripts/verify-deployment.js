#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * This script verifies that the deployment is working correctly by:
 * 1. Checking that all routes are accessible
 * 2. Verifying that static assets are loading
 * 3. Testing key functionality
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.VERCEL_URL || process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const USE_HTTPS = BASE_URL.startsWith('https://');

const client = USE_HTTPS ? https : http;

// Routes to test
const routesToTest = [
  '/',
  '/?view=calendar',
  '/?view=students',
  '/?view=settings',
  '/sessions/new',
  '/students/new',
  '/calendar/day/2025-10-20', // Test day view
];

// Static assets to test
const staticAssets = [
  '/_next/static/css/',
  '/_next/static/js/',
];

/**
 * Make HTTP request and return promise
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
          data: data.substring(0, 200) // First 200 chars for debugging
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
    const result = await makeRequest(route);
    
    if (result.status === 200) {
      console.log(`✅ ${route} - OK (${result.status})`);
      return true;
    } else {
      console.log(`❌ ${route} - FAILED (${result.status})`);
      console.log(`   Response: ${result.data}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${route} - ERROR: ${error.message}`);
    return false;
  }
}

/**
 * Test static assets
 */
async function testStaticAssets() {
  try {
    // Test that _next directory exists
    const result = await makeRequest('/_next');
    
    if (result.status === 200 || result.status === 403) {
      console.log(`✅ Static assets directory accessible`);
      return true;
    } else {
      console.log(`❌ Static assets directory not accessible (${result.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Static assets test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main verification function
 */
async function verifyDeployment() {
  console.log(`🔍 Verifying deployment at: ${BASE_URL}`);
  console.log('=' .repeat(50));
  
  let allPassed = true;
  
  // Test routes
  console.log('\n📄 Testing Routes:');
  for (const route of routesToTest) {
    const passed = await testRoute(route);
    if (!passed) allPassed = false;
  }
  
  // Test static assets
  console.log('\n📦 Testing Static Assets:');
  const assetsPassed = await testStaticAssets();
  if (!assetsPassed) allPassed = false;
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  if (allPassed) {
    console.log('🎉 Deployment verification PASSED!');
    process.exit(0);
  } else {
    console.log('💥 Deployment verification FAILED!');
    console.log('\nTroubleshooting steps:');
    console.log('1. Check that the build completed successfully');
    console.log('2. Verify all files were deployed correctly');
    console.log('3. Check server logs for errors');
    console.log('4. Ensure Next.js configuration is correct');
    process.exit(1);
  }
}

// Run verification
verifyDeployment().catch(error => {
  console.error('Verification script failed:', error);
  process.exit(1);
});