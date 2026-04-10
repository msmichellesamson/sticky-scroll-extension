const CircuitBreaker = require('../circuit-breaker.js');

describe('CircuitBreaker', () => {
  let circuitBreaker;
  let mockAsyncFunction;

  beforeEach(() => {
    mockAsyncFunction = jest.fn();
    circuitBreaker = new CircuitBreaker(mockAsyncFunction, {
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitoringPeriod: 60000
    });
  });

  describe('failure detection', () => {
    it('should open circuit after threshold failures', async () => {
      mockAsyncFunction.mockRejectedValue(new Error('Service unavailable'));

      // Trigger failures to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute('test-data');
        } catch (e) {
          // Expected failures
        }
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
      expect(circuitBreaker.getMetrics().failureCount).toBe(3);
    });

    it('should fail fast when circuit is open', async () => {
      // Force circuit open
      circuitBreaker.setState('OPEN');
      
      const startTime = Date.now();
      try {
        await circuitBreaker.execute('test-data');
      } catch (error) {
        const duration = Date.now() - startTime;
        expect(error.message).toContain('Circuit breaker is OPEN');
        expect(duration).toBeLessThan(10); // Should fail immediately
      }
    });
  });

  describe('recovery mechanism', () => {
    it('should transition to half-open after recovery timeout', (done) => {
      circuitBreaker.setState('OPEN');
      
      setTimeout(() => {
        expect(circuitBreaker.getState()).toBe('HALF_OPEN');
        done();
      }, 1100); // Slightly more than recovery timeout
    }, 2000);

    it('should close circuit on successful call in half-open state', async () => {
      mockAsyncFunction.mockResolvedValue('success');
      circuitBreaker.setState('HALF_OPEN');

      const result = await circuitBreaker.execute('test-data');
      
      expect(result).toBe('success');
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.getMetrics().failureCount).toBe(0);
    });

    it('should reopen circuit on failure in half-open state', async () => {
      mockAsyncFunction.mockRejectedValue(new Error('Still failing'));
      circuitBreaker.setState('HALF_OPEN');

      try {
        await circuitBreaker.execute('test-data');
      } catch (e) {
        // Expected failure
      }

      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('metrics and monitoring', () => {
    it('should track request metrics accurately', async () => {
      mockAsyncFunction.mockResolvedValueOnce('success')
                      .mockRejectedValueOnce(new Error('failure'))
                      .mockResolvedValueOnce('success');

      await circuitBreaker.execute('test1');
      try {
        await circuitBreaker.execute('test2');
      } catch (e) {}
      await circuitBreaker.execute('test3');

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.successCount).toBe(2);
      expect(metrics.failureCount).toBe(1);
      expect(metrics.errorRate).toBeCloseTo(0.33, 1);
    });

    it('should reset metrics after monitoring period', (done) => {
      circuitBreaker = new CircuitBreaker(mockAsyncFunction, {
        failureThreshold: 5,
        recoveryTimeout: 1000,
        monitoringPeriod: 100 // Short period for testing
      });

      mockAsyncFunction.mockRejectedValue(new Error('test failure'));
      
      circuitBreaker.execute('test').catch(() => {});
      
      setTimeout(() => {
        const metrics = circuitBreaker.getMetrics();
        expect(metrics.totalRequests).toBe(0);
        expect(metrics.failureCount).toBe(0);
        done();
      }, 150);
    }, 1000);
  });
});