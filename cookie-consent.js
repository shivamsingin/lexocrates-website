// Cookie Consent Management
class CookieConsent {
    constructor() {
        this.cookieName = 'lexocrates_cookie_consent';
        this.cookieExpiry = 365; // days
        this.init();
    }

    init() {
        if (!this.hasConsent()) {
            this.showBanner();
        }
    }

    hasConsent() {
        return this.getCookie(this.cookieName) === 'accepted';
    }

    showBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-consent-text">
                    <h4>🍪 Cookie Notice</h4>
                    <p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies as described in our <a href="cookie-policy.html" target="_blank">Cookie Policy</a>.</p>
                    <div class="cookie-consent-options">
                        <label class="cookie-option">
                            <input type="checkbox" id="essential-cookies" checked disabled>
                            <span>Essential Cookies (Required)</span>
                        </label>
                        <label class="cookie-option">
                            <input type="checkbox" id="analytics-cookies">
                            <span>Analytics Cookies</span>
                        </label>
                        <label class="cookie-option">
                            <input type="checkbox" id="marketing-cookies">
                            <span>Marketing Cookies</span>
                        </label>
                    </div>
                </div>
                <div class="cookie-consent-buttons">
                    <button id="accept-all-cookies" class="btn btn-primary">Accept All</button>
                    <button id="accept-essential-cookies" class="btn btn-secondary">Essential Only</button>
                    <button id="customize-cookies" class="btn btn-outline">Customize</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('accept-all-cookies').addEventListener('click', () => {
            this.acceptAll();
        });

        document.getElementById('accept-essential-cookies').addEventListener('click', () => {
            this.acceptEssential();
        });

        document.getElementById('customize-cookies').addEventListener('click', () => {
            this.showCustomizeModal();
        });
    }

    acceptAll() {
        this.setCookie(this.cookieName, 'accepted', this.cookieExpiry);
        this.setCookie('analytics_cookies', 'accepted', this.cookieExpiry);
        this.setCookie('marketing_cookies', 'accepted', this.cookieExpiry);
        this.hideBanner();
        this.showSuccessMessage('All cookies accepted');
    }

    acceptEssential() {
        this.setCookie(this.cookieName, 'accepted', this.cookieExpiry);
        this.setCookie('analytics_cookies', 'declined', this.cookieExpiry);
        this.setCookie('marketing_cookies', 'declined', this.cookieExpiry);
        this.hideBanner();
        this.showSuccessMessage('Essential cookies only accepted');
    }

    showCustomizeModal() {
        const modal = document.createElement('div');
        modal.id = 'cookie-customize-modal';
        modal.innerHTML = `
            <div class="cookie-modal-content">
                <div class="cookie-modal-header">
                    <h3>🍪 Cookie Preferences</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="cookie-modal-body">
                    <div class="cookie-category">
                        <h4>Essential Cookies</h4>
                        <p>These cookies are necessary for the website to function properly. They cannot be disabled.</p>
                        <div class="cookie-details">
                            <strong>Purpose:</strong> Security, session management, basic functionality<br>
                            <strong>Duration:</strong> Session to 1 year<br>
                            <strong>Examples:</strong> CSRF tokens, authentication, language preferences
                        </div>
                    </div>
                    
                    <div class="cookie-category">
                        <h4>Analytics Cookies</h4>
                        <p>These cookies help us understand how visitors interact with our website.</p>
                        <div class="cookie-details">
                            <strong>Purpose:</strong> Website analytics, performance monitoring<br>
                            <strong>Duration:</strong> 1-2 years<br>
                            <strong>Examples:</strong> Google Analytics, page views, user behavior
                        </div>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="analytics-toggle">
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Enable Analytics Cookies</span>
                        </label>
                    </div>
                    
                    <div class="cookie-category">
                        <h4>Marketing Cookies</h4>
                        <p>These cookies are used to deliver relevant advertisements and track marketing campaign performance.</p>
                        <div class="cookie-details">
                            <strong>Purpose:</strong> Marketing, advertising, retargeting<br>
                            <strong>Duration:</strong> 1-2 years<br>
                            <strong>Examples:</strong> Google Ads, Facebook Pixel, LinkedIn Insights
                        </div>
                        <label class="cookie-toggle">
                            <input type="checkbox" id="marketing-toggle">
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Enable Marketing Cookies</span>
                        </label>
                    </div>
                </div>
                <div class="cookie-modal-footer">
                    <button id="save-preferences" class="btn btn-primary">Save Preferences</button>
                    <button id="cancel-preferences" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.bindModalEvents();
    }

    bindModalEvents() {
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('cancel-preferences').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('save-preferences').addEventListener('click', () => {
            const analytics = document.getElementById('analytics-toggle').checked;
            const marketing = document.getElementById('marketing-toggle').checked;
            
            this.setCookie(this.cookieName, 'accepted', this.cookieExpiry);
            this.setCookie('analytics_cookies', analytics ? 'accepted' : 'declined', this.cookieExpiry);
            this.setCookie('marketing_cookies', marketing ? 'accepted' : 'declined', this.cookieExpiry);
            
            this.hideModal();
            this.hideBanner();
            this.showSuccessMessage('Cookie preferences saved');
        });
    }

    hideModal() {
        const modal = document.getElementById('cookie-customize-modal');
        if (modal) {
            modal.remove();
        }
    }

    hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.animation = 'slideOutDown 0.5s ease-in-out';
            setTimeout(() => {
                banner.remove();
            }, 500);
        }
    }

    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'cookie-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.5s ease-in-out';
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }

    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
}

// Initialize cookie consent when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CookieConsent();
});
