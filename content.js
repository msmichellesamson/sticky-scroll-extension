// Sticky Scroll Extension - Content Script
class StickyScrollManager {
  constructor() {
    this.isSelectionMode = false;
    this.stickyElements = new Map();
    this.stickyScrollElements = new Map();
    this.elementCounter = 0;
    this.overlayElement = null;
    this.currentMode = 'note'; // 'note' or 'scroll'
    this.stickyScrollContainer = null;
    this.init();
  }

  init() {
    this.detectPageType();
    this.createToggleButton();
    this.setupMessageListener();
    this.loadStickyElements();
    this.setupPositionUpdater();
  }

  setupPositionUpdater() {
    // Update positions when window resizes or page layout changes
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (this.stickyScrollElements.size > 0) {
          this.repositionPinnedElements();
        }
      }, 250);
    });

    // Also check for position updates periodically (in case page header changes)
    setInterval(() => {
      if (this.stickyScrollElements.size > 0) {
        this.repositionPinnedElements();
      }
    }, 2000); // Check every 2 seconds
  }

  detectPageType() {
    // Detect if this is a PDF viewer
    this.isPDFViewer = this.detectPDFViewer();
    if (this.isPDFViewer) {
      this.setupPDFSupport();
    }
  }

  detectPDFViewer() {
    // Check various indicators of PDF viewing
    return (
      // Chrome's built-in PDF viewer
      window.location.href.includes('.pdf') ||
      document.querySelector('embed[type="application/pdf"]') ||
      document.querySelector('object[type="application/pdf"]') ||
      // PDF.js viewer (Firefox and some Chrome extensions)
      window.PDFViewerApplication ||
      document.querySelector('#viewer') && document.querySelector('.page') ||
      // Adobe PDF viewer
      document.querySelector('#adobe-dc-view') ||
      // Other PDF viewers
      document.body.classList.contains('pdf-viewer') ||
      document.title.toLowerCase().includes('.pdf')
    );
  }

  setupPDFSupport() {
    // Add specific handling for PDF viewers
    console.log('PDF viewer detected - enhanced sticky scroll mode activated');
    
    // Wait for PDF to load if using PDF.js
    if (window.PDFViewerApplication) {
      window.PDFViewerApplication.eventBus.on('pagesinit', () => {
        this.enhancePDFExperience();
      });
    } else {
      // For other PDF viewers, wait a bit for content to load
      setTimeout(() => {
        this.enhancePDFExperience();
      }, 1000);
    }
  }

  enhancePDFExperience() {
    // Add PDF-specific improvements
    const toggleBtn = document.getElementById('sticky-scroll-toggle');
    if (toggleBtn) {
      toggleBtn.title = 'Toggle Sticky Scroll for PDF (Pin text or images)';
      toggleBtn.style.background = '#FF6B35'; // Different color for PDF mode
    }
  }

  createToggleButton() {
    // Create expandable floating control panel
    const controlPanel = document.createElement('div');
    controlPanel.id = 'sticky-scroll-controls';
    controlPanel.className = 'collapsed';
    controlPanel.innerHTML = `
      <div class="main-toggle" title="Sticky Scroll Controls">
        <div class="main-icon" id="main-mode-icon">🗒️</div>
      </div>
      <div class="expanded-panel">
        <button class="control-btn mode-btn mode-active" data-mode="note" title="Sticky Notes - Copy to floating notes">
          <span class="btn-icon">🗒️</span>
        </button>
        <button class="control-btn mode-btn mode-inactive" data-mode="scroll" title="Sticky Scroll - Pin to top">
          <span class="btn-icon">📌</span>
        </button>
        <button class="control-btn toggle-btn selection-inactive" id="sticky-scroll-toggle" title="Toggle Selection Mode">
          <span class="btn-icon">⚡</span>
        </button>
        <div class="separator"></div>
        <button class="control-btn clear-btn" title="Clear All">
          <span class="btn-icon">🗑️</span>
        </button>
      </div>
    `;
    
    // Add event listeners
    const mainToggle = controlPanel.querySelector('.main-toggle');
    mainToggle.addEventListener('click', () => this.toggleControlPanel());
    
    const modeButtons = controlPanel.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        console.log('Mode button clicked:', e.target.dataset.mode);
        this.switchMode(e.target.dataset.mode);
      });
    });
    
    const toggleBtn = controlPanel.querySelector('#sticky-scroll-toggle');
    toggleBtn.addEventListener('click', () => {
      console.log('Selection toggle clicked, current state:', this.isSelectionMode);
      this.toggleSelectionMode();
    });
    
    const clearBtn = controlPanel.querySelector('.clear-btn');
    clearBtn.addEventListener('click', () => this.clearAllElements());
    
    document.body.appendChild(controlPanel);
    
    // Create sticky scroll container
    this.createStickyScrollContainer();
  }

  toggleControlPanel() {
    const controlPanel = document.getElementById('sticky-scroll-controls');
    const isCollapsed = controlPanel.classList.contains('collapsed');
    
    if (isCollapsed) {
      controlPanel.classList.remove('collapsed');
      controlPanel.classList.add('expanded');
    } else {
      controlPanel.classList.add('collapsed');
      controlPanel.classList.remove('expanded');
    }
  }

  clearAllElements() {
    this.clearAllStickyElements();
    this.clearAllStickyScrollElements();
  }

  switchMode(mode) {
    console.log('Switching to mode:', mode);
    this.currentMode = mode;
    
    // Update main icon to show current mode
    const mainIcon = document.getElementById('main-mode-icon');
    if (mainIcon) {
      mainIcon.textContent = mode === 'note' ? '🗒️' : '📌';
    }
    
    // Update mode buttons - always keep one active (radio button behavior)
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.classList.add('mode-active');
        btn.classList.remove('mode-inactive');
        console.log('Activated mode button:', mode);
      } else {
        btn.classList.remove('mode-active');
        btn.classList.add('mode-inactive');
        console.log('Deactivated mode button:', btn.dataset.mode);
      }
    });
    
    // Update instructions if in selection mode
    if (this.overlayElement) {
      this.updateInstructions();
    }
  }

  createStickyScrollContainer() {
    // No longer needed - elements become sticky in place
    // This function kept for compatibility but does nothing
  }

  toggleSelectionMode() {
    this.isSelectionMode = !this.isSelectionMode;
    
    if (this.isSelectionMode) {
      this.enterSelectionMode();
    } else {
      this.exitSelectionMode();
    }
  }

  enterSelectionMode() {
    // Create overlay for selection
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'sticky-scroll-overlay';
    this.updateInstructions();
    document.body.appendChild(this.overlayElement);

    // Store bound references to avoid duplicate listeners
    this.boundMouseOver = this.handleMouseOver.bind(this);
    this.boundMouseOut = this.handleMouseOut.bind(this);
    this.boundElementClick = this.handleElementClick.bind(this);
    this.boundKeyDown = this.handleKeyDown.bind(this);

    // Add event listeners
    document.addEventListener('mouseover', this.boundMouseOver);
    document.addEventListener('mouseout', this.boundMouseOut);
    document.addEventListener('click', this.boundElementClick);
    document.addEventListener('keydown', this.boundKeyDown);

    // Update toggle button to green (active state)
    const toggleBtn = document.getElementById('sticky-scroll-toggle');
    toggleBtn.classList.add('selection-active');
    toggleBtn.classList.remove('selection-inactive');
    
    // Auto-expand when entering selection mode
    const controls = document.getElementById('sticky-scroll-controls');
    controls.classList.remove('collapsed');
    controls.classList.add('expanded');
  }

  exitSelectionMode() {
    // Remove overlay
    if (this.overlayElement) {
      this.overlayElement.remove();
      this.overlayElement = null;
    }

    // Remove event listeners using stored references
    if (this.boundMouseOver) {
      document.removeEventListener('mouseover', this.boundMouseOver);
    }
    if (this.boundMouseOut) {
      document.removeEventListener('mouseout', this.boundMouseOut);
    }
    if (this.boundElementClick) {
      document.removeEventListener('click', this.boundElementClick);
    }
    if (this.boundKeyDown) {
      document.removeEventListener('keydown', this.boundKeyDown);
    }

    // Remove highlight from any highlighted element
    document.querySelectorAll('.sticky-scroll-highlight').forEach(el => {
      el.classList.remove('sticky-scroll-highlight');
    });

    // Update toggle button to normal state
    const toggleBtn = document.getElementById('sticky-scroll-toggle');
    toggleBtn.classList.remove('selection-active');
    toggleBtn.classList.add('selection-inactive');
  }

  updateInstructions() {
    if (!this.overlayElement) return;
    
    const instructions = this.currentMode === 'note' 
      ? '🗒️ <strong>Sticky Note Mode:</strong> Click any element to copy it into a floating note'
      : '📌 <strong>Sticky Scroll Mode:</strong> Click any element to pin it to the top while scrolling';
    
    this.overlayElement.innerHTML = `
      <div class="sticky-scroll-instructions">
        ${instructions}<br>
        <small>Press ESC to exit selection mode</small>
      </div>
    `;
  }

  handleMouseOver(event) {
    if (!this.isSelectionMode) return;
    
    const element = event.target;
    if (element.id === 'sticky-scroll-overlay' || 
        element.closest('#sticky-scroll-overlay') ||
        element.closest('#sticky-scroll-controls') ||
        element.closest('.sticky-element-container') ||
        element.classList.contains('sticky-element-close')) {
      return;
    }

    element.classList.add('sticky-scroll-highlight');
  }

  handleMouseOut(event) {
    if (!this.isSelectionMode) return;
    
    const element = event.target;
    element.classList.remove('sticky-scroll-highlight');
  }

  handleElementClick(event) {
    if (!this.isSelectionMode) return;
    
    event.preventDefault();
    event.stopPropagation();

    const element = event.target;
    if (element.id === 'sticky-scroll-overlay' || 
        element.closest('#sticky-scroll-overlay') ||
        element.closest('#sticky-scroll-controls') ||
        element.closest('.sticky-element-container') ||
        element.closest('#sticky-scroll-container')) {
      return;
    }

    // Clear mode selection - only do ONE thing based on mode
    if (this.currentMode === 'note') {
      console.log('Creating sticky note for element:', element);
      this.createStickyNote(element);
    } else if (this.currentMode === 'scroll') {
      console.log('Creating sticky scroll for element:', element);
      this.createStickyScrollElement(element);
    }
    
    this.exitSelectionMode();
  }

  handleKeyDown(event) {
    if (event.key === 'Escape' && this.isSelectionMode) {
      this.exitSelectionMode();
    }
  }

  createStickyNote(originalElement) {
    const elementId = `sticky-note-${++this.elementCounter}`;
    
    // Clone the element
    const clonedElement = originalElement.cloneNode(true);
    
    // Create container for the sticky note (floating window only)
    const container = document.createElement('div');
    container.className = 'sticky-note-container';
    container.id = elementId;
    
    // Create header with controls
    const header = document.createElement('div');
    header.className = 'sticky-note-header';
    header.innerHTML = `
      <span class="sticky-note-title">📝 Sticky Note</span>
      <div class="sticky-note-controls">
        <button class="sticky-control-btn" data-action="minimize">−</button>
        <button class="sticky-control-btn" data-action="close">×</button>
      </div>
    `;
    
    // Create content area
    const content = document.createElement('div');
    content.className = 'sticky-note-content';
    content.appendChild(clonedElement);
    
    // Assemble container
    container.appendChild(header);
    container.appendChild(content);
    
    // Make container draggable
    this.makeDraggable(container, header);
    
    // Add event listeners for controls
    header.querySelector('[data-action="close"]').addEventListener('click', () => {
      this.removeStickyNote(elementId);
    });
    
    header.querySelector('[data-action="minimize"]').addEventListener('click', () => {
      this.toggleMinimizeNote(elementId);
    });
    
    // Add to page
    document.body.appendChild(container);
    
    // Store reference (separate from sticky scroll elements)
    this.stickyElements.set(elementId, {
      container: container,
      originalElement: originalElement,
      isMinimized: false,
      type: 'note'
    });
    
    // Add accessibility visual feedback to original element
    originalElement.classList.add('sticky-noted-element');
    
    // Save to storage
    this.saveStickyElements();
    
    // Created floating note with visual feedback on original element!
    console.log('Created sticky note with accessibility feedback:', elementId);
  }

  createStickyScrollElement(originalElement) {
    // Check if element is already pinned
    if (originalElement.classList.contains('sticky-scroll-pinned') || 
        originalElement.hasAttribute('data-sticky-id')) {
      console.log('Element already pinned, skipping');
      return;
    }
    
    const elementId = `sticky-scroll-element-${++this.elementCounter}`;
    
    // Store original position and styling
    const originalPosition = originalElement.style.position;
    const originalTop = originalElement.style.top;
    const originalLeft = originalElement.style.left;
    const originalWidth = originalElement.style.width;
    const originalZIndex = originalElement.style.zIndex;
    const originalBackground = originalElement.style.background;
    const originalPadding = originalElement.style.padding;
    
    // Create a placeholder to maintain document flow
    const placeholder = document.createElement('div');
    placeholder.className = 'sticky-scroll-placeholder';
    placeholder.style.height = originalElement.offsetHeight + 'px';
    placeholder.style.background = 'rgba(255, 107, 53, 0.1)';
    placeholder.style.border = '2px dashed #FF6B35';
    placeholder.style.display = 'flex';
    placeholder.style.alignItems = 'center';
    placeholder.style.justifyContent = 'center';
    placeholder.style.color = '#FF6B35';
    placeholder.style.fontSize = '14px';
    placeholder.style.fontWeight = 'bold';
    placeholder.innerHTML = '📌 Element pinned to top';
    
    // Insert placeholder before original element
    originalElement.parentNode.insertBefore(placeholder, originalElement);
    
    // Calculate top position based on existing page headers and pinned elements
    const baseTopOffset = this.calculateBaseTopOffset();
    const stackOffset = this.stickyScrollElements.size * 60; // Stack elements with 60px offset
    const topOffset = baseTopOffset + stackOffset;
    
    // Make the original element fixed to top of viewport
    originalElement.style.position = 'fixed';
    originalElement.style.top = topOffset + 'px';
    originalElement.style.left = '0px';
    originalElement.style.width = '100%';
    originalElement.style.zIndex = '9998';
    originalElement.style.background = originalElement.style.background || 'white';
    originalElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    originalElement.style.borderBottom = '1px solid #e0e0e0';
    originalElement.style.padding = originalElement.style.padding || '10px 20px';
    
    // Add classes for styling and accessibility
    originalElement.classList.add('sticky-scroll-pinned');
    originalElement.classList.add('sticky-scroll-original');
    originalElement.setAttribute('data-sticky-id', elementId);
    
    // Create a small indicator/close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sticky-element-close';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Unpin element';
    closeBtn.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      width: 20px;
      height: 20px;
      background: #ff4444;
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 12px;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.removeStickyScrollElement(elementId);
    });
    
    originalElement.style.position = 'relative';
    originalElement.appendChild(closeBtn);
    
    // Store reference with original styling
    this.stickyScrollElements.set(elementId, {
      element: originalElement,
      placeholder: placeholder,
      closeBtn: closeBtn,
      originalStyles: {
        position: originalPosition,
        top: originalTop,
        left: originalLeft,
        width: originalWidth,
        zIndex: originalZIndex,
        background: originalBackground,
        padding: originalPadding
      }
    });
    
    // Add visual indicator
    originalElement.classList.add('sticky-scroll-top-pinned');
    
    // Save to storage
    this.saveStickyElements();
    
    console.log(`Element pinned with ID: ${elementId}`);
  }

  removeStickyScrollElement(elementId) {
    const stickyData = this.stickyScrollElements.get(elementId);
    if (!stickyData) {
      console.log(`No sticky data found for ID: ${elementId}`);
      return;
    }

    const element = stickyData.element;
    const originalStyles = stickyData.originalStyles;
    
    // Restore original styling
    element.style.position = originalStyles.position || '';
    element.style.top = originalStyles.top || '';
    element.style.left = originalStyles.left || '';
    element.style.width = originalStyles.width || '';
    element.style.zIndex = originalStyles.zIndex || '';
    element.style.background = originalStyles.background || '';
    element.style.padding = originalStyles.padding || '';
    element.style.boxShadow = '';
    element.style.borderBottom = '';
    
    // Remove classes and attributes (including accessibility feedback)
    element.classList.remove('sticky-scroll-pinned', 'sticky-scroll-top-pinned', 'sticky-scroll-original');
    element.removeAttribute('data-sticky-id');
    
    // Remove placeholder
    if (stickyData.placeholder && stickyData.placeholder.parentNode) {
      stickyData.placeholder.remove();
    }
    
    // Remove close button
    if (stickyData.closeBtn && stickyData.closeBtn.parentNode) {
      stickyData.closeBtn.remove();
    }
    
    // Remove from our tracking
    this.stickyScrollElements.delete(elementId);
    
    // Reposition remaining pinned elements
    this.repositionPinnedElements();
    
    // Save to storage
    this.saveStickyElements();
    
    console.log(`Element unpinned: ${elementId}`);
  }

  clearAllStickyScrollElements() {
    // Remove all sticky scroll elements
    this.stickyScrollElements.forEach((_, elementId) => {
      this.removeStickyScrollElement(elementId);
    });
  }

  calculateBaseTopOffset() {
    // Find existing fixed/sticky elements at the top of the page
    let maxBottom = 0;
    const detectedHeaders = [];
    
    // Common header selectors to check first
    const commonHeaderSelectors = [
      'header', 'nav', '.header', '.navbar', '.nav', '.navigation',
      '.top-bar', '.toolbar', '.menu-bar', '[role="banner"]'
    ];
    
    // Check common header elements first
    for (const selector of commonHeaderSelectors) {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const style = window.getComputedStyle(element);
        const position = style.position;
        
        if ((position === 'fixed' || position === 'sticky')) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100 && rect.height > 0 && rect.width > 0) {
            const elementBottom = rect.top + rect.height;
            if (elementBottom > maxBottom) {
              maxBottom = elementBottom;
              detectedHeaders.push({
                selector: selector,
                height: rect.height,
                bottom: elementBottom
              });
            }
          }
        }
      }
    }
    
    // If no common headers found, check all elements
    if (maxBottom === 0) {
      const allElements = document.querySelectorAll('*');
      
      for (const element of allElements) {
        // Skip our own extension elements
        if (element.closest('#sticky-scroll-controls') || 
            element.classList.contains('sticky-scroll-pinned') ||
            element.classList.contains('sticky-element-container')) {
          continue;
        }
        
        const style = window.getComputedStyle(element);
        const position = style.position;
        const top = parseInt(style.top) || 0;
        
        // Check if element is fixed or sticky and positioned at/near the top
        if ((position === 'fixed' || position === 'sticky') && 
            top >= -10 && top <= 10) { // Within 10px of top
          
          const rect = element.getBoundingClientRect();
          
          // Only consider elements that are actually visible and at the top
          if (rect.top <= 100 && rect.height > 0 && rect.width > 0) {
            const elementBottom = rect.top + rect.height;
            if (elementBottom > maxBottom) {
              maxBottom = elementBottom;
              detectedHeaders.push({
                element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                height: rect.height,
                bottom: elementBottom
              });
            }
          }
        }
      }
    }
    
    // Log detected headers for debugging
    if (detectedHeaders.length > 0) {
      console.log('Sticky Scroll: Detected page headers:', detectedHeaders);
      console.log('Sticky Scroll: Positioning pins below existing headers at offset:', maxBottom + 5);
    }
    
    // Add a small buffer to avoid touching existing elements
    return Math.max(0, maxBottom + 5);
  }

  repositionPinnedElements() {
    // Reposition all pinned elements to stack properly below existing headers
    const baseOffset = this.calculateBaseTopOffset();
    let index = 0;
    
    this.stickyScrollElements.forEach((stickyData) => {
      const topOffset = baseOffset + (index * 60); // 60px per element
      stickyData.element.style.top = topOffset + 'px';
      index++;
    });
  }

  updateBodyPadding() {
    // No longer needed - elements are sticky in place, no container
  }

  makeDraggable(container, header) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('sticky-control-btn')) return;
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        container.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    });

    document.addEventListener('mouseup', () => {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    });
  }

  toggleMinimize(elementId) {
    const stickyData = this.stickyElements.get(elementId);
    if (!stickyData) return;

    // Handle based on type
    if (stickyData.type === 'note') {
      this.toggleMinimizeNote(elementId);
      return;
    }

    // Original sticky element minimize logic
    const content = stickyData.container.querySelector('.sticky-element-content');
    const minimizeBtn = stickyData.container.querySelector('[data-action="minimize"]');
    
    if (stickyData.isMinimized) {
      content.style.display = 'block';
      minimizeBtn.textContent = '−';
      stickyData.isMinimized = false;
    } else {
      content.style.display = 'none';
      minimizeBtn.textContent = '+';
      stickyData.isMinimized = true;
    }
  }

  removeStickyElement(elementId) {
    const stickyData = this.stickyElements.get(elementId);
    if (!stickyData) return;

    // Handle based on type
    if (stickyData.type === 'note') {
      this.removeStickyNote(elementId);
      return;
    }

    // Original sticky element removal logic
    if (stickyData.originalElement) {
      stickyData.originalElement.classList.remove('sticky-scroll-pinned');
    }
    
    // Remove container from page
    stickyData.container.remove();
    
    // Remove from our tracking
    this.stickyElements.delete(elementId);
    
    // Save to storage
    this.saveStickyElements();
  }

  saveStickyElements() {
    // Handle extension context invalidation gracefully
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          stickyElementsCount: this.stickyElements.size,
          stickyScrollCount: this.stickyScrollElements.size
        });
      }
    } catch (error) {
      // Extension context invalidated - ignore silently
      console.log('Extension context invalidated, cannot save to storage');
    }
  }

  loadStickyElements() {
    // Load any previously saved sticky elements
    try {
      if (chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['stickyElementsCount'], (result) => {
          if (chrome.runtime.lastError) {
            console.log('Extension context invalidated during storage read');
            return;
          }
          console.log('Loaded sticky elements count:', result.stickyElementsCount || 0);
        });
      }
    } catch (error) {
      console.log('Extension context invalidated, cannot load from storage');
    }
  }

  setupMessageListener() {
    // Listen for messages from popup
    try {
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
          try {
            switch (request.action) {
              case 'toggleSelection':
                this.toggleSelectionMode();
                sendResponse({ success: true });
                break;
              case 'clearAll':
                this.clearAllStickyElements();
                this.clearAllStickyScrollElements();
                sendResponse({ success: true });
                break;
              case 'getStats':
                sendResponse({ 
                  stickyCount: this.stickyElements.size,
                  stickyScrollCount: this.stickyScrollElements.size,
                  totalCount: this.stickyElements.size + this.stickyScrollElements.size,
                  selectionMode: this.isSelectionMode,
                  currentMode: this.currentMode,
                  isPDFViewer: this.isPDFViewer 
                });
                break;
            }
          } catch (error) {
            console.log('Extension context invalidated during message handling');
            sendResponse({ success: false, error: 'Extension context invalidated' });
          }
        });
      }
    } catch (error) {
      console.log('Extension context invalidated, cannot setup message listener');
    }
  }

  removeStickyNote(elementId) {
    const stickyData = this.stickyElements.get(elementId);
    if (!stickyData || stickyData.type !== 'note') return;

    // Remove accessibility visual feedback from original element
    if (stickyData.originalElement) {
      stickyData.originalElement.classList.remove('sticky-noted-element');
    }

    // Remove container from page
    stickyData.container.remove();
    
    // Remove from our tracking
    this.stickyElements.delete(elementId);
    
    // Save to storage
    this.saveStickyElements();
    
    console.log('Removed sticky note:', elementId);
  }

  toggleMinimizeNote(elementId) {
    const stickyData = this.stickyElements.get(elementId);
    if (!stickyData || stickyData.type !== 'note') return;

    const content = stickyData.container.querySelector('.sticky-note-content');
    const minimizeBtn = stickyData.container.querySelector('[data-action="minimize"]');
    
    if (stickyData.isMinimized) {
      content.style.display = 'block';
      minimizeBtn.textContent = '−';
      stickyData.isMinimized = false;
    } else {
      content.style.display = 'none';
      minimizeBtn.textContent = '+';
      stickyData.isMinimized = true;
    }
  }

  clearAllStickyElements() {
    // Remove all sticky note elements
    this.stickyElements.forEach((stickyData, elementId) => {
      if (stickyData.type === 'note') {
        this.removeStickyNote(elementId);
      } else {
        this.removeStickyElement(elementId);
      }
    });
  }
}

// Initialize the extension when the page loads
function initializeExtension() {
  try {
    // Check if extension context is valid
    if (!chrome || !chrome.runtime) {
      console.log('Extension context not available, skipping initialization');
      return;
    }
    
    new StickyScrollManager();
  } catch (error) {
    console.log('Extension context invalidated, cannot initialize');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}
