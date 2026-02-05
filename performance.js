// Performance monitoring for sticky scroll operations

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      scrollEvents: 0,
      processingTime: [],
      memoryUsage: [],
      lastCleanup: Date.now()
    };
    this.observers = new Map();
    this.startMonitoring();
  }

  startMonitoring() {
    // Track scroll event frequency
    this.trackScrollEvents();
    
    // Monitor memory usage every 30 seconds
    setInterval(() => this.collectMemoryMetrics(), 30000);
    
    // Cleanup old metrics every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  trackScrollEvents() {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    const self = this;
    
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      if (type === 'scroll') {
        const wrappedListener = function(event) {
          const start = performance.now();
          self.metrics.scrollEvents++;
          
          const result = listener.call(this, event);
          
          const duration = performance.now() - start;
          self.recordProcessingTime(duration);
          
          return result;
        };
        
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  recordProcessingTime(duration) {
    this.metrics.processingTime.push({
      duration,
      timestamp: Date.now()
    });
  }

  collectMemoryMetrics() {
    if (performance.memory) {
      this.metrics.memoryUsage.push({
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        timestamp: Date.now()
      });
    }
  }

  getMetrics() {
    const now = Date.now();
    const recentProcessingTimes = this.metrics.processingTime
      .filter(m => now - m.timestamp < 60000); // Last minute
    
    return {
      scrollEventsPerMinute: this.metrics.scrollEvents,
      avgProcessingTime: recentProcessingTimes.length > 0 
        ? recentProcessingTimes.reduce((sum, m) => sum + m.duration, 0) / recentProcessingTimes.length
        : 0,
      currentMemoryUsage: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] || null,
      timestamp: now
    };
  }

  cleanup() {
    const cutoff = Date.now() - 300000; // Keep last 5 minutes
    this.metrics.processingTime = this.metrics.processingTime.filter(m => m.timestamp > cutoff);
    this.metrics.memoryUsage = this.metrics.memoryUsage.filter(m => m.timestamp > cutoff);
    this.metrics.scrollEvents = 0; // Reset counter
    this.metrics.lastCleanup = Date.now();
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
} else {
  window.PerformanceMonitor = PerformanceMonitor;
}