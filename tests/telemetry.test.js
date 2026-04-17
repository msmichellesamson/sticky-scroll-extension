const { Telemetry } = require('../telemetry');

describe('Telemetry', () => {
  let telemetry;
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    telemetry = new Telemetry();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEvent', () => {
    it('should queue event when tracking is enabled', () => {
      telemetry.enabled = true;
      
      telemetry.trackEvent('scroll_position_saved', {
        url: 'https://example.com',
        position: 1200
      });

      expect(telemetry.eventQueue).toHaveLength(1);
      expect(telemetry.eventQueue[0]).toMatchObject({
        event: 'scroll_position_saved',
        data: {
          url: 'https://example.com',
          position: 1200
        }
      });
    });

    it('should not queue event when tracking is disabled', () => {
      telemetry.enabled = false;
      
      telemetry.trackEvent('scroll_position_saved', { position: 1200 });

      expect(telemetry.eventQueue).toHaveLength(0);
    });

    it('should add timestamp to events', () => {
      telemetry.enabled = true;
      const beforeTime = Date.now();
      
      telemetry.trackEvent('test_event', {});
      
      const afterTime = Date.now();
      const event = telemetry.eventQueue[0];
      
      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(event.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('flush', () => {
    it('should send events to telemetry endpoint', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      telemetry.enabled = true;
      
      telemetry.trackEvent('test_event', { data: 'test' });
      await telemetry.flush();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/telemetry'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('test_event')
        })
      );
    });

    it('should clear queue after successful flush', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      telemetry.enabled = true;
      
      telemetry.trackEvent('test_event', {});
      await telemetry.flush();

      expect(telemetry.eventQueue).toHaveLength(0);
    });

    it('should handle flush errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      telemetry.enabled = true;
      
      telemetry.trackEvent('test_event', {});
      
      await expect(telemetry.flush()).resolves.not.toThrow();
      // Queue should still contain events on error
      expect(telemetry.eventQueue).toHaveLength(1);
    });
  });
});