// Scroll position persistence for sticky-scroll-extension
class ScrollPersistence {
  constructor() {
    this.positions = new Map();
    this.storageKey = 'sticky_scroll_positions';
    this.maxEntries = 100;
    this.loadPositions();
  }

  async loadPositions() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const stored = result[this.storageKey] || {};
      this.positions = new Map(Object.entries(stored));
    } catch (error) {
      console.error('Failed to load scroll positions:', error);
    }
  }

  async savePosition(url, position) {
    if (!url || position < 0) return;
    
    const normalizedUrl = this.normalizeUrl(url);
    this.positions.set(normalizedUrl, {
      position,
      timestamp: Date.now()
    });

    // Cleanup old entries
    if (this.positions.size > this.maxEntries) {
      const entries = Array.from(this.positions.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, this.maxEntries);
      this.positions = new Map(entries);
    }

    try {
      const positionsObj = Object.fromEntries(this.positions);
      await chrome.storage.local.set({ [this.storageKey]: positionsObj });
    } catch (error) {
      console.error('Failed to save scroll position:', error);
    }
  }

  getPosition(url) {
    const normalizedUrl = this.normalizeUrl(url);
    const entry = this.positions.get(normalizedUrl);
    
    // Return position if found and not older than 24 hours
    if (entry && (Date.now() - entry.timestamp) < 86400000) {
      return entry.position;
    }
    return 0;
  }

  normalizeUrl(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

  clearOldPositions() {
    const cutoff = Date.now() - 604800000; // 7 days
    for (const [url, data] of this.positions) {
      if (data.timestamp < cutoff) {
        this.positions.delete(url);
      }
    }
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScrollPersistence;
}