/**
 * Platform Environment Abstraction
 * 
 * Provides centralized runtime detection to cleanly distinguish between
 * the Tauri desktop shell and a standard web browser.
 */
export const Platform = {
  /**
   * Determine if the application is running inside a Tauri desktop container.
   * @returns {boolean}
   */
  isTauri() {
    return typeof window !== 'undefined' && Boolean(window.__TAURI__);
  },

  /**
   * Determine if the application is running inside a standard web browser.
   * @returns {boolean}
   */
  isBrowser() {
    return !this.isTauri();
  },

  /**
   * Initialize platform-specific root attributes and environment setup.
   */
  initialize() {
    if (typeof document !== 'undefined') {
      const platform = this.isTauri() ? 'tauri' : 'browser';
      document.documentElement.setAttribute('data-platform', platform);
    }
  }
};
