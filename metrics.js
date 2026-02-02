// Performance metrics collector for sticky scroll events
class ScrollMetrics {
    constructor() {
        this.metrics = {
            scrollEvents: 0,
            stickyActivations: 0,
            avgScrollVelocity: 0,
            performanceIssues: 0
        };
        this.velocityBuffer = [];
        this.lastScrollTime = 0;
        this.lastScrollY = 0;
    }

    recordScrollEvent(scrollY, timestamp = Date.now()) {
        this.metrics.scrollEvents++;
        
        // Calculate velocity
        if (this.lastScrollTime > 0) {
            const timeDelta = timestamp - this.lastScrollTime;
            const distanceDelta = Math.abs(scrollY - this.lastScrollY);
            const velocity = distanceDelta / timeDelta;
            
            this.velocityBuffer.push(velocity);
            if (this.velocityBuffer.length > 50) {
                this.velocityBuffer.shift();
            }
            
            this.metrics.avgScrollVelocity = 
                this.velocityBuffer.reduce((a, b) => a + b, 0) / this.velocityBuffer.length;
        }
        
        this.lastScrollTime = timestamp;
        this.lastScrollY = scrollY;
    }

    recordStickyActivation() {
        this.metrics.stickyActivations++;
    }

    recordPerformanceIssue() {
        this.metrics.performanceIssues++;
    }

    getMetrics() {
        return { ...this.metrics };
    }

    exportPrometheusFormat() {
        return [
            `# HELP sticky_scroll_events_total Total number of scroll events`,
            `# TYPE sticky_scroll_events_total counter`,
            `sticky_scroll_events_total ${this.metrics.scrollEvents}`,
            ``,
            `# HELP sticky_activations_total Total sticky element activations`,
            `# TYPE sticky_activations_total counter`, 
            `sticky_activations_total ${this.metrics.stickyActivations}`,
            ``,
            `# HELP scroll_velocity_avg Average scroll velocity (px/ms)`,
            `# TYPE scroll_velocity_avg gauge`,
            `scroll_velocity_avg ${this.metrics.avgScrollVelocity.toFixed(3)}`,
            ``,
            `# HELP performance_issues_total Performance issues detected`,
            `# TYPE performance_issues_total counter`,
            `performance_issues_total ${this.metrics.performanceIssues}`
        ].join('\n');
    }
}

// Export for content script usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScrollMetrics;
} else {
    window.ScrollMetrics = ScrollMetrics;
}