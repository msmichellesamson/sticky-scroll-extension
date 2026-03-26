/**
 * Viewport-aware scroll position calculator
 * Ensures scroll restoration accounts for dynamic content and viewport changes
 */

class ViewportCalculator {
  constructor() {
    this.viewportHistory = new Map();
    this.contentHeightCache = new Map();
  }

  /**
   * Calculate normalized scroll position relative to viewport
   * @param {string} url - Page URL
   * @param {number} scrollY - Current scroll position
   * @returns {object} Normalized position data
   */
  calculateNormalizedPosition(url, scrollY) {
    const viewport = this.getViewportMetrics();
    const contentHeight = document.documentElement.scrollHeight;
    
    // Calculate relative position (0-1 scale)
    const relativePosition = scrollY / Math.max(contentHeight - viewport.height, 1);
    
    // Store viewport context for restoration
    const positionData = {
      absolute: scrollY,
      relative: Math.min(Math.max(relativePosition, 0), 1),
      viewport: viewport,
      contentHeight: contentHeight,
      timestamp: Date.now()
    };
    
    this.viewportHistory.set(url, positionData);
    return positionData;
  }

  /**
   * Restore scroll position with viewport awareness
   * @param {string} url - Page URL
   * @returns {number|null} Calculated scroll position
   */
  restoreViewportAwarePosition(url) {
    const stored = this.viewportHistory.get(url);
    if (!stored) return null;
    
    const currentViewport = this.getViewportMetrics();
    const currentContentHeight = document.documentElement.scrollHeight;
    
    // Use relative position for better accuracy across viewport changes
    const targetPosition = stored.relative * Math.max(currentContentHeight - currentViewport.height, 0);
    
    // Validate position is within bounds
    return Math.min(Math.max(targetPosition, 0), currentContentHeight - currentViewport.height);
  }

  getViewportMetrics() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      ratio: window.innerWidth / window.innerHeight
    };
  }

  clearOldEntries(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const now = Date.now();
    for (const [url, data] of this.viewportHistory.entries()) {
      if (now - data.timestamp > maxAge) {
        this.viewportHistory.delete(url);
      }
    }
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ViewportCalculator;
} else {
  window.ViewportCalculator = ViewportCalculator;
}