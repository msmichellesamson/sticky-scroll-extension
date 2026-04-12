class ErrorHandler {
  constructor() {
    this.errorCategories = {
      NETWORK: 'network',
      STORAGE: 'storage',
      PERMISSION: 'permission',
      ML_MODEL: 'ml_model',
      PERFORMANCE: 'performance',
      USER_INPUT: 'user_input'
    };
    
    this.recoveryStrategies = new Map();
    this.initializeStrategies();
  }

  initializeStrategies() {
    this.recoveryStrategies.set(this.errorCategories.NETWORK, {
      retryCount: 3,
      backoffMs: 1000,
      fallback: () => this.enableOfflineMode()
    });
    
    this.recoveryStrategies.set(this.errorCategories.STORAGE, {
      retryCount: 2,
      backoffMs: 500,
      fallback: () => this.useMemoryStorage()
    });
    
    this.recoveryStrategies.set(this.errorCategories.ML_MODEL, {
      retryCount: 1,
      backoffMs: 2000,
      fallback: () => this.useFallbackPrediction()
    });
  }

  categorizeError(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.errorCategories.NETWORK;
    }
    if (error.message.includes('storage') || error.name === 'QuotaExceededError') {
      return this.errorCategories.STORAGE;
    }
    if (error.message.includes('permission') || error.name === 'NotAllowedError') {
      return this.errorCategories.PERMISSION;
    }
    if (error.message.includes('model') || error.message.includes('prediction')) {
      return this.errorCategories.ML_MODEL;
    }
    if (error.name === 'PerformanceError') {
      return this.errorCategories.PERFORMANCE;
    }
    return this.errorCategories.USER_INPUT;
  }

  async handleWithRecovery(error, context = {}) {
    const category = this.categorizeError(error);
    const strategy = this.recoveryStrategies.get(category);
    
    if (!strategy) {
      console.error(`No recovery strategy for category: ${category}`, error);
      return { success: false, error };
    }

    for (let attempt = 1; attempt <= strategy.retryCount; attempt++) {
      try {
        if (context.retryFn) {
          const result = await context.retryFn();
          return { success: true, result, attempt };
        }
        break;
      } catch (retryError) {
        if (attempt === strategy.retryCount) {
          console.warn(`All retries failed for ${category}, using fallback`);
          const fallbackResult = await strategy.fallback();
          return { success: true, result: fallbackResult, usedFallback: true };
        }
        await this.sleep(strategy.backoffMs * attempt);
      }
    }
    
    return { success: false, error, category };
  }

  async enableOfflineMode() {
    console.log('Enabling offline mode for scroll predictions');
    return { mode: 'offline', predictions: [] };
  }

  async useMemoryStorage() {
    console.log('Falling back to memory-only storage');
    return new Map();
  }

  async useFallbackPrediction() {
    console.log('Using simple heuristic prediction');
    return { confidence: 0.5, prediction: 'continue' };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

if (typeof module !== 'undefined') {
  module.exports = ErrorHandler;
}