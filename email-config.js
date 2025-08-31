// Email Configuration for Support Widget
// This file contains configuration for email services used by the support widget

// EmailJS Configuration
const EMAIL_CONFIG = {
    // EmailJS Service ID (you'll get this when you create a service)
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    
    // EmailJS Template ID (you'll get this when you create a template)
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
    
    // EmailJS Public Key (you'll get this from your EmailJS dashboard)
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
    
    // Support email address
    supportEmail: 'support@lexocrates.com',
    
    // Company name
    companyName: 'Lexocrates',
    
    // Auto-response message
    autoResponse: {
        subject: 'Support Ticket Received - Lexocrates',
        message: `Thank you for contacting Lexocrates support.

We have received your support ticket and will get back to you within 24 hours.

If this is an urgent matter, please call us at +91 94140 80184.

Best regards,
The Lexocrates Support Team`
    }
};

// Initialize EmailJS if available
if (typeof emailjs !== 'undefined') {
    emailjs.init(EMAIL_CONFIG.publicKey);
}

// Email sending function
async function sendSupportEmail(ticketData) {
    try {
        if (typeof emailjs !== 'undefined') {
            // Use EmailJS if available
            const templateParams = {
                to_email: EMAIL_CONFIG.supportEmail,
                from_name: ticketData.name,
                from_email: ticketData.email,
                subject: `Support Ticket: ${ticketData.subject}`,
                message: `
New Support Ticket Received

Name: ${ticketData.name}
Email: ${ticketData.email}
Category: ${ticketData.category}
Priority: ${ticketData.priority}
Subject: ${ticketData.subject}

Message:
${ticketData.message}

Submitted: ${new Date(ticketData.timestamp).toLocaleString()}
                `
            };

            return await emailjs.send(EMAIL_CONFIG.serviceId, EMAIL_CONFIG.templateId, templateParams);
        } else {
            // Fallback: Use mailto link
            const mailtoLink = `mailto:${EMAIL_CONFIG.supportEmail}?subject=Support Ticket: ${encodeURIComponent(ticketData.subject)}&body=${encodeURIComponent(`
New Support Ticket Received

Name: ${ticketData.name}
Email: ${ticketData.email}
Category: ${ticketData.category}
Priority: ${ticketData.priority}
Subject: ${ticketData.subject}

Message:
${ticketData.message}

Submitted: ${new Date(ticketData.timestamp).toLocaleString()}
            `)}`;
            
            window.open(mailtoLink);
            return Promise.resolve();
        }
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EMAIL_CONFIG, sendSupportEmail };
}
