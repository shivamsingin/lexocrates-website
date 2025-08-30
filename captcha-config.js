// CAPTCHA Configuration and Management
class CAPTCHAConfig {
    constructor() {
        this.siteKey = null;
        this.isLoaded = false;
    }

    // Initialize CAPTCHA configuration
    async init() {
        try {
            // Fetch CAPTCHA site key from backend
            const response = await fetch('/api/contact/captcha-key');
            const data = await response.json();
            
            if (data.success && data.data.siteKey) {
                this.siteKey = data.data.siteKey;
                this.updateCAPTCHAWidget();
                this.isLoaded = true;
                console.log('CAPTCHA configured successfully');
            } else {
                console.warn('CAPTCHA not configured on server');
                this.hideCAPTCHAWidget();
            }
        } catch (error) {
            console.error('Failed to load CAPTCHA configuration:', error);
            this.hideCAPTCHAWidget();
        }
    }

    // Update CAPTCHA widget with site key
    updateCAPTCHAWidget() {
        const captchaWidget = document.querySelector('.g-recaptcha');
        if (captchaWidget && this.siteKey) {
            captchaWidget.setAttribute('data-sitekey', this.siteKey);
            
            // Re-render CAPTCHA if grecaptcha is available
            if (window.grecaptcha && window.grecaptcha.render) {
                grecaptcha.render(captchaWidget, {
                    'sitekey': this.siteKey
                });
            }
        }
    }

    // Hide CAPTCHA widget if not configured
    hideCAPTCHAWidget() {
        const captchaContainer = document.querySelector('.g-recaptcha')?.parentElement;
        if (captchaContainer) {
            captchaContainer.style.display = 'none';
        }
    }

    // Get CAPTCHA token
    getToken() {
        if (window.grecaptcha && window.grecaptcha.getResponse) {
            return grecaptcha.getResponse();
        }
        return null;
    }

    // Reset CAPTCHA
    reset() {
        if (window.grecaptcha && window.grecaptcha.reset) {
            grecaptcha.reset();
        }
    }

    // Check if CAPTCHA is required
    isRequired() {
        return this.isLoaded && this.siteKey;
    }
}

// Initialize CAPTCHA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.captchaConfig = new CAPTCHAConfig();
    window.captchaConfig.init();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CAPTCHAConfig;
}



