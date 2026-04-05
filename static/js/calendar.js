// Calendar and Reminder functionality
let currentDate = new Date();
let selectedDate = new Date();
let allReminders = [];

// Initialize calendar
function initializeCalendar() {
    renderCalendar();
    setupEventListeners();
    loadAllReminders();
    updateSelectedDateDisplay();
    loadExpensesForDate(selectedDate);
}

// Set today's date in reminder date input by default
function setReminderDateDefault() {
    const dateInput = document.getElementById('reminderDate');
    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }
}

// Render calendar
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Clear calendar
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        
        const cellDate = new Date(year, month, day);
        const dateString = formatDate(cellDate);
        
        // Highlight today
        const today = new Date();
        if (cellDate.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }
        
        // Highlight selected date
        if (cellDate.toDateString() === selectedDate.toDateString()) {
            dayCell.classList.add('selected');
        }

        // Check if date has reminders
        const hasReminder = allReminders.some(r => r.reminder_date === dateString && !r.is_paid);
        if (hasReminder) {
            dayCell.classList.add('has-reminder');
            dayCell.style.position = 'relative';
        }
        
        // Add click event
        dayCell.addEventListener('click', () => selectDate(cellDate));
        
        calendarDays.appendChild(dayCell);
    }
}

// Select a date
function selectDate(date) {
    selectedDate = new Date(date);
    renderCalendar();
    updateSelectedDateDisplay();
    loadExpensesForDate(date);
}

// Format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Update selected date display
function updateSelectedDateDisplay() {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedDate = `${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}, ${selectedDate.getFullYear()}`;
    document.getElementById('selectedDate').textContent = formattedDate;
}

// Load all reminders
function loadAllReminders() {
    fetch('/api/reminders')
        .then(res => res.json())
        .then(data => {
            allReminders = data.reminders || [];
            renderCalendar();
            loadExpensesForDate(selectedDate);
        })
        .catch(err => {
            console.error('Error loading reminders:', err);
            allReminders = [];
        });
}

// Load reminders and expenses for selected date
function loadExpensesForDate(date) {
    const dateString = formatDate(date);
    const remindersList = document.getElementById('remindersList');
    const expensesList = document.getElementById('expensesList');
    
    remindersList.innerHTML = '';
    expensesList.innerHTML = '';

    // Load reminders for selected date
    const dateReminders = allReminders.filter(r => r.reminder_date === dateString);
    if (dateReminders.length > 0) {
        dateReminders.forEach(reminder => {
            const reminderItem = document.createElement('div');
            reminderItem.className = `reminder-item ${reminder.is_paid ? 'paid' : ''}`;
            reminderItem.innerHTML = `
                <div class="reminder-header">
                    <div>
                        <div class="reminder-title">${reminder.title}</div>
                        <div class="reminder-category">${reminder.category}</div>
                    </div>
                    <div class="reminder-amount">₹${reminder.amount.toFixed(2)}</div>
                </div>
                ${reminder.description ? `<div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin: 6px 0;">${reminder.description}</div>` : ''}
                <div class="reminder-actions">
                    ${!reminder.is_paid ? `<button class="reminder-btn" onclick="markPaid(${reminder.id})"><i class="fas fa-check"></i> Mark Paid</button>` : '<span style="color: #22c55e; font-weight: 600;">✓ Paid</span>'}
                    <button class="reminder-btn" onclick="deleteReminder(${reminder.id})"><i class="fas fa-trash"></i> Delete</button>
                </div>
            `;
            remindersList.appendChild(reminderItem);
        });
    } else {
        remindersList.innerHTML = '<p class="no-items">No payment reminders</p>';
    }

    // Load mock expenses for demo
    const expenses = [
        { id: 1, category: 'Food', amount: 25.50, description: 'Lunch at cafe' },
        { id: 2, category: 'Transport', amount: 15.00, description: 'Uber ride' },
        { id: 3, category: 'Entertainment', amount: 45.00, description: 'Movie tickets' }
    ];
    
    if (date.getDate() % 3 === 0) {
        expenses.slice(0, 2).forEach(expense => {
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-item';
            expenseItem.innerHTML = `
                <div class="expense-info">
                    <div class="expense-category">${expense.category}</div>
                    <div class="expense-description">${expense.description}</div>
                </div>
                <div class="expense-amount">₹${expense.amount.toFixed(2)}</div>
            `;
            expensesList.appendChild(expenseItem);
        });
    } else {
        expensesList.innerHTML = '<p class="no-items">No expenses for this date</p>';
    }
}

// Open reminder modal
function openReminderModal() {
    const modal = document.getElementById('reminderModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setReminderDateDefault();
}

// Close reminder modal
function closeReminderModal() {
    const modal = document.getElementById('reminderModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('reminderForm').reset();
}

// Save reminder
function saveReminder(e) {
    e.preventDefault();
    
    const title = document.getElementById('reminderTitle').value;
    const amount = parseFloat(document.getElementById('reminderAmount').value);
    const category = document.getElementById('reminderCategory').value;
    const reminderDate = document.getElementById('reminderDate').value;
    const description = document.getElementById('reminderDesc').value;

    if (!title || !amount || !reminderDate) {
        alert('Please fill all required fields');
        return;
    }

    fetch('/api/reminders/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title,
            amount,
            category,
            reminder_date: reminderDate,
            description
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            closeReminderModal();
            loadAllReminders();
            showNotification('✓ Reminder saved successfully!', 'success');
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(err => {
        console.error('Error saving reminder:', err);
        alert('Error saving reminder');
    });
}

// Mark reminder as paid
function markPaid(reminderId) {
    fetch(`/api/reminders/${reminderId}/mark-paid`, {
        method: 'POST'
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loadAllReminders();
            showNotification('✓ Marked as paid!', 'success');
        }
    })
    .catch(err => console.error('Error marking paid:', err));
}

// Delete reminder
function deleteReminder(reminderId) {
    if (confirm('Are you sure you want to delete this reminder?')) {
        fetch(`/api/reminders/${reminderId}/delete`, {
            method: 'POST'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadAllReminders();
                showNotification('✓ Reminder deleted!', 'success');
            }
        })
        .catch(err => console.error('Error deleting reminder:', err));
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#22c55e' : '#3b82f6'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 100000;
        animation: slideInUp 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutUp 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Previous month button
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    // Next month button
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // Add reminder button
    const addReminderBtn = document.getElementById('addReminderBtn');
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', openReminderModal);
    }

    // Reminder form submit
    const reminderForm = document.getElementById('reminderForm');
    if (reminderForm) {
        reminderForm.addEventListener('submit', saveReminder);
    }

    // Close modal on overlay click
    const modal = document.getElementById('reminderModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target === modal.querySelector('.modal-overlay')) {
                closeReminderModal();
            }
        });
    }

    // Close modal on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeReminderModal();
        }
    });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeCalendar);