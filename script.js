// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header background change on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.service-card, .industry-card, .feature');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Form feedback message system
function showFormMessage(form, message, type = 'success') {
    // Remove any existing messages
    const existingMessage = form.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message form-message-${type}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Insert message after the form
    form.parentNode.insertBefore(messageDiv, form.nextSibling);
    
    // Auto-remove message after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Form submission handling
const contactForm = document.querySelector('.contact-form form');
const newsletterForm = document.querySelector('.newsletter-form');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Add CSRF token to form
        if (window.csrfUtils) {
            window.csrfUtils.addTokenToForm(this);
        }
        
        // Get form data
        const formData = new FormData(this);
        const firstName = this.querySelector('#firstName')?.value;
        const lastName = this.querySelector('#lastName')?.value;
        const email = this.querySelector('#email')?.value;
        const company = this.querySelector('#company')?.value;
        const services = this.querySelector('#services')?.value;
        const message = this.querySelector('#message')?.value;
        
        // Simple validation
        if (!firstName || !lastName || !email || !company || !services || !message) {
            showFormMessage(this, 'Please fill in all required fields', 'error');
            return;
        }
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showFormMessage(this, 'Please enter a valid email address', 'error');
            return;
        }
        
        // CAPTCHA validation
        if (window.captchaConfig && window.captchaConfig.isRequired()) {
            const captchaToken = window.captchaConfig.getToken();
            if (!captchaToken) {
                showFormMessage(this, 'Please complete the CAPTCHA verification', 'error');
                return;
            }
        }
        
        // Submit form with CSRF protection
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        try {
            // Add CAPTCHA token to form data if required
            if (window.captchaConfig && window.captchaConfig.isRequired()) {
                const captchaToken = window.captchaConfig.getToken();
                formData.append('captchaToken', captchaToken);
            }
            
            const result = await window.csrfUtils.submitForm(this, '/api/contact/submit');
            
            if (result.success) {
                showFormMessage(this, 'Thank you! Your message has been sent successfully. We will contact you within 24 hours.', 'success');
                this.reset();
                if (window.captchaConfig) {
                    window.captchaConfig.reset(); // Reset CAPTCHA after successful submission
                }
            } else {
                showFormMessage(this, 'Failed to send message. Please check your connection and try again.', 'error');
                if (window.captchaConfig) {
                    window.captchaConfig.reset(); // Reset CAPTCHA on error
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            showFormMessage(this, 'An error occurred while sending your message. Please try again later.', 'error');
            if (window.captchaConfig) {
                window.captchaConfig.reset(); // Reset CAPTCHA on error
            }
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Add CSRF token to form
        if (window.csrfUtils) {
            window.csrfUtils.addTokenToForm(this);
        }
        
        const email = this.querySelector('input[type="email"]').value;
        
        if (!email) {
            showFormMessage(this, 'Please enter an email address', 'error');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showFormMessage(this, 'Please enter a valid email address', 'error');
            return;
        }
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Subscribing...';
        submitBtn.disabled = true;
        
        try {
            const result = await window.csrfUtils.submitJSON({ email }, '/api/newsletter/subscribe');
            
            if (result.success) {
                showFormMessage(this, 'Thank you for subscribing! You will receive our latest news and updates.', 'success');
                this.reset();
            } else {
                showFormMessage(this, 'Failed to subscribe. Please check your connection and try again.', 'error');
            }
        } catch (error) {
            console.error('Newsletter subscription error:', error);
            showFormMessage(this, 'An error occurred while subscribing. Please try again later.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// General form handler for all forms
document.addEventListener('DOMContentLoaded', function() {
    // Handle all forms except contact and newsletter forms (which are handled separately)
    const allForms = document.querySelectorAll('form:not(.contact-form form):not(.newsletter-form)');
    
    allForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get the submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            if (!submitBtn) return;
            
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Submitting...';
            submitBtn.disabled = true;
            
            // Simple validation for email fields
            const emailInputs = this.querySelectorAll('input[type="email"]');
            let isValid = true;
            
            emailInputs.forEach(input => {
                if (input.value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(input.value)) {
                        showFormMessage(this, 'Please enter a valid email address', 'error');
                        isValid = false;
                    }
                }
            });
            
            if (!isValid) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                return;
            }
            
            // Simulate form submission (since we don't have backend endpoints for all forms)
            setTimeout(() => {
                // For newsletter forms, show success message
                if (this.querySelector('input[type="email"]') && !this.classList.contains('contact-form')) {
                    showFormMessage(this, 'Thank you for subscribing! You will receive our latest updates.', 'success');
                    this.reset();
                } else {
                    // For other forms, show generic success message
                    showFormMessage(this, 'Thank you! Your form has been submitted successfully.', 'success');
                    this.reset();
                }
                
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1000);
        });
    });
});

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + '+';
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + '+';
        }
    }, 16);
}

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stats = entry.target.querySelectorAll('.stat h3');
            stats.forEach(stat => {
                const target = parseInt(stat.textContent);
                animateCounter(stat, target);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// Add loading animation
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Service card hover effects
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Industry card hover effects
document.querySelectorAll('.industry-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px) scale(1.05)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Dark Mode Toggle Functionality
class DarkModeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.toggle = document.getElementById('darkModeToggle');
        this.init();
    }

    init() {
        // Set initial theme
        this.setTheme(this.theme);
        
        // Add event listener to toggle button
        if (this.toggle) {
            this.toggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // Listen for system theme changes
        this.watchSystemTheme();
    }

    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update toggle button state
        if (this.toggle) {
            this.toggle.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
        }
    }

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        
        // Add animation class
        document.body.classList.add('theme-transitioning');
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 300);
    }

    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem('theme')) {
                const systemTheme = mediaQuery.matches ? 'dark' : 'light';
                this.setTheme(systemTheme);
            }
            
            // Listen for system theme changes
            mediaQuery.addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }
}

// Initialize dark mode manager
document.addEventListener('DOMContentLoaded', () => {
    new DarkModeManager();
});

// Mobile menu styles are now in CSS file
