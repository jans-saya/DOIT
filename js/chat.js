

class ChatManager {
    constructor() {
        this.conversationHistory = [];
        this.maxHistoryLength = 20;
        this.apiEndpoint = 'http://localhost:5000/api/chat';
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        console.log('🤖 Initializing Chat Manager...');
        this.loadChatHistory();
        this.setupEventListeners();
        this.setupMoodButtons();
        this.setupSuggestionButtons();
        this.setupClearChatButton();
        console.log('✅ Chat Manager Ready');
    }

    
    setupEventListeners() {
        const sendButton = document.getElementById('sendMessage');
        const messageInput = document.getElementById('messageInput');
        
        if (sendButton && messageInput) {
            sendButton.addEventListener('click', () => this.sendMessage());
            
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    setupMoodButtons() {
        const moodButtons = document.querySelectorAll('.mood-btn');
        moodButtons.forEach(button => {
            button.addEventListener('click', () => {
                const mood = button.getAttribute('data-mood');
                this.handleMoodSelection(mood);
            });
        });
    }

    setupSuggestionButtons() {
        const suggestionButtons = document.querySelectorAll('.suggestion-btn');
        suggestionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const message = button.getAttribute('data-message');
                const messageInput = document.getElementById('messageInput');
                if (messageInput) {
                    messageInput.value = message;
                    messageInput.focus();
                }
            });
        });
    }

    setupClearChatButton() {
        const clearChatBtn = document.getElementById('clearChatBtn');
        if (clearChatBtn) {
            clearChatBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to clear the entire chat history?")) {
                    this.resetChatHistory();
                }
            });
        }
    }

    // ===== CHAT HISTORY MANAGEMENT =====
    
    loadChatHistory() {
        try {
            const savedHistory = this.getFromLocalStorage('chatHistory', []);
            
            if (!Array.isArray(savedHistory)) {
                console.warn("Saved chat history is not an array. Resetting to empty array.");
                this.conversationHistory = [];
            } else {
                this.conversationHistory = savedHistory;
            }
            
            this.displayChatHistory();
            
        } catch (error) {
            console.error("Error loading chat history:", error);
            this.conversationHistory = [];
            this.addWelcomeMessage();
        }
    }

    displayChatHistory() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        chatMessages.innerHTML = '';
        
        if (this.conversationHistory.length === 0) {
            this.addWelcomeMessage();
            return;
        }
        
        // Display recent messages (last 10 to avoid UI overload)
        const recentMessages = this.conversationHistory.slice(-10);
        recentMessages.forEach(msg => {
            this.displayMessage(msg.role, msg.content, false);
        });
    }

    addWelcomeMessage() {
        const welcomeMessage = {
            role: "assistant",
            content: "Hello! I'm your companion. I'm here to assist with your journey. How may I help you today?"
        };
        
        this.displayMessage(welcomeMessage.role, welcomeMessage.content);
        this.conversationHistory = [welcomeMessage];
        this.saveToLocalStorage('chatHistory', this.conversationHistory);
    }

    resetChatHistory() {
        localStorage.removeItem('chatHistory');
        this.conversationHistory = [];
        this.addWelcomeMessage();
        console.log("Chat history has been reset successfully");
    }

    // ===== MESSAGE HANDLING =====
    
    async sendMessage() {
        if (this.isProcessing) return;
        
        const messageInput = document.getElementById('messageInput');
        const chatMessages = document.getElementById('chatMessages');
        
        if (!messageInput || !chatMessages) {
            console.error("Required DOM elements not found");
            return;
        }
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        console.log("💬 Sending message:", message.substring(0, 50) + "...");
        
        this.isProcessing = true;
        
        // Display user message
        this.displayMessage('user', message);
        this.addToHistory('user', message);
        
        // Clear input
        messageInput.value = '';
        
        // Show typing indicator
        const typingIndicator = this.createTypingIndicator();
        chatMessages.appendChild(typingIndicator);
        this.scrollToBottom();
        
        try {
            const response = await this.getAIResponse(message);
            
            // Remove typing indicator
            if (typingIndicator.parentNode) {
                typingIndicator.remove();
            }
            
            // Display AI response
            this.displayMessage('assistant', response);
            this.addToHistory('assistant', response);
            
            // Handle potential events and tasks
            setTimeout(() => {
                this.processMessageForActions(message, response);
            }, 500);
            
        } catch (error) {
            console.error("Error in sendMessage:", error);
            
            if (typingIndicator.parentNode) {
                typingIndicator.remove();
            }
            
            this.displayErrorMessage(error);
            
        } finally {
            this.isProcessing = false;
        }
    }

    displayMessage(role, text, saveToHistory = true) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = role === 'user' ? 'message user-message' : 'message companion-message';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Process text for basic markdown
        const processedText = this.processMarkdown(text);
        
        const paragraph = document.createElement('p');
        paragraph.innerHTML = processedText;
        messageContent.appendChild(paragraph);
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        this.scrollToBottom();
    }

    createTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message companion-message typing';
        typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        return typingDiv;
    }

    displayErrorMessage(error) {
        let errorMessage = "I'm having trouble connecting to my thinking capabilities right now. ";
        
        if (error.message.includes('Cannot connect to AI service')) {
            errorMessage += "It looks like the AI service isn't running. Please check if the Python server is started.";
        } else if (error.message.includes('AI service is experiencing issues')) {
            errorMessage += "The AI service is having technical difficulties. Please try again in a moment.";
        } else if (error.message.includes('Authentication failed')) {
            errorMessage += "There's an authentication issue with the AI service.";
        } else if (error.message.includes('Too many requests')) {
            errorMessage += "I'm receiving too many requests right now. Please wait a moment before trying again.";
        } else {
            errorMessage += "Please try again in a moment, or let me know if there's another way I can help.";
        }
        
        this.displayMessage('assistant', errorMessage);
        
        if (window.showError) {
            window.showError("Connection Error", "Unable to reach AI companion. Please check your connection.");
        }
    }

    // ===== AI INTEGRATION =====
    
    async getAIResponse(message) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: "claude-3-5-sonnet-20241022",
                    max_tokens: 1000,
                    messages: this.prepareMessagesForAPI(),
                    system: this.getSystemPrompt()
                })
            });

            if (!response.ok) {
                let errorMessage = `API error: ${response.status}`;
                
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                        if (errorData.details) {
                            errorMessage += ` - ${errorData.details}`;
                        }
                    }
                } catch (parseError) {
                    console.error("Could not parse error response:", parseError);
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            if (!data.content || !Array.isArray(data.content) || !data.content[0]?.text) {
                throw new Error("Invalid response format from API");
            }
            
            return data.content[0].text;
            
        } catch (error) {
            console.error("Error in getAIResponse:", error);
            
            if (error.message.includes('Failed to fetch')) {
                throw new Error("Cannot connect to AI service. Please make sure the Python server is running on localhost:5000");
            } else if (error.message.includes('API error: 500')) {
                throw new Error("AI service is experiencing issues. Please check the server logs and try again.");
            } else if (error.message.includes('API error: 401')) {
                throw new Error("Authentication failed. Please check the API key configuration.");
            } else if (error.message.includes('API error: 429')) {
                throw new Error("Too many requests. Please wait a moment and try again.");
            } else {
                throw error;
            }
        }
    }

    prepareMessagesForAPI() {
        // Keep conversation within token limits - last 8 messages
        const recentHistory = this.conversationHistory.slice(-8);
        return recentHistory.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    getSystemPrompt() {
        return `You are a supportive AI companion for the DOIT productivity app, designed to help users with ADHD, depression, or motivation issues. Your purpose is to provide empathetic, thoughtful assistance while helping users organize their thoughts, manage their tasks, and improve their wellbeing.

PERSONALITY:
- Warm, empathetic, and understanding, but also gently encouraging
- Thoughtful and reflective rather than superficial
- Speaks in a natural, conversational style that feels personal
- Balances emotional support with practical advice
- Offers specific, actionable suggestions rather than vague platitudes

CAPABILITIES:
- Help users identify and break down tasks into manageable steps
- Suggest evidence-based techniques for focus, motivation, and emotional regulation
- Recognize emotional patterns and provide tailored support
- Assist with time management and productivity strategies
- Help users create and maintain healthy habits
- Identify when users might need task management help and offer to add tasks to their system

TASK MANAGEMENT:
- When a user mentions a task or something they need to do, offer to add it to their task list
- Categorize tasks appropriately (Morning Routine, Health & Wellness, Work & Study, Personal Growth)
- When suggesting techniques or strategies, offer to add them as tasks
- Follow up on previously mentioned tasks when appropriate

CONVERSATION APPROACH:
- Ask thoughtful follow-up questions to better understand the user's situation
- Remember details from earlier in the conversation and reference them appropriately
- Vary your responses rather than using the same phrases repeatedly
- When the user is struggling, validate their feelings before offering solutions
- When appropriate, share specific techniques like the Pomodoro method, body doubling, 5-minute rule, etc.
- Use a strengths-based approach that builds on the user's capabilities

LIMITATIONS:
- Never claim to diagnose or treat medical conditions
- Acknowledge when a question might be better addressed by a healthcare professional
- Be honest about your limitations as an AI assistant
- Prioritize the user's wellbeing above all else

Use this guidance to provide personalized, compassionate, and practical support to help users improve their productivity and wellbeing.`;
    }

    // ===== EVENT AND TASK DETECTION =====
    
    processMessageForActions(userMessage, aiResponse) {
        const eventHandled = this.detectAndHandleEvents(userMessage);
        
        if (!eventHandled) {
            this.detectAndHandleTasks(userMessage);
        }
    }

    detectAndHandleEvents(userMessage) {
        const eventPatterns = [
            {
                pattern: /(?:schedule|add|book)\s+(?:my\s+)?(.*?)(?:\s+(?:on|for|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\s*$)/i,
                type: 'schedule'
            },
            {
                pattern: /(appointment|meeting)\s+with\s+([^,\.!?]*)/i,
                type: 'meeting'
            },
            {
                pattern: /(\w+)\s+appointment/i,
                type: 'appointment'
            }
        ];

        const timeKeywords = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'tomorrow', 'today'];
        const hasTimeReference = timeKeywords.some(keyword => userMessage.toLowerCase().includes(keyword));

        for (const { pattern, type } of eventPatterns) {
            const match = userMessage.match(pattern);
            if (match && hasTimeReference) {
                const eventDetails = this.extractEventDetails(userMessage, type, match);
                this.showEventActionButtons(eventDetails);
                return true;
            }
        }

        return false;
    }

    extractEventDetails(userMessage, type, match) {
        const eventDetails = {
            title: '',
            possibleDate: '',
            possibleTime: '09:00'
        };

        // Extract title based on type
        switch (type) {
            case 'schedule':
                eventDetails.title = match[1] ? match[1].trim() : 'New appointment';
                break;
            case 'meeting':
                eventDetails.title = `${match[1]} with ${match[2].trim()}`;
                break;
            case 'appointment':
                eventDetails.title = `${match[1]} appointment`;
                break;
            default:
                eventDetails.title = 'New event';
        }

        // Capitalize first letter
        if (eventDetails.title) {
            eventDetails.title = eventDetails.title.charAt(0).toUpperCase() + eventDetails.title.slice(1);
        }

        // Extract date
        eventDetails.possibleDate = this.extractDateFromMessage(userMessage);

        return eventDetails;
    }

    extractDateFromMessage(message) {
        const userLower = message.toLowerCase();
        
        if (userLower.includes('today')) {
            return this.formatDateForStorage(new Date());
        } else if (userLower.includes('tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return this.formatDateForStorage(tomorrow);
        } else if (userLower.includes('monday')) {
            return this.getNextDayOfWeek(1);
        } else if (userLower.includes('tuesday')) {
            return this.getNextDayOfWeek(2);
        } else if (userLower.includes('wednesday')) {
            return this.getNextDayOfWeek(3);
        } else if (userLower.includes('thursday')) {
            return this.getNextDayOfWeek(4);
        } else if (userLower.includes('friday')) {
            return this.getNextDayOfWeek(5);
        } else if (userLower.includes('saturday')) {
            return this.getNextDayOfWeek(6);
        } else if (userLower.includes('sunday')) {
            return this.getNextDayOfWeek(0);
        } else {
            return this.formatDateForStorage(new Date());
        }
    }

    detectAndHandleTasks(userMessage) {
        const taskKeywords = ['todo', 'task', 'remind me', 'need to', 'should do', 'want to'];
        const isTaskRelated = taskKeywords.some(keyword => 
            userMessage.toLowerCase().includes(keyword.toLowerCase())
        );

        if (isTaskRelated) {
            const taskDetails = this.extractTaskDetails(userMessage);
            if (taskDetails.text) {
                this.showTaskActionButtons(taskDetails);
            }
        }
    }

    extractTaskDetails(userMessage) {
        let taskText = userMessage;
        let category = 'personal';

        // Remove common starting phrases
        taskText = taskText.replace(/^(can you |please |could you |i need to |i want to |remind me to )/gi, '');

        // Extract task from "remind me to X" pattern
        const reminderPhrases = ['remind me to', 'i need to', 'i should'];
        for (const phrase of reminderPhrases) {
            if (userMessage.toLowerCase().includes(phrase)) {
                const startIndex = userMessage.toLowerCase().indexOf(phrase) + phrase.length;
                taskText = userMessage.substring(startIndex).trim();
                taskText = taskText.replace(/[.!?]$/, '');
                break;
            }
        }

        // Determine category
        const taskLower = taskText.toLowerCase();
        if (taskLower.includes('work') || taskLower.includes('study') || taskLower.includes('read')) {
            category = 'work';
        } else if (taskLower.includes('exercise') || taskLower.includes('health') || taskLower.includes('water') || taskLower.includes('walk')) {
            category = 'health';
        } else if (taskLower.includes('morning') || taskLower.includes('wake') || taskLower.includes('breakfast')) {
            category = 'morning';
        }

        return {
            text: taskText.trim(),
            category: category
        };
    }

    // ===== ACTION BUTTONS =====
    
    showEventActionButtons(eventDetails) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message companion-message';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const mainText = document.createElement('p');
        mainText.innerHTML = `I can help you with "<strong>${eventDetails.title}</strong>". What would you like me to do?`;
        messageContent.appendChild(mainText);
        
        const buttonContainer = this.createButtonContainer();
        
        // Add to Calendar button
        const calendarBtn = this.createActionButton('calendar-plus', 'Add to Calendar', () => {
            this.addEventToCalendar(eventDetails);
            this.displayMessage('assistant', `Perfect! I've added "${eventDetails.title}" to your calendar for ${this.formatDateForDisplay(eventDetails.possibleDate)}.`);
            buttonContainer.remove();
            
            if (window.showSuccess) {
                window.showSuccess('Event Added', `"${eventDetails.title}" has been added to your calendar.`);
            }
        });
        
        // Add as Task button
        const taskBtn = this.createActionButton('tasks', 'Add as Task', () => {
            this.addTaskToTasksSystem(eventDetails.title, 'personal');
            this.displayMessage('assistant', `Got it! I've added "${eventDetails.title}" to your tasks.`);
            buttonContainer.remove();
        });
        
        // Cancel button
        const cancelBtn = this.createActionButton('times', 'Not now', () => {
            this.displayMessage('assistant', `No problem! Let me know if you need help with anything else.`);
            buttonContainer.remove();
        });
        
        buttonContainer.appendChild(calendarBtn);
        buttonContainer.appendChild(taskBtn);
        buttonContainer.appendChild(cancelBtn);
        
        messageContent.appendChild(buttonContainer);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        this.scrollToBottom();
    }

    showTaskActionButtons(taskDetails) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message companion-message';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const mainText = document.createElement('p');
        mainText.innerHTML = `Would you like me to add "${taskDetails.text}" to your ${this.formatCategoryName(taskDetails.category)} tasks?`;
        messageContent.appendChild(mainText);
        
        const buttonContainer = this.createButtonContainer();
        
        const addBtn = this.createActionButton('plus', 'Add to Tasks', () => {
            this.addTaskToTasksSystem(taskDetails.text, taskDetails.category);
            this.displayMessage('assistant', `Your task has been added to your tasks list.`);
            buttonContainer.remove();
        });
        
        const cancelBtn = this.createActionButton('times', 'No thanks', () => {
            this.displayMessage('assistant', `No problem. Is there anything else I can help with?`);
            buttonContainer.remove();
        });
        
        buttonContainer.appendChild(addBtn);
        buttonContainer.appendChild(cancelBtn);
        
        messageContent.appendChild(buttonContainer);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        this.scrollToBottom();
    }

    createButtonContainer() {
        const container = document.createElement('div');
        container.style.cssText = `
            margin-top: 12px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        `;
        return container;
    }

    createActionButton(icon, text, onClick) {
        const button = document.createElement('button');
        button.className = 'btn secondary-btn';
        button.innerHTML = `<i class="fas fa-${icon}"></i> ${text}`;
        button.style.cssText = `
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        `;
        button.addEventListener('click', onClick);
        return button;
    }

    // ===== MOOD HANDLING =====
    
    handleMoodSelection(mood) {
        const moodMap = {
            'terrible': '😢',
            'bad': '😕',
            'neutral': '😐',
            'good': '🙂',
            'great': '😄'
        };
        
        const moodText = {
            'terrible': "I'm sorry to hear you're feeling low today. It takes courage to acknowledge difficult emotions. Would you like to talk about what's troubling you?",
            'bad': "Some days are harder than others. Thank you for sharing how you're feeling. Is there anything specific weighing on your mind?",
            'neutral': "A neutral day can be a good foundation to build upon. Is there anything you'd like to focus on to enhance your day?",
            'good': "I'm glad to hear you're having a good day! What's been going well for you?",
            'great': "Wonderful! It's excellent that you're feeling so positive today. Would you like to channel this energy into any particular tasks or activities?"
        };
        
        // Update mood button UI
        const moodButtons = document.querySelectorAll('.mood-btn');
        moodButtons.forEach(btn => btn.classList.remove('selected'));
        const selectedBtn = document.querySelector(`.mood-btn[data-mood="${mood}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        }
        
        // Save mood
        this.saveMoodToStorage(mood);
        
        // Add to conversation
        const response = moodText[mood] || "Thank you for sharing how you feel today.";
        this.displayMessage('assistant', response);
        
        this.addToHistory('user', `I'm feeling ${mood} today ${moodMap[mood]}`);
        this.addToHistory('assistant', response);
    }

    
    addEventToCalendar(eventDetails) {
        const newEvent = {
            id: this.generateId(),
            title: eventDetails.title,
            date: eventDetails.possibleDate,
            startTime: eventDetails.possibleTime || '09:00',
            endTime: this.calculateEndTime(eventDetails.possibleTime || '09:00'),
            description: 'Added from chat',
            notification: '15min',
            notified: false
        };
        
        let calendarEvents = this.getFromLocalStorage('calendarEvents', []);
        calendarEvents.push(newEvent);
        this.saveToLocalStorage('calendarEvents', calendarEvents);
        
        // Try to refresh calendar if on calendar page
        try {
            if (typeof renderEvents === 'function') {
                renderEvents();
            }
            if (typeof updateUpcomingEvents === 'function') {
                updateUpcomingEvents();
            }
        } catch (error) {
            console.log("Calendar refresh functions not available (probably not on calendar page)");
        }
    }

    addTaskToTasksSystem(taskText, category) {
        const tasks = this.getFromLocalStorage('tasks', []);
        
        const newTask = {
            id: this.generateId(),
            text: taskText,
            category: category,
            completed: false,
            important: false,
            createdAt: new Date().toISOString(),
            dueDate: new Date().toISOString()
        };
        
        tasks.push(newTask);
        this.saveToLocalStorage('tasks', tasks);
        
        console.log("Task added from companion chat:", newTask);
    }

    
    addToHistory(role, content) {
        this.conversationHistory.push({ role, content });
        
        // Trim history to prevent memory issues
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
        
        this.saveToLocalStorage('chatHistory', this.conversationHistory);
    }

    processMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    saveMoodToStorage(mood) {
        const today = new Date().toISOString().split('T')[0];
        const moodHistory = this.getFromLocalStorage('moodHistory', {});
        moodHistory[today] = mood;
        this.saveToLocalStorage('moodHistory', moodHistory);
    }

    formatCategoryName(category) {
        const categoryMap = {
            'morning': 'Morning Routine',
            'health': 'Health & Wellness',
            'work': 'Work & Study',
            'personal': 'Personal Growth'
        };
        return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
    }

    formatDateForStorage(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateForDisplay(dateString) {
        const date = new Date(dateString);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    getNextDayOfWeek(targetDayOfWeek) {
        const today = new Date();
        const currentDayOfWeek = today.getDay();
        
        let daysToAdd = targetDayOfWeek - currentDayOfWeek;
        
        if (daysToAdd === 0) {
            const currentHour = today.getHours();
            if (currentHour < 18) {
                daysToAdd = 0; // Today
            } else {
                daysToAdd = 7; // Next week
            }
        } else if (daysToAdd < 0) {
            daysToAdd += 7;
        }
        
        const targetDate = new Date();
        targetDate.setDate(today.getDate() + daysToAdd);
        
        return this.formatDateForStorage(targetDate);
    }

    calculateEndTime(startTime) {
        if (!startTime) return '10:00';
        
        const [hours, minutes] = startTime.split(':');
        let hour = parseInt(hours);
        hour = (hour + 1) % 24;
        return `${hour.toString().padStart(2, '0')}:${minutes}`;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    getFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            let parsedData = data ? JSON.parse(data) : defaultValue;
            
            if (key === 'chatHistory' && !Array.isArray(parsedData)) {
                console.warn(`localStorage item '${key}' is not an array, returning default`);
                return defaultValue;
            }
            
            return parsedData;
        } catch (error) {
            console.error(`Error retrieving '${key}' from localStorage:`, error);
            return defaultValue;
        }
    }

    saveToLocalStorage(key, data) {
        try {
            if (key === 'chatHistory' && !Array.isArray(data)) {
                console.error("Attempted to save non-array as chatHistory", data);
                data = Array.isArray(data) ? data : [];
            }
            
            const jsonString = JSON.stringify(data);
            localStorage.setItem(key, jsonString);
            return true;
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
            
            if (error.message.includes('circular')) {
                try {
                    const seen = new WeakSet();
                    const safeJson = JSON.stringify(data, (key, value) => {
                        if (typeof value === 'object' && value !== null) {
                            if (seen.has(value)) {
                                return '[Circular]';
                            }
                            seen.add(value);
                        }
                        return value;
                    });
                    localStorage.setItem(key, safeJson);
                    return true;
                } catch (e) {
                    console.error("Second attempt to save failed:", e);
                }
            }
            
            return false;
        }
    }
}


// Initialize chat manager when DOM is loaded
let chatManager;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Chat System...');
    chatManager = new ChatManager();
});

// Make functions globally available for integration with other modules
window.addTaskFromChat = function(taskText, category) {
    if (chatManager) {
        chatManager.addTaskToTasksSystem(taskText, category);
        chatManager.displayMessage('assistant', `Your task has been added to your tasks list.`);
    }
};

window.cancelAddTask = function() {
    if (chatManager) {
        chatManager.displayMessage('assistant', `No problem. Is there anything else I can help with?`);
    }
};

// Export chat manager for other modules
window.chatManager = chatManager;