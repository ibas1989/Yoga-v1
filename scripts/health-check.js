#!/usr/bin/env node

const http = require('http');

const endpoints = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/sw.js'
];

const checkEndpoint = (url) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${url}`, (res) => {
      resolve({
        url,
        status: res.statusCode,
        success: res.statusCode === 200
      });
    });
    
    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        success: false,
        error: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        success: false,
        error: 'Request timeout'
      });
    });
  });
};

const runHealthCheck = async () => {
  console.log('🔍 Running health check on localhost:3000...\n');
  
  const results = await Promise.all(
    endpoints.map(checkEndpoint)
  );
  
  let allPassed = true;
  
  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.url} - ${result.status}`);
    if (!result.success) {
      allPassed = false;
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  });
  
  console.log(`\n${allPassed ? '🎉 All endpoints are healthy!' : '⚠️  Some endpoints have issues.'}`);
  
  if (!allPassed) {
    process.exit(1);
  }
};

runHealthCheck().catch(console.error);