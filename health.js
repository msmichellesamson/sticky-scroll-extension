// Extension Health Monitor
class ExtensionHealth {
  constructor() {
    this.startTime = Date.now();
    this.errorCount = 0;
    this.lastError = null;
    this.setupErrorTracking();
  }

  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.errorCount++;
      this.lastError = {
        message: event.message,
        timestamp: Date.now(),
        source: event.filename
      };
    });
  }

  getHealthStatus() {
    const uptime = Date.now() - this.startTime;
    const status = {
      healthy: this.errorCount < 10,
      uptime: uptime,
      errorCount: this.errorCount,
      lastError: this.lastError,
      version: chrome.runtime.getManifest().version,
      timestamp: Date.now()
    };

    return status;
  }

  // Expose health endpoint for monitoring
  async reportHealth() {
    const health = this.getHealthStatus();
    
    // Store in local storage for popup access
    try {
      await chrome.storage.local.set({ 'extension_health': health });
    } catch (error) {
      console.error('Failed to store health data:', error);
    }

    return health;
  }

  // Reset error counters
  reset() {
    this.errorCount = 0;
    this.lastError = null;
  }
}

// Initialize health monitor
const healthMonitor = new ExtensionHealth();

// Report health every 30 seconds
setInterval(() => {
  healthMonitor.reportHealth();
}, 30000);

// Export for other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExtensionHealth;
}