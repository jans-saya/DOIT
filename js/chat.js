// Global conversation history variable
let conversationHistory = [];

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize chat components
    initChat();
});

function initChat() {
    // Get chat elements
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');
    
    // Load conversation history from localStorage
    try {
        loadChatHistory();
    } catch (e) {
        console.error("Error loading chat history:", e);
    }
    
    // Add event listener for send button
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', function() {
            sendMessage();
        });
        
        // Allow sending message with Enter key (but Shift+Enter for new line)
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Add event listeners for mood buttons
    const moodButtons = document.querySelectorAll('.mood-btn');
    
    moodButtons.forEach(button => {
        button.addEventListener('click', function() {
            const mood = this.getAttribute('data-mood');
            selectMood(mood);
        });
    });
    
    // Add event listeners for suggestion buttons
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    suggestionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const message = this.getAttribute('data-message');
            if (messageInput) {
                messageInput.value = message;
                messageInput.focus();
            }
        });
    });
    
    // Create global task management functions in window scope
    window.addTaskFromChat = function(taskText, category) {
        addTaskToTasksSystem(taskText, category);
        displayMessage('assistant', `Your task has been added to your tasks list.`);
    };
    
    window.cancelAddTask = function() {
        displayMessage('assistant', `No problem. Is there anything else I can help with?`);
    };
}

// Load chat history from localStorage
function loadChatHistory() {
    try {
        const savedHistory = getFromLocalStorage('chatHistory', []);
        
        // Ensure conversationHistory is always an array
        if (!Array.isArray(savedHistory)) {
            console.warn("Saved chat history is not an array. Resetting to empty array.");
            conversationHistory = [];
        } else {
            conversationHistory = savedHistory;
        }
        
        // Display saved messages
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            // Clear existing messages first
            chatMessages.innerHTML = '';
            
            // Add a welcome message if there's no history
            if (!conversationHistory || conversationHistory.length === 0) {
                const welcomeMessage = {
                    role: "assistant",
                    content: "Hello! I'm your companion. I'm here to assist with your journey. How may I help you today?"
                };
                displayMessage(welcomeMessage.role, welcomeMessage.content);
                conversationHistory = [welcomeMessage];
                saveToLocalStorage('chatHistory', conversationHistory);
            } else {

                const recentMessages = Array.isArray(conversationHistory) ? 
                    conversationHistory.slice(-10) : [];
                
                recentMessages.forEach(msg => {
                    displayMessage(msg.role, msg.content);
                });
            }
        }
    } catch (e) {
        console.error("Error loading chat history:", e);
        // Reset conversation history if there's an error
        conversationHistory = [];
        
        // Add a welcome message
        const welcomeMessage = {
            role: "assistant",
            content: "Hello! I'm your companion. I'm here to assist with your journey. How may I help you today?"
        };
        
        // Display welcome message
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
            displayMessage(welcomeMessage.role, welcomeMessage.content);
            conversationHistory = [welcomeMessage];
            saveToLocalStorage('chatHistory', conversationHistory);
        }
    }
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    
    if (!messageInput || !chatMessages) return;
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    // Display user message
    displayMessage('user', message);
    
    // Add user message to conversation history
    conversationHistory.push({ role: "user", content: message });
    
    // Save the history after adding user message
    saveToLocalStorage('chatHistory', conversationHistory);
    
    // Clear input field
    messageInput.value = '';
    
    // Display typing indicator
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message companion-message typing';
    typingIndicator.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    chatMessages.appendChild(typingIndicator);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        // Get AI response
        const response = await getAIResponse(message);
        
        // Remove typing indicator
        if (typingIndicator.parentNode) {
            chatMessages.removeChild(typingIndicator);
        }
        
        // Display AI response
        displayMessage('assistant', response);
        
        // Add to conversation history
        conversationHistory.push({ role: "assistant", content: response });
        
        // Save updated history
        saveToLocalStorage('chatHistory', conversationHistory);
        
        // CHECK FOR CALENDAR EVENTS FIRST (before tasks)
        const eventHandled = handlePotentialEvent(message, response);
        
        // Only check for tasks if it wasn't handled as an event
        if (!eventHandled) {
            handlePotentialTask(message, response);
        }
        
    } catch (error) {
        // Remove typing indicator
        if (typingIndicator.parentNode) {
            chatMessages.removeChild(typingIndicator);
        }
        
        // Display error message
        displayMessage('assistant', "I'm having trouble connecting to my thinking capabilities right now. Please try again in a moment, or let me know if there's another way I can help.");
        console.error("Error getting AI response:", error);
    }
}

function handlePotentialEventFixed(userMessage, aiResponse) {
    const userLower = userMessage.toLowerCase();
    
    // Very specific patterns for calendar events
    const isCalendarEvent = (
        (userLower.includes('meeting with') && (userLower.includes('friday') || userLower.includes('monday') || userLower.includes('tuesday') || userLower.includes('wednesday') || userLower.includes('thursday') || userLower.includes('saturday') || userLower.includes('sunday'))) ||
        (userLower.includes('schedule') && userLower.includes('meeting') && (userLower.includes('friday') || userLower.includes('monday') || userLower.includes('tuesday') || userLower.includes('wednesday') || userLower.includes('thursday') || userLower.includes('saturday') || userLower.includes('sunday'))) ||
        (userLower.includes('add') && userLower.includes('meeting') && (userLower.includes('friday') || userLower.includes('monday') || userLower.includes('tuesday') || userLower.includes('wednesday') || userLower.includes('thursday') || userLower.includes('saturday') || userLower.includes('sunday')))
    );
    
    if (isCalendarEvent) {
        console.log("🗓️ CALENDAR EVENT DETECTED:", userMessage);
        
        // Simple extraction
        let title = "Meeting";
        if (userLower.includes('meeting with')) {
            const match = userMessage.match(/meeting with ([^,\.!?]*)/i);
            if (match) {
                title = "Meeting with " + match[1].trim();
            }
        }
        
        // Get the day
        let eventDate = formatDateForStorage(new Date()); // default to today
        if (userLower.includes('friday')) {
            eventDate = getNextDayOfWeek(5);
        } else if (userLower.includes('monday')) {
            eventDate = getNextDayOfWeek(1);
        } else if (userLower.includes('tuesday')) {
            eventDate = getNextDayOfWeek(2);
        } else if (userLower.includes('wednesday')) {
            eventDate = getNextDayOfWeek(3);
        } else if (userLower.includes('thursday')) {
            eventDate = getNextDayOfWeek(4);
        } else if (userLower.includes('saturday')) {
            eventDate = getNextDayOfWeek(6);
        } else if (userLower.includes('sunday')) {
            eventDate = getNextDayOfWeek(0);
        }
        
        const eventDetails = {
            title: title,
            possibleDate: eventDate,
            possibleTime: '09:00'
        };
        
        // Show action buttons
        setTimeout(() => {
            showEventActionButtons(eventDetails);
        }, 1000);
        
        return true;
    }
    
    return false;
}

function handlePotentialEvent(userMessage, aiResponse) {
    // Enhanced detection for calendar events
    const strongEventKeywords = [
        'schedule', 'appointment', 'meeting', 'calendar', 'book', 'reserve',
        'add meeting', 'add appointment', 'plan meeting', 'set up meeting'
    ];
    
    const timeKeywords = [
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 
        'tomorrow', 'today', 'next week', 'this week', 'on monday', 'on tuesday', 
        'on wednesday', 'on thursday', 'on friday', 'on saturday', 'on sunday'
    ];
    
    const userLower = userMessage.toLowerCase();
    
    // Check if message contains strong event indicators
    const hasStrongEventKeyword = strongEventKeywords.some(keyword => 
        userLower.includes(keyword.toLowerCase())
    );
    
    const hasTimeReference = timeKeywords.some(keyword => 
        userLower.includes(keyword.toLowerCase())
    );
    
    // SPECIAL CASE: Look for "meeting with" pattern specifically
    const hasMeetingWith = userLower.includes('meeting with') && hasTimeReference;
    
    // If it has both a strong event keyword AND a time reference, OR it's a "meeting with" pattern
    if ((hasStrongEventKeyword && hasTimeReference) || hasMeetingWith) {
        
        console.log("🗓️ DETECTED CALENDAR EVENT:", userMessage);
        
        // Extract event details
        const eventDetails = extractBetterEventDetails(userMessage);
        
        // Show action buttons immediately
        setTimeout(() => {
            showEventActionButtons(eventDetails);
        }, 500);
        
        return true; // We handled this message
    }
    
    return false; // We did not handle this message
}

function extractBetterEventDetails(userMessage) {
    console.log("🔍 Extracting event details from:", userMessage);
    
    const eventDetails = {
        title: '',
        possibleDate: '',
        possibleTime: '09:00'
    };
    
    const userLower = userMessage.toLowerCase();
    
    // TITLE EXTRACTION - Handle specific patterns
    let title = '';
    
    // Pattern 1: "meeting with [person/group]"
    const meetingWithMatch = userLower.match(/meeting with ([^,\.!?\s]+(?: [^,\.!?\s]+)*)/);
    if (meetingWithMatch) {
        title = "Meeting with " + meetingWithMatch[1].trim();
        console.log("📝 Found 'meeting with' pattern:", title);
    }
    
    // Pattern 2: "schedule [something]"
    else {
        const scheduleMatch = userLower.match(/schedule (?:my )?([^,\.!?]*?)(?:\s+on\s+|\s+for\s+|\s+tomorrow|\s+today|$)/);
        if (scheduleMatch) {
            title = scheduleMatch[1].trim();
            // Clean up common words
            title = title.replace(/^(my|the|a|an)\s+/i, '');
            console.log("📝 Found 'schedule' pattern:", title);
        }
    }
    
    // Pattern 3: "add [something]"
    if (!title) {
        const addMatch = userLower.match(/add (?:my )?([^,\.!?]*?)(?:\s+on\s+|\s+for\s+|\s+tomorrow|\s+today|$)/);
        if (addMatch) {
            title = addMatch[1].trim();
            title = title.replace(/^(my|the|a|an)\s+/i, '');
            console.log("📝 Found 'add' pattern:", title);
        }
    }
    
    // Fallback: use a generic title
    if (!title || title.length < 2) {
        title = "New meeting";
        console.log("📝 Using fallback title:", title);
    }
    
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    eventDetails.title = title;
    
    // DATE EXTRACTION - More precise
    if (userLower.includes('friday') || userLower.includes('on friday')) {
        eventDetails.possibleDate = getNextDayOfWeek(5); // Friday
        console.log("📅 Date set to Friday");
    } else if (userLower.includes('monday') || userLower.includes('on monday')) {
        eventDetails.possibleDate = getNextDayOfWeek(1);
    } else if (userLower.includes('tuesday') || userLower.includes('on tuesday')) {
        eventDetails.possibleDate = getNextDayOfWeek(2);
    } else if (userLower.includes('wednesday') || userLower.includes('on wednesday')) {
        eventDetails.possibleDate = getNextDayOfWeek(3);
    } else if (userLower.includes('thursday') || userLower.includes('on thursday')) {
        eventDetails.possibleDate = getNextDayOfWeek(4);
    } else if (userLower.includes('saturday') || userLower.includes('on saturday')) {
        eventDetails.possibleDate = getNextDayOfWeek(6);
    } else if (userLower.includes('sunday') || userLower.includes('on sunday')) {
        eventDetails.possibleDate = getNextDayOfWeek(0);
    } else if (userLower.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        eventDetails.possibleDate = formatDateForStorage(tomorrow);
    } else {
        eventDetails.possibleDate = formatDateForStorage(new Date());
    }
    
    console.log("✅ Final event details:", eventDetails);
    return eventDetails;
}

// Completely rewritten extractSimpleEventDetails function with debugging
function extractSimpleEventDetails(userMessage) {
    console.log("Original message:", userMessage); // Debug log
    
    const eventDetails = {
        title: '',
        possibleDate: '',
        possibleTime: '09:00'
    };
    
    // Start with the original message
    let title = userMessage;
    
    // Step-by-step extraction with logging
    console.log("Step 1 - Original:", title);
    
    // Remove common starting phrases first
    title = title.replace(/^(can you |please |could you |i need to |i want to )/gi, '');
    console.log("Step 2 - After removing start phrases:", title);
    
    // Handle "schedule X" pattern - extract everything after "schedule"
    if (title.toLowerCase().includes('schedule ')) {
        const scheduleIndex = title.toLowerCase().indexOf('schedule ');
        title = title.substring(scheduleIndex + 9); // 9 = length of "schedule "
        console.log("Step 3 - After removing 'schedule ':", title);
    }
    
    // Remove "my" at the beginning
    if (title.toLowerCase().startsWith('my ')) {
        title = title.substring(3); // Remove "my "
        console.log("Step 4 - After removing 'my ':", title);
    }
    
    // Remove everything from time reference onwards 
    const timeWords = [
        ' on monday', ' on tuesday', ' on wednesday', ' on thursday', 
        ' on friday', ' on saturday', ' on sunday', 
        ' monday', ' tuesday', ' wednesday', ' thursday', 
        ' friday', ' saturday', ' sunday',
        ' tomorrow', ' today', ' for tomorrow', ' for today'
    ];
    
    for (const timeWord of timeWords) {
        const index = title.toLowerCase().indexOf(timeWord);
        if (index !== -1) {
            title = title.substring(0, index);
            console.log(`Step 5 - After removing '${timeWord}':`, title);
            break;
        }
    }
    
    // Clean up whitespace and punctuation
    title = title.trim();
    title = title.replace(/[.,!?]+$/, ''); // Remove trailing punctuation
    
    // If title is empty or too generic, try to extract from original message differently
    if (!title || title.length < 3) {
        // Try to find meaningful content between "schedule" and time words
        const originalLower = userMessage.toLowerCase();
        
        // Look for patterns like "meeting with X" or "appointment with X"
        const meetingMatch = originalLower.match(/meeting with ([^,\.!?]*)/);
        const appointmentMatch = originalLower.match(/appointment with ([^,\.!?]*)/);
        
        if (meetingMatch) {
            title = "Meeting with " + meetingMatch[1].trim();
        } else if (appointmentMatch) {
            title = "Appointment with " + appointmentMatch[1].trim();
        } else {
            title = "New appointment"; // Fallback
        }
    }
    
    // Capitalize first letter
    if (title.length > 0) {
        title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    
    console.log("Final extracted title:", title); // Debug log
    
    eventDetails.title = title;
    
    // IMPROVED DAY EXTRACTION - more specific matching
    const userLower = userMessage.toLowerCase();
    
    // Look for "on [day]" or "for [day]" patterns first (more specific)
    if (userLower.includes('on friday') || userLower.includes('for friday')) {
        eventDetails.possibleDate = getNextDayOfWeek(5);
    } else if (userLower.includes('on monday') || userLower.includes('for monday')) {
        eventDetails.possibleDate = getNextDayOfWeek(1);
    } else if (userLower.includes('on tuesday') || userLower.includes('for tuesday')) {
        eventDetails.possibleDate = getNextDayOfWeek(2);
    } else if (userLower.includes('on wednesday') || userLower.includes('for wednesday')) {
        eventDetails.possibleDate = getNextDayOfWeek(3);
    } else if (userLower.includes('on thursday') || userLower.includes('for thursday')) {
        eventDetails.possibleDate = getNextDayOfWeek(4);
    } else if (userLower.includes('on saturday') || userLower.includes('for saturday')) {
        eventDetails.possibleDate = getNextDayOfWeek(6);
    } else if (userLower.includes('on sunday') || userLower.includes('for sunday')) {
        eventDetails.possibleDate = getNextDayOfWeek(0);
    } else if (userLower.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        eventDetails.possibleDate = formatDateForStorage(tomorrow);
    } else {
        // Default to today
        eventDetails.possibleDate = formatDateForStorage(new Date());
    }
    
    console.log("Final event details:", eventDetails); // Debug log
    return eventDetails;
}
// Also update the showEventActionButtons function to make sure it's using the right title
function showEventActionButtons(eventDetails) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Debug log to see what title we're getting
    console.log("Showing action buttons for:", eventDetails);
    
    // Create message div
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message companion-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Add the main text - make sure we're using the extracted title
    const mainText = document.createElement('p');
    mainText.innerHTML = `I can add <strong>${eventDetails.title}</strong> for you. What would you like to do?`;
    messageContent.appendChild(mainText);
    
    // Create buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.flexWrap = 'wrap';
    
    // Add to Calendar button
    const calendarBtn = document.createElement('button');
    calendarBtn.className = 'btn secondary-btn';
    calendarBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Add to Calendar';
    calendarBtn.addEventListener('click', function() {
        addEventToCalendar(eventDetails);
        displayMessage('assistant', `Perfect! I've added "${eventDetails.title}" to your calendar.`);
        buttonContainer.remove();
    });
    
    // Add as Task button
    const taskBtn = document.createElement('button');
    taskBtn.className = 'btn secondary-btn';
    taskBtn.innerHTML = '<i class="fas fa-tasks"></i> Add as Task';
    taskBtn.addEventListener('click', function() {
        addTaskToTasksSystem(eventDetails.title, 'personal');
        displayMessage('assistant', `Got it! I've added "${eventDetails.title}" to your tasks.`);
        buttonContainer.remove();
    });
    
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Not now';
    cancelBtn.addEventListener('click', function() {
        displayMessage('assistant', `No problem! Let me know if you need help with anything else.`);
        buttonContainer.remove();
    });
    
    // Add buttons to container
    buttonContainer.appendChild(calendarBtn);
    buttonContainer.appendChild(taskBtn);
    buttonContainer.appendChild(cancelBtn);
    
    // Add button container to message
    messageContent.appendChild(buttonContainer);
    messageDiv.appendChild(messageContent);
    
    // Add to chat
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
// Show action buttons for events
function showEventActionButtons(eventDetails) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Create message div
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message companion-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Add the main text
    const mainText = document.createElement('p');
    mainText.innerHTML = `I can help you with "<strong>${eventDetails.title}</strong>". What would you like me to do?`;
    messageContent.appendChild(mainText);
    
    // Create buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.flexWrap = 'wrap';
    
    // Add to Calendar button
    const calendarBtn = document.createElement('button');
    calendarBtn.className = 'btn secondary-btn';
    calendarBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Add to Calendar';
    calendarBtn.addEventListener('click', function() {
        addEventToCalendar(eventDetails);
        displayMessage('assistant', `Perfect! I've added "${eventDetails.title}" to your calendar.`);
        buttonContainer.remove(); // Remove buttons after use
    });
    
    // Add as Task button
    const taskBtn = document.createElement('button');
    taskBtn.className = 'btn secondary-btn';
    taskBtn.innerHTML = '<i class="fas fa-tasks"></i> Add as Task';
    taskBtn.addEventListener('click', function() {
        addTaskToTasksSystem(eventDetails.title, 'personal');
        displayMessage('assistant', `Got it! I've added "${eventDetails.title}" to your tasks.`);
        buttonContainer.remove(); // Remove buttons after use
    });
    
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Not now';
    cancelBtn.addEventListener('click', function() {
        displayMessage('assistant', `No problem! Let me know if you need help with anything else.`);
        buttonContainer.remove(); // Remove buttons after use
    });
    
    // Add buttons to container
    buttonContainer.appendChild(calendarBtn);
    buttonContainer.appendChild(taskBtn);
    buttonContainer.appendChild(cancelBtn);
    
    // Add button container to message
    messageContent.appendChild(buttonContainer);
    messageDiv.appendChild(messageContent);
    
    // Add to chat
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Helper function to get next occurrence of day of week - IMPROVED
function getNextDayOfWeek(targetDayOfWeek) {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    
    // Calculate days to add
    let daysToAdd = targetDayOfWeek - currentDayOfWeek;
    
    // If the target day is today, ask if they mean today or next week
    if (daysToAdd === 0) {
        // If it's still early in the day, assume they mean today
        const currentHour = today.getHours();
        if (currentHour < 18) { // Before 6 PM
            daysToAdd = 0; // Today
        } else {
            daysToAdd = 7; // Next week
        }
    } else if (daysToAdd < 0) {
        // Target day has passed this week, go to next week
        daysToAdd += 7;
    }
    
    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysToAdd);
    
    return formatDateForStorage(targetDate);
}
// Function to add event to calendar (same as before)
function addEventToCalendar(eventDetails) {
    const newEvent = {
        id: generateId(),
        title: eventDetails.title,
        date: eventDetails.possibleDate,
        startTime: eventDetails.possibleTime,
        endTime: calculateEndTime(eventDetails.possibleTime),
        description: 'Added from chat',
        notification: '15min',
        notified: false
    };
    
    let calendarEvents = getFromLocalStorage('calendarEvents', []);
    calendarEvents.push(newEvent);
    saveToLocalStorage('calendarEvents', calendarEvents);
    
    console.log("Event added to calendar:", newEvent);
}

// Calculate end time (1 hour after start)
function calculateEndTime(startTime) {
    const [hours, minutes] = startTime.split(':');
    let hour = parseInt(hours);
    hour = (hour + 1) % 24;
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

// Handle potential task in message
function handlePotentialTask(userMessage, aiResponse) {
    // Check if message is about creating a task
    const taskKeywords = ['todo', 'task', 'remind me', 'schedule', 'don\'t forget', 'need to', 'should do'];
    const isTaskRelated = taskKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword.toLowerCase())
    );
    
   
if (isTaskRelated) {
    // Extract potential task
    let potentialTask = userMessage;
    
    
    if (userMessage.toLowerCase().includes('can you add') && userMessage.toLowerCase().includes('task')) {
        const addPattern = /can you add ([^?]+)( to my)? tasks?/i;
        const addMatch = userMessage.match(addPattern);
        
        if (addMatch && addMatch[1]) {
            potentialTask = addMatch[1].trim();
        }
    } else {
        const reminderPhrases = ['remind me to', 'i need to', 'i should'];
        for (const phrase of reminderPhrases) {
            if (userMessage.toLowerCase().includes(phrase)) {
                const startIndex = userMessage.toLowerCase().indexOf(phrase) + phrase.length;
                potentialTask = userMessage.substring(startIndex).trim();
                
                potentialTask = potentialTask.replace(/[.!?]$/, '');
                break;
            }
        }
    }
    

            
        
        
        // Determine task category
        let category = 'personal';
        if (potentialTask.toLowerCase().includes('work') || 
            potentialTask.toLowerCase().includes('study') || 
            potentialTask.toLowerCase().includes('read')) {
            category = 'work';
        } else if (potentialTask.toLowerCase().includes('exercise') || 
                  potentialTask.toLowerCase().includes('health') || 
                  potentialTask.toLowerCase().includes('water') ||
                  potentialTask.toLowerCase().includes('walk')) {
            category = 'health';
        } else if (potentialTask.toLowerCase().includes('morning') || 
                  potentialTask.toLowerCase().includes('wake') || 
                  potentialTask.toLowerCase().includes('breakfast')) {
            category = 'morning';
        }
        
        // Offer to create a task
        setTimeout(() => {
            // Ask if they want to add the task
            const addTaskMessage = `Would you like me to add "${potentialTask}" to your ${formatCategoryName(category)} tasks?`;
            displayMessage('assistant', addTaskMessage);
            
            // Create proper task buttons - this format works better with innerHTML
            setTimeout(() => {
                // Create task action message with properly formatted buttons
                const taskActionDiv = document.createElement('div');
                
                // Create Add to Tasks button
                const addButton = document.createElement('button');
                addButton.className = 'btn secondary-btn';
                addButton.textContent = 'Add to Tasks';
                addButton.addEventListener('click', function() {
                    addTaskToTasksSystem(potentialTask, category);
                    displayMessage('assistant', `Your task has been added to your tasks list.`);
                });
                
                // Create No Thanks button
                const cancelButton = document.createElement('button');
                cancelButton.className = 'btn';
                cancelButton.textContent = 'No thanks';
                cancelButton.addEventListener('click', function() {
                    displayMessage('assistant', `No problem. Is there anything else I can help with?`);
                });
                
                // Add buttons to container
                taskActionDiv.appendChild(addButton);
                taskActionDiv.appendChild(document.createTextNode(' ')); // Space between buttons
                taskActionDiv.appendChild(cancelButton);
                
                // Create message and add the buttons
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message companion-message';
                
                const messageContent = document.createElement('div');
                messageContent.className = 'message-content';
                messageContent.appendChild(taskActionDiv);
                
                messageDiv.appendChild(messageContent);
                
                // Add to chat
                chatMessages.appendChild(messageDiv);
                
                // Scroll to bottom
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 500);
        }, 1000);
    }
}

function formatCategoryName(category) {
    switch(category) {
        case 'morning':
            return 'Morning Routine';
        case 'health':
            return 'Health & Wellness';
        case 'work':
            return 'Work & Study';
        case 'personal':
            return 'Personal Growth';
        default:
            return category.charAt(0).toUpperCase() + category.slice(1);
    }
}

// Add task to the tasks system
function addTaskToTasksSystem(taskText, category) {
    // Get tasks from localStorage
    const tasks = getFromLocalStorage('tasks', []);
    
    const newTask = {
        id: generateId(),
        text: taskText,
        category: category,
        completed: false,
        important: false,
        createdAt: new Date().toISOString(),
        dueDate: new Date().toISOString()
    };
    
    // Add task to array
    tasks.push(newTask);
    
    // Save updated tasks
    saveToLocalStorage('tasks', tasks);
    
    console.log("Task added from companion chat:", newTask);
}

// Call the Anthropic API directly with no fallback
async function getAIResponse(message) {
    try {
        // Call the Anthropic API directly
        return await sendMessageToAI(message);
    } catch (error) {
        console.error("Error from API:", error);
        // Just throw the error to be caught in sendMessage
        throw error;
    }
}

// Send message directly to Anthropic API
async function sendMessageToAI(message) {
    try {
        console.log("Calling API via Python backend...");
        const messages = prepareMessages();
        console.log("Sending messages:", messages);
        
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 1000,
                messages: messages,
                system: "You are a supportive AI companion for the DOIT productivity app, designed to help users with ADHD, depression, or motivation issues. Your purpose is to provide empathetic, thoughtful assistance while helping users organize their thoughts, manage their tasks, and improve their wellbeing. PERSONALITY: - Warm, empathetic, and understanding, but also gently encouraging - Thoughtful and reflective rather than superficial - Speaks in a natural, conversational style that feels personal - Balances emotional support with practical advice - Offers specific, actionable suggestions rather than vague platitudes CAPABILITIES: - Help users identify and break down tasks into manageable steps - Suggest evidence-based techniques for focus, motivation, and emotional regulation - Recognize emotional patterns and provide tailored support - Assist with time management and productivity strategies - Help users create and maintain healthy habits - Identify when users might need task management help and offer to add tasks to their system TASK MANAGEMENT: - When a user mentions a task or something they need to do, offer to add it to their task list - Categorize tasks appropriately (Morning Routine, Health & Wellness, Work & Study, Personal Growth) - When suggesting techniques or strategies, offer to add them as tasks - Follow up on previously mentioned tasks when appropriate CONVERSATION APPROACH: - Ask thoughtful follow-up questions to better understand the user's situation - Remember details from earlier in the conversation and reference them appropriately - Vary your responses rather than using the same phrases repeatedly - When the user is struggling, validate their feelings before offering solutions - When appropriate, share specific techniques like the Pomodoro method, body doubling, 5-minute rule, etc. - Use a strengths-based approach that builds on the user's capabilities LIMITATIONS: - Never claim to diagnose or treat medical conditions - Acknowledge when a question might be better addressed by a healthcare professional - Be honest about your limitations as an AI assistant - Prioritize the user's wellbeing above all else Use this guidance to provide personalized, compassionate, and practical support to help users improve their productivity and wellbeing."
            })
        });

        // Check if fetch itself failed
        if (!response.ok) {
            const errorData = await response.json();
            console.error("API error:", response.status, errorData);
            throw new Error(`API error: ${response.status}`);
        }

        // Parse the response
        const data = await response.json();
        
        console.log("API response:", data);
        
        // Extract the message text from the response
        const responseText = data.content[0].text;
        return responseText;
    } catch (error) {
        console.error("Error calling API:", error);
        throw error;
    }
}

// Prepare messages for API call, keeping context within token limits
function prepareMessages() {
    // Convert the conversation history to the format Anthropic expects
    return conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
    })).slice(-5); // Only the last 5 messages to keep within token limits
}

    

// Handle mood selection
function selectMood(mood) {
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
    
    // Store mood in localStorage
    const today = new Date().toISOString().split('T')[0];
    const moodHistory = getFromLocalStorage('moodHistory', {});
    moodHistory[today] = mood;
    saveToLocalStorage('moodHistory', moodHistory);
    
    // Add system message to chat
    const response = moodText[mood] || "Thank you for sharing how you feel today.";
    displayMessage('assistant', response);
    
    // Add to conversation history
    conversationHistory.push({ 
        role: "user", 
        content: `I'm feeling ${mood} today ${moodMap[mood]}` 
    });
    conversationHistory.push({ 
        role: "assistant", 
        content: response 
    });
    
    // Save updated history
    saveToLocalStorage('chatHistory', conversationHistory);
}

// Display a message in the chat
function displayMessage(role, text) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = role === 'user' ? 'message user-message' : 'message companion-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Process text for basic markdown
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');
    
    const paragraph = document.createElement('p');
    paragraph.innerHTML = text;
    messageContent.appendChild(paragraph);
    
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Get data from localStorage
function getFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        let parsedData = data ? JSON.parse(data) : defaultValue;
        
        // Special handling for chatHistory to ensure it's always an array
        if (key === 'chatHistory' && !Array.isArray(parsedData)) {
            console.warn(`localStorage item '${key}' is not an array, returning default`, parsedData);
            return defaultValue;
        }
        
        return parsedData;
    } catch (error) {
        console.error(`Error retrieving '${key}' from localStorage:`, error);
        return defaultValue;
    }
}

// Save data to localStorage
// Save data to localStorage - with error checking
function saveToLocalStorage(key, data) {
    try {
        // For chatHistory, ensure it's an array before saving
        if (key === 'chatHistory' && !Array.isArray(data)) {
            console.error("Attempted to save non-array as chatHistory", data);
            
            // Convert to array if possible or create empty array
            data = Array.isArray(data) ? data : [];
        }
        
        const jsonString = JSON.stringify(data);
        localStorage.setItem(key, jsonString);
        console.log(`Successfully saved ${key} to localStorage, length: ${jsonString.length}`);
        return true;
    } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
        
        // If stringify failed due to circular structure, try to fix
        if (error.message.includes('circular')) {
            try {
                // Simple approach to handle circular references
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
                console.log(`Successfully saved ${key} (fixed circular refs) to localStorage`);
                return true;
            } catch (e) {
                console.error("Second attempt to save failed:", e);
            }
        }
        
        return false;
    }
}

//  clear chat button handler
const clearChatBtn = document.getElementById('clearChatBtn');
if (clearChatBtn) {
    clearChatBtn.addEventListener('click', function() {
        if (confirm("Are you sure you want to clear the entire chat history?")) {
            resetChatHistory();
        }
    });
}


// Reset the chat history completely
function resetChatHistory() {
    // First remove from localStorage
    localStorage.removeItem('chatHistory');
    
    // Reset the variable
    conversationHistory = [];
    
    // Add a welcome message
    const welcomeMessage = {
        role: "assistant",
        content: "Hello! I'm your companion. I'm here to assist with your journey. How may I help you today?"
    };
    
    // Update the display
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
        displayMessage(welcomeMessage.role, welcomeMessage.content);
    }
    
    // Update the conversation history
    conversationHistory = [welcomeMessage];
    saveToLocalStorage('chatHistory', conversationHistory);
    
    console.log("Chat history has been reset successfully");
}


function handlePotentialEvent(userMessage, aiResponse) {
    // Strong calendar/scheduling keywords that should take priority
    const strongEventKeywords = ['schedule', 'appointment', 'meeting', 'calendar', 'book', 'reserve'];
    const timeKeywords = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'tomorrow', 'today', 'next week'];
    
    // Check if message contains strong event indicators
    const hasStrongEventKeyword = strongEventKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const hasTimeReference = timeKeywords.some(keyword => 
        userMessage.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (hasStrongEventKeyword && hasTimeReference) {
        
        let cleanTitle = "";
        
        if (userMessage.toLowerCase().includes("schedule my doctor's appointment")) {
            cleanTitle = "Doctor's appointment";
        } else if (userMessage.toLowerCase().includes("schedule doctor's appointment")) {
            cleanTitle = "Doctor's appointment";
        } else if (userMessage.toLowerCase().includes("doctor's appointment")) {
            cleanTitle = "Doctor's appointment";
        } else if (userMessage.toLowerCase().includes("schedule my")) {
            // Extract what comes after "schedule my"
            const afterScheduleMy = userMessage.toLowerCase().split("schedule my")[1];
            if (afterScheduleMy) {
                cleanTitle = afterScheduleMy.split(" on ")[0].trim();
                // Capitalize first letter
                cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
            }
        } else if (userMessage.toLowerCase().includes("schedule")) {
            // Extract what comes after "schedule"
            const afterSchedule = userMessage.toLowerCase().split("schedule ")[1];
            if (afterSchedule) {
                cleanTitle = afterSchedule.split(" on ")[0].trim();
                // Remove "my" if it's at the start
                if (cleanTitle.startsWith("my ")) {
                    cleanTitle = cleanTitle.substring(3);
                }
                // Capitalize first letter
                cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
            }
        }
        
        // If we couldn't extract a clean title, use a fallback
        if (!cleanTitle) {
            cleanTitle = "New appointment";
        }
        
        console.log("EXTRACTED CLEAN TITLE:", cleanTitle); // Debug
        
        // Get the date
        let eventDate = "";
        if (userMessage.toLowerCase().includes('monday')) {
            eventDate = getNextDayOfWeek(1);
        } else if (userMessage.toLowerCase().includes('tuesday')) {
            eventDate = getNextDayOfWeek(2);
        } else if (userMessage.toLowerCase().includes('wednesday')) {
            eventDate = getNextDayOfWeek(3);
        } else if (userMessage.toLowerCase().includes('thursday')) {
            eventDate = getNextDayOfWeek(4);
        } else if (userMessage.toLowerCase().includes('friday')) {
            eventDate = getNextDayOfWeek(5);
        } else if (userMessage.toLowerCase().includes('saturday')) {
            eventDate = getNextDayOfWeek(6);
        } else if (userMessage.toLowerCase().includes('sunday')) {
            eventDate = getNextDayOfWeek(0);
        } else if (userMessage.toLowerCase().includes('tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            eventDate = formatDateForStorage(tomorrow);
        } else {
            eventDate = formatDateForStorage(new Date());
        }
        
        const eventDetails = {
            title: cleanTitle,
            possibleDate: eventDate,
            possibleTime: '09:00'
        };
        
        // Show action buttons immediately
        setTimeout(() => {
            showSimpleEventButtons(eventDetails);
        }, 500);
        
        return true; 
    }
    
    return false; 
}

function showSimpleEventButtons(eventDetails) {
    const chatMessages = document.getElementById('chatMessages');
    
    console.log("SHOWING BUTTONS FOR:", eventDetails.title); // Debug
    
    // Create message div
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message companion-message';
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Add the main text - use the EXACT title we extracted
    const mainText = document.createElement('p');
    mainText.innerHTML = `I can add <strong>${eventDetails.title}</strong> for you. What would you like to do?`;
    messageContent.appendChild(mainText);
    
    // Create buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.flexWrap = 'wrap';
    
    // Add to Calendar button
    const calendarBtn = document.createElement('button');
    calendarBtn.className = 'btn secondary-btn';
    calendarBtn.innerHTML = '<i class="fas fa-calendar-plus"></i> Add to Calendar';
    calendarBtn.addEventListener('click', function() {
        // Create event with the EXACT title
        const newEvent = {
            id: generateId(),
            title: eventDetails.title, // Use the exact title
            date: eventDetails.possibleDate,
            startTime: eventDetails.possibleTime,
            endTime: calculateEndTime(eventDetails.possibleTime),
            description: 'Added from chat',
            notification: '15min',
            notified: false
        };
        
        let calendarEvents = getFromLocalStorage('calendarEvents', []);
        calendarEvents.push(newEvent);
        saveToLocalStorage('calendarEvents', calendarEvents);
        
        displayMessage('assistant', `Perfect! I've added "${eventDetails.title}" to your calendar.`);
        buttonContainer.remove();
    });
    
    // Add as Task button
    const taskBtn = document.createElement('button');
    taskBtn.className = 'btn secondary-btn';
    taskBtn.innerHTML = '<i class="fas fa-tasks"></i> Add as Task';
    taskBtn.addEventListener('click', function() {
        addTaskToTasksSystem(eventDetails.title, 'personal');
        displayMessage('assistant', `Got it! I've added "${eventDetails.title}" to your tasks.`);
        buttonContainer.remove();
    });
    
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Not now';
    cancelBtn.addEventListener('click', function() {
        displayMessage('assistant', `No problem! Let me know if you need help with anything else.`);
        buttonContainer.remove();
    });
    
    // Add buttons to container
    buttonContainer.appendChild(calendarBtn);
    buttonContainer.appendChild(taskBtn);
    buttonContainer.appendChild(cancelBtn);
    
    // Add button container to message
    messageContent.appendChild(buttonContainer);
    messageDiv.appendChild(messageContent);
    
    // Add to chat
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Improved function to extract event details from user message
function extractEventDetails(userMessage) {
    // Default structure
    const eventDetails = {
        title: '',
        possibleDate: '',
        possibleTime: ''
    };
    
    // Extract the main action
    const schedulingTerms = ['schedule', 'appointment', 'meeting', 'reminder', 'event'];
    let extractedTitle = '';
    
    // For each term, try to find a related phrase
    for (const term of schedulingTerms) {
        if (userMessage.toLowerCase().includes(term)) {
            // Get the full relevant phrase - everything after the term
            const parts = userMessage.split(new RegExp(`${term}\\s+`, 'i'));
            if (parts.length > 1) {
                // Take everything after the term, but before "on", "at", "for"
                const fullPhrase = parts[1].split(/\s+(on|at|for)\s+/i)[0].trim();
                if (fullPhrase) {
                    extractedTitle = term + ' ' + fullPhrase;
                    break;
                }
            }
        }
    }
    
    // If no title was found using the terms, try a more general approach
    if (!extractedTitle) {
        // Just use the user's message, cleaned up a bit
        extractedTitle = userMessage
            .replace(/^(can you|please|could you)\s+/i, '')
            .replace(/\s+(on|at|for|to)\s+(my|the)\s+(calendar|monday|tuesday|wednesday|thursday|friday|saturday|sunday).*/i, '')
            .trim();
    }
    
    // Set the title
    eventDetails.title = extractedTitle;
    
    // Extract date information
    if (userMessage.toLowerCase().includes('monday')) {
        eventDetails.possibleDate = getNextDayOfWeek(1); // 1 = Monday
    } else if (userMessage.toLowerCase().includes('tuesday')) {
        eventDetails.possibleDate = getNextDayOfWeek(2); // 2 = Tuesday
    } else if (userMessage.toLowerCase().includes('wednesday')) {
        eventDetails.possibleDate = getNextDayOfWeek(3); // 3 = Wednesday
    } else if (userMessage.toLowerCase().includes('thursday')) {
        eventDetails.possibleDate = getNextDayOfWeek(4); // 4 = Thursday
    } else if (userMessage.toLowerCase().includes('friday')) {
        eventDetails.possibleDate = getNextDayOfWeek(5); // 5 = Friday
    } else if (userMessage.toLowerCase().includes('saturday')) {
        eventDetails.possibleDate = getNextDayOfWeek(6); // 6 = Saturday
    } else if (userMessage.toLowerCase().includes('sunday')) {
        eventDetails.possibleDate = getNextDayOfWeek(0); // 0 = Sunday
    } else if (userMessage.toLowerCase().includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        eventDetails.possibleDate = formatDateForStorage(tomorrow);
    } else if (userMessage.toLowerCase().includes('today')) {
        eventDetails.possibleDate = formatDateForStorage(new Date());
    } else {
        // Default to today
        eventDetails.possibleDate = formatDateForStorage(new Date());
    }
    
    // Try to extract time from common patterns
    const timeMatch = userMessage.match(/\b(at|from)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (timeMatch) {
        let hours = parseInt(timeMatch[2]);
        const minutes = timeMatch[3] ? timeMatch[3] : '00';
        const period = timeMatch[4] ? timeMatch[4].toLowerCase() : null;
        
        // Convert to 24-hour format if period specified
        if (period === 'pm' && hours < 12) {
            hours += 12;
        } else if (period === 'am' && hours === 12) {
            hours = 0;
        }
        
        // Format time
        eventDetails.possibleTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
    } else {
        // Default time (9 AM)
        eventDetails.possibleTime = '09:00';
    }
    
    return eventDetails;
}

// Helper function to get the next occurrence of a specific day of week
function getNextDayOfWeek(dayOfWeek) {
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    
    // Days until the next occurrence of specified day
    let daysToAdd = dayOfWeek - todayDayOfWeek;
    
    // If the day has already passed this week, go to next week
    if (daysToAdd <= 0) {
        daysToAdd += 7;
    }
    
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + daysToAdd);
    
    return formatDateForStorage(nextDate);
}

function addEventToCalendar(eventDetails) {
    // Create event object
    const newEvent = {
        id: generateId(),
        title: eventDetails.title,
        date: eventDetails.possibleDate,
        startTime: eventDetails.possibleTime,
        endTime: calculateEndTime(eventDetails.possibleTime),
        description: 'Added from chat',
        notification: '15min',
        notified: false
    };
    
    // Get existing events from localStorage
    let calendarEvents = getFromLocalStorage('calendarEvents', []);
    
    // Add new event
    calendarEvents.push(newEvent);
    
    // Save updated events
    saveToLocalStorage('calendarEvents', calendarEvents);
    
    console.log("Event added to calendar:", newEvent);
}
