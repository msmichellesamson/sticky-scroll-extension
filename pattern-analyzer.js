class ScrollPatternAnalyzer {
  constructor() {
    this.patterns = new Map();
    this.sessionData = [];
    this.apiEndpoint = 'https://api.scrollpatterns.dev/v1/patterns';
  }

  trackScrollPattern(url, scrollData) {
    const pattern = {
      url: this.normalizeUrl(url),
      velocity: scrollData.velocity,
      direction: scrollData.direction,
      timestamp: Date.now(),
      sessionId: this.getSessionId()
    };
    
    this.sessionData.push(pattern);
    this.analyzePattern(pattern);
  }

  analyzePattern(pattern) {
    const key = `${pattern.url}_${pattern.direction}`;
    if (!this.patterns.has(key)) {
      this.patterns.set(key, { count: 0, avgVelocity: 0, samples: [] });
    }
    
    const existing = this.patterns.get(key);
    existing.samples.push(pattern.velocity);
    existing.count++;
    existing.avgVelocity = existing.samples.reduce((a, b) => a + b) / existing.samples.length;
    
    if (existing.count % 10 === 0) {
      this.sendToBackend(key, existing);
    }
  }

  async sendToBackend(patternKey, data) {
    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pattern: patternKey,
          metrics: data,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Pattern sync failed:', error);
    }
  }

  normalizeUrl(url) {
    return url.split('?')[0].split('#')[0];
  }

  getSessionId() {
    return localStorage.getItem('scroll_session') || 'anonymous';
  }

  getPatternInsights() {
    const insights = [];
    this.patterns.forEach((data, key) => {
      if (data.count > 5) {
        insights.push({
          pattern: key,
          frequency: data.count,
          avgVelocity: Math.round(data.avgVelocity)
        });
      }
    });
    return insights.sort((a, b) => b.frequency - a.frequency);
  }
}