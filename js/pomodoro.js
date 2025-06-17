// Global variables
let timer = {
    duration: 25 * 60, // 25 minutes in seconds
    remaining: 25 * 60,
    interval: null,
    isRunning: false,
    isWorkSession: true,
    startTime: null,    // Timestamp when timer started
    pausedTime: null    // Timestamp when timer was paused
};

let stats = {
    sessions: 0,
    totalFocusTime: 0 // in minutes
};

let sound = {
    isEnabled: true,
    volume: 50,
    theme: 'library',
    audio: null
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Pomodoro components
    initPomodoro();
});

function initPomodoro() {
    // Load saved state
    loadPomodoroState();
    
    // Set up timer display
    updateTimerDisplay();
    
    // Set up timer controls
    setupTimerControls();
    
    // Set up timer type buttons
    setupTimerTypeButtons();
    
    // Set up sound controls
    setupSoundControls();
    
    // Initialize progress ring
    updateProgressRing();
    
    // Update statistics displays
    updateStats();
}

// Load saved state from localStorage
function loadPomodoroState() {
    // Load stats
    const savedStats = getFromLocalStorage('pomodoroStats', null);
    if (savedStats) {
        stats = savedStats;
    }
    
    // Load sound preferences
    const savedSound = getFromLocalStorage('sound', null);
    if (savedSound) {
        sound = savedSound;
    }
    
    // Load timer state
    const savedTimer = getFromLocalStorage('timerState', null);
    if (savedTimer) {
        // Restore saved properties
        timer.duration = savedTimer.duration;
        timer.isWorkSession = savedTimer.isWorkSession;
        
        // Check if timer was running when user left the page
        if (savedTimer.isRunning && savedTimer.startTime) {
            // Calculate elapsed time
            const startTime = new Date(savedTimer.startTime);
            const currentTime = new Date();
            const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
            
            // Calculate remaining time
            const newRemaining = savedTimer.duration - elapsedSeconds;
            
            if (newRemaining <= 0) {
                // Timer would have ended
                timer.remaining = 0;
                timer.isRunning = false;
                
                // If it was a work session, increment stats
                if (timer.isWorkSession) {
                    stats.sessions++;
                    stats.totalFocusTime += Math.floor(timer.duration / 60);
                    saveToLocalStorage('pomodoroStats', stats);
                }
            } else {
                // Timer still has time left, resume it
                timer.remaining = newRemaining;
                timer.startTime = savedTimer.startTime;
                timer.isRunning = true;
                
                // Start the interval to continue countdown
                timer.interval = setInterval(updateTimer, 1000);
                
                // Play ambience if enabled
                if (sound.isEnabled) {
                    playAmbience();
                }
            }
        } else if (savedTimer.pausedTime) {
            // Timer was paused, restore remaining time
            timer.remaining = savedTimer.remaining;
            timer.isRunning = false;
        } else {
            // Default to full duration
            timer.remaining = savedTimer.duration;
            timer.isRunning = false;
        }
        
        // Update UI to match restored state
        updateTimerControls(timer.isRunning);
    }
    
    // Load session history
    loadSessionHistory();
}

// Set up timer controls
function setupTimerControls() {
    // Get control elements
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtn = document.getElementById('resetTimer');
    
    // Start button event listener
    if (startBtn) {
        startBtn.addEventListener('click', startTimer);
    }
    
    // Pause button event listener
    if (pauseBtn) {
        pauseBtn.addEventListener('click', pauseTimer);
    }
    
    // Reset button event listener
    if (resetBtn) {
        resetBtn.addEventListener('click', resetTimer);
    }
    
    // Session complete modal buttons
    const startBreakBtn = document.getElementById('startBreakBtn');
    const continueWorkingBtn = document.getElementById('continueWorkingBtn');
    
    if (startBreakBtn) {
        startBreakBtn.addEventListener('click', () => {
            // Set timer to break duration
            timer.duration = 5 * 60; // 5 minute break
            timer.remaining = timer.duration;
            timer.isWorkSession = false;
            
            // Update UI
            updateTimerTypeButtons();
            updateTimerDisplay();
            updateProgressRing();
            
            // Start timer
            startTimer();
            
            // Close modal
            const modal = document.getElementById('sessionCompleteModal');
            if (modal) {
                modal.classList.remove('is-active');
            }
        });
    }
    
    if (continueWorkingBtn) {
        continueWorkingBtn.addEventListener('click', () => {
            // Reset timer for another work session
            timer.duration = 25 * 60; // 25 minute work session
            timer.remaining = timer.duration;
            timer.isWorkSession = true;
            
            // Update UI
            updateTimerTypeButtons();
            updateTimerDisplay();
            updateProgressRing();
            
            // Start timer
            startTimer();
            
            // Close modal
            const modal = document.getElementById('sessionCompleteModal');
            if (modal) {
                modal.classList.remove('is-active');
            }
        });
    }
}

// Set up timer type buttons
function setupTimerTypeButtons() {
    const timerTypeButtons = document.querySelectorAll('.timer-type-btn');
    
    timerTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            timerTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Get time value
            const time = parseInt(button.dataset.time, 10);
            
            // Update timer
            timer.duration = time * 60;
            timer.remaining = timer.duration;
            timer.isWorkSession = time === 25; // Work session if 25 minutes
            
            // Reset timer if running
            if (timer.isRunning) {
                pauseTimer();
                resetTimer();
            } else {
                // Just update display
                updateTimerDisplay();
                updateProgressRing();
            }
            
            // Save timer state
            saveTimerState();
        });
    });
}

// Update timer type buttons to match current state
function updateTimerTypeButtons() {
    const timerTypeButtons = document.querySelectorAll('.timer-type-btn');
    
    let activeTime;
    if (timer.isWorkSession) {
        activeTime = '25';
    } else if (timer.duration === 5 * 60) {
        activeTime = '5';
    } else {
        activeTime = '15';
    }
    
    timerTypeButtons.forEach(button => {
        if (button.dataset.time === activeTime) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// Set up sound controls
function setupSoundControls() {
    // Get sound elements
    const soundToggle = document.getElementById('soundToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    const soundTheme = document.getElementById('soundTheme');
    
    // Set initial values
    if (soundToggle) {
        soundToggle.checked = sound.isEnabled;
    }
    
    if (volumeSlider) {
        volumeSlider.value = sound.volume;
    }
    
    if (soundTheme) {
        soundTheme.value = sound.theme;
    }
    
    // Sound toggle event listener
    if (soundToggle) {
        soundToggle.addEventListener('change', () => {
            sound.isEnabled = soundToggle.checked;
            saveToLocalStorage('sound', sound);
            
            if (sound.isEnabled) {
                if (timer.isRunning) {
                    playAmbience();
                }
            } else {
                stopAmbience();
            }
        });
    }
    
    // Volume slider event listener
    if (volumeSlider) {
        volumeSlider.addEventListener('input', () => {
            sound.volume = volumeSlider.value;
            saveToLocalStorage('sound', sound);
            
            if (sound.audio) {
                sound.audio.volume = sound.volume / 100;
            }
        });
    }
    
    // Sound theme select event listener
    if (soundTheme) {
        soundTheme.addEventListener('change', () => {
            sound.theme = soundTheme.value;
            saveToLocalStorage('sound', sound);
            
            if (timer.isRunning && sound.isEnabled) {
                stopAmbience();
                playAmbience();
            }
        });
    }
}

// Start timer
function startTimer() {
    if (timer.isRunning) return;
    
    // Record start time if starting fresh
    if (!timer.startTime) {
        timer.startTime = new Date().toISOString();
    }
    
    // Clear pausedTime
    timer.pausedTime = null;
    
    // Update UI
    updateTimerControls(true);
    
    // Start interval
    timer.isRunning = true;
    timer.interval = setInterval(updateTimer, 1000);
    
    // Play ambience if enabled
    if (sound.isEnabled) {
        playAmbience();
    }
    
    // Save timer state
    saveTimerState();
}

// Pause timer
function pauseTimer() {
    if (!timer.isRunning) return;
    
    // Record pause time
    timer.pausedTime = new Date().toISOString();
    
    // Update UI
    updateTimerControls(false);
    
    // Clear interval
    timer.isRunning = false;
    clearInterval(timer.interval);
    
    // Stop ambience
    stopAmbience();
    
    // Save timer state
    saveTimerState();
}

// Reset timer
function resetTimer() {
    // Reset timer
    timer.remaining = timer.duration;
    timer.startTime = timer.isRunning ? new Date().toISOString() : null;
    timer.pausedTime = null;
    
    // Update UI
    updateTimerDisplay();
    updateProgressRing();
    
    // If running, restart interval
    if (timer.isRunning) {
        clearInterval(timer.interval);
        timer.interval = setInterval(updateTimer, 1000);
    }
    
    // Save timer state
    saveTimerState();
}

// Save timer state to localStorage
function saveTimerState() {
    // Create a serializable version of the timer state
    const timerState = {
        duration: timer.duration,
        remaining: timer.remaining,
        isRunning: timer.isRunning,
        isWorkSession: timer.isWorkSession,
        startTime: timer.startTime,
        pausedTime: timer.pausedTime
    };
    
    saveToLocalStorage('timerState', timerState);
}

// Update timer display
function updateTimerDisplay() {
    const timerDisplays = document.querySelectorAll('.timer-display');
    
    const timeString = formatTime(timer.remaining);
    
    timerDisplays.forEach(display => {
        display.textContent = timeString;
    });
}

// Update timer controls
function updateTimerControls(isRunning) {
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    
    if (startBtn) {
        startBtn.disabled = isRunning;
    }
    
    if (pauseBtn) {
        pauseBtn.disabled = !isRunning;
    }
}

// Update timer
function updateTimer() {
    if (timer.remaining <= 0) {
        // Timer complete
        completeTimer();
        return;
    }
    
    // Decrement timer
    timer.remaining--;
    
    // Update display
    updateTimerDisplay();
    
    // Update progress ring
    updateProgressRing();
    
    // Save timer state periodically (every 15 seconds to avoid excessive writes)
    if (timer.remaining % 15 === 0) {
        saveTimerState();
    }
}

// Update progress ring
function updateProgressRing() {
    const progressRing = document.getElementById('progressRing');
    if (!progressRing) return;
    
    const circumference = 753.6; // 2 * π * 120 (circle radius)
    
    // Calculate progress
    const progress = timer.remaining / timer.duration;
    const offset = circumference * (1 - progress);
    
    // Update stroke dash offset
    progressRing.style.strokeDasharray = circumference;
    progressRing.style.strokeDashoffset = offset;
}

// Complete timer
function completeTimer() {
    // Stop timer
    timer.isRunning = false;
    clearInterval(timer.interval);
    timer.startTime = null;
    timer.pausedTime = null;
    
    // Update UI
    updateTimerControls(false);
    
    // Play completion sound
    playCompletionSound();
    
    // Show notification
    showTimerNotification();
    
    // If work session, increment stats
    if (timer.isWorkSession) {
        completeWorkSession();
    }
    
    // Save timer state
    saveTimerState();
    
    // Show session complete modal
    const sessionCompleteModal = document.getElementById('sessionCompleteModal');
    if (sessionCompleteModal) {
        sessionCompleteModal.classList.add('is-active');
    }
    // When timer completes:
showNotification('Timer Complete!', timer.isWorkSession ? 'Time for a break!' : 'Break over!');
}

// Complete work session
function completeWorkSession() {
    // Increment sessions
    stats.sessions++;
    
    // Add focus time (in minutes)
    stats.totalFocusTime += Math.floor(timer.duration / 60);
    
    // Save state
    saveToLocalStorage('pomodoroStats', stats);
    
    // Update statistics
    updateStats();
    
    // Add session to history
    addSessionToHistory();
    
    // Update encouragement message
    updateEncouragementMessage();
}

// Update statistics
function updateStats() {
    // Update session count
    const sessionCount = document.getElementById('sessionCount');
    if (sessionCount) {
        sessionCount.textContent = stats.sessions;
    }
    
    // Update focus time
    const focusTime = document.getElementById('focusTime');
    if (focusTime) {
        const hours = Math.floor(stats.totalFocusTime / 60);
        const mins = stats.totalFocusTime % 60;
        
        if (hours > 0) {
            focusTime.textContent = `${hours}h ${mins}m`;
        } else {
            focusTime.textContent = `${mins} mins`;
        }
    }
}

// Add session to history
function addSessionToHistory() {
    const sessionHistory = document.getElementById('sessionHistory');
    if (!sessionHistory) return;
    
    // Clear empty message if present
    const emptyMessage = sessionHistory.querySelector('.empty-message');
    if (emptyMessage) {
        sessionHistory.removeChild(emptyMessage);
    }
    
    // Create new session item
    const sessionItem = document.createElement('li');
    sessionItem.className = 'session-item';
    
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    sessionItem.innerHTML = `
        <span class="session-time">${timeString}</span>
        <span class="session-type">Study Session</span>
        <span class="session-duration">${Math.floor(timer.duration / 60)} mins</span>
    `;
    
    // Add to beginning of list
    sessionHistory.insertBefore(sessionItem, sessionHistory.firstChild);
    
    // Limit to 5 recent sessions
    if (sessionHistory.children.length > 5) {
        sessionHistory.removeChild(sessionHistory.lastChild);
    }
    
    // Save session history
    saveSessionHistory();
}

// Save session history to localStorage
function saveSessionHistory() {
    const sessionHistory = document.getElementById('sessionHistory');
    if (!sessionHistory) return;
    
    // Get all session items
    const sessionItems = sessionHistory.querySelectorAll('.session-item');
    const history = [];
    
    sessionItems.forEach(item => {
        const timeEl = item.querySelector('.session-time');
        const typeEl = item.querySelector('.session-type');
        const durationEl = item.querySelector('.session-duration');
        
        if (timeEl && typeEl && durationEl) {
            history.push({
                time: timeEl.textContent,
                type: typeEl.textContent,
                duration: durationEl.textContent
            });
        }
    });
    
    // Save to localStorage
    saveToLocalStorage('sessionHistory', history);
}

// Load session history from localStorage
function loadSessionHistory() {
    const sessionHistory = document.getElementById('sessionHistory');
    if (!sessionHistory) return;
    
    // Clear current history
    sessionHistory.innerHTML = '';
    
    // Get saved history
    const history = getFromLocalStorage('sessionHistory', []);
    
    // If no history, show empty message
    if (history.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'session-item empty-message';
        emptyMessage.textContent = 'No sessions completed yet. Start your first timer!';
        sessionHistory.appendChild(emptyMessage);
        return;
    }
    
    // Add history items
    history.forEach(session => {
        const sessionItem = document.createElement('li');
        sessionItem.className = 'session-item';
        
        sessionItem.innerHTML = `
            <span class="session-time">${session.time}</span>
            <span class="session-type">${session.type}</span>
            <span class="session-duration">${session.duration}</span>
        `;
        
        sessionHistory.appendChild(sessionItem);
    });
}

// Update encouragement message
function updateEncouragementMessage() {
    const encouragementMessage = document.getElementById('encouragementMessage');
    if (!encouragementMessage) return;
    
    // Array of encouraging messages
    const messages = [
        "Your diligence today creates freedom tomorrow. Keep going!",
        "Excellent work! Each focused session builds your mental strength.",
        "Well done! Consistent effort leads to remarkable results.",
        "You're making great progress. Each session is a building block for success.",
        "Impressive focus! Your dedication is truly commendable."
    ];
    
    // Select a random message
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // Update the message
    encouragementMessage.textContent = message;
}

// Play ambience sound
function playAmbience() {
    if (!sound.isEnabled) return;
    
    // Stop any existing sound
    stopAmbience();
    
    // Create new audio element
    sound.audio = new Audio();
    
    // Set source based on theme
    switch (sound.theme) {
        case 'library':
            sound.audio.src = 'assets/sounds/library-ambience.mp3';
            break;
        case 'rain':
            sound.audio.src = 'assets/sounds/rain.mp3';
            break;
        case 'fire':
            sound.audio.src = 'assets/sounds/fireplace.mp3';
            break;
        case 'ocean':
            sound.audio.src = 'assets/sounds/ocean.mp3';
            break;
        default:
            // No sound for 'none' theme
            return;
    }
    
    // Set volume and loop
    sound.audio.volume = sound.volume / 100;
    sound.audio.loop = true;
    
    // Play sound
    sound.audio.play().catch(error => {
        console.error('Error playing ambience:', error);
        // Many browsers require user interaction before playing audio
        // The error is expected if there was no interaction
    });
}

// Stop ambience sound
function stopAmbience() {
    if (sound.audio) {
        sound.audio.pause();
        sound.audio = null;
    }
}

// Play completion sound
function playCompletionSound() {
    if (!sound.isEnabled) return;
    
    const completionSound = new Audio('assets/sounds/timer-complete.mp3');
    completionSound.volume = sound.volume / 100;
    
    completionSound.play().catch(error => {
        console.error('Error playing completion sound:', error);
    });
}

// Show timer notification
function showTimerNotification() {
    const title = timer.isWorkSession ? 
        "Study Session Complete!" : 
        "Break Time Complete!";
    
    const message = timer.isWorkSession ?
        "Well done! Time for a well-deserved break." :
        "Break time is over. Ready to focus again?";
    
    // Show browser notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
        createNotification(title, message);
    }
}

// Format time in MM:SS format
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Add event listener for page unload
window.addEventListener('beforeunload', function() {
    // Save timer state before navigating away
    saveTimerState();
});