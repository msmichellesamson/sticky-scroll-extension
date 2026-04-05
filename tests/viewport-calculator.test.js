// Unit tests for viewport calculator
const ViewportCalculator = require('../viewport-calculator');

describe('ViewportCalculator', () => {
  let calculator;
  
  beforeEach(() => {
    calculator = new ViewportCalculator();
    // Mock viewport dimensions
    global.window = {
      innerHeight: 800,
      innerWidth: 1200,
      scrollY: 0,
      document: {
        body: { scrollHeight: 2000 }
      }
    };
  });

  describe('calculateVisiblePercentage', () => {
    it('should return 0% when element is above viewport', () => {
      const element = { offsetTop: -100, offsetHeight: 50 };
      const result = calculator.calculateVisiblePercentage(element);
      expect(result).toBe(0);
    });

    it('should return 100% when element is fully visible', () => {
      const element = { offsetTop: 100, offsetHeight: 50 };
      const result = calculator.calculateVisiblePercentage(element);
      expect(result).toBe(100);
    });

    it('should calculate partial visibility correctly', () => {
      global.window.scrollY = 50;
      const element = { offsetTop: 0, offsetHeight: 100 };
      const result = calculator.calculateVisiblePercentage(element);
      expect(result).toBe(50);
    });
  });

  describe('getScrollProgress', () => {
    it('should return 0 at top of page', () => {
      const progress = calculator.getScrollProgress();
      expect(progress).toBe(0);
    });

    it('should return 100 at bottom of page', () => {
      global.window.scrollY = 1200; // scrollHeight - innerHeight
      const progress = calculator.getScrollProgress();
      expect(progress).toBe(100);
    });

    it('should calculate mid-page progress', () => {
      global.window.scrollY = 600;
      const progress = calculator.getScrollProgress();
      expect(progress).toBe(50);
    });
  });

  describe('isInViewport', () => {
    it('should return true for visible element', () => {
      const element = { offsetTop: 100, offsetHeight: 50 };
      const result = calculator.isInViewport(element);
      expect(result).toBe(true);
    });

    it('should return false for element below viewport', () => {
      const element = { offsetTop: 1000, offsetHeight: 50 };
      const result = calculator.isInViewport(element);
      expect(result).toBe(false);
    });
  });
});