import errorHandler from './error-handler.js';

class MLFeatureExtractor {
  constructor() {
    this.features = new Map();
  }

  async extractScrollFeatures(scrollData) {
    return errorHandler.withRetry(async () => {
      if (!scrollData || !Array.isArray(scrollData.velocities)) {
        throw new Error('Invalid scroll data format');
      }

      const velocities = scrollData.velocities;
      const positions = scrollData.positions || [];
      
      if (velocities.length === 0) {
        throw new Error('No velocity data available');
      }

      return {
        avgVelocity: this.calculateMean(velocities),
        maxVelocity: Math.max(...velocities),
        velocityVariance: this.calculateVariance(velocities),
        scrollDirection: this.getScrollDirection(positions),
        accelerationPattern: this.getAccelerationPattern(velocities),
        timestamp: Date.now()
      };
    }, 'feature-extraction');
  }

  calculateMean(values) {
    if (!values.length) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  calculateVariance(values) {
    if (values.length < 2) return 0;
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return this.calculateMean(squaredDiffs);
  }

  getScrollDirection(positions) {
    if (positions.length < 2) return 'unknown';
    const diff = positions[positions.length - 1] - positions[0];
    return diff > 0 ? 'down' : 'up';
  }

  getAccelerationPattern(velocities) {
    if (velocities.length < 2) return 'constant';
    
    const changes = [];
    for (let i = 1; i < velocities.length; i++) {
      changes.push(velocities[i] - velocities[i - 1]);
    }
    
    const avgChange = this.calculateMean(changes);
    if (Math.abs(avgChange) < 0.1) return 'constant';
    return avgChange > 0 ? 'accelerating' : 'decelerating';
  }
}

export default new MLFeatureExtractor();