class ExtensionError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'ExtensionError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp
    };
  }
}

class ErrorHandler {
  static async withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i === maxRetries - 1) break;
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    
    throw new ExtensionError(
      'Operation failed after retries',
      'RETRY_EXHAUSTED',
      { originalError: lastError.message, attempts: maxRetries }
    );
  }

  static handleStorageError(error, operation) {
    const code = error.message.includes('QUOTA_BYTES') ? 'QUOTA_EXCEEDED' : 'STORAGE_ERROR';
    return new ExtensionError(
      `Storage ${operation} failed: ${error.message}`,
      code,
      { operation }
    );
  }

  static handleDOMError(error, selector) {
    return new ExtensionError(
      `DOM operation failed: ${error.message}`,
      'DOM_ERROR',
      { selector, url: window.location.href }
    );
  }

  static async logError(error) {
    try {
      const errorData = error instanceof ExtensionError ? error.toJSON() : {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      };

      // Send to background script for telemetry
      chrome.runtime.sendMessage({
        type: 'ERROR_LOG',
        error: errorData
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ExtensionError, ErrorHandler };
}