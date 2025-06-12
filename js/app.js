
document.addEventListener('DOMContentLoaded', function() {

    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        currentDateElement.textContent = today.toLocaleDateString('en-US', options);
    }

    // Initialize modals
    initializeModals();
    
    // Request notification permission if needed
    requestNotificationPermission();
});

/**
 * Modal functionality
 */
function initializeModals() {
    // Get all modals and their related buttons
    const modals = document.querySelectorAll('.modal');
    
    // Handle opening modals
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        const addTaskModal = document.getElementById('addTaskModal');
        addTaskBtn.addEventListener('click', () => {
            addTaskModal.classList.add('is-active');
        });
    }
    
    // Handle quick add task button on dashboard
    const quickAddTask = document.getElementById('quickAddTask');
    if (quickAddTask) {
        const addTaskModal = document.getElementById('addTaskModal');
        if (addTaskModal) {
            quickAddTask.addEventListener('click', () => {
                addTaskModal.classList.add('is-active');
            });
        }
    }
    
    // Handle closing modals
    modals.forEach(modal => {
        // Close button in modal
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('is-active');
            });
        }
        
        // Close when clicking modal background
        const modalBg = modal.querySelector('.modal-background');
        if (modalBg) {
            modalBg.addEventListener('click', () => {
                modal.classList.remove('is-active');
            });
        }
        
        // Cancel button
        const cancelBtn = modal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('is-active');
            });
        }
    });
}

/**
 * Request notification permission
 */
function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
        // Wait a moment before asking for permission
        setTimeout(() => {
            Notification.requestPermission();
        }, 5000);
    }
}

/**
 * Utility functions
 */

// Format time in MM:SS format
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Show notification
function showNotification(title, message) {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return;
    }
    
    // Check if permission is already granted
    if (Notification.permission === "granted") {
        createNotification(title, message);
    } 
    // Otherwise, request permission
    else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                createNotification(title, message);
            }
        });
    }
}

// Create and show notification
function createNotification(title, message) {
    const notification = new Notification(title, {
        body: message,
        icon: "assets/images/app-icon.png"
    });
    
    notification.onclick = function() {
        window.focus();
        this.close();
    };
    
    // Auto close after 5 seconds
    setTimeout(() => {
        notification.close();
    }, 5000);
}

// Save data to localStorage
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Error saving to localStorage:", error);
        return false;
    }
}

// Get data from localStorage
function getFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error("Error retrieving from localStorage:", error);
        return defaultValue;
    }
}

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}