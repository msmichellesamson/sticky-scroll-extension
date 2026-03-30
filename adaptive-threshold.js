// Adaptive threshold learning for scroll behavior
class AdaptiveThreshold {
  constructor() {
    this.thresholds = new Map();
    this.learningRate = 0.1;
    this.minSamples = 10;
  }

  // Learn optimal threshold for domain/page type
  updateThreshold(domain, scrollSpeed, userSatisfaction) {
    const key = this.getDomainKey(domain);
    
    if (!this.thresholds.has(key)) {
      this.thresholds.set(key, {
        value: 100, // default threshold
        samples: 0,
        totalSatisfaction: 0
      });
    }

    const threshold = this.thresholds.get(key);
    threshold.samples++;
    threshold.totalSatisfaction += userSatisfaction;
    
    // Adjust threshold based on satisfaction
    if (threshold.samples >= this.minSamples) {
      const avgSatisfaction = threshold.totalSatisfaction / threshold.samples;
      const adjustment = this.learningRate * (avgSatisfaction - 0.5) * scrollSpeed;
      threshold.value = Math.max(50, Math.min(300, threshold.value + adjustment));
    }
  }

  // Get current threshold for domain
  getThreshold(domain) {
    const key = this.getDomainKey(domain);
    return this.thresholds.get(key)?.value || 100;
  }

  getDomainKey(domain) {
    // Group similar domains for better learning
    if (domain.includes('github')) return 'code';
    if (domain.includes('stackoverflow')) return 'qa';
    if (domain.includes('medium') || domain.includes('blog')) return 'article';
    return 'general';
  }

  // Export learned thresholds
  exportModel() {
    return Object.fromEntries(this.thresholds);
  }

  // Import previously learned thresholds
  importModel(data) {
    this.thresholds = new Map(Object.entries(data));
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdaptiveThreshold;
} else {
  window.AdaptiveThreshold = AdaptiveThreshold;
}