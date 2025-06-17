// Calendar management
let currentDate = new Date();
let events = [];
let selectedEventId = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize calendar
    initCalendar();
});

function initCalendar() {
    // Set up current month display
    updateMonthDisplay();
    
    // Generate calendar grid
    generateCalendar();
    
    // Load events from localStorage
    loadEvents();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up daily check-in
    setupDailyCheckIn();
    
    // Set up notifications
    setupNotifications();
}

// Load events from localStorage
function loadEvents() {
    events = getFromLocalStorage('calendarEvents', []);
    
    // Populate calendar with events
    renderEvents();
    
    // Update upcoming events list
    updateUpcomingEvents();
}

// Set up event listeners
function setupEventListeners() {
    // Month navigation
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', goToPreviousMonth);
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', goToNextMonth);
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', goToToday);
    }
    
    // Add event button
    const addEventBtn = document.getElementById('addEventBtn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', openAddEventModal);
    }
    
    // Modal close buttons
    setupModalButtons();
    
    // Save event button
    const saveEventBtn = document.getElementById('saveEvent');
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', saveEvent);
    }
    
    // Save daily focus button
    const saveFocusBtn = document.getElementById('saveFocus');
    if (saveFocusBtn) {
        saveFocusBtn.addEventListener('click', saveDailyFocus);
    }
    
    // AI suggest event time button
    const aiSuggestBtn = document.getElementById('aiSuggestEvent');
    if (aiSuggestBtn) {
        aiSuggestBtn.addEventListener('click', suggestEventTime);
    }
    
    // Edit and delete event buttons
    const editEventBtn = document.getElementById('editEvent');
    const deleteEventBtn = document.getElementById('deleteEvent');
    
    if (editEventBtn) {
        editEventBtn.addEventListener('click', editEvent);
    }
    
    if (deleteEventBtn) {
        deleteEventBtn.addEventListener('click', deleteEvent);
    }
}

// Set up modal buttons
function setupModalButtons() {
    // Get all modals
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('is-active');
            });
        }
        
        // Background click
        const modalBg = modal.querySelector('.modal-background');
        if (modalBg) {
            modalBg.addEventListener('click', () => {
                modal.classList.remove('is-active');
            });
        }
        
        // Cancel button
        const cancelBtn = modal.querySelector('#cancelEvent');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('is-active');
            });
        }
    });
}

// Set up daily check-in
function setupDailyCheckIn() {
    // Set current date
    const checkInDate = document.querySelector('.check-in-date');
    if (checkInDate) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        checkInDate.textContent = new Date().toLocaleDateString('en-US', options);
    }
    
    // Set up mood buttons
    const moodButtons = document.querySelectorAll('.mood-btn');
    moodButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove selected class from all buttons
            moodButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add selected class to clicked button
            this.classList.add('selected');
            
            // Save mood to localStorage
            const mood = this.getAttribute('data-mood');
            saveMood(mood);
        });
    });
    
    // Load saved mood
    loadSavedMood();
    
    // Load saved daily focus
    loadSavedFocus();
}

// Save mood to localStorage
function saveMood(mood) {
    const today = new Date().toISOString().split('T')[0];
    const moodHistory = getFromLocalStorage('moodHistory', {});
    moodHistory[today] = mood;
    saveToLocalStorage('moodHistory', moodHistory);
}

// Load saved mood
function loadSavedMood() {
    const today = new Date().toISOString().split('T')[0];
    const moodHistory = getFromLocalStorage('moodHistory', {});
    const todayMood = moodHistory[today];
    
    if (todayMood) {
        const moodBtn = document.querySelector(`.mood-btn[data-mood="${todayMood}"]`);
        if (moodBtn) {
            moodBtn.classList.add('selected');
        }
    }
}

// Save daily focus
function saveDailyFocus() {
    const focusInput = document.getElementById('dailyFocus');
    if (!focusInput) return;
    
    const focus = focusInput.value.trim();
    const today = new Date().toISOString().split('T')[0];
    const focusHistory = getFromLocalStorage('focusHistory', {});
    
    focusHistory[today] = focus;
    saveToLocalStorage('focusHistory', focusHistory);
    
    // Show saved confirmation
    const saveFocusBtn = document.getElementById('saveFocus');
    if (saveFocusBtn) {
        const originalText = saveFocusBtn.textContent;
        saveFocusBtn.textContent = 'Saved!';
        
        setTimeout(() => {
            saveFocusBtn.textContent = originalText;
        }, 2000);
    }
}

// Load saved daily focus
function loadSavedFocus() {
    const focusInput = document.getElementById('dailyFocus');
    if (!focusInput) return;
    
    const today = new Date().toISOString().split('T')[0];
    const focusHistory = getFromLocalStorage('focusHistory', {});
    const todayFocus = focusHistory[today] || '';
    
    focusInput.value = todayFocus;
}

// Set up notifications
function setupNotifications() {
    // Request notification permission if needed
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
    
    // Check for upcoming event notifications every minute
    setInterval(checkEventNotifications, 60000);
}

// Check for event notifications
function checkEventNotifications() {
    if (Notification.permission !== "granted") return;
    
    const now = new Date();
    const currentTime = now.getTime();
    
    events.forEach(event => {
        if (event.notified) return; // Skip already notified events
        
        const eventTime = new Date(event.date + 'T' + event.startTime).getTime();
        const notifyTime = getNotificationTime(eventTime, event.notification);
        
        // If it's time to notify and we haven't already
        if (currentTime >= notifyTime && currentTime < eventTime) {
            // Create notification
            createEventNotification(event);
            
            // Mark as notified
            event.notified = true;
        }
    });
    
    // Save updated events
    saveToLocalStorage('calendarEvents', events);
}

// Get notification time based on event time and notification setting
function getNotificationTime(eventTime, notificationType) {
    switch (notificationType) {
        case '15min':
            return eventTime - (15 * 60 * 1000);
        case '30min':
            return eventTime - (30 * 60 * 1000);
        case '1hour':
            return eventTime - (60 * 60 * 1000);
        case '1day':
            return eventTime - (24 * 60 * 60 * 1000);
        default:
            return eventTime; // No notification
    }
}

// Create event notification
function createEventNotification(event) {
    const title = `Upcoming: ${event.title}`;
    const options = {
        body: `${formatEventTime(event)} - ${event.description || 'No description'}`,
        icon: 'assets/images/app-icon.png'
    };
    
    const notification = new Notification(title, options);
    
    notification.onclick = function() {
        window.focus();
        openEventDetails(event);
        this.close();
    };
}

// Update month display
function updateMonthDisplay() {
    const monthDisplay = document.getElementById('currentMonth');
    if (!monthDisplay) return;
    
    const options = { month: 'long', year: 'numeric' };
    monthDisplay.textContent = currentDate.toLocaleDateString('en-US', options);
}

// Generate calendar grid
function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    // Clear existing calendar
    calendarGrid.innerHTML = '';
    
    // Get first day of month
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get last day of month
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Get total days in month
    const totalDays = lastDay.getDate();
    
    // Get total days from previous month to display
    const prevMonthDays = firstDayOfWeek;
    
    // Get last day of previous month
    const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    
    // Create calendar days
    
    // Previous month days
    for (let i = prevMonthDays - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
        createCalendarDay(calendarGrid, day, date, true);
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        createCalendarDay(calendarGrid, day, date, false);
    }
    
    // Next month days (to fill out the grid)
    const totalCells = 42; // 6 rows x 7 days
    const nextMonthDays = totalCells - totalDays - prevMonthDays;
    
    for (let day = 1; day <= nextMonthDays; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
        createCalendarDay(calendarGrid, day, date, true);
    }
}

// Create calendar day element
function createCalendarDay(container, dayNumber, date, isOtherMonth) {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    // Create day element
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    dayElement.dataset.date = date.toISOString().split('T')[0];
    
    // Add additional classes
    if (isOtherMonth) {
        dayElement.classList.add('other-month');
    }
    
    if (isToday) {
        dayElement.classList.add('today');
    }
    
    // Add day number
    const dayNumberEl = document.createElement('div');
    dayNumberEl.className = 'day-number';
    dayNumberEl.textContent = dayNumber;
    dayElement.appendChild(dayNumberEl);
    
    // Add events container
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    dayElement.appendChild(eventsContainer);
    
    // Add click event to add an event on that day
    dayElement.addEventListener('click', function() {
        openAddEventModal(date);
    });
    
    // Append to container
    container.appendChild(dayElement);
}

// Open add event modal
function openAddEventModal(date) {
    const modal = document.getElementById('addEventModal');
    if (!modal) return;
    
    // Set default date to today or selected date
    const eventDate = document.getElementById('eventDate');
    if (eventDate) {
        const defaultDate = date instanceof Date ? date : new Date();
        eventDate.value = defaultDate.toISOString().split('T')[0];
    }
    
    // Clear form fields
    const eventTitle = document.getElementById('eventTitle');
    const eventStartTime = document.getElementById('eventStartTime');
    const eventEndTime = document.getElementById('eventEndTime');
    const eventDescription = document.getElementById('eventDescription');
    const eventNotify = document.getElementById('eventNotify');
    
    if (eventTitle) eventTitle.value = '';
    if (eventStartTime) eventStartTime.value = '';
    if (eventEndTime) eventEndTime.value = '';
    if (eventDescription) eventDescription.value = '';
    if (eventNotify) eventNotify.value = 'none';
    
    // Update save button text
    const saveEventBtn = document.getElementById('saveEvent');
    if (saveEventBtn) {
        saveEventBtn.textContent = 'Add Event';
    }
    
    // Hide AI suggest button for now
    const aiSuggestBtn = document.getElementById('aiSuggestEvent');
    if (aiSuggestBtn) {
        aiSuggestBtn.style.display = 'inline-block';
    }
    
    // Set selected event ID to null (creating a new event)
    selectedEventId = null;
    
    // Show modal
    modal.classList.add('is-active');
}

// Save event
function saveEvent() {
    // Get form values
    const eventTitle = document.getElementById('eventTitle').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const eventStartTime = document.getElementById('eventStartTime').value;
    const eventEndTime = document.getElementById('eventEndTime').value;
    const eventDescription = document.getElementById('eventDescription').value.trim();
    const eventNotify = document.getElementById('eventNotify').value;
    
    // Validate
    if (!eventTitle || !eventDate || !eventStartTime) {
        alert('Please fill in required fields: Title, Date, and Start Time.');
        return;
    }
    
    // Create event object
    const eventObj = {
        id: selectedEventId || generateId(),
        title: eventTitle,
        date: eventDate,
        startTime: eventStartTime,
        endTime: eventEndTime,
        description: eventDescription,
        notification: eventNotify,
        notified: false
    };
    
    // Update or add event
    if (selectedEventId) {
        // Update existing event
        const index = events.findIndex(event => event.id === selectedEventId);
        if (index !== -1) {
            events[index] = eventObj;
        }
    } else {
        // Add new event
        events.push(eventObj);
    }
    
    // Save to localStorage
    saveToLocalStorage('calendarEvents', events);
    
    // Close modal
    const modal = document.getElementById('addEventModal');
    if (modal) {
        modal.classList.remove('is-active');
    }
    
    // Re-render events
    renderEvents();
    
    // Update upcoming events list
    updateUpcomingEvents();

    showNotification('Event Added', `"${eventTitle}" scheduled for ${eventDate}`);
}

// Render events on calendar
function renderEvents() {
    // Clear existing events
    const eventContainers = document.querySelectorAll('.day-events');
    eventContainers.forEach(container => {
        container.innerHTML = '';
    });
    
    // Render each event
    events.forEach(event => {
        renderEvent(event);
    });
}

// Render a single event on the calendar
function renderEvent(event) {
    const dayElement = document.querySelector(`.calendar-day[data-date="${event.date}"]`);
    if (!dayElement) return;
    
    const eventsContainer = dayElement.querySelector('.day-events');
    if (!eventsContainer) return;
    
    // Check if we need "more events" indicator
    const currentEvents = eventsContainer.querySelectorAll('.day-event');
    if (currentEvents.length >= 3) {
        // Check if we already have "more events" indicator
        if (!eventsContainer.querySelector('.more-events')) {
            const moreEvents = document.createElement('div');
            moreEvents.className = 'more-events';
            moreEvents.textContent = `+${events.filter(e => e.date === event.date).length - 2} more`;
            eventsContainer.appendChild(moreEvents);
        }
        return;
    }
    
    // Create event element
    const eventElement = document.createElement('div');
    eventElement.className = 'day-event';
    eventElement.textContent = `${formatTime(event.startTime)} ${event.title}`;
    eventElement.dataset.eventId = event.id;
    
    // Add click event
    eventElement.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent opening the add event modal
        openEventDetails(event);
    });
    
    // Append to events container
    eventsContainer.appendChild(eventElement);
}

// Open event details modal
function openEventDetails(event) {
    const modal = document.getElementById('eventDetailsModal');
    if (!modal) return;
    
    // Set event details
    const detailsTitle = document.getElementById('detailsEventTitle');
    const detailsDate = document.getElementById('detailsEventDate');
    const detailsTime = document.getElementById('detailsEventTime');
    const detailsNotify = document.getElementById('detailsEventNotify');
    const detailsDescription = document.getElementById('detailsEventDescription');
    
    if (detailsTitle) detailsTitle.textContent = event.title;
    
    if (detailsDate) {
        const date = new Date(event.date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        detailsDate.textContent = date.toLocaleDateString('en-US', options);
    }
    
    if (detailsTime) {
        detailsTime.textContent = formatEventTime(event);
    }
    
    if (detailsNotify) {
        detailsNotify.textContent = formatNotification(event.notification);
    }
    
    if (detailsDescription) {
        detailsDescription.textContent = event.description || 'No description';
    }
    
    // Store selected event ID
    selectedEventId = event.id;
    
    // Show modal
    modal.classList.add('is-active');
}

// Edit event
function editEvent() {
    // Find the event
    const event = events.find(event => event.id === selectedEventId);
    if (!event) return;
    
    // Close details modal
    const detailsModal = document.getElementById('eventDetailsModal');
    if (detailsModal) {
        detailsModal.classList.remove('is-active');
    }
    
    // Open add event modal with event data
    const modal = document.getElementById('addEventModal');
    if (!modal) return;
    
    // Fill form fields
    const eventTitle = document.getElementById('eventTitle');
    const eventDate = document.getElementById('eventDate');
    const eventStartTime = document.getElementById('eventStartTime');
    const eventEndTime = document.getElementById('eventEndTime');
    const eventDescription = document.getElementById('eventDescription');
    const eventNotify = document.getElementById('eventNotify');
    
    if (eventTitle) eventTitle.value = event.title;
    if (eventDate) eventDate.value = event.date;
    if (eventStartTime) eventStartTime.value = event.startTime;
    if (eventEndTime) eventEndTime.value = event.endTime || '';
    if (eventDescription) eventDescription.value = event.description || '';
    if (eventNotify) eventNotify.value = event.notification || 'none';
    
    // Update save button text
    const saveEventBtn = document.getElementById('saveEvent');
    if (saveEventBtn) {
        saveEventBtn.textContent = 'Update Event';
    }
    
    // Hide AI suggest button for editing
    const aiSuggestBtn = document.getElementById('aiSuggestEvent');
    if (aiSuggestBtn) {
        aiSuggestBtn.style.display = 'none';
    }
    
    // Show modal
    modal.classList.add('is-active');
}

// Delete event
function deleteEvent() {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    // Remove event from array
    events = events.filter(event => event.id !== selectedEventId);
    
    // Save to localStorage
    saveToLocalStorage('calendarEvents', events);
    
    // Close modal
    const modal = document.getElementById('eventDetailsModal');
    if (modal) {
        modal.classList.remove('is-active');
    }
    
    // Re-render events
    renderEvents();
    
    // Update upcoming events list
    updateUpcomingEvents();
}

// Update upcoming events list
function updateUpcomingEvents() {
    const upcomingList = document.getElementById('upcomingEventsList');
    if (!upcomingList) return;
    
    // Clear existing list
    upcomingList.innerHTML = '';
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter upcoming events (events scheduled today or in the future)
    const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
    });
    
    // Sort by date
    upcomingEvents.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.startTime);
        const dateB = new Date(b.date + 'T' + b.startTime);
        return dateA - dateB;
    });
    
    // Display upcoming events (limit to 5)
    const eventsToShow = upcomingEvents.slice(0, 5);
    
    if (eventsToShow.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'event-item empty-message';
        emptyMessage.textContent = 'No upcoming events. Click "Add Event" to create one.';
        upcomingList.appendChild(emptyMessage);
        return;
    }
    
    eventsToShow.forEach(event => {
        const eventDate = new Date(event.date);
        const options = { month: 'short', day: 'numeric' };
        const formattedDate = eventDate.toLocaleDateString('en-US', options);
        
        const eventItem = document.createElement('li');
        eventItem.className = 'event-item';
        eventItem.dataset.eventId = event.id;
        
        eventItem.innerHTML = `
            <div class="event-date">${formattedDate}</div>
            <div class="event-content">
                <div class="event-title">${event.title}</div>
                <div class="event-time">${formatTime(event.startTime)}${event.endTime ? ' - ' + formatTime(event.endTime) : ''}</div>
            </div>
        `;
        
        // Add click event
        eventItem.addEventListener('click', function() {
            openEventDetails(event);
        });
        
        upcomingList.appendChild(eventItem);
    });
}

// Navigate to previous month
function goToPreviousMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    updateMonthDisplay();
    generateCalendar();
    renderEvents();
}

// Navigate to next month
function goToNextMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    updateMonthDisplay();
    generateCalendar();
    renderEvents();
}

// Navigate to today
function goToToday() {
    currentDate = new Date();
    updateMonthDisplay();
    generateCalendar();
    renderEvents();
}

// Suggest event time using AI (simulated)
function suggestEventTime() {
    const eventTitle = document.getElementById('eventTitle').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    
    if (!eventTitle || !eventTitle.length) {
        alert("Please enter an event title first.");
        return;
    }
    
    // Get day of week
    const date = new Date(eventDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Simulate AI suggestion based on event title and day of week
    let suggestedStartTime, suggestedEndTime;
    
    // Weekend vs weekday logic
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (eventTitle.toLowerCase().includes('meeting') || eventTitle.toLowerCase().includes('class')) {
        suggestedStartTime = isWeekend ? '10:00' : '09:00';
        suggestedEndTime = isWeekend ? '11:30' : '10:30';
    } else if (eventTitle.toLowerCase().includes('lunch') || eventTitle.toLowerCase().includes('eat')) {
        suggestedStartTime = '12:30';
        suggestedEndTime = '13:30';
    } else if (eventTitle.toLowerCase().includes('study') || eventTitle.toLowerCase().includes('work')) {
        suggestedStartTime = isWeekend ? '14:00' : '13:00';
        suggestedEndTime = isWeekend ? '17:00' : '16:00';
    } else if (eventTitle.toLowerCase().includes('exercise') || eventTitle.toLowerCase().includes('workout')) {
        suggestedStartTime = isWeekend ? '09:00' : '17:00';
        suggestedEndTime = isWeekend ? '10:00' : '18:00';
    } else {
        // Default times
        suggestedStartTime = isWeekend ? '11:00' : '18:00';
        suggestedEndTime = isWeekend ? '12:00' : '19:00';
    }
    
    // Update form fields
    const eventStartTime = document.getElementById('eventStartTime');
    const eventEndTime = document.getElementById('eventEndTime');
    
    if (eventStartTime) eventStartTime.value = suggestedStartTime;
    if (eventEndTime) eventEndTime.value = suggestedEndTime;
    
    // Show confirmation
    alert(`Based on your event "${eventTitle}" on ${formatDateString(eventDate)}, I suggest scheduling it from ${formatTime(suggestedStartTime)} to ${formatTime(suggestedEndTime)}.`);
}

// Format date string
function formatDateString(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format time (24h to 12h)
function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
}

// Format event time (start and end if available)
function formatEventTime(event) {
    const startTime = formatTime(event.startTime);
    
    if (event.endTime) {
        const endTime = formatTime(event.endTime);
        return `${startTime} - ${endTime}`;
    }
    
    return startTime;
}

// Format notification setting
function formatNotification(notification) {
    switch (notification) {
        case '15min':
            return '15 minutes before';
        case '30min':
            return '30 minutes before';
        case '1hour':
            return '1 hour before';
        case '1day':
            return '1 day before';
        default:
            return 'None';
    }
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}