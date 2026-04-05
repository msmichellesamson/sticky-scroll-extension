class ErrorHandler {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.backoffMs = 1000;
  }

  async withRetry(operation, context = 'unknown') {
    const key = `${context}-${Date.now()}`;
    let attempt = 0;

    while (attempt < this.maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        this.retryAttempts.set(key, attempt);
        
        if (attempt >= this.maxRetries) {
          this.logError(error, context, attempt);
          throw new Error(`Failed after ${attempt} attempts: ${error.message}`);
        }

        const delay = this.backoffMs * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }
  }

  logError(error, context, attempts) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      attempts,
      timestamp: Date.now()
    };
    
    console.error('[ScrollExtension] Error:', errorData);
    
    // Send to background for telemetry
    chrome.runtime?.sendMessage({
      type: 'error',
      data: errorData
    }).catch(() => {});
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRetryStats() {
    return {
      totalRetries: this.retryAttempts.size,
      avgRetries: Array.from(this.retryAttempts.values()).reduce((a, b) => a + b, 0) / this.retryAttempts.size || 0
    };
  }
}

const errorHandler = new ErrorHandler();
export default errorHandler;