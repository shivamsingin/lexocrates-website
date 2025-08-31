/**
 * CSRF Token Management for Main Website
 * Handles CSRF token retrieval and form submission with CSRF protection
 */

class CSRFUtils {
  constructor() {
    this.token = null;
    this.initialize();
  }

  /**
   * Initialize CSRF token
   */
  async initialize() {
    try {
      // Try to get token from cookie first
      const cookieToken = this.getTokenFromCookie();
      if (cookieToken) {
        this.token = cookieToken;
        return cookieToken;
      }

      // Fetch new token from server
      return await this.fetchToken();
    } catch (error) {
      console.error('Failed to initialize CSRF token:', error);
      return null;
    }
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
   * Fetch CSRF token from server
   */
  async fetchToken() {
    try {
      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'same-origin'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        return data.token;
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
    return null;
  }

  /**
   * Get CSRF token for form submission
   */
  getToken() {
    return this.token;
  }

  /**
   * Add CSRF token to form
   */
  addTokenToForm(form) {
    if (!this.token) {
      console.warn('CSRF token not available');
      return;
    }

    // Remove existing CSRF token if present
    const existingToken = form.querySelector('input[name="_csrf"]');
    if (existingToken) {
      existingToken.remove();
    }

    // Add new CSRF token
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = '_csrf';
    tokenInput.value = this.token;
    form.appendChild(tokenInput);
  }

  /**
   * Submit form with CSRF protection
   */
  async submitForm(form, endpoint) {
    if (!this.token) {
      console.error('CSRF token not available');
      return { success: false, error: 'CSRF token not available' };
    }

    try {
      const formData = new FormData(form);
      formData.append('_csrf', this.token);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        headers: {
          'X-CSRF-Token': this.token
        }
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Form submission error:', error);
      return { success: false, error: 'Form submission failed' };
    }
  }

  /**
   * Submit JSON data with CSRF protection
   */
  async submitJSON(data, endpoint) {
    if (!this.token) {
      console.error('CSRF token not available');
      return { success: false, error: 'CSRF token not available' };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.token
        },
        body: JSON.stringify({
          ...data,
          _csrf: this.token
        }),
        credentials: 'same-origin'
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('JSON submission error:', error);
      return { success: false, error: 'Submission failed' };
    }
  }
}

// Create global instance
window.csrfUtils = new CSRFUtils();




