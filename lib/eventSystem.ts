/**
 * Enhanced Event System for Session Management
 * Provides reliable event dispatching and listening with error handling
 */

// Event types for type safety
export type SessionEventType = 
  | 'sessionCreated'
  | 'sessionUpdated'
  | 'sessionCompleted'
  | 'sessionCancelled'
  | 'sessionDeleted'
  | 'sessionChanged'
  | 'taskListUpdate';

export interface SessionEventDetail {
  sessionId?: string;
  session?: any;
  message?: string;
  overdueCount?: number;
  overdueSessions?: string[];
  timestamp?: string;
}

/**
 * Enhanced event dispatcher with error handling and logging
 */
export function dispatchSessionEvent(
  eventType: SessionEventType, 
  detail: SessionEventDetail
): void {
  if (typeof window === 'undefined') {
    console.warn(`Cannot dispatch ${eventType} event: window is undefined`);
    return;
  }

  try {
    const event = new CustomEvent(eventType, { detail });
    window.dispatchEvent(event);
    
    // Log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`📡 Dispatched ${eventType} event:`, detail);
    }
  } catch (error) {
    console.error(`Failed to dispatch ${eventType} event:`, error);
  }
}

/**
 * Enhanced event listener with error handling
 */
export function addSessionEventListener(
  eventType: SessionEventType,
  handler: (event: CustomEvent) => void,
  options?: AddEventListenerOptions
): void {
  if (typeof window === 'undefined') {
    console.warn(`Cannot add ${eventType} listener: window is undefined`);
    return;
  }

  try {
    const wrappedHandler = (event: CustomEvent) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in ${eventType} event handler:`, error);
      }
    };

    window.addEventListener(eventType, wrappedHandler as EventListener, options);
  } catch (error) {
    console.error(`Failed to add ${eventType} listener:`, error);
  }
}

/**
 * Remove event listener with error handling
 */
export function removeSessionEventListener(
  eventType: SessionEventType,
  handler: (event: CustomEvent) => void
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.removeEventListener(eventType, handler as EventListener);
  } catch (error) {
    console.error(`Failed to remove ${eventType} listener:`, error);
  }
}

/**
 * Batch event listener for multiple session events
 */
export function addBatchSessionEventListeners(
  eventTypes: SessionEventType[],
  handler: (event: CustomEvent) => void,
  options?: AddEventListenerOptions
): () => void {
  const listeners: Array<{ eventType: SessionEventType; handler: (event: CustomEvent) => void }> = [];

  eventTypes.forEach(eventType => {
    addSessionEventListener(eventType, handler, options);
    listeners.push({ eventType, handler });
  });

  // Return cleanup function
  return () => {
    listeners.forEach(({ eventType, handler }) => {
      removeSessionEventListener(eventType, handler);
    });
  };
}

/**
 * Test the event system
 */
export function testEventSystem(): void {
  console.log('🧪 Testing Event System...');
  
  const testEvents: SessionEventType[] = [
    'sessionCreated',
    'sessionUpdated',
    'sessionCompleted',
    'sessionCancelled',
    'sessionDeleted',
    'sessionChanged',
    'taskListUpdate'
  ];

  const receivedEvents = new Set<SessionEventType>();

  // Add test listeners
  const cleanup = addBatchSessionEventListeners(testEvents, (event) => {
    receivedEvents.add(event.type as SessionEventType);
    console.log(`✅ Received ${event.type}:`, event.detail);
  });

  // Dispatch test events
  testEvents.forEach(eventType => {
    dispatchSessionEvent(eventType, { 
      sessionId: 'test-session',
      message: `Test ${eventType} event`,
      timestamp: new Date().toISOString()
    });
  });

  // Check results after a delay
  setTimeout(() => {
    console.log(`📊 Event Test Results: ${receivedEvents.size}/${testEvents.length} events received`);
    
    const missingEvents = testEvents.filter(event => !receivedEvents.has(event));
    if (missingEvents.length > 0) {
      console.warn('⚠️ Missing events:', missingEvents);
    } else {
      console.log('✅ All events working correctly!');
    }
    
    // Cleanup test listeners
    cleanup();
  }, 1000);
}

/**
 * Get event system status
 */
export function getEventSystemStatus(): {
  windowAvailable: boolean;
  eventTypes: SessionEventType[];
  testResults?: { received: number; total: number; missing: string[] };
} {
  return {
    windowAvailable: typeof window !== 'undefined',
    eventTypes: [
      'sessionCreated',
      'sessionUpdated', 
      'sessionCompleted',
      'sessionCancelled',
      'sessionDeleted',
      'sessionChanged',
      'taskListUpdate'
    ]
  };
}
