class VelocityTracker {
  constructor() {
    this.positions = [];
    this.maxSamples = 10;
  }

  addSample(scrollY, timestamp) {
    this.positions.push({ y: scrollY, time: timestamp });
    if (this.positions.length > this.maxSamples) {
      this.positions.shift();
    }
  }

  getVelocity() {
    if (this.positions.length < 2) return 0;
    
    const latest = this.positions[this.positions.length - 1];
    const previous = this.positions[this.positions.length - 2];
    
    const deltaY = latest.y - previous.y;
    const deltaTime = latest.time - previous.time;
    
    return deltaTime > 0 ? deltaY / deltaTime : 0;
  }

  getAverageVelocity() {
    if (this.positions.length < 2) return 0;
    
    const first = this.positions[0];
    const last = this.positions[this.positions.length - 1];
    
    const totalDelta = last.y - first.y;
    const totalTime = last.time - first.time;
    
    return totalTime > 0 ? totalDelta / totalTime : 0;
  }

  isScrolling() {
    return Math.abs(this.getVelocity()) > 1;
  }

  reset() {
    this.positions = [];
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VelocityTracker;
} else if (typeof window !== 'undefined') {
  window.VelocityTracker = VelocityTracker;
}