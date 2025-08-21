// Popup Script for Sticky Scroll Extension
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('toggle-selection');
  const clearBtn = document.getElementById('clear-all');
  const stickyCountEl = document.getElementById('sticky-count');
  const selectionStatusEl = document.getElementById('selection-status');

  // Initialize popup
  init();

  function init() {
    updateStats();
    setupEventListeners();
  }

  function setupEventListeners() {
    toggleBtn.addEventListener('click', handleToggleSelection);
    clearBtn.addEventListener('click', handleClearAll);
  }

  async function handleToggleSelection() {
    try {
      // Add loading state
      toggleBtn.classList.add('btn-loading');
      toggleBtn.disabled = true;

      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleSelection' 
      });

      if (response?.success) {
        // Update stats after short delay to allow content script to update
        setTimeout(updateStats, 100);
      }
    } catch (error) {
      console.error('Error toggling selection mode:', error);
      showError('Could not toggle selection mode. Please refresh the page and try again.');
    } finally {
      // Remove loading state
      toggleBtn.classList.remove('btn-loading');
      toggleBtn.disabled = false;
    }
  }

  async function handleClearAll() {
    try {
      // Add loading state
      clearBtn.classList.add('btn-loading');
      clearBtn.disabled = true;

      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'clearAll' 
      });

      if (response?.success) {
        // Update stats immediately
        stickyCountEl.textContent = '0';
        stickyCountEl.className = 'status-value inactive';
        
        // Show success feedback
        showSuccess('All pins cleared!');
      }
    } catch (error) {
      console.error('Error clearing pins:', error);
      showError('Could not clear pins. Please try again.');
    } finally {
      // Remove loading state
      clearBtn.classList.remove('btn-loading');
      clearBtn.disabled = false;
    }
  }

  async function updateStats() {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script to get stats
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'getStats' 
      });

      if (response) {
        // Update sticky count (show total count)
        const totalCount = response.totalCount || 0;
        const noteCount = response.stickyCount || 0;
        const scrollCount = response.stickyScrollCount || 0;
        
        stickyCountEl.textContent = `${totalCount} (📝${noteCount} 📌${scrollCount})`;
        stickyCountEl.className = totalCount > 0 
          ? 'status-value active' 
          : 'status-value inactive';

        // Update selection mode status
        const modeText = response.selectionMode ? 'On' : 'Off';
        const pdfText = response.isPDFViewer ? ' (PDF)' : '';
        selectionStatusEl.textContent = modeText + pdfText;
        selectionStatusEl.className = response.selectionMode 
          ? 'status-value active' 
          : 'status-value inactive';

        // Update button text based on selection mode
        const btnText = response.selectionMode 
          ? 'Exit Selection Mode' 
          : 'Enter Selection Mode';
        toggleBtn.querySelector('span:last-child').textContent = btnText;
      }
    } catch (error) {
      console.error('Error getting stats:', error);
      // Set default values if we can't communicate with content script
      stickyCountEl.textContent = '?';
      stickyCountEl.className = 'status-value inactive';
      selectionStatusEl.textContent = 'Unknown';
      selectionStatusEl.className = 'status-value inactive';
    }
  }

  function showSuccess(message) {
    showToast(message, 'success');
  }

  function showError(message) {
    showToast(message, 'error');
  }

  function showToast(message, type) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add toast styles
    Object.assign(toast.style, {
      position: 'fixed',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 15px',
      borderRadius: '6px',
      color: 'white',
      fontSize: '12px',
      fontWeight: '600',
      zIndex: '10000',
      opacity: '0',
      transition: 'opacity 0.3s ease',
      backgroundColor: type === 'success' ? '#4CAF50' : '#ff4444'
    });

    // Add to popup
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => {
      toast.style.opacity = '1';
    }, 10);

    // Hide and remove toast
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }

  // Update stats periodically while popup is open
  const statsInterval = setInterval(updateStats, 2000);

  // Clean up interval when popup closes
  window.addEventListener('beforeunload', () => {
    clearInterval(statsInterval);
  });

  // Handle keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + Space to toggle selection mode
    if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
      event.preventDefault();
      handleToggleSelection();
    }
    
    // Ctrl/Cmd + Delete to clear all
    if ((event.ctrlKey || event.metaKey) && event.key === 'Delete') {
      event.preventDefault();
      handleClearAll();
    }
  });

  // Add version info (you can update this)
  const version = chrome.runtime.getManifest().version;
  console.log(`Sticky Scroll Extension v${version} loaded`);
});
