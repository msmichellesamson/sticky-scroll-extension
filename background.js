// Enhanced background script with proper error handling and logging

class ExtensionLogger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data) : null
    };
    
    console[level](`[StickyScroll] ${timestamp}: ${message}`, data || '');
    
    // Store recent logs for debugging
    chrome.storage.local.get(['extensionLogs'], (result) => {
      const logs = result.extensionLogs || [];
      logs.push(logEntry);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      chrome.storage.local.set({ extensionLogs: logs });
    });
  }
  
  static error(message, error = null) {
    this.log('error', message, error ? { 
      name: error.name, 
      message: error.message, 
      stack: error.stack 
    } : null);
  }
  
  static warn(message, data = null) {
    this.log('warn', message, data);
  }
  
  static info(message, data = null) {
    this.log('info', message, data);
  }
}

// Extension lifecycle management
chrome.runtime.onInstalled.addListener((details) => {
  try {
    ExtensionLogger.info('Extension installed/updated', { 
      reason: details.reason,
      version: chrome.runtime.getManifest().version 
    });
    
    // Initialize default settings on fresh install
    if (details.reason === 'install') {
      chrome.storage.sync.set({
        stickyScrollEnabled: true,
        scrollSensitivity: 'medium',
        enabledDomains: []
      }, () => {
        if (chrome.runtime.lastError) {
          ExtensionLogger.error('Failed to initialize settings', chrome.runtime.lastError);
        } else {
          ExtensionLogger.info('Default settings initialized');
        }
      });
    }
  } catch (error) {
    ExtensionLogger.error('Error during extension installation', error);
  }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  try {
    ExtensionLogger.info('Extension started');
  } catch (error) {
    ExtensionLogger.error('Error during extension startup', error);
  }
});

// Handle messages from content scripts with error boundaries
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    ExtensionLogger.info('Message received', { type: request.type, tabId: sender.tab?.id });
    
    switch (request.type) {
      case 'getSettings':
        chrome.storage.sync.get(['stickyScrollEnabled', 'scrollSensitivity'], (result) => {
          if (chrome.runtime.lastError) {
            ExtensionLogger.error('Failed to get settings', chrome.runtime.lastError);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse(result);
          }
        });
        return true; // Async response
        
      case 'reportError':
        ExtensionLogger.error('Content script error', request.error);
        sendResponse({ received: true });
        break;
        
      default:
        ExtensionLogger.warn('Unknown message type', { type: request.type });
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (error) {
    ExtensionLogger.error('Error handling message', error);
    sendResponse({ error: 'Internal error' });
  }
});

// Global error handler
self.addEventListener('error', (event) => {
  ExtensionLogger.error('Unhandled error in background script', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

self.addEventListener('unhandledrejection', (event) => {
  ExtensionLogger.error('Unhandled promise rejection', {
    reason: event.reason?.toString() || 'Unknown rejection'
  });
});