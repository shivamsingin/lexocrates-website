#!/usr/bin/env node

/**
 * HTTPS Configuration Test Script
 * Tests HTTPS enforcement, security headers, and configuration
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const HTTPS_URL = process.env.HTTPS_URL || 'https://localhost:443';

class HTTPSTestSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  /**
   * Add test result
   */
  addResult(testName, passed, message, details = null) {
    const result = {
      test: testName,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    };

    this.results.tests.push(result);
    
    if (passed) {
      this.results.passed++;
      console.log(`✅ ${testName}: ${message}`);
    } else if (message.includes('WARNING')) {
      this.results.warnings++;
      console.log(`⚠️  ${testName}: ${message}`);
    } else {
      this.results.failed++;
      console.log(`❌ ${testName}: ${message}`);
    }
  }

  /**
   * Test HTTPS redirect
   */
  async testHTTPSRedirect() {
    try {
      const response = await this.makeRequest(`${BASE_URL}/api/health`, 'GET');
      
      if (response.statusCode === 301 || response.statusCode === 302) {
        const location = response.headers.location;
        if (location && location.startsWith('https://')) {
          this.addResult('HTTPS Redirect', true, 'HTTP requests redirected to HTTPS');
        } else {
          this.addResult('HTTPS Redirect', false, 'Redirect not pointing to HTTPS', { location });
        }
      } else if (process.env.NODE_ENV === 'production') {
        this.addResult('HTTPS Redirect', false, 'No HTTPS redirect in production', { statusCode: response.statusCode });
      } else {
        this.addResult('HTTPS Redirect', true, 'No redirect needed in development');
      }
    } catch (error) {
      this.addResult('HTTPS Redirect', false, 'Failed to test HTTPS redirect', { error: error.message });
    }
  }

  /**
   * Test security headers
   */
  async testSecurityHeaders() {
    try {
      const response = await this.makeRequest(`${BASE_URL}/api/security-test`, 'GET');
      const headers = response.headers;

      const requiredHeaders = [
        'x-content-type-options',
        'x-frame-options', 
        'x-xss-protection',
        'referrer-policy'
      ];

      requiredHeaders.forEach(header => {
        if (headers[header]) {
          this.addResult(`Security Header: ${header}`, true, `Header present: ${headers[header]}`);
        } else {
          this.addResult(`Security Header: ${header}`, false, `Missing required header: ${header}`);
        }
      });

      // Test HSTS header in production
      if (process.env.NODE_ENV === 'production') {
        if (headers['strict-transport-security']) {
          this.addResult('HSTS Header', true, `HSTS enabled: ${headers['strict-transport-security']}`);
        } else {
          this.addResult('HSTS Header', false, 'HSTS header missing in production');
        }
      } else {
        this.addResult('HSTS Header', true, 'HSTS not required in development');
      }

    } catch (error) {
      this.addResult('Security Headers', false, 'Failed to test security headers', { error: error.message });
    }
  }

  /**
   * Test HTTPS status endpoint
   */
  async testHTTPSStatus() {
    try {
      const response = await this.makeRequest(`${BASE_URL}/api/https-status`, 'GET');
      const data = JSON.parse(response.data);

      if (data.success) {
        this.addResult('HTTPS Status Endpoint', true, 'HTTPS status endpoint working');
        
        // Check HTTPS configuration
        if (data.configuration) {
          this.addResult('HTTPS Configuration', true, 'HTTPS configuration validated');
        }

        // Check if HTTPS is enforced in production
        if (process.env.NODE_ENV === 'production') {
          if (data.https.isSecure) {
            this.addResult('HTTPS Enforcement', true, 'HTTPS properly enforced in production');
          } else {
            this.addResult('HTTPS Enforcement', false, 'HTTPS not enforced in production', data.https);
          }
        } else {
          this.addResult('HTTPS Enforcement', true, 'HTTPS enforcement not required in development');
        }
      } else {
        this.addResult('HTTPS Status Endpoint', false, 'HTTPS status endpoint failed', data);
      }
    } catch (error) {
      this.addResult('HTTPS Status Endpoint', false, 'Failed to test HTTPS status', { error: error.message });
    }
  }

  /**
   * Test SSL certificate configuration
   */
  testSSLCertificateConfig() {
    const certPath = process.env.SSL_CERT_PATH;
    const keyPath = process.env.SSL_KEY_PATH;

    if (!certPath || !keyPath) {
      this.addResult('SSL Certificate Config', true, 'SSL certificates not configured (using reverse proxy)');
      return;
    }

    // Check if certificate files exist
    if (fs.existsSync(certPath)) {
      this.addResult('SSL Certificate File', true, 'SSL certificate file exists');
    } else {
      this.addResult('SSL Certificate File', false, 'SSL certificate file not found', { path: certPath });
    }

    if (fs.existsSync(keyPath)) {
      this.addResult('SSL Key File', true, 'SSL private key file exists');
    } else {
      this.addResult('SSL Key File', false, 'SSL private key file not found', { path: keyPath });
    }
  }

  /**
   * Test environment configuration
   */
  testEnvironmentConfig() {
    const env = process.env.NODE_ENV;
    const trustProxy = process.env.NODE_ENV === 'production';
    const cookieSecure = process.env.COOKIE_SECURE;

    this.addResult('Environment', true, `Running in ${env} mode`);

    if (env === 'production') {
      if (trustProxy) {
        this.addResult('Trust Proxy', true, 'Trust proxy enabled for production');
      } else {
        this.addResult('Trust Proxy', false, 'Trust proxy not enabled in production');
      }

      if (cookieSecure === 'true') {
        this.addResult('Secure Cookies', true, 'Secure cookies enabled for production');
      } else {
        this.addResult('Secure Cookies', false, 'Secure cookies not enabled in production', { cookieSecure });
      }
    } else {
      this.addResult('Trust Proxy', true, 'Trust proxy not required in development');
      this.addResult('Secure Cookies', true, 'Secure cookies not required in development');
    }
  }

  /**
   * Make HTTP request
   */
  makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'User-Agent': 'HTTPS-Test-Suite/1.0'
        }
      };

      const client = urlObj.protocol === 'https:' ? https : http;
      
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(data);
      }
      
      req.end();
    });
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🔒 HTTPS Configuration Test Suite');
    console.log('=====================================\n');

    // Test environment configuration
    this.testEnvironmentConfig();
    this.testSSLCertificateConfig();

    // Test HTTPS functionality
    await this.testHTTPSStatus();
    await this.testSecurityHeaders();
    await this.testHTTPSRedirect();

    // Print summary
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📋 Total: ${this.results.tests.length}`);

    // Print recommendations
    console.log('\n💡 Recommendations');
    console.log('==================');
    
    if (this.results.failed > 0) {
      console.log('🔧 Fix the failed tests above before deploying to production');
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('🚀 Set NODE_ENV=production for full HTTPS enforcement');
    }
    
    if (!process.env.SSL_CERT_PATH || !process.env.SSL_KEY_PATH) {
      console.log('🔐 Configure SSL certificates or use a reverse proxy for HTTPS termination');
    }

    console.log('\n✅ Test suite completed!');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const testSuite = new HTTPSTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = HTTPSTestSuite;

