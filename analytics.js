// Scroll position analytics for sticky scroll extension
class ScrollAnalytics {
  constructor() {
    this.sessionData = {
      scrollEvents: 0,
      totalScrollDistance: 0,
      maxScrollPosition: 0,
      sessionStart: Date.now(),
      domains: new Set()
    };
    this.lastScrollPosition = 0;
    this.throttleDelay = 100;
    this.lastThrottledTime = 0;
  }

  trackScroll(scrollY, domain) {
    const now = Date.now();
    if (now - this.lastThrottledTime < this.throttleDelay) return;
    
    this.lastThrottledTime = now;
    this.sessionData.scrollEvents++;
    this.sessionData.domains.add(domain);
    
    const scrollDelta = Math.abs(scrollY - this.lastScrollPosition);
    this.sessionData.totalScrollDistance += scrollDelta;
    this.sessionData.maxScrollPosition = Math.max(this.sessionData.maxScrollPosition, scrollY);
    
    this.lastScrollPosition = scrollY;
    
    // Send to background script for aggregation
    chrome.runtime.sendMessage({
      type: 'SCROLL_ANALYTICS',
      data: {
        scrollY,
        domain,
        delta: scrollDelta,
        timestamp: now
      }
    });
  }

  getSessionSummary() {
    const duration = Date.now() - this.sessionData.sessionStart;
    return {
      ...this.sessionData,
      domains: Array.from(this.sessionData.domains),
      sessionDuration: duration,
      avgScrollsPerMinute: this.sessionData.scrollEvents / (duration / 60000)
    };
  }
}

// Initialize analytics
const scrollAnalytics = new ScrollAnalytics();

// Track scroll events
window.addEventListener('scroll', () => {
  const domain = window.location.hostname;
  scrollAnalytics.trackScroll(window.scrollY, domain);
});

// Export for testing
if (typeof module !== 'undefined') {
  module.exports = ScrollAnalytics;
}