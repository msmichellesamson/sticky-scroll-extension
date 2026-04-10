class CircuitBreaker {
  constructor(failureThreshold = 5, recoveryTimeout = 30000, retryAttempts = 3) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeout = recoveryTimeout;
    this.retryAttempts = retryAttempts;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(operation, operationName = 'unknown') {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
        console.log(`[CircuitBreaker] Attempting recovery for ${operationName}`);
      } else {
        throw new Error(`Circuit breaker OPEN for ${operationName}`);
      }
    }

    return this.executeWithRetry(operation, operationName);
  }

  async executeWithRetry(operation, operationName) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const result = await operation();
        this.onSuccess();
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`[CircuitBreaker] Attempt ${attempt}/${this.retryAttempts} failed for ${operationName}:`, error.message);
        
        if (attempt < this.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
        }
      }
    }
    
    this.onFailure(operationName);
    throw lastError;
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure(operationName) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.error(`[CircuitBreaker] Circuit opened for ${operationName} after ${this.failureCount} failures`);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CircuitBreaker;
}