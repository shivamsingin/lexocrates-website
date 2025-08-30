// Support Widget JavaScript
class SupportWidget {
    constructor() {
        this.isOpen = false;
        this.currentInterface = 'welcome';
        this.chatHistory = [];
        this.botHistory = [];
        this.typingTimer = null;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadChatbotResponses();
        this.showNotification();
    }

    bindEvents() {
        // Widget toggle
        const widgetToggle = document.getElementById('widgetToggle');
        const closeWidget = document.getElementById('closeWidget');
        const widgetContainer = document.getElementById('widgetContainer');

        widgetToggle.addEventListener('click', () => this.toggleWidget());
        closeWidget.addEventListener('click', () => this.closeWidget());

        // Support options
        document.querySelectorAll('.support-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const optionType = e.currentTarget.dataset.option;
                this.switchInterface(optionType);
            });
        });

        // Chat functionality
        const chatInput = document.getElementById('chatInput');
        const sendMessage = document.getElementById('sendMessage');

        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        sendMessage.addEventListener('click', () => this.sendChatMessage());

        // Bot functionality
        const botInput = document.getElementById('botInput');
        const sendBotMessage = document.getElementById('sendBotMessage');

        botInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendBotMessage();
            }
        });

        sendBotMessage.addEventListener('click', () => this.sendBotMessage());

        // Ticket form
        const ticketForm = document.getElementById('ticketForm');
        ticketForm.addEventListener('submit', (e) => this.submitTicket(e));
    }

    toggleWidget() {
        const widgetContainer = document.getElementById('widgetContainer');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            widgetContainer.classList.add('active');
            this.hideNotification();
        } else {
            widgetContainer.classList.remove('active');
        }
    }

    closeWidget() {
        const widgetContainer = document.getElementById('widgetContainer');
        this.isOpen = false;
        widgetContainer.classList.remove('active');
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
                document.getElementById('chatInterface').style.display = 'flex';
                this.currentInterface = 'chat';
                break;
            case 'bot':
                document.getElementById('botInterface').style.display = 'flex';
                this.currentInterface = 'bot';
                break;
            case 'ticket':
                document.getElementById('ticketInterface').style.display = 'block';
                this.currentInterface = 'ticket';
                break;
        }
    }

    sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage('chat', message, 'user');
        chatInput.value = '';

        // Simulate agent response
        setTimeout(() => {
            this.simulateAgentResponse(message);
        }, 1000);
    }

    sendBotMessage() {
        const botInput = document.getElementById('botInput');
        const message = botInput.value.trim();
        
        if (!message) return;

        // Add user message
        this.addMessage('bot', message, 'user');
        botInput.value = '';

        // Get bot response
        setTimeout(() => {
            const botResponse = this.getBotResponse(message);
            this.addMessage('bot', botResponse, 'bot');
        }, 800);
    }

    addMessage(interfaceType, message, sender) {
        const messagesContainer = document.getElementById(
            interfaceType === 'chat' ? 'chatMessages' : 'botMessages'
        );

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        if (sender === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else if (sender === 'agent') {
            avatar.innerHTML = '<i class="fas fa-headset"></i>';
        } else if (sender === 'bot') {
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
        }

        const content = document.createElement('div');
        content.className = 'message-content';
        
        const messageText = document.createElement('p');
        messageText.textContent = message;
        
        const time = document.createElement('span');
        time.className = 'message-time';
        time.textContent = this.getCurrentTime();

        content.appendChild(messageText);
        content.appendChild(time);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Store in history
        if (interfaceType === 'chat') {
            this.chatHistory.push({ sender, message, time: this.getCurrentTime() });
        } else {
            this.botHistory.push({ sender, message, time: this.getCurrentTime() });
        }
    }

    simulateAgentResponse(userMessage) {
        const responses = [
            "Thank you for your message. I'm here to help you with any questions about our legal services.",
            "I understand your inquiry. Let me provide you with the information you need.",
            "That's a great question! Let me check our database and get back to you with the details.",
            "I appreciate you reaching out. Our team will review your request and respond accordingly.",
            "Thank you for contacting Lexocrates support. How can I assist you further?"
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage('chat', randomResponse, 'agent');
    }

    loadChatbotResponses() {
        this.botResponses = {
            'service': {
                keywords: ['service', 'services', 'legal', 'support', 'help'],
                response: "We offer comprehensive legal services including legal research, contract drafting, litigation support, eDiscovery, and more. Our team of experienced legal professionals is available 24/7 to assist you."
            },
            'pricing': {
                keywords: ['price', 'cost', 'pricing', 'fee', 'rate', 'expensive', 'cheap'],
                response: "Our pricing is competitive and transparent. We offer flexible pricing models including hourly rates, project-based pricing, and retainer agreements. Contact us for a personalized quote."
            },
            'process': {
                keywords: ['process', 'how', 'work', 'procedure', 'steps'],
                response: "Our process is simple: 1) Initial consultation, 2) Project scope definition, 3) Team assignment, 4) Regular updates, 5) Quality review, 6) Final delivery. We maintain 99% client satisfaction."
            },
            'contact': {
                keywords: ['contact', 'phone', 'email', 'reach', 'call'],
                response: "You can reach us at +91 94140 80184 or email us at info@lexocrates.com. Our support team is available 24/7 to assist you."
            },
            'location': {
                keywords: ['location', 'where', 'office', 'address', 'india'],
                response: "We are based in Jaipur, India, serving clients globally including the US, UK, Canada, and Commonwealth nations. Our team works remotely to provide round-the-clock support."
            },
            'quality': {
                keywords: ['quality', 'good', 'excellent', 'professional', 'experience'],
                response: "We maintain ISO 27001 and ISO 9001 certifications. Our team has an average of 15+ years of experience with 99% client satisfaction rate."
            }
        };
    }

    getBotResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        for (const category in this.botResponses) {
            const response = this.botResponses[category];
            if (response.keywords.some(keyword => message.includes(keyword))) {
                return response.response;
            }
        }

        // Default response
        return "Thank you for your message. I'm here to help with information about our legal services, pricing, processes, or any other inquiries. How can I assist you today?";
    }

    submitTicket(e) {
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

        // Simulate ticket submission
        this.showTicketConfirmation(ticketData);
        
        // Reset form
        e.target.reset();
    }

    showTicketConfirmation(ticketData) {
        const ticketInterface = document.getElementById('ticketInterface');
        ticketInterface.innerHTML = `
            <div class="ticket-confirmation">
                <div class="confirmation-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h4>Ticket Submitted Successfully!</h4>
                <p>Your support ticket has been created. We'll get back to you within 24 hours.</p>
                <div class="ticket-details">
                    <p><strong>Ticket ID:</strong> #${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                    <p><strong>Subject:</strong> ${ticketData.subject}</p>
                    <p><strong>Priority:</strong> ${ticketData.priority}</p>
                </div>
                <button class="btn-back" onclick="supportWidget.switchInterface('welcome')">
                    <i class="fas fa-arrow-left"></i>
                    Back to Support Options
                </button>
            </div>
        `;
    }

    showNotification() {
        // Show notification after 5 seconds
        setTimeout(() => {
            const notificationBadge = document.getElementById('notificationBadge');
            notificationBadge.style.display = 'flex';
        }, 5000);
    }

    hideNotification() {
        const notificationBadge = document.getElementById('notificationBadge');
        notificationBadge.style.display = 'none';
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Public method to switch back to welcome screen
    switchInterface(interfaceType) {
        if (interfaceType === 'welcome') {
            document.getElementById('welcomeScreen').style.display = 'flex';
            document.getElementById('chatInterface').style.display = 'none';
            document.getElementById('botInterface').style.display = 'none';
            document.getElementById('ticketInterface').style.display = 'none';
            this.currentInterface = 'welcome';
        } else {
            this.switchInterface(interfaceType);
        }
    }
}

// Initialize support widget when DOM is loaded
let supportWidget;
document.addEventListener('DOMContentLoaded', () => {
    supportWidget = new SupportWidget();
});

// Add some CSS for the ticket confirmation
const style = document.createElement('style');
style.textContent = `
    .ticket-confirmation {
        text-align: center;
        padding: 20px;
    }
    
    .confirmation-icon {
        width: 60px;
        height: 60px;
        background: #2ecc71;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 15px;
        color: white;
        font-size: 1.5rem;
    }
    
    .ticket-confirmation h4 {
        color: var(--text-primary, #2c3e50);
        margin: 0 0 10px 0;
    }
    
    .ticket-confirmation p {
        color: var(--text-secondary, #6c757d);
        margin: 0 0 15px 0;
    }
    
    .ticket-details {
        background: var(--bg-secondary, #f8f9fa);
        padding: 15px;
        border-radius: 8px;
        margin: 15px 0;
        text-align: left;
    }
    
    .ticket-details p {
        margin: 5px 0;
        font-size: 0.85rem;
    }
    
    .btn-back {
        background: var(--accent-blue, #3498db);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 auto;
        transition: all 0.3s ease;
    }
    
    .btn-back:hover {
        background: #2980b9;
        transform: translateY(-1px);
    }
    
    [data-theme="dark"] .ticket-confirmation h4 {
        color: var(--text-primary, #e2e8f0);
    }
    
    [data-theme="dark"] .ticket-confirmation p {
        color: var(--text-secondary, #cbd5e1);
    }
    
    [data-theme="dark"] .ticket-details {
        background: var(--bg-secondary, #1a1a1a);
    }
`;
document.head.appendChild(style);
