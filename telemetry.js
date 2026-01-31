// Basic telemetry collection for sticky scroll usage
class TelemetryCollector {
  constructor() {
    this.endpoint = 'http://localhost:3001/api/telemetry';
    this.batchSize = 10;
    this.events = [];
  }

  trackScrollStick(url, duration) {
    const event = {
      type: 'scroll_stick',
      timestamp: Date.now(),
      url: new URL(url).hostname,
      duration_ms: duration,
      user_agent: navigator.userAgent.substring(0, 100)
    };
    
    this.events.push(event);
    
    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.events.length === 0) return;
    
    const payload = {
      events: [...this.events],
      client_id: await this.getClientId()
    };
    
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      this.events = [];
    } catch (error) {
      console.warn('Telemetry upload failed:', error.message);
    }
  }

  async getClientId() {
    const result = await chrome.storage.local.get(['clientId']);
    if (result.clientId) return result.clientId;
    
    const clientId = crypto.randomUUID();
    await chrome.storage.local.set({ clientId });
    return clientId;
  }
}

const telemetry = new TelemetryCollector();

// Auto-flush on page unload
window.addEventListener('beforeunload', () => telemetry.flush());

if (typeof module !== 'undefined') {
  module.exports = { TelemetryCollector };
}