class ErrorHandler {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 100;
    this.maxDelay = 5000;
  }

  async handleWithRetry(operation, context = {}) {
    let lastError;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryableError(error) || attempt === this.maxRetries - 1) {
          this.logError(error, { ...context, attempt });
          throw error;
        }
        
        const delay = this.calculateDelay(attempt);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  isRetryableError(error) {
    const retryableTypes = [
      'NetworkError',
      'TimeoutError',
      'ServiceUnavailable'
    ];
    
    return retryableTypes.some(type => 
      error.name === type || 
      error.message.includes(type.toLowerCase())
    );
  }

  calculateDelay(attempt) {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, this.maxDelay);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logError(error, context) {
    console.error('Operation failed:', {
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
}