/**
 * Unit tests for scroll pattern analysis
 */

describe('Pattern Analyzer', () => {
  let patternAnalyzer;

  beforeEach(() => {
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
    
    patternAnalyzer = require('../pattern-analyzer');
  });

  describe('Pattern Detection', () => {
    it('should detect reading patterns', () => {
      const scrollEvents = [
        { velocity: 50, pauseDuration: 2000, position: 100 },
        { velocity: 30, pauseDuration: 3000, position: 200 },
        { velocity: 45, pauseDuration: 2500, position: 300 }
      ];

      const pattern = patternAnalyzer.detectPattern(scrollEvents);
      
      expect(pattern.type).toBe('reading');
      expect(pattern.confidence).toBeGreaterThan(0.5);
    });

    it('should detect skimming patterns', () => {
      const scrollEvents = [
        { velocity: 300, pauseDuration: 100, position: 100 },
        { velocity: 280, pauseDuration: 150, position: 500 },
        { velocity: 320, pauseDuration: 80, position: 900 }
      ];

      const pattern = patternAnalyzer.detectPattern(scrollEvents);
      
      expect(pattern.type).toBe('skimming');
      expect(pattern.confidence).toBeGreaterThan(0.5);
    });

    it('should handle insufficient data', () => {
      const pattern = patternAnalyzer.detectPattern([]);
      
      expect(pattern.type).toBe('unknown');
      expect(pattern.confidence).toBe(0);
    });
  });

  describe('Pattern Learning', () => {
    it('should update pattern weights based on feedback', () => {
      const initialWeights = patternAnalyzer.getPatternWeights();
      
      patternAnalyzer.updateWeights('reading', 0.8);
      
      const updatedWeights = patternAnalyzer.getPatternWeights();
      expect(updatedWeights.reading).not.toBe(initialWeights.reading);
    });
  });
});