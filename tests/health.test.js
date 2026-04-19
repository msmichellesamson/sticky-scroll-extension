const { HealthChecker } = require('../health.js');

describe('HealthChecker', () => {
  let healthChecker;

  beforeEach(() => {
    healthChecker = new HealthChecker();
    jest.clearAllMocks();
  });

  describe('checkSystemHealth', () => {
    it('should return healthy status with all checks passing', async () => {
      const result = await healthChecker.checkSystemHealth();
      
      expect(result.status).toBe('healthy');
      expect(result.checks).toHaveProperty('memory');
      expect(result.checks).toHaveProperty('storage');
      expect(result.checks).toHaveProperty('performance');
      expect(result.timestamp).toBeDefined();
    });

    it('should detect memory pressure', async () => {
      // Mock high memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 100 * 1024 * 1024,
          totalJSHeapSize: 110 * 1024 * 1024
        }
      });

      const result = await healthChecker.checkSystemHealth();
      
      expect(result.checks.memory.status).toBe('warning');
      expect(result.checks.memory.usage).toBeGreaterThan(0.8);
    });

    it('should check storage quota', async () => {
      const mockQuota = { usage: 800000, quota: 1000000 };
      global.chrome = {
        storage: {
          local: {
            getBytesInUse: jest.fn().mockResolvedValue(800000)
          }
        }
      };
      global.navigator = {
        storage: {
          estimate: jest.fn().mockResolvedValue(mockQuota)
        }
      };

      const result = await healthChecker.checkSystemHealth();
      
      expect(result.checks.storage.usage).toBe(0.8);
    });
  });

  describe('getHealthScore', () => {
    it('should calculate correct health score', () => {
      const checks = {
        memory: { status: 'healthy', weight: 0.4 },
        storage: { status: 'warning', weight: 0.3 },
        performance: { status: 'healthy', weight: 0.3 }
      };

      const score = healthChecker.getHealthScore(checks);
      
      expect(score).toBe(0.7); // 0.4 + 0 + 0.3
    });

    it('should return 0 for all critical checks', () => {
      const checks = {
        memory: { status: 'critical', weight: 0.5 },
        storage: { status: 'critical', weight: 0.5 }
      };

      const score = healthChecker.getHealthScore(checks);
      
      expect(score).toBe(0);
    });
  });

  describe('shouldAlert', () => {
    it('should alert on critical status', () => {
      const result = { status: 'critical', score: 0.2 };
      
      expect(healthChecker.shouldAlert(result)).toBe(true);
    });

    it('should alert on low health score', () => {
      const result = { status: 'degraded', score: 0.4 };
      
      expect(healthChecker.shouldAlert(result)).toBe(true);
    });

    it('should not alert on healthy status', () => {
      const result = { status: 'healthy', score: 0.9 };
      
      expect(healthChecker.shouldAlert(result)).toBe(false);
    });
  });
});