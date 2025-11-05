/**
 * Browser compatibility utilities
 * Detects browser features and provides fallbacks
 */

export const browserCompatibility = {
  /**
   * Check if browser supports WebRTC
   */
  supportsWebRTC: () => {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  },

  /**
   * Check if browser supports IndexedDB
   */
  supportsIndexedDB: () => {
    return !!(window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB);
  },

  /**
   * Check if browser supports localStorage
   */
  supportsLocalStorage: () => {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Check if browser supports CSS Grid
   */
  supportsCSSGrid: () => {
    return CSS.supports('display', 'grid');
  },

  /**
   * Check if browser supports Flexbox
   */
  supportsFlexbox: () => {
    return CSS.supports('display', 'flex');
  },

  /**
   * Get browser name and version
   */
  getBrowserInfo: () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';

    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('Edg') > -1) {
      browser = 'Edge';
      const match = ua.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) {
      browser = 'IE';
      const match = ua.match(/(?:MSIE |rv:)(\d+)/);
      version = match ? match[1] : 'Unknown';
    }

    return { browser, version };
  },

  /**
   * Check if browser is supported
   */
  isBrowserSupported: () => {
    const info = browserCompatibility.getBrowserInfo();
    
    // Block IE
    if (info.browser === 'IE') {
      return false;
    }

    // Check minimum version requirements
    if (info.browser === 'Chrome' && parseInt(info.version) < 60) {
      return false;
    }
    if (info.browser === 'Firefox' && parseInt(info.version) < 55) {
      return false;
    }
    if (info.browser === 'Safari' && parseInt(info.version) < 11) {
      return false;
    }
    if (info.browser === 'Edge' && parseInt(info.version) < 79) {
      return false;
    }

    // Check for required features
    if (!browserCompatibility.supportsWebRTC()) {
      return false;
    }

    return true;
  },

  /**
   * Show browser compatibility warning
   */
  showCompatibilityWarning: () => {
    if (!browserCompatibility.isBrowserSupported()) {
      const info = browserCompatibility.getBrowserInfo();
      const warning = document.createElement('div');
      warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        padding: 16px;
        text-align: center;
        z-index: 10000;
        font-weight: 600;
      `;
      warning.textContent = `Your browser (${info.browser} ${info.version}) may not be fully supported. Please use Chrome, Firefox, Safari, or Edge (latest versions).`;
      document.body.appendChild(warning);

      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (warning.parentNode) {
          warning.parentNode.removeChild(warning);
        }
      }, 10000);
    }
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      browserCompatibility.showCompatibilityWarning();
    });
  } else {
    browserCompatibility.showCompatibilityWarning();
  }
}

export default browserCompatibility;

