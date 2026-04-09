import { mlServiceBreaker } from './circuit-breaker.js';
import { logger } from './error-handler.js';

class MLFeatureExtractor {
  constructor() {
    this.features = new Map();
    this.serviceUrl = 'https://ml-service.example.com/api';
  }

  async extractScrollFeatures(scrollData) {
    try {
      const features = await mlServiceBreaker.call(
        this.callMLService.bind(this),
        '/features/scroll',
        scrollData
      );
      
      logger.debug('ML features extracted', { featureCount: features.length });
      return features;
    } catch (error) {
      logger.warn('ML service unavailable, using fallback features', { error: error.message });
      return this.getFallbackFeatures(scrollData);
    }
  }

  async callMLService(endpoint, data) {
    const response = await fetch(`${this.serviceUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`ML service error: ${response.status}`);
    }

    return response.json();
  }

  getFallbackFeatures(scrollData) {
    return {
      velocity: scrollData.velocity || 0,
      acceleration: scrollData.acceleration || 0,
      direction: scrollData.direction || 1,
      timestamp: Date.now()
    };
  }

  getCircuitBreakerStatus() {
    return mlServiceBreaker.getState();
  }
}

export default MLFeatureExtractor;