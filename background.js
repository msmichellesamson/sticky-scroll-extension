// Background service worker for Chrome extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      enabled: true,
      sensitivity: 0.5,
      debug: false
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'PERFORMANCE_METRIC') {
    // Store performance metrics
    const metric = {
      timestamp: Date.now(),
      url: sender.tab?.url,
      scrollDistance: request.data.scrollDistance,
      timeSpent: request.data.timeSpent,
      elementsStuck: request.data.elementsStuck
    };
    
    // Store in local storage (limited retention)
    chrome.storage.local.get(['metrics'], (result) => {
      const metrics = result.metrics || [];
      metrics.push(metric);
      
      // Keep only last 100 metrics
      if (metrics.length > 100) {
        metrics.shift();
      }
      
      chrome.storage.local.set({ metrics });
    });
    
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Cleanup old metrics daily
chrome.alarms.create('cleanup-metrics', { delayInMinutes: 1440, periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup-metrics') {
    const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    chrome.storage.local.get(['metrics'], (result) => {
      const metrics = result.metrics || [];
      const filtered = metrics.filter(m => m.timestamp > weekAgo);
      chrome.storage.local.set({ metrics: filtered });
    });
  }
});