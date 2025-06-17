

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initAuth();
});

function initAuth() {
    // Set up auth tabs
    setupAuthTabs();
    
    // Set up password visibility toggle
    setupPasswordToggles();
    
    // Set up password strength meter
    setupPasswordStrength();
    
    // Set up form submissions
    setupFormSubmissions();
}

// Set up auth tabs (login/register)
function setupAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and forms
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Get tab target and activate corresponding form
            const target = tab.dataset.tab;
            const form = document.getElementById(`${target}Form`);
            if (form) {
                form.classList.add('active');
            }
        });
    });
}

// Set up password visibility toggles
function setupPasswordToggles() {
    const toggles = document.querySelectorAll('.toggle-password');
    
    toggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            
            // Toggle password visibility
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                passwordInput.type = 'password';
                this.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });
}

// Set up password strength meter
function setupPasswordStrength() {
    const registerPassword = document.getElementById('registerPassword');
    if (!registerPassword) return;
    
    registerPassword.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        updatePasswordStrengthUI(strength);
    });
}

// Calculate password strength (0-3)
function calculatePasswordStrength(password) {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    
    // Character variety checks
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // Return score (0-4)
    return Math.min(4, strength);
}

// Update password strength UI
function updatePasswordStrengthUI(strength) {
    const segments = document.querySelectorAll('.strength-segment');
    const strengthText = document.querySelector('.strength-text');
    
    // Reset segments
    segments.forEach(segment => {
        segment.className = 'strength-segment';
    });
    
    // Update segments based on strength
    for (let i = 0; i < strength; i++) {
        if (i < segments.length) {
            if (strength === 1) {
                segments[i].classList.add('weak');
            } else if (strength === 2) {
                segments[i].classList.add('medium');
            } else {
                segments[i].classList.add('strong');
            }
        }
    }
    
    // Update text
    if (strengthText) {
        if (strength === 0) {
            strengthText.textContent = 'Password strength';
        } else if (strength === 1) {
            strengthText.textContent = 'Weak password';
        } else if (strength === 2) {
            strengthText.textContent = 'Medium password';
        } else if (strength === 3) {
            strengthText.textContent = 'Strong password';
        } else {
            strengthText.textContent = 'Very strong password';
        }
    }
}

// Set up form submissions
function setupFormSubmissions() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            // Simple validation
            if (!email || !password) {
                alert('Please enter both email and password.');
                return;
            }
            
            // In a real app, you would call an API here
            // For demo, simulate login
            simulateLogin(email, password, rememberMe);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const agreeTerms = document.getElementById('agreeTerms').checked;
            
            // Simple validation
            if (!name || !email || !password) {
                alert('Please fill in all fields.');
                return;
            }
            
            if (!agreeTerms) {
                alert('You must agree to the Terms of Service and Privacy Policy.');
                return;
            }
            
            // Check password strength
            const strength = calculatePasswordStrength(password);
            if (strength < 3) {
                alert('Please choose a stronger password.');
                return;
            }
            
            // In a real app, you would call an API here
            // For demo, simulate registration
            simulateRegistration(name, email, password);
        });
    }
}

// Simulate login (for demo)
function simulateLogin(email, password, rememberMe) {
    // Show loading state
    showLoadingState('loginForm');
    
    // Simulate API call delay
    setTimeout(() => {
        // Create user object
        const user = {
            email: email,
            name: email.split('@')[0], // Use part of email as name for demo
            loginTime: new Date().toISOString()
        };
        
        // Save to localStorage
        saveToLocalStorage('currentUser', user);
        
        // Redirect to dashboard (main page for now)
        window.location.href = 'index.html';
    }, 1500);
}

// Simulate registration (for demo)
function simulateRegistration(name, email, password) {
    // Show loading state
    showLoadingState('registerForm');
    
    // Simulate API call delay
    setTimeout(() => {
        // Create user object
        const user = {
            name: name,
            email: email,
            registrationTime: new Date().toISOString()
        };
        
        // Save to localStorage
        saveToLocalStorage('currentUser', user);
        
        // Redirect to dashboard (main page for now)
        window.location.href = 'index.html';

        saveToLocalStorage('currentUser', user);
        
        // Show success message
        showSuccessMessage('Account created successfully! Welcome to DOIT!');
        
        // Redirect to dashboard (main page for now)
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }, 1500);
}

// Show loading state for forms
function showLoadingState(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }
}

// Show success message
function showSuccessMessage(message) {
    // Create success message element
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        z-index: 10000;
        font-family: 'Lora', Georgia, serif;
        font-size: 0.95rem;
        max-width: 350px;
        animation: slideInRight 0.4s ease-out;
    `;
    
    successDiv.innerHTML = `
        <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
        ${message}
    `;
    
    // Add animation styles if not already present
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.style.animation = 'slideOutRight 0.4s ease-in';
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 400);
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #F44336, #d32f2f);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
        z-index: 10000;
        font-family: 'Lora', Georgia, serif;
        font-size: 0.95rem;
        max-width: 350px;
        animation: slideInRight 0.4s ease-out;
    `;
    
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
        ${message}
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 4 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideOutRight 0.4s ease-in';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 400);
    }, 4000);
}

// Save data to localStorage
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Error saving to localStorage:", error);
        showErrorMessage("Failed to save user data locally.");
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

// Enhanced form validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePassword(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^A-Za-z0-9]/.test(password)
    };
}

// Enhanced login function with better validation
function enhancedLogin(email, password, rememberMe) {
    // Validate email format
    if (!validateEmail(email)) {
        showErrorMessage('Please enter a valid email address.');
        return;
    }
    
    // Show loading state
    showLoadingState('loginForm');
    
    // Simulate API call delay
    setTimeout(() => {
        // In a real app, you would verify credentials against a backend
        // For demo purposes, we'll simulate successful login
        
        const user = {
            id: 'user_' + Date.now(),
            email: email,
            name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            loginTime: new Date().toISOString(),
            rememberMe: rememberMe
        };
        
        // Save user data
        if (saveToLocalStorage('currentUser', user)) {
            showSuccessMessage(`Welcome back, ${user.name}!`);
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }, 1500);
}

// Enhanced registration function with better validation
function enhancedRegistration(name, email, password) {
    // Validate name
    if (name.length < 2) {
        showErrorMessage('Name must be at least 2 characters long.');
        return;
    }
    
    // Validate email
    if (!validateEmail(email)) {
        showErrorMessage('Please enter a valid email address.');
        return;
    }
    
    // Validate password
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.length) {
        showErrorMessage('Password must be at least 8 characters long.');
        return;
    }
    
    // Show loading state
    showLoadingState('registerForm');
    
    // Simulate API call delay
    setTimeout(() => {
        // In a real app, you would create the account on the backend
        // For demo purposes, we'll simulate successful registration
        
        const user = {
            id: 'user_' + Date.now(),
            name: name,
            email: email,
            registrationTime: new Date().toISOString(),
            isNewUser: true
        };
        
        // Save user data
        if (saveToLocalStorage('currentUser', user)) {
            showSuccessMessage(`Welcome to DOIT, ${name}! Your account has been created.`);
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }, 1500);
}

// Update the existing form submission handlers to use enhanced functions
function updateFormSubmissions() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const rememberMe = document.getElementById('rememberMe').checked;
            
            if (!email || !password) {
                showErrorMessage('Please enter both email and password.');
                return;
            }
            
            enhancedLogin(email, password, rememberMe);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const agreeTerms = document.getElementById('agreeTerms').checked;
            
            if (!name || !email || !password) {
                showErrorMessage('Please fill in all required fields.');
                return;
            }
            
            if (!agreeTerms) {
                showErrorMessage('You must agree to the Terms of Service and Privacy Policy.');
                return;
            }
            
            enhancedRegistration(name, email, password);
        });
    }
}

// Social login handlers (demo only)
function setupSocialLogin() {
    const socialButtons = document.querySelectorAll('.social-btn');
    
    socialButtons.forEach(button => {
        button.addEventListener('click', function() {
            const provider = this.classList.contains('google-btn') ? 'Google' : 
                           this.classList.contains('apple-btn') ? 'Apple' : 'Facebook';
            
            // In a real app, you would integrate with OAuth providers
            showErrorMessage(`${provider} login is not available in this demo. Please use email/password.`);
        });
    });
}

// Check if user is already logged in
function checkExistingLogin() {
    const currentUser = getFromLocalStorage('currentUser');
    
    if (currentUser && window.location.pathname.includes('login.html')) {
        // User is already logged in, redirect to main page
        showSuccessMessage(`Welcome back, ${currentUser.name}!`);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Logout function (to be used in other pages)
function logout() {
    localStorage.removeItem('currentUser');
    showSuccessMessage('You have been logged out successfully.');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// Make logout function globally available
window.logout = logout;

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    checkExistingLogin();
    setupSocialLogin();
    updateFormSubmissions(); // Use enhanced form submissions
    
    // Also keep the original init function
    if (typeof initAuth === 'function') {
        initAuth();
    }
});