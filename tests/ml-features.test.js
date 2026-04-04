/**
 * Unit tests for ML feature extraction and validation
 */

describe('ML Features', () => {
  let mlFeatures;

  beforeEach(() => {
    // Mock chrome API
    global.chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
    };
    
    // Import after mocking
    mlFeatures = require('../ml-features');
  });

  describe('Feature Extraction', () => {
    it('should extract basic scroll features', () => {
      const scrollData = {
        velocity: 150,
        acceleration: 0.5,
        direction: 1,
        timestamp: Date.now(),
        position: 500
      };

      const features = mlFeatures.extractFeatures([scrollData]);
      
      expect(features).toHaveProperty('avgVelocity');
      expect(features).toHaveProperty('maxVelocity');
      expect(features).toHaveProperty('scrollDirection');
      expect(features.avgVelocity).toBeCloseTo(150, 2);
    });

    it('should handle empty scroll data', () => {
      const features = mlFeatures.extractFeatures([]);
      
      expect(features.avgVelocity).toBe(0);
      expect(features.maxVelocity).toBe(0);
      expect(features.scrollDirection).toBe(0);
    });

    it('should calculate momentum correctly', () => {
      const scrollData = [
        { velocity: 100, timestamp: 1000 },
        { velocity: 200, timestamp: 1100 },
        { velocity: 150, timestamp: 1200 }
      ];

      const features = mlFeatures.extractFeatures(scrollData);
      
      expect(features.momentum).toBeGreaterThan(0);
      expect(features.avgVelocity).toBeCloseTo(150, 2);
    });
  });

  describe('Feature Validation', () => {
    it('should validate feature vector format', () => {
      const validFeatures = {
        avgVelocity: 100,
        maxVelocity: 200,
        momentum: 0.8,
        scrollDirection: 1
      };

      expect(mlFeatures.validateFeatures(validFeatures)).toBe(true);
    });

    it('should reject invalid feature vectors', () => {
      const invalidFeatures = {
        avgVelocity: 'invalid',
        maxVelocity: null
      };

      expect(mlFeatures.validateFeatures(invalidFeatures)).toBe(false);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple scroll sessions', async () => {
      const sessions = [
        [{ velocity: 100, timestamp: 1000 }],
        [{ velocity: 200, timestamp: 2000 }]
      ];

      const results = await mlFeatures.processBatch(sessions);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('avgVelocity');
      expect(results[1]).toHaveProperty('avgVelocity');
    });
  });
});