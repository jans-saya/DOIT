

class InAppNotifications {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }
    
    init() {
        this.createContainer();
        console.log('✅ In-app notification system ready');
    }
    
    createContainer() {
        // Create notification container
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.innerHTML = `
            <style>
                #notification-container {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 350px;
                    z-index: 1000;
                    pointer-events: none;
                }
                
                .in-app-notification {
                    background: linear-gradient(135deg, rgba(52, 45, 33, 0.95), rgba(62, 55, 43, 0.95));
                    border: 1px solid #C4A96A;
                    border-radius: 12px;
                    padding: 16px 20px;
                    margin-bottom: 12px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                    pointer-events: all;
                    position: relative;
                    overflow: hidden;
                    animation: slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    font-family: 'Lora', Georgia, serif;
                    color: #E9DFC8;
                }
                
                .notification-success {
                    border-left: 4px solid #4CAF50;
                }
                
                .notification-info {
                    border-left: 4px solid #2196F3;
                }
                
                .notification-warning {
                    border-left: 4px solid #FF9800;
                }
                
                .notification-error {
                    border-left: 4px solid #F44336;
                }
                
                .notification-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .notification-title {
                    font-family: 'Libre Baskerville', serif;
                    font-weight: 600;
                    font-size: 1.1rem;
                    color: #C4A96A;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .notification-icon {
                    font-size: 1.2rem;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: #A8998A;
                    cursor: pointer;
                    font-size: 1.3rem;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s ease;
                }
                
                .notification-close:hover {
                    background: rgba(196, 169, 106, 0.1);
                    color: #E9DFC8;
                }
                
                .notification-message {
                    font-size: 0.95rem;
                    line-height: 1.4;
                    margin-bottom: 8px;
                }
                
                .notification-time {
                    font-size: 0.8rem;
                    color: #A8998A;
                    font-style: italic;
                }
                
                .notification-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                
                .notification-btn {
                    padding: 6px 12px;
                    border: 1px solid #C4A96A;
                    background: transparent;
                    color: #C4A96A;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.3s ease;
                    font-family: 'Lora', Georgia, serif;
                }
                
                .notification-btn:hover {
                    background: rgba(196, 169, 106, 0.1);
                    transform: translateY(-1px);
                }
                
                .notification-btn.primary {
                    background: #C4A96A;
                    color: #252017;
                }
                
                .notification-btn.primary:hover {
                    background: #D6BB7C;
                }
                
                .notification-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: #C4A96A;
                    border-radius: 0 0 12px 12px;
                    animation: progressBar linear;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                
                @keyframes progressBar {
                    from {
                        width: 100%;
                    }
                    to {
                        width: 0%;
                    }
                }
                
                .notification-removing {
                    animation: slideOutRight 0.3s ease-in;
                }
                
                /* Celebration effects for success notifications */
                .notification-success::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(76, 175, 80, 0.1), transparent);
                    animation: celebrate 2s ease-in-out;
                }
                
                @keyframes celebrate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(this.container);
    }
    
    show(type, title, message, options = {}) {
        const notification = {
            id: this.generateId(),
            type: type,
            title: title,
            message: message,
            options: options,
            createdAt: new Date()
        };
        
        this.notifications.push(notification);
        this.render(notification);
        
        // Auto-remove after specified time
        const autoClose = options.autoClose !== false;
        const delay = options.delay || 5000;
        
        if (autoClose) {
            setTimeout(() => {
                this.remove(notification.id);
            }, delay);
        }
        
        return notification.id;
    }
    
    render(notification) {
        const element = document.createElement('div');
        element.className = `in-app-notification notification-${notification.type}`;
        element.dataset.id = notification.id;
        
        const icon = this.getIcon(notification.type);
        const time = this.formatTime(notification.createdAt);
        
        let actionsHtml = '';
        if (notification.options.actions && notification.options.actions.length > 0) {
            actionsHtml = `
                <div class="notification-actions">
                    ${notification.options.actions.map(action => 
                        `<button class="notification-btn ${action.primary ? 'primary' : ''}" 
                                data-action="${action.id}">${action.label}</button>`
                    ).join('')}
                </div>
            `;
        }
        
        const autoClose = notification.options.autoClose !== false;
        const delay = notification.options.delay || 5000;
        
        element.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">
                    <span class="notification-icon">${icon}</span>
                    ${notification.title}
                </div>
                <button class="notification-close" data-close="${notification.id}">&times;</button>
            </div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${time}</div>
            ${actionsHtml}
            ${autoClose ? `<div class="notification-progress" style="animation-duration: ${delay}ms;"></div>` : ''}
        `;
        
        // Add event listeners
        const closeBtn = element.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.remove(notification.id));
        
        // Add action listeners
        if (notification.options.actions) {
            notification.options.actions.forEach(action => {
                const actionBtn = element.querySelector(`[data-action="${action.id}"]`);
                if (actionBtn) {
                    actionBtn.addEventListener('click', () => {
                        if (action.callback) action.callback();
                        if (action.autoClose !== false) {
                            this.remove(notification.id);
                        }
                    });
                }
            });
        }
        
        this.container.appendChild(element);
        
        // Limit to 5 notifications maximum
        if (this.container.children.length > 6) { // 6 because of the style tag
            const oldest = this.container.children[1]; // Skip the style tag
            if (oldest) {
                this.remove(oldest.dataset.id);
            }
        }
    }
    
    remove(notificationId) {
        const element = this.container.querySelector(`[data-id="${notificationId}"]`);
        if (element) {
            element.classList.add('notification-removing');
            setTimeout(() => {
                if (element.parentNode) {
                    element.remove();
                }
            }, 300);
        }
        
        // Remove from array
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
    }
    
    getIcon(type) {
        switch (type) {
            case 'success': return '🎉';
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            default: return 'ℹ️';
        }
    }
    
    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    // Convenience methods
    success(title, message, options = {}) {
        return this.show('success', title, message, options);
    }
    
    info(title, message, options = {}) {
        return this.show('info', title, message, options);
    }
    
    warning(title, message, options = {}) {
        return this.show('warning', title, message, options);
    }
    
    error(title, message, options = {}) {
        return this.show('error', title, message, options);
    }
    
    // Clear all notifications
    clear() {
        const notifications = this.container.querySelectorAll('.in-app-notification');
        notifications.forEach(notification => {
            this.remove(notification.dataset.id);
        });
    }
}

// Initialize the notification system
const notifications = new InAppNotifications();

// Global convenience functions
window.showNotification = (type, title, message, options = {}) => {
    return notifications.show(type, title, message, options);
};

window.showSuccess = (title, message, options = {}) => {
    return notifications.success(title, message, options);
};

window.showInfo = (title, message, options = {}) => {
    return notifications.info(title, message, options);
};

window.showWarning = (title, message, options = {}) => {
    return notifications.warning(title, message, options);
};

window.showError = (title, message, options = {}) => {
    return notifications.error(title, message, options);
};

// Updated task completion function
function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        // Toggle completion status
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        
        // Show in-app notification when task completed
        if (tasks[taskIndex].completed) {
            showSuccess(
                'Task Completed! 🎯',
                `Great job finishing "${tasks[taskIndex].text}"`,
                {
                    actions: [
                        {
                            id: 'view_tasks',
                            label: 'View All Tasks',
                            callback: () => console.log('View tasks clicked')
                        }
                    ]
                }
            );
        }
        
        // Save to localStorage
        saveToLocalStorage('tasks', tasks);
        
        // Render tasks
        renderTasks();
        
        // Update progress
        updateTaskProgress();
    }
}

// Examples of other notifications you can use:
window.exampleNotifications = () => {
    // Task notifications
    showSuccess('Task Added', 'New task has been added to your list');
    
    setTimeout(() => {
        showInfo('Timer Started', 'Focus session beginning now');
    }, 1000);
    
    setTimeout(() => {
        showWarning('Break Time', 'You\'ve been working for 25 minutes', {
            actions: [
                {
                    id: 'start_break',
                    label: 'Start Break',
                    primary: true,
                    callback: () => console.log('Starting break')
                },
                {
                    id: 'continue',
                    label: 'Keep Working',
                    callback: () => console.log('Continuing work')
                }
            ]
        });
    }, 2000);
    
    setTimeout(() => {
        showError('Sync Failed', 'Unable to save your data. Please try again.');
    }, 3000);
};

// Test function
window.testInAppNotifications = () => {
    exampleNotifications();
};