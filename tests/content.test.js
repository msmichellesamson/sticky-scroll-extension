// Unit tests for scroll position storage and restoration
const { JSDOM } = require('jsdom');

// Mock chrome storage API
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

describe('Scroll Position Manager', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><body style="height: 2000px"><div>Content</div></body>');
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    
    // Reset mocks
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
  });

  test('should generate unique page identifier', () => {
    const getPageId = () => {
      const url = window.location.href;
      const title = document.title;
      return btoa(url + title).substring(0, 16);
    };
    
    const pageId = getPageId();
    expect(pageId).toBeDefined();
    expect(typeof pageId).toBe('string');
    expect(pageId.length).toBe(16);
  });

  test('should store scroll position', async () => {
    const mockScrollY = 500;
    Object.defineProperty(window, 'scrollY', { value: mockScrollY });
    
    const storeScrollPosition = () => {
      const pageId = 'test-page-id';
      const scrollData = {
        y: window.scrollY,
        timestamp: Date.now(),
        url: window.location.href
      };
      
      chrome.storage.local.set({
        [`scroll_${pageId}`]: scrollData
      });
    };
    
    storeScrollPosition();
    
    expect(chrome.storage.local.set).toHaveBeenCalledWith({
      'scroll_test-page-id': {
        y: 500,
        timestamp: expect.any(Number),
        url: expect.any(String)
      }
    });
  });

  test('should restore scroll position', async () => {
    const mockScrollData = {
      y: 300,
      timestamp: Date.now() - 1000,
      url: 'about:blank'
    };
    
    chrome.storage.local.get.mockResolvedValue({
      'scroll_test-page-id': mockScrollData
    });
    
    const restoreScrollPosition = async () => {
      const pageId = 'test-page-id';
      const result = await chrome.storage.local.get(`scroll_${pageId}`);
      const scrollData = result[`scroll_${pageId}`];
      
      if (scrollData && Date.now() - scrollData.timestamp < 300000) { // 5 min
        window.scrollTo(0, scrollData.y);
        return scrollData.y;
      }
      return null;
    };
    
    const restoredY = await restoreScrollPosition();
    expect(restoredY).toBe(300);
  });

  test('should ignore stale scroll data', async () => {
    const staleScrollData = {
      y: 400,
      timestamp: Date.now() - 400000, // 6+ minutes old
      url: 'about:blank'
    };
    
    chrome.storage.local.get.mockResolvedValue({
      'scroll_test-page-id': staleScrollData
    });
    
    const restoreScrollPosition = async () => {
      const pageId = 'test-page-id';
      const result = await chrome.storage.local.get(`scroll_${pageId}`);
      const scrollData = result[`scroll_${pageId}`];
      
      if (scrollData && Date.now() - scrollData.timestamp < 300000) {
        return scrollData.y;
      }
      return null;
    };
    
    const restoredY = await restoreScrollPosition();
    expect(restoredY).toBeNull();
  });
});

// Performance test for scroll throttling
describe('Scroll Performance', () => {
  test('should throttle scroll events', (done) => {
    let callCount = 0;
    const throttledFn = (fn, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };
    
    const scrollHandler = throttledFn(() => {
      callCount++;
    }, 100);
    
    // Simulate rapid scroll events
    for (let i = 0; i < 10; i++) {
      scrollHandler();
    }
    
    setTimeout(() => {
      expect(callCount).toBe(1); // Should only be called once due to throttling
      done();
    }, 150);
  });
});