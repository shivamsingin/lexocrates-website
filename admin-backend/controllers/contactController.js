const { InputSanitizer, ValidationRules, CAPTCHA } = require('../middleware/security');
const nodemailer = require('nodemailer');

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message, captchaToken } = req.body;

    // Additional server-side validation
    if (!name || !email || !subject || !message || !captchaToken) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required including CAPTCHA verification'
      });
    }

    // Verify CAPTCHA
    const captchaValid = await CAPTCHA.verify(captchaToken, process.env.RECAPTCHA_SECRET_KEY);
    if (!captchaValid) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed. Please try again.'
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      name: InputSanitizer.sanitizeText(name),
      email: InputSanitizer.sanitizeText(email),
      subject: InputSanitizer.sanitizeText(subject),
      message: InputSanitizer.sanitizeText(message)
    };

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Send email (if email service is configured)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const mailOptions = {
          from: process.env.EMAIL_FROM || 'noreply@lexocrates.com',
          to: process.env.CONTACT_EMAIL || 'contact@lexocrates.com',
          subject: `Contact Form: ${sanitizedData.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${sanitizedData.name}</p>
            <p><strong>Email:</strong> ${sanitizedData.email}</p>
            <p><strong>Subject:</strong> ${sanitizedData.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${sanitizedData.message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Submitted on: ${new Date().toISOString()}</small></p>
          `
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the request if email fails, just log it
      }
    }

    // Store in database (optional)
    // You could create a Contact model and store submissions

    res.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your message. Please try again.'
    });
  }
};

// @desc    Get CAPTCHA site key (for frontend)
// @route   GET /api/contact/captcha-key
// @access  Public
const getCaptchaKey = async (req, res) => {
  try {
    const siteKey = process.env.RECAPTCHA_SITE_KEY;
    
    if (!siteKey) {
      return res.status(500).json({
        success: false,
        message: 'CAPTCHA not configured'
      });
    }

    res.json({
      success: true,
      data: {
        siteKey
      }
    });
  } catch (error) {
    console.error('CAPTCHA key error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving CAPTCHA configuration'
    });
  }
};

module.exports = {
  submitContactForm,
  getCaptchaKey
};
