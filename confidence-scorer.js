/**
 * Confidence scoring for ML predictions
 * Combines multiple signals to assess prediction reliability
 */

class ConfidenceScorer {
  constructor() {
    this.weights = {
      velocity: 0.3,
      pattern: 0.25,
      historical: 0.2,
      viewport: 0.15,
      timing: 0.1
    };
  }

  /**
   * Calculate confidence score for scroll prediction
   * @param {Object} signals - Combined prediction signals
   * @returns {number} Confidence score 0-1
   */
  calculateConfidence(signals) {
    try {
      const scores = {
        velocity: this.scoreVelocityConsistency(signals.velocity),
        pattern: this.scorePatternMatch(signals.pattern),
        historical: this.scoreHistoricalAccuracy(signals.historical),
        viewport: this.scoreViewportStability(signals.viewport),
        timing: this.scoreTimingPredictability(signals.timing)
      };

      return Object.entries(scores).reduce((total, [key, score]) => {
        return total + (score * this.weights[key]);
      }, 0);

    } catch (error) {
      console.error('Confidence calculation failed:', error);
      return 0.1; // Low confidence fallback
    }
  }

  scoreVelocityConsistency(velocity) {
    if (!velocity || velocity.variance === undefined) return 0.1;
    return Math.max(0, 1 - (velocity.variance / 1000));
  }

  scorePatternMatch(pattern) {
    if (!pattern || !pattern.confidence) return 0.1;
    return Math.min(1, pattern.confidence);
  }

  scoreHistoricalAccuracy(historical) {
    if (!historical || !historical.accuracy) return 0.1;
    return Math.min(1, historical.accuracy);
  }

  scoreViewportStability(viewport) {
    if (!viewport || viewport.changes === undefined) return 0.5;
    return Math.max(0, 1 - (viewport.changes / 10));
  }

  scoreTimingPredictability(timing) {
    if (!timing || !timing.consistency) return 0.3;
    return Math.min(1, timing.consistency);
  }

  /**
   * Adjust prediction based on confidence level
   * @param {Object} prediction - ML prediction result
   * @param {number} confidence - Confidence score
   * @returns {Object} Adjusted prediction
   */
  adjustPrediction(prediction, confidence) {
    const threshold = confidence < 0.3 ? 0.8 : 0.6;
    
    return {
      ...prediction,
      confidence,
      shouldPredict: confidence > 0.4,
      threshold,
      reliability: this.getReliabilityLevel(confidence)
    };
  }

  getReliabilityLevel(confidence) {
    if (confidence > 0.8) return 'high';
    if (confidence > 0.5) return 'medium';
    if (confidence > 0.2) return 'low';
    return 'unreliable';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfidenceScorer;
}