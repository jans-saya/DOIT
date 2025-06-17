

// Global variables
let tasks = [];
let currentFilter = 'all';
let currentCategory = null;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize task components
    initTasks();
});

function initTasks() {
    // Load tasks from localStorage
    loadTasks();
    
    // Set up event listeners for task list
    setupTaskListeners();
    
    // Set up event listeners for task filters
    setupFilterListeners();
    
    // Set up event listeners for task categories
    setupCategoryListeners();
    
    // Set up task form
    setupTaskForm();
    
    // Update task progress
    updateTaskProgress();
}

// Load tasks from localStorage
function loadTasks() {
    tasks = getFromLocalStorage('tasks', []);
    
    // If no tasks exist, create default morning routine tasks
    if (tasks.length === 0) {
        tasks = [
            {
                id: generateId(),
                text: 'Wake up before 8 AM',
                category: 'morning',
                completed: false,
                important: false,
                createdAt: new Date().toISOString(),
                dueDate: new Date().toISOString()
            },
            {
                id: generateId(),
                text: 'Wash face and brush teeth',
                category: 'morning',
                completed: false,
                important: false,
                createdAt: new Date().toISOString(),
                dueDate: new Date().toISOString()
            },
            {
                id: generateId(),
                text: 'Make breakfast and eat mindfully',
                category: 'morning',
                completed: false,
                important: false,
                createdAt: new Date().toISOString(),
                dueDate: new Date().toISOString()
            },
            {
                id: generateId(),
                text: '15-minute walk outdoors',
                category: 'health',
                completed: false,
                important: true,
                createdAt: new Date().toISOString(),
                dueDate: new Date().toISOString()
            },
            {
                id: generateId(),
                text: 'Read one chapter of academic literature',
                category: 'work',
                completed: false,
                important: true,
                createdAt: new Date().toISOString(),
                dueDate: new Date().toISOString()
            }
        ];
        
        saveToLocalStorage('tasks', tasks);
    }
    
    // Render tasks
    renderTasks();
}

// Render tasks to the task list
function renderTasks() {
    const taskList = document.getElementById('mainTaskList');
    if (!taskList) return;
    
    // Clear current task list
    taskList.innerHTML = '';
    
    // Filter tasks based on current filter
    let filteredTasks = filterTasks(tasks);
    
    // Get unique categories in filtered tasks
    const categories = [...new Set(filteredTasks.map(task => task.category))];
    
    // Generate HTML for each category and its tasks
    categories.forEach(category => {
        // Only show tasks for selected category if a category filter is active
        if (currentCategory && category !== currentCategory) return;
        
        // Create category header
        const categoryHeader = document.createElement('li');
        categoryHeader.className = 'task-category-header';
        categoryHeader.textContent = formatCategoryName(category);
        taskList.appendChild(categoryHeader);
        
        // Filter tasks for this category
        const categoryTasks = filteredTasks.filter(task => task.category === category);
        
        // Create task items
        categoryTasks.forEach(task => {
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
        });
    });
    
    // If no tasks to show, display a message
    if (taskList.children.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No tasks found. Create a new task to get started.';
        taskList.appendChild(emptyMessage);
    }
    
    // Also update dashboard tasks if on main page
    updateDashboardTasks();
}

// Create a task element
function createTaskElement(task) {
    const taskItem = document.createElement('li');
    taskItem.className = 'task-item';
    taskItem.dataset.id = task.id;
    
    // Add 'important' class if task is important
    if (task.important) {
        taskItem.classList.add('important');
    }
    
    // Add 'completed' class if task is completed
    if (task.completed) {
        taskItem.classList.add('completed');
    }
    
    // Create task checkbox
    const taskCheckbox = document.createElement('label');
    taskCheckbox.className = 'task-checkbox';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    
    const checkmark = document.createElement('span');
    checkmark.className = 'checkmark';
    
    taskCheckbox.appendChild(checkbox);
    taskCheckbox.appendChild(checkmark);
    
    // Create task content
    const taskContent = document.createElement('div');
    taskContent.className = 'task-content';
    
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;
    
    // Add importance badge if important
    if (task.important) {
        const taskBadge = document.createElement('span');
        taskBadge.className = 'task-badge';
        taskBadge.textContent = 'Important';
        taskContent.appendChild(taskText);
        taskContent.appendChild(taskBadge);
    } else {
        taskContent.appendChild(taskText);
    }
    
    // Add action buttons
    const taskActions = document.createElement('div');
    taskActions.className = 'task-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'task-action-btn';
    editBtn.title = 'Edit';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-action-btn';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    
    taskActions.appendChild(editBtn);
    taskActions.appendChild(deleteBtn);
    
    taskContent.appendChild(taskActions);
    
    // Assemble task item
    taskItem.appendChild(taskCheckbox);
    taskItem.appendChild(taskContent);
    
    return taskItem;
}

// Format category name for display
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

// Filter tasks based on current filter
function filterTasks(taskList) {
    switch(currentFilter) {
        case 'today':
            // Filter tasks due today
            const today = new Date().toISOString().split('T')[0];
            return taskList.filter(task => {
                const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
                return taskDate === today;
            });
        case 'important':
            // Filter important tasks
            return taskList.filter(task => task.important);
        case 'completed':
            // Filter completed tasks
            return taskList.filter(task => task.completed);
        case 'all':
        default:
            // Return all tasks
            return taskList;
    }
}

// Set up event listeners for task list
function setupTaskListeners() {
    const taskList = document.getElementById('mainTaskList');
    if (!taskList) return;
    
    // Use event delegation for task list
    taskList.addEventListener('click', function(e) {
        // Handle checkbox clicks
        if (e.target.type === 'checkbox') {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.id;
                toggleTaskCompletion(taskId);
            }
        }
        
        // Handle edit button clicks
        if (e.target.closest('.task-action-btn[title="Edit"]')) {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.id;
                editTask(taskId);
            }
        }
        
        // Handle delete button clicks
        if (e.target.closest('.task-action-btn[title="Delete"]')) {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.id;
                deleteTask(taskId);
            }
        }
    });
}

// Set up event listeners for task filters
function setupFilterListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all filter buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Set current filter
            currentFilter = this.dataset.filter;
            
            // Render tasks with new filter
            renderTasks();
        });
    });
}

// Set up event listeners for task categories
function setupCategoryListeners() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Toggle active class
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // If already selected, deselect
            if (currentCategory === this.dataset.category) {
                currentCategory = null;
            } else {
                // Set new category and add active class
                currentCategory = this.dataset.category;
                this.classList.add('active');
            }
            
            // Render tasks with new category filter
            renderTasks();
        });
    });
}

// Set up task form
function setupTaskForm() {
    const saveTaskBtn = document.getElementById('saveTask');
    if (!saveTaskBtn) return;
    
    saveTaskBtn.addEventListener('click', function() {
        // Get form values
        const taskTitle = document.getElementById('taskTitle').value.trim();
        const taskCategory = document.getElementById('taskCategory').value;
        const taskImportance = document.getElementById('taskImportance').value === 'important';
        const taskNotes = document.getElementById('taskNotes').value.trim();
        
        // Validate task title
        if (!taskTitle) {
            alert('Please enter a task description');
            return;
        }
        
        // Create new task
        const newTask = {
            id: generateId(),
            text: taskTitle,
            category: taskCategory,
            completed: false,
            important: taskImportance,
            createdAt: new Date().toISOString(),
            dueDate: new Date().toISOString(),
            notes: taskNotes
        };
        
        // Add task to task list
        tasks.push(newTask);
        
        // Save to localStorage
        saveToLocalStorage('tasks', tasks);
        
        // Render tasks
        renderTasks();
        
        // Close modal
        const modal = document.getElementById('addTaskModal');
        if (modal) {
            modal.classList.remove('is-active');
        }
        
        // Clear form
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskNotes').value = '';
    });
    
    // Set up AI task generation
    const aiGenerateBtn = document.getElementById('aiGenerateTask');
    if (aiGenerateBtn) {
        aiGenerateBtn.addEventListener('click', async function() {
            const goal = document.getElementById('taskTitle').value.trim();
            
            // Make sure there's some input
            if (!goal) {
                alert('Please enter a goal or task description first');
                return;
            }
            
            // Disable button and show loading state
            aiGenerateBtn.disabled = true;
            aiGenerateBtn.textContent = 'Generating...';
            
            try {
                // In a real implementation, call the Anthropic API here
                // Simulate API call for demo
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Generate a more detailed task based on the input
                let enhancedTask = goal;
                
                // Simple enhancement logic
                if (goal.toLowerCase().includes('read')) {
                    enhancedTask = `Read one chapter of material on "${goal.replace('read', '').trim()}" and take notes on key concepts`;
                } else if (goal.toLowerCase().includes('exercise')) {
                    enhancedTask = `Complete a 30-minute session of ${goal.replace('exercise', '').trim() || 'physical activity'} with proper warm-up and cool-down`;
                } else if (goal.toLowerCase().includes('write')) {
                    enhancedTask = `Write a well-structured ${goal.replace('write', '').trim() || 'document'} (minimum 500 words) with clear introduction and conclusion`;
                } else {
                    enhancedTask = `${goal} (with focused attention for at least 25 minutes)`;
                }
                
                // Update the task title field
                document.getElementById('taskTitle').value = enhancedTask;
                
                // Suggest an appropriate category
                const categorySelect = document.getElementById('taskCategory');
                if (categorySelect) {
                    if (goal.toLowerCase().includes('read') || goal.toLowerCase().includes('study') || goal.toLowerCase().includes('write')) {
                        categorySelect.value = 'work';
                    } else if (goal.toLowerCase().includes('exercise') || goal.toLowerCase().includes('eat') || goal.toLowerCase().includes('meditate')) {
                        categorySelect.value = 'health';
                    }
                }
                
                // Add notes with suggestions
                const notesField = document.getElementById('taskNotes');
                if (notesField) {
                    notesField.value = "AI suggestions:\n- Break this down into 25-minute focused sessions\n- Consider using the Pomodoro timer feature\n- Schedule this for your peak energy time of day";
                }
                
            } catch (error) {
                console.error('Error generating task:', error);
                alert('Sorry, there was an error generating your task. Please try again.');
            } finally {
                // Re-enable button
                aiGenerateBtn.disabled = false;
                aiGenerateBtn.textContent = 'Ask AI to Generate';
            }
        });
    }
}

// Toggle task completion status
// INTEGRATION EXAMPLES - How to add notifications to your existing code

// ====== 1. TASKS.JS - Add notifications when tasks are completed ======

// Find your toggleTaskCompletion function and modify it:
// Updated toggleTaskCompletion function WITH notifications

function toggleTaskCompletion(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        // Toggle completion status
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        
        // Show ONLY in-app notification (no Web API)
        if (tasks[taskIndex].completed) {
            showSuccess('Task Completed! 🎉', `Well done: "${tasks[taskIndex].text}"`);
        }
        
        // Save to localStorage
        saveToLocalStorage('tasks', tasks);
        
        // Render tasks
        renderTasks();
        
        // Update progress
        updateTaskProgress();
    }
}






// Add this function to app.js:
function setupDailyReminders() {
    // Morning check-in reminder
    scheduleDaily(9, 0, () => {
        showNotification(
            'Morning Check-in 🌅',
            'Good morning! How are you feeling today?',
            {
                onClick: () => {
                    window.location.href = 'calendar.html';
                }
            }
        );
    });
    
    // Evening reflection reminder
    scheduleDaily(20, 0, () => {
        showNotification(
            'Evening Reflection 🌙',
            'How did your day go? Take a moment to reflect.',
            {
                onClick: () => {
                    window.location.href = 'companion.html';
                }
            }
        );
    });
}

// Helper function to schedule daily notifications
function scheduleDaily(hour, minute, callback) {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntil = scheduledTime.getTime() - now.getTime();
    
    setTimeout(() => {
        callback();
        // Schedule for next day
        setInterval(callback, 24 * 60 * 60 * 1000); // Repeat every 24 hours
    }, timeUntil);
}

// ====== 6. Example of testing notifications ======

// Add this function to test your notifications (you can call it from browser console)
function testNotifications() {
    console.log('Testing notifications...');
    
    // Test basic notification
    showNotification('Test Notification', 'This is a test message');
    
    // Test with onClick
    setTimeout(() => {
        showNotification('Test with Action', 'Click me!', {
            onClick: () => {
                alert('Notification clicked!');
            }
        });
    }, 2000);
    
    // Test task completion
    setTimeout(() => {
        showNotification('Task Completed! 🎉', 'Great job completing "Test Task"');
    }, 4000);
}

// Make test function available globally
window.testNotifications = testNotifications;
// Show task completion message


// Edit task
function editTask(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;
    
    // For a simple demo, use prompt/confirm dialogs
    // In a real app, you would use a modal with a form
    const newText = prompt("Edit task:", task.text);
    if (newText === null) return; // User cancelled
    
    const important = confirm("Mark as important?");
    
    // Update task
    task.text = newText.trim();
    task.important = important;
    
    // Save to localStorage
    saveToLocalStorage('tasks', tasks);
    
    // Render tasks
    renderTasks();
}

// Delete task
function deleteTask(taskId) {
    // Confirm deletion
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    // Filter out the task with the specified ID
    tasks = tasks.filter(task => task.id !== taskId);
    
    // Save to localStorage
    saveToLocalStorage('tasks', tasks);
    
    // Render tasks
    renderTasks();
    
    // Update progress
    updateTaskProgress();
}

// Update task progress
function updateTaskProgress() {
    const progressFill = document.getElementById('taskProgress');
    const progressText = document.querySelector('.progress-text');
    
    if (!progressFill || !progressText) return;
    
    // Calculate progress
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    // Update progress bar
    progressFill.style.width = `${percentage}%`;
    
    // Update text
    progressText.textContent = `${completed}/${total} completed`;
}

// Update dashboard tasks
function updateDashboardTasks() {
    const dashboardTasks = document.getElementById('dashboardTasks');
    if (!dashboardTasks) return; // Not on dashboard page
    
    // Clear current tasks
    dashboardTasks.innerHTML = '';
    
    // Get today's tasks (up to 3)
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
        return taskDate === today;
    }).slice(0, 3);
    
    // If no tasks for today, show default message
    if (todayTasks.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No tasks for today. Add some!';
        dashboardTasks.appendChild(emptyMessage);
        return;
    }
    
    // Create task items for dashboard
    todayTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        
        // Create checkbox
        const taskCheckbox = document.createElement('label');
        taskCheckbox.className = 'task-checkbox';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        
        const checkmark = document.createElement('span');
        checkmark.className = 'checkmark';
        
        taskCheckbox.appendChild(checkbox);
        taskCheckbox.appendChild(checkmark);
        
        // Create task text
        const taskText = document.createElement('span');
        taskText.className = 'task-text';
        taskText.textContent = task.text;
        
        // Add event listener for checkbox
        checkbox.addEventListener('change', function() {
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = this.checked;
                saveToLocalStorage('tasks', tasks);
                updateTaskProgress();
            }
        });
        
        // Assemble task item
        taskItem.appendChild(taskCheckbox);
        taskItem.appendChild(taskText);
        
        dashboardTasks.appendChild(taskItem);
    });
}