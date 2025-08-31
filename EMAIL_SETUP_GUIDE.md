# Email Setup Guide for Support Widget

## 📧 **Email Configuration Options**

The support widget currently has two email options:

### **Option 1: EmailJS (Recommended - Free)**
EmailJS allows you to send emails directly from the browser without a backend server.

#### **Setup Steps:**
1. **Sign up** at [EmailJS.com](https://www.emailjs.com/)
2. **Create an Email Service:**
   - Go to Email Services
   - Add a new service (Gmail, Outlook, etc.)
   - Note your Service ID

3. **Create an Email Template:**
   - Go to Email Templates
   - Create a new template
   - Use variables: `{{to_email}}`, `{{from_name}}`, `{{from_email}}`, `{{subject}}`, `{{message}}`
   - Note your Template ID

4. **Get your Public Key:**
   - Go to Account > API Keys
   - Copy your Public Key

5. **Update Configuration:**
   - Open `email-config.js`
   - Replace the placeholder values:
     ```javascript
     serviceId: 'YOUR_EMAILJS_SERVICE_ID',
     templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
     publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
     ```

### **Option 2: Mailto Link (Fallback)**
If EmailJS is not configured, the system will use a mailto link that opens the user's email client.

## 🔧 **Current Configuration**

The support widget is configured to send emails to: **support@lexocrates.com**

## 📋 **Email Template Example**

Here's a sample email template for EmailJS:

```html
Subject: Support Ticket: {{subject}}

New Support Ticket Received

Name: {{from_name}}
Email: {{from_email}}
Subject: {{subject}}

Message:
{{message}}

Submitted: [Current timestamp]

---
This email was sent from the Lexocrates support widget.
```

## 🚀 **Testing the Email System**

1. **Test EmailJS:**
   - Fill out a support ticket form
   - Submit the ticket
   - Check if email is received at support@lexocrates.com

2. **Test Fallback:**
   - If EmailJS fails, a mailto link should open
   - The email client should open with pre-filled information

## ⚠️ **Important Notes**

- **Free Tier Limits:** EmailJS free tier allows 200 emails/month
- **Email Delivery:** Emails may go to spam folder initially
- **Domain Verification:** Consider verifying your domain with EmailJS for better delivery

## 🔒 **Security Considerations**

- **Public Key:** The EmailJS public key is visible in the browser (this is normal and safe)
- **Rate Limiting:** EmailJS has built-in rate limiting to prevent abuse
- **Spam Protection:** EmailJS includes spam protection features

## 📞 **Support**

If you need help setting up EmailJS:
1. Check the [EmailJS documentation](https://www.emailjs.com/docs/)
2. Contact EmailJS support
3. Or use the mailto fallback option

## 🎯 **Next Steps**

1. **Set up EmailJS** (recommended)
2. **Test the email functionality**
3. **Monitor email delivery**
4. **Configure auto-responses** if needed

The support widget will work with either option, but EmailJS provides a better user experience.
