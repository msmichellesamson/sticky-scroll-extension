class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.maxBackoff = options.maxBackoff || 300000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.currentBackoff = this.resetTimeout;
  }

  async execute(operation, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`Circuit breaker OPEN. Next attempt in ${this.nextAttemptTime - Date.now()}ms`);
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.currentBackoff = this.resetTimeout;
    this.nextAttemptTime = null;
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.currentBackoff = Math.min(
        this.currentBackoff * this.backoffMultiplier,
        this.maxBackoff
      );
      this.nextAttemptTime = Date.now() + this.currentBackoff;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttemptTime: this.nextAttemptTime,
      currentBackoff: this.currentBackoff
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.currentBackoff = this.resetTimeout;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CircuitBreaker;
}