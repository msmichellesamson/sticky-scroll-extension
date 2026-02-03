class CircuitBreaker {
  constructor(threshold = 5, timeout = 30000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failures = 0;
    this.lastFailTime = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  recordFailure() {
    this.failures++;
    this.lastFailTime = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
}

const analyticsBreaker = new CircuitBreaker(3, 60000);

export async function trackEvent(event, data = {}) {
  try {
    await analyticsBreaker.call(async () => {
      const response = await fetch('https://api.analytics.com/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, timestamp: Date.now() })
      });
      
      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
    });
  } catch (error) {
    console.warn('Analytics tracking failed:', error.message);
    // Store locally for retry
    await storeFailedEvent(event, data);
  }
}

async function storeFailedEvent(event, data) {
  const failed = await chrome.storage.local.get('failedEvents') || { failedEvents: [] };
  failed.failedEvents.push({ event, data, timestamp: Date.now() });
  await chrome.storage.local.set({ failedEvents: failed.failedEvents.slice(-50) });
}