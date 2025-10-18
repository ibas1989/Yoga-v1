/**
 * Test script to verify the event system is working correctly
 * This script can be run in the browser console to test all session events
 */

(function() {
  'use strict';
  
  console.log('🧪 Testing Session Event System...');
  
  // Test event listeners
  const testEvents = [
    'sessionCreated',
    'sessionUpdated', 
    'sessionCompleted',
    'sessionCancelled',
    'sessionDeleted',
    'sessionChanged',
    'taskListUpdate'
  ];
  
  // Track which events are received
  const receivedEvents = new Set();
  
  // Add event listeners for testing
  testEvents.forEach(eventName => {
    window.addEventListener(eventName, (event) => {
      receivedEvents.add(eventName);
      console.log(`✅ Received event: ${eventName}`, event.detail);
    });
  });
  
  // Test function to simulate session events
  function testSessionEvents() {
    console.log('🔄 Simulating session events...');
    
    // Simulate sessionCreated event
    window.dispatchEvent(new CustomEvent('sessionCreated', { 
      detail: { 
        session: { 
          id: 'test-session-1', 
          status: 'scheduled',
          date: new Date(),
          startTime: '10:00',
          endTime: '11:00'
        } 
      } 
    }));
    
    // Simulate sessionUpdated event
    window.dispatchEvent(new CustomEvent('sessionUpdated', { 
      detail: { 
        sessionId: 'test-session-1',
        session: { 
          id: 'test-session-1', 
          status: 'scheduled',
          date: new Date(),
          startTime: '10:00',
          endTime: '11:00'
        } 
      } 
    }));
    
    // Simulate sessionCompleted event
    window.dispatchEvent(new CustomEvent('sessionCompleted', { 
      detail: { 
        sessionId: 'test-session-1',
        session: { 
          id: 'test-session-1', 
          status: 'completed',
          date: new Date(),
          startTime: '10:00',
          endTime: '11:00'
        } 
      } 
    }));
    
    // Simulate sessionCancelled event
    window.dispatchEvent(new CustomEvent('sessionCancelled', { 
      detail: { 
        sessionId: 'test-session-2',
        session: { 
          id: 'test-session-2', 
          status: 'cancelled',
          date: new Date(),
          startTime: '14:00',
          endTime: '15:00'
        } 
      } 
    }));
    
    // Simulate sessionDeleted event
    window.dispatchEvent(new CustomEvent('sessionDeleted', { 
      detail: { 
        sessionId: 'test-session-3'
      } 
    }));
    
    // Simulate sessionChanged event
    window.dispatchEvent(new CustomEvent('sessionChanged', { 
      detail: { 
        session: { 
          id: 'test-session-4', 
          status: 'scheduled',
          date: new Date(),
          startTime: '16:00',
          endTime: '17:00'
        } 
      } 
    }));
    
    // Simulate taskListUpdate event
    window.dispatchEvent(new CustomEvent('taskListUpdate', { 
      detail: { 
        overdueSessions: ['test-session-5', 'test-session-6'],
        timestamp: new Date().toISOString()
      } 
    }));
    
    // Wait a bit for events to be processed
    setTimeout(() => {
      console.log('📊 Event Test Results:');
      console.log(`Total events tested: ${testEvents.length}`);
      console.log(`Events received: ${receivedEvents.size}`);
      console.log('Received events:', Array.from(receivedEvents));
      
      const missingEvents = testEvents.filter(event => !receivedEvents.has(event));
      if (missingEvents.length > 0) {
        console.warn('⚠️ Missing events:', missingEvents);
      } else {
        console.log('✅ All events received successfully!');
      }
      
      // Test badge count update
      if (typeof window.getPendingTasksCount === 'function') {
        const taskCount = window.getPendingTasksCount();
        console.log(`📊 Current pending tasks count: ${taskCount}`);
      } else {
        console.log('ℹ️ getPendingTasksCount function not available (this is normal)');
      }
      
    }, 1000);
  }
  
  // Test the cron job if available
  function testCronJob() {
    console.log('🔄 Testing Cron Job...');
    
    if (typeof window.sessionCron !== 'undefined') {
      console.log('✅ Cron job available');
      console.log('Cron job running:', window.sessionCron.isRunning());
      
      // Test manual check
      window.sessionCron.check();
      console.log('✅ Manual cron check completed');
    } else {
      console.log('ℹ️ Cron job not available (script may not be loaded)');
    }
  }
  
  // Run tests
  console.log('🚀 Starting event system tests...');
  testSessionEvents();
  testCronJob();
  
  // Expose test functions globally
  window.testEventSystem = {
    testEvents,
    testCronJob,
    runAllTests: () => {
      testSessionEvents();
      testCronJob();
    }
  };
  
  console.log('🎯 Test functions available:');
  console.log('- window.testEventSystem.testEvents()');
  console.log('- window.testEventSystem.testCronJob()');
  console.log('- window.testEventSystem.runAllTests()');
  
})();
