const { ScrollPersistence } = require('../scroll-persistence');

describe('ScrollPersistence', () => {
  let scrollPersistence;
  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      data: {},
      get: jest.fn((key) => Promise.resolve(mockStorage.data[key])),
      set: jest.fn((data) => {
        Object.assign(mockStorage.data, data);
        return Promise.resolve();
      }),
      remove: jest.fn((key) => {
        delete mockStorage.data[key];
        return Promise.resolve();
      })
    };
    
    scrollPersistence = new ScrollPersistence(mockStorage);
  });

  describe('saveScrollPosition', () => {
    it('should save scroll position for URL', async () => {
      const url = 'https://example.com';
      const position = { x: 100, y: 200 };
      const timestamp = Date.now();

      await scrollPersistence.saveScrollPosition(url, position, timestamp);

      expect(mockStorage.set).toHaveBeenCalledWith({
        [`scroll_${url}`]: {
          position,
          timestamp,
          confidence: expect.any(Number)
        }
      });
    });

    it('should handle invalid positions', async () => {
      const url = 'https://example.com';
      const invalidPosition = { x: -1, y: NaN };

      await scrollPersistence.saveScrollPosition(url, invalidPosition);

      expect(mockStorage.set).not.toHaveBeenCalled();
    });
  });

  describe('getScrollPosition', () => {
    it('should retrieve saved scroll position', async () => {
      const url = 'https://example.com';
      const savedData = {
        position: { x: 150, y: 300 },
        timestamp: Date.now() - 1000,
        confidence: 0.8
      };
      
      mockStorage.data[`scroll_${url}`] = savedData;

      const result = await scrollPersistence.getScrollPosition(url);

      expect(result).toEqual(savedData);
    });

    it('should return null for non-existent URL', async () => {
      const result = await scrollPersistence.getScrollPosition('https://nonexistent.com');
      expect(result).toBeNull();
    });

    it('should expire old positions', async () => {
      const url = 'https://example.com';
      const expiredData = {
        position: { x: 100, y: 200 },
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours old
        confidence: 0.9
      };
      
      mockStorage.data[`scroll_${url}`] = expiredData;

      const result = await scrollPersistence.getScrollPosition(url);
      expect(result).toBeNull();
      expect(mockStorage.remove).toHaveBeenCalledWith(`scroll_${url}`);
    });
  });

  describe('cleanupOldEntries', () => {
    it('should remove entries older than 24 hours', async () => {
      const oldKey = 'scroll_https://old.com';
      const recentKey = 'scroll_https://recent.com';
      
      mockStorage.data = {
        [oldKey]: {
          timestamp: Date.now() - (25 * 60 * 60 * 1000)
        },
        [recentKey]: {
          timestamp: Date.now() - (1 * 60 * 60 * 1000)
        }
      };

      await scrollPersistence.cleanupOldEntries();

      expect(mockStorage.remove).toHaveBeenCalledWith(oldKey);
      expect(mockStorage.remove).not.toHaveBeenCalledWith(recentKey);
    });
  });
});