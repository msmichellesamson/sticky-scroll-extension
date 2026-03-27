class ExtensionErrorHandler {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.errorBuffer = [];
    this.flushInterval = 30000;
    
    this.startErrorFlush();
  }

  async handleError(error, context = {}) {
    const errorData = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      context,
      url: window.location?.href,
      userAgent: navigator.userAgent
    };

    this.errorBuffer.push(errorData);
    
    // Log to console for debugging
    console.error('[StickyScroll]', errorData);
    
    // Critical errors bypass buffer
    if (this.isCriticalError(error)) {
      await this.reportError(errorData);
    }
  }

  async withRetry(operation, context) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === this.maxRetries) {
          await this.handleError(error, { ...context, finalAttempt: true });
          throw error;
        }
        
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * attempt)
        );
      }
    }
  }

  isCriticalError(error) {
    const criticalPatterns = [
      /permission/i,
      /network/i,
      /storage/i,
      /manifest/i
    ];
    
    return criticalPatterns.some(pattern => 
      pattern.test(error.message)
    );
  }

  async reportError(errorData) {
    try {
      await chrome.runtime.sendMessage({
        type: 'ERROR_REPORT',
        data: errorData
      });
    } catch (e) {
      console.error('[StickyScroll] Failed to report error:', e);
    }
  }

  startErrorFlush() {
    setInterval(async () => {
      if (this.errorBuffer.length > 0) {
        const errors = this.errorBuffer.splice(0);
        await this.reportError({ batch: errors });
      }
    }, this.flushInterval);
  }

  clearErrors() {
    this.errorBuffer = [];
  }
}

window.extensionErrorHandler = new ExtensionErrorHandler();