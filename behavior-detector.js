class BehaviorDetector {
  constructor() {
    this.sessionPatterns = new Map();
    this.thresholds = {
      rapidScroll: 500,
      dwelling: 2000,
      backtrack: 3
    };
  }

  analyzeSession(scrollEvents) {
    const patterns = {
      isRapidScrolling: this.detectRapidScrolling(scrollEvents),
      isDwelling: this.detectDwelling(scrollEvents),
      isBacktracking: this.detectBacktracking(scrollEvents),
      confidence: 0
    };

    patterns.confidence = this.calculateConfidence(patterns);
    return patterns;
  }

  detectRapidScrolling(events) {
    if (events.length < 3) return false;
    
    const recentEvents = events.slice(-3);
    const timeSpan = recentEvents[2].timestamp - recentEvents[0].timestamp;
    const totalDistance = Math.abs(recentEvents[2].position - recentEvents[0].position);
    
    return timeSpan < this.thresholds.rapidScroll && totalDistance > 300;
  }

  detectDwelling(events) {
    if (events.length < 2) return false;
    
    const lastEvent = events[events.length - 1];
    const timeSinceLastScroll = Date.now() - lastEvent.timestamp;
    
    return timeSinceLastScroll > this.thresholds.dwelling;
  }

  detectBacktracking(events) {
    if (events.length < this.thresholds.backtrack) return false;
    
    const recent = events.slice(-this.thresholds.backtrack);
    let directionChanges = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const prevDir = recent[i-1].velocity > 0 ? 'down' : 'up';
      const currDir = recent[i].velocity > 0 ? 'down' : 'up';
      
      if (prevDir !== currDir) directionChanges++;
    }
    
    return directionChanges >= 2;
  }

  calculateConfidence(patterns) {
    let score = 0;
    
    if (patterns.isRapidScrolling) score += 0.4;
    if (patterns.isDwelling) score += 0.3;
    if (patterns.isBacktracking) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  getRecommendation(patterns) {
    if (patterns.isRapidScrolling) {
      return { action: 'reduce_sensitivity', reason: 'rapid_scrolling' };
    }
    
    if (patterns.isDwelling) {
      return { action: 'increase_precision', reason: 'dwelling_detected' };
    }
    
    if (patterns.isBacktracking) {
      return { action: 'enable_momentum', reason: 'backtracking_pattern' };
    }
    
    return { action: 'maintain', reason: 'normal_behavior' };
  }
}