// Support Widget Management
class SupportWidget {
    constructor() {
        this.isOpen = false;
        this.currentInterface = 'welcome';
        this.chatHistory = [];
        this.botHistory = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadChatbotResponses();
    }

    bindEvents() {
        // Widget toggle
        document.getElementById('widgetToggle').addEventListener('click', () => {
            this.toggleWidget();
        });

        // Close widget
        document.getElementById('closeWidget').addEventListener('click', () => {
            this.closeWidget();
        });

        // Support options
        document.querySelectorAll('.support-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const interfaceType = e.currentTarget.getAttribute('data-interface');
                this.switchInterface(interfaceType);
            });
        });

        // Chat interface
        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Bot interface
        document.getElementById('sendBotMessage').addEventListener('click', () => {
            this.sendBotMessage();
        });

        document.getElementById('botInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendBotMessage();
            }
        });

        // Ticket form
        document.getElementById('ticketForm').addEventListener('submit', (e) => {
            this.submitTicket(e);
        });
    }

    toggleWidget() {
        const container = document.getElementById('widgetContainer');
        const toggle = document.getElementById('widgetToggle');
        
        if (this.isOpen) {
            container.style.display = 'none';
            this.isOpen = false;
            toggle.classList.remove('active');
        } else {
            container.style.display = 'block';
            this.isOpen = true;
            toggle.classList.add('active');
            this.showNotification();
        }
    }

    closeWidget() {
        const container = document.getElementById('widgetContainer');
        const toggle = document.getElementById('widgetToggle');
        
        container.style.display = 'none';
        this.isOpen = false;
        toggle.classList.remove('active');
    }

    switchInterface(interfaceType) {
        // Hide all interfaces
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('chatInterface').style.display = 'none';
        document.getElementById('botInterface').style.display = 'none';
        document.getElementById('ticketInterface').style.display = 'none';

        // Show selected interface
        switch (interfaceType) {
            case 'chat':
                document.getElementById('chatInterface').style.display = 'block';
                this.currentInterface = 'chat';
                break;
            case 'bot':
                document.getElementById('botInterface').style.display = 'block';
                this.currentInterface = 'bot';
                break;
            case 'ticket':
                document.getElementById('ticketInterface').style.display = 'block';
                this.currentInterface = 'ticket';
                break;
        }
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message) {
            this.addMessage('chat', message, 'user');
            input.value = '';
            
            // Simulate agent response
            setTimeout(() => {
                this.simulateAgentResponse(message);
            }, 1000);
        }
    }

    sendBotMessage() {
        const input = document.getElementById('botInput');
        const message = input.value.trim();
        
        if (message) {
            this.addMessage('bot', message, 'user');
            input.value = '';
            
            // Get bot response
            setTimeout(() => {
                const response = this.getBotResponse(message);
                this.addMessage('bot', response, 'bot');
            }, 500);
        }
    }

    addMessage(interfaceType, message, sender) {
        const messagesContainer = document.getElementById(interfaceType === 'chat' ? 'chatMessages' : 'botMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = sender === 'user' ? 'fas fa-user' : (interfaceType === 'chat' ? 'fas fa-headset' : 'fas fa-robot');
        const senderName = sender === 'user' ? 'You' : (interfaceType === 'chat' ? 'Support Agent' : 'Lexi AI');
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="${avatar}"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
                <span class="message-time">${this.getCurrentTime()}</span>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        
        // Ensure scrolling works by adding a small delay
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 10);
        
        // Store in history
        if (interfaceType === 'chat') {
            this.chatHistory.push({ message, sender, timestamp: new Date() });
        } else {
            this.botHistory.push({ message, sender, timestamp: new Date() });
        }
    }

    simulateAgentResponse(userMessage) {
        const responses = [
            "Thank you for your message. I'm here to help you with any questions about our legal services.",
            "I understand your inquiry. Let me connect you with the appropriate team member who can assist you better.",
            "That's a great question! Our team specializes in this area and would be happy to provide detailed information.",
            "I appreciate you reaching out. For the most accurate and detailed response, I recommend creating a support ticket so our legal experts can assist you directly.",
            "Thank you for contacting Lexocrates. I'm forwarding your inquiry to our specialized team who will get back to you within 24 hours."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage('chat', randomResponse, 'agent');
    }

    loadChatbotResponses() {
        this.botResponses = {
            // Service Information
            'services': {
                keywords: ['services', 'offer', 'provide', 'legal services', 'what do you do'],
                response: "Lexocrates offers comprehensive legal process outsourcing services including:\n\n• Legal Research & Writing\n• Contract Drafting & Review\n• Litigation Support\n• eDiscovery & Document Review\n• Legal Transcription\n• Legal Translation\n• Legal Data Entry\n• Virtual Paralegal Services\n\nWould you like more details about any specific service?"
            },
            'pricing': {
                keywords: ['price', 'cost', 'fee', 'how much', 'pricing', 'rates'],
                response: "Our pricing varies based on the complexity and scope of your project. We offer:\n\n• Hourly rates for ongoing support\n• Project-based pricing for specific deliverables\n• Retainer agreements for long-term partnerships\n• Custom quotes for enterprise clients\n\nFor a detailed quote, please create a support ticket and we'll provide a personalized estimate within 24 hours."
            },
            'process': {
                keywords: ['process', 'how it works', 'workflow', 'procedure', 'steps'],
                response: "Our process is simple and efficient:\n\n1. **Initial Consultation** - We discuss your requirements\n2. **Project Planning** - Define scope, timeline, and deliverables\n3. **Execution** - Our expert team works on your project\n4. **Quality Review** - Multi-level quality assurance\n5. **Delivery** - Timely delivery with detailed reports\n\nWe maintain regular communication throughout the process to ensure your satisfaction."
            },
            'contact': {
                keywords: ['contact', 'reach', 'phone', 'email', 'speak to someone'],
                response: "You can reach us through multiple channels:\n\n📞 **Phone:** +91 94140 80184\n📧 **Email:** info@lexocrates.com\n📍 **Address:** B-1402 Mangalam The Grand Residency, Near Teoler School, Sirsi Road, Jaipur, Rajasthan, India\n\nFor immediate assistance, you can also create a support ticket and we'll respond within 24 hours."
            },
            'experience': {
                keywords: ['experience', 'years', 'background', 'expertise', 'qualified'],
                response: "Lexocrates has extensive experience in legal process outsourcing:\n\n• **Industry Experience:** 10+ years serving law firms and corporations\n• **Expert Team:** Qualified legal professionals with specialized expertise\n• **Global Reach:** Serving clients across Canada\n• **Quality Standards:** ISO-certified processes and quality assurance\n• **Technology:** Advanced tools and secure infrastructure\n\nWe've successfully completed thousands of projects across various legal domains."
            },
            'security': {
                keywords: ['security', 'confidential', 'privacy', 'data protection', 'secure'],
                response: "Security and confidentiality are our top priorities:\n\n🔒 **Data Protection:** AES-256 encryption for all data\n🛡️ **Access Control:** Role-based access and multi-factor authentication\n🌐 **Secure Infrastructure:** Enterprise-grade cloud security\n📋 **NDA Protection:** Comprehensive confidentiality agreements\n🔍 **Audit Trails:** Complete activity logging and monitoring\n\nWe comply with GDPR, CCPA, and other international data protection regulations."
            },
            'industries': {
                keywords: ['industries', 'sectors', 'clients', 'who do you serve'],
                response: "We serve clients across multiple industries:\n\n🏦 **Financial Services** - Banking, insurance, investment firms\n🏥 **Healthcare** - Hospitals, pharmaceutical companies, medical devices\n💻 **Technology** - Software companies, startups, tech corporations\n🏭 **Manufacturing** - Industrial companies, supply chain management\n🛍️ **Retail** - E-commerce, retail chains, consumer goods\n🎓 **Education** - Universities, educational institutions\n\nOur legal expertise spans across all major business sectors."
            },
            'timeline': {
                keywords: ['timeline', 'duration', 'how long', 'delivery time', 'turnaround'],
                response: "Our delivery timelines depend on project complexity:\n\n⚡ **Urgent Projects:** 24-48 hours (rush service available)\n📅 **Standard Projects:** 3-7 business days\n📋 **Complex Projects:** 1-2 weeks\n📊 **Large-scale Projects:** 2-4 weeks\n\nWe always provide realistic timelines upfront and keep you updated on progress. Rush services are available for urgent matters."
            },
            'default': {
                response: "Thank you for your question! I'm Lexi, your AI assistant at Lexocrates. I can help you with:\n\n• Service information and pricing\n• Process explanations and timelines\n• Contact information and support\n• Security and confidentiality details\n\nFor specific legal advice or detailed quotes, I recommend creating a support ticket so our legal experts can assist you directly. How else can I help you today?"
            }
        };
    }

    getBotResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Check for matching responses
        for (const [key, data] of Object.entries(this.botResponses)) {
            if (key === 'default') continue;
            
            for (const keyword of data.keywords) {
                if (message.includes(keyword)) {
                    return data.response;
                }
            }
        }
        
        // Return default response
        return this.botResponses.default.response;
    }

    async submitTicket(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const ticketData = {
            name: formData.get('ticketName') || document.getElementById('ticketName').value,
            email: formData.get('ticketEmail') || document.getElementById('ticketEmail').value,
            subject: formData.get('ticketSubject') || document.getElementById('ticketSubject').value,
            category: formData.get('ticketCategory') || document.getElementById('ticketCategory').value,
            message: formData.get('ticketMessage') || document.getElementById('ticketMessage').value,
            priority: formData.get('ticketPriority') || document.getElementById('ticketPriority').value,
            timestamp: new Date().toISOString()
        };

        try {
            // Send email using EmailJS or similar service
            await this.sendTicketEmail(ticketData);
            
            // Show success message
            this.showTicketConfirmation(ticketData);
            
            // Reset form
            e.target.reset();
            
        } catch (error) {
            console.error('Error submitting ticket:', error);
            this.showTicketError();
        }
    }

    async sendTicketEmail(ticketData) {
        // Use the email configuration
        if (typeof sendSupportEmail !== 'undefined') {
            return await sendSupportEmail(ticketData);
        } else {
            // Fallback: Use a simple mailto link
            const mailtoLink = `mailto:support@lexocrates.com?subject=Support Ticket: ${encodeURIComponent(ticketData.subject)}&body=${encodeURIComponent(`
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
    }

    showTicketConfirmation(ticketData) {
        const ticketInterface = document.getElementById('ticketInterface');
        ticketInterface.innerHTML = `
            <div class="ticket-confirmation">
                <div class="confirmation-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4>Ticket Submitted Successfully!</h4>
                <p>Thank you for contacting us. We've received your support ticket and will get back to you within 24 hours.</p>
                
                <div class="ticket-details">
                    <h5>Ticket Details:</h5>
                    <p><strong>Subject:</strong> ${ticketData.subject}</p>
                    <p><strong>Category:</strong> ${ticketData.category}</p>
                    <p><strong>Priority:</strong> ${ticketData.priority}</p>
                    <p><strong>Reference:</strong> #${Date.now().toString().slice(-6)}</p>
                </div>
                
                <button class="btn-back" onclick="supportWidget.switchInterface('welcome')">
                    <i class="fas fa-arrow-left"></i>
                    Back to Support Options
                </button>
            </div>
        `;
    }

    showTicketError() {
        const ticketInterface = document.getElementById('ticketInterface');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ticket-error';
        errorDiv.innerHTML = `
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h4>Submission Error</h4>
            <p>We encountered an issue submitting your ticket. Please try again or contact us directly at support@lexocrates.com</p>
        `;
        
        ticketInterface.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showNotification() {
        const badge = document.getElementById('notificationBadge');
        badge.style.display = 'block';
        badge.textContent = '1';
    }

    hideNotification() {
        const badge = document.getElementById('notificationBadge');
        badge.style.display = 'none';
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// Initialize support widget
let supportWidget;
document.addEventListener('DOMContentLoaded', () => {
    supportWidget = new SupportWidget();
});

// Add CSS for ticket confirmation
const style = document.createElement('style');
style.textContent = `
    .ticket-confirmation {
        text-align: center;
        padding: 2rem;
    }
    
    .confirmation-icon {
        font-size: 3rem;
        color: #10b981;
        margin-bottom: 1rem;
    }
    
    .ticket-confirmation h4 {
        color: #1f2937;
        margin-bottom: 1rem;
    }
    
    .ticket-confirmation p {
        color: #6b7280;
        margin-bottom: 2rem;
    }
    
    .ticket-details {
        background: #f9fafb;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        text-align: left;
    }
    
    .ticket-details h5 {
        color: #1f2937;
        margin-bottom: 1rem;
    }
    
    .ticket-details p {
        margin-bottom: 0.5rem;
        color: #6b7280;
    }
    
    .btn-back {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 auto;
        transition: all 0.3s ease;
    }
    
    .btn-back:hover {
        background: #2563eb;
        transform: translateY(-1px);
    }
    
    .ticket-error {
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #dc2626;
        padding: 1rem;
        border-radius: 6px;
        margin-top: 1rem;
        text-align: center;
    }
    
    .error-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }
`;
document.head.appendChild(style);
