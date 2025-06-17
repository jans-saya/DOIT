
document.addEventListener('DOMContentLoaded', function() {

    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        currentDateElement.textContent = today.toLocaleDateString('en-US', options);
    }

    // Initialize modals
    initializeModals();
    
    
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





// Format time in MM:SS format
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

function initializeAuth() {
    const currentUser = getFromLocalStorage('currentUser', null);
    const loginLinks = document.querySelectorAll('.login-link');
    
    if (currentUser) {
        // User is logged in
        loginLinks.forEach(link => {
            // Change login link to show user name and dropdown
            link.textContent = currentUser.name || currentUser.email.split('@')[0];
            link.href = '#';
            link.classList.add('user-profile-link');
            
            // Add dropdown menu on click
            link.addEventListener('click', handleUserMenu);
        });
        
        // Show welcome message for new users
        if (currentUser.isNewUser) {
            setTimeout(() => {
                showWelcomeMessage(currentUser);
                // Clear the new user flag
                delete currentUser.isNewUser;
                saveToLocalStorage('currentUser', currentUser);
            }, 1000);
        }
        
    } else {
        // User is not logged in
        loginLinks.forEach(link => {
            link.textContent = 'Login';
            link.href = 'login.html';
            link.classList.remove('user-profile-link');
        });
    }
}

// Handle user menu dropdown
function handleUserMenu(e) {
    e.preventDefault();
    
    // Remove existing menu if present
    const existingMenu = document.querySelector('.user-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const currentUser = getFromLocalStorage('currentUser');
    if (!currentUser) return;
    
    // Create user menu dropdown
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: var(--spacing-sm);
        box-shadow: 0 4px 12px var(--shadow-color);
        z-index: 1000;
        min-width: 200px;
        animation: dropdownSlide 0.3s ease-out;
    `;
    
    // Add dropdown animation
    if (!document.getElementById('dropdown-styles')) {
        const style = document.createElement('style');
        style.id = 'dropdown-styles';
        style.textContent = `
            @keyframes dropdownSlide {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }
    
    menu.innerHTML = `
        <div style="padding: var(--spacing-sm); border-bottom: 1px solid var(--border-color); margin-bottom: var(--spacing-sm); color: var(--text-primary);">
            <strong>${currentUser.name}</strong>
            <div style="font-size: 0.9rem; color: var(--text-muted);">${currentUser.email}</div>
        </div>
        <button class="menu-btn" onclick="viewProfile()" style="width: 100%; margin-bottom: var(--spacing-xs);">
            <i class="fas fa-user" style="margin-right: 8px;"></i>Profile
        </button>
        <button class="menu-btn" onclick="viewSettings()" style="width: 100%; margin-bottom: var(--spacing-xs);">
            <i class="fas fa-cog" style="margin-right: 8px;"></i>Settings
        </button>
        <button class="menu-btn" onclick="exportData()" style="width: 100%; margin-bottom: var(--spacing-xs);">
            <i class="fas fa-download" style="margin-right: 8px;"></i>Export Data
        </button>
        <hr style="border: none; border-top: 1px solid var(--border-color); margin: var(--spacing-sm) 0;">
        <button class="menu-btn logout-btn" onclick="logout()" style="width: 100%; color: #F44336;">
            <i class="fas fa-sign-out-alt" style="margin-right: 8px;"></i>Logout
        </button>
    `;
    
    // Style menu buttons
    const menuButtons = menu.querySelectorAll('.menu-btn');
    menuButtons.forEach(btn => {
        btn.style.cssText = `
            background: transparent;
            border: none;
            color: var(--text-primary);
            padding: var(--spacing-sm);
            text-align: left;
            cursor: pointer;
            border-radius: var(--border-radius);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            font-family: inherit;
        `;
        
        btn.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'var(--hover-bg)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
    });
    
    // Position menu relative to the clicked link
    const linkRect = e.target.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${linkRect.bottom + 5}px`;
    menu.style.right = `${window.innerWidth - linkRect.right}px`;
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !e.target.classList.contains('user-profile-link')) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

// Show welcome message for new users
function showWelcomeMessage(user) {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, var(--card-bg), rgba(62, 55, 43, 0.95));
        border: 2px solid var(--color-gold);
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
        z-index: 10000;
        max-width: 400px;
        text-align: center;
        animation: welcomePopIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    
    // Add welcome animation
    if (!document.getElementById('welcome-styles')) {
        const style = document.createElement('style');
        style.id = 'welcome-styles';
        style.textContent = `
            @keyframes welcomePopIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    welcomeDiv.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <i class="fas fa-user-check" style="font-size: 3rem; color: var(--color-gold); margin-bottom: 1rem;"></i>
            <h2 style="color: var(--color-gold); margin-bottom: 0.5rem; font-family: 'Libre Baskerville', serif;">
                Welcome to DOIT!
            </h2>
            <p style="color: var(--text-primary); margin-bottom: 1.5rem; line-height: 1.5;">
                Hello <strong>${user.name}</strong>! Your productivity journey starts now. 
                Let's help you achieve your goals with our AI companion, task management, and focus tools.
            </p>
            <button id="welcomeGetStarted" style="
                background: var(--color-gold);
                color: var(--color-dark-brown);
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                font-family: 'Libre Baskerville', serif;
                transition: all 0.3s ease;
            ">
                Get Started
            </button>
        </div>
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 9999;
        backdrop-filter: blur(3px);
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(welcomeDiv);
    
    // Handle get started button
    const getStartedBtn = document.getElementById('welcomeGetStarted');
    getStartedBtn.addEventListener('click', function() {
        backdrop.remove();
        welcomeDiv.remove();
        
        // Optionally navigate to a specific page
        // window.location.href = 'companion.html';
    });
    
    // Auto-close after 10 seconds
    setTimeout(() => {
        if (backdrop.parentNode) backdrop.remove();
        if (welcomeDiv.parentNode) welcomeDiv.remove();
    }, 10000);
}

// User menu functions
function viewProfile() {
    const currentUser = getFromLocalStorage('currentUser');
    if (!currentUser) return;
    
    alert(`Profile: ${currentUser.name}\nEmail: ${currentUser.email}\nMember since: ${new Date(currentUser.registrationTime || currentUser.loginTime).toLocaleDateString()}`);
}

function viewSettings() {
    alert('Settings panel would open here. This is a demo feature.');
}

function exportData() {
    try {
        const userData = {
            user: getFromLocalStorage('currentUser'),
            tasks: getFromLocalStorage('tasks', []),
            calendarEvents: getFromLocalStorage('calendarEvents', []),
            chatHistory: getFromLocalStorage('chatHistory', []),
            pomodoroStats: getFromLocalStorage('pomodoroStats', {}),
            moodHistory: getFromLocalStorage('moodHistory', {}),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `doit-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.showSuccess) {
            window.showSuccess('Data Exported', 'Your DOIT data has been downloaded successfully.');
        }
    } catch (error) {
        console.error('Export error:', error);
        if (window.showError) {
            window.showError('Export Failed', 'Could not export your data. Please try again.');
        }
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    
    if (window.showSuccess) {
        window.showSuccess('Logged Out', 'You have been logged out successfully.');
    }
    
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Make functions globally available
window.viewProfile = viewProfile;
window.viewSettings = viewSettings;
window.exportData = exportData;
window.logout = logout;

// Update the main initialization to include auth
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOIT App Initializing...');
    
    // Initialize authentication first
    initializeAuth();
    
    // Initialize current date display
    initializeDateDisplay();
    
    // Initialize page-specific functionality
    initializePageFeatures();
    
    // Initialize notifications system
    initializeNotifications();
    
    console.log('✅ DOIT App Ready');
});