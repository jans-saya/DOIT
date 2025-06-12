

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