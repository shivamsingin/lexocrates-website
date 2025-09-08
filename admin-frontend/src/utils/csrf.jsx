import axios from 'axios';

/**
 * CSRF Token Management Utility
 * Handles CSRF token retrieval, storage, and automatic inclusion in requests
 */

class CSRFManager {
  constructor() {
    this.token = null;
    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for automatic CSRF token inclusion
   */
  setupInterceptors() {
    // Request interceptor to add CSRF token to all requests
    axios.interceptors.request.use(
      (config) => {
        // Add CSRF token to headers for state-changing requests
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
          const token = this.getToken();
          if (token) {
            config.headers['X-CSRF-Token'] = token;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle CSRF token refresh
    axios.interceptors.response.use(
      (response) => {
        // Check if response contains a new CSRF token
        const newToken = response.headers['x-csrf-token'] || response.data?.csrfToken;
        if (newToken) {
          this.setToken(newToken);
        }
        return response;
      },
      (error) => {
        // Handle CSRF token errors
        if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
          console.warn('CSRF token validation failed, refreshing token...');
          this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get CSRF token from cookie or localStorage
   */
  getToken() {
    if (this.token) {
      return this.token;
    }

    // Try to get from cookie first
    const cookieToken = this.getTokenFromCookie();
    if (cookieToken) {
      this.token = cookieToken;
      return cookieToken;
    }

    // Try to get from localStorage
    const storedToken = localStorage.getItem('csrfToken');
    if (storedToken) {
      this.token = storedToken;
      return storedToken;
    }

    return null;
  }

  /**
   * Get CSRF token from cookies
   */
  getTokenFromCookie() {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'XSRF-TOKEN') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Set CSRF token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('csrfToken', token);
  }

  /**
   * Clear CSRF token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('csrfToken');
  }

  /**
   * Refresh CSRF token by making a request to get a new one
   */
  async refreshToken() {
    try {
      const response = await axios.get('/api/csrf-token');
      const newToken = response.data.token || response.data.csrfToken;
      if (newToken) {
        this.setToken(newToken);
        return newToken;
      }
    } catch (error) {
      console.error('Failed to refresh CSRF token:', error);
    }
    return null;
  }

  /**
   * Initialize CSRF token on app startup
   */
  async initialize() {
    try {
      // Try to get token from existing cookie
      const existingToken = this.getTokenFromCookie();
      if (existingToken) {
        this.setToken(existingToken);
        return existingToken;
      }

      // Fetch new token from server
      return await this.refreshToken();
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
      return null;
    }
  }

  /**
   * Get CSRF token for form submission
   */
  getFormToken() {
    const token = this.getToken();
    return token ? `<input type="hidden" name="_csrf" value="${token}">` : '';
  }

  /**
   * Get CSRF token for AJAX requests
   */
  getAjaxToken() {
    return this.getToken();
  }
}

// Create singleton instance
const csrfManager = new CSRFManager();

export default csrfManager;

