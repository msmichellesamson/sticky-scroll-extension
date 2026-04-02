class ErrorHandler {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.baseDelay = 1000;
  }

  async handleWithRetry(operation, context = '') {
    const key = `${operation.name}_${context}`;
    const attempts = this.retryAttempts.get(key) || 0;
    
    try {
      const result = await operation();
      this.retryAttempts.delete(key); // Reset on success
      return result;
    } catch (error) {
      if (attempts >= this.maxRetries) {
        this.retryAttempts.delete(key);
        throw new Error(`Operation failed after ${this.maxRetries} retries: ${error.message}`);
      }

      const delay = this.baseDelay * Math.pow(2, attempts);
      this.retryAttempts.set(key, attempts + 1);
      
      console.warn(`Retry attempt ${attempts + 1}/${this.maxRetries} for ${key} in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.handleWithRetry(operation, context);
    }
  }

  logError(error, context = '') {
    const timestamp = new Date().toISOString();
    const errorData = {
      timestamp,
      message: error.message,
      stack: error.stack,
      context,
      url: window.location?.href || 'unknown'
    };
    
    console.error('ScrollExtension Error:', errorData);
    
    // Send to background script for telemetry
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'error',
        data: errorData
      }).catch(() => {}); // Ignore if background unavailable
    }
  }

  isRetriableError(error) {
    const retriableErrors = [
      'NetworkError',
      'TimeoutError',
      'Failed to fetch',
      'Connection refused'
    ];
    
    return retriableErrors.some(pattern => 
      error.message.includes(pattern)
    );
  }
}

const errorHandler = new ErrorHandler();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler, errorHandler };
}