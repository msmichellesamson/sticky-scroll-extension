/**
 * ML Feature Extractor for Scroll Behavior Analysis
 * Extracts features for training scroll prediction models
 */

class MLFeatureExtractor {
  constructor() {
    this.features = [];
    this.windowSize = 10; // Last 10 scroll events
    this.scrollBuffer = [];
  }

  /**
   * Extract features from scroll event for ML training
   */
  extractFeatures(scrollEvent, viewport, velocity) {
    const feature = {
      timestamp: Date.now(),
      scrollY: scrollEvent.scrollY,
      scrollX: scrollEvent.scrollX,
      deltaY: scrollEvent.deltaY,
      deltaX: scrollEvent.deltaX,
      velocity: velocity.current,
      acceleration: velocity.acceleration,
      viewportHeight: viewport.height,
      viewportWidth: viewport.width,
      documentHeight: document.documentElement.scrollHeight,
      scrollRatio: scrollEvent.scrollY / document.documentElement.scrollHeight,
      isAtTop: scrollEvent.scrollY === 0,
      isAtBottom: (scrollEvent.scrollY + viewport.height) >= document.documentElement.scrollHeight - 5,
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay()
    };

    this.scrollBuffer.push(feature);
    if (this.scrollBuffer.length > this.windowSize) {
      this.scrollBuffer.shift();
    }

    return this.computeSequenceFeatures();
  }

  /**
   * Compute sequence-based features from scroll buffer
   */
  computeSequenceFeatures() {
    if (this.scrollBuffer.length < 2) return null;

    const recent = this.scrollBuffer.slice(-5);
    const velocities = recent.map(f => f.velocity);
    const deltas = recent.map(f => f.deltaY);

    return {
      avgVelocity: velocities.reduce((a, b) => a + b, 0) / velocities.length,
      maxVelocity: Math.max(...velocities),
      velocityVariance: this.variance(velocities),
      scrollDirection: deltas[deltas.length - 1] > 0 ? 1 : -1,
      consecutiveDirection: this.getConsecutiveDirection(deltas),
      scrollFrequency: recent.length / (recent[recent.length - 1].timestamp - recent[0].timestamp) * 1000,
      bufferSize: this.scrollBuffer.length
    };
  }

  variance(arr) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  }

  getConsecutiveDirection(deltas) {
    let consecutive = 1;
    const lastDirection = deltas[deltas.length - 1] > 0 ? 1 : -1;
    
    for (let i = deltas.length - 2; i >= 0; i--) {
      const direction = deltas[i] > 0 ? 1 : -1;
      if (direction === lastDirection) {
        consecutive++;
      } else {
        break;
      }
    }
    
    return consecutive;
  }

  /**
   * Export features for training data
   */
  exportTrainingData() {
    return {
      features: this.features,
      metadata: {
        totalSamples: this.features.length,
        windowSize: this.windowSize,
        extractedAt: new Date().toISOString()
      }
    };
  }

  reset() {
    this.features = [];
    this.scrollBuffer = [];
  }
}

// Export for use in content script
window.MLFeatureExtractor = MLFeatureExtractor;