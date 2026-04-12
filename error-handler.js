class ErrorHandler {
  constructor() {
    this.maxRetries = 3;
    this.baseDelay = 1000;
    this.maxDelay = 10000;
  }

  async withRetry(operation, context = '') {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === this.maxRetries) {
          this.logError(error, context, attempt + 1);
          throw error;
        }
        
        if (!this.isRetryableError(error)) {
          this.logError(error, context, attempt + 1);
          throw error;
        }
        
        const delay = this.calculateDelay(attempt);
        console.warn(`Retry attempt ${attempt + 1}/${this.maxRetries + 1} for ${context} after ${delay}ms`);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  isRetryableError(error) {
    if (error.name === 'NetworkError') return true;
    if (error.message?.includes('timeout')) return true;
    if (error.status >= 500 && error.status < 600) return true;
    if (error.status === 429) return true; // Rate limit
    return false;
  }

  calculateDelay(attempt) {
    const delay = this.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, this.maxDelay);
  }

  logError(error, context, attempt) {
    console.error(`Error in ${context} (attempt ${attempt}):`, {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      timestamp: new Date().toISOString()
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
}