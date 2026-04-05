/* ========== BUDGET SETTINGS PAGE ANIMATIONS ========== */

document.addEventListener('DOMContentLoaded', function() {
    initializeSettings();
});

function initializeSettings() {
    // Get budget data from the page
    const budgetValue = parseFloat(document.getElementById('budget')?.value || 0);
    const currentMonthExpense = parseFloat(
        getNumberFromElement('current-month-expense') || 
        getNumberFromText(document.querySelector('.info-item:nth-child(2)'))
    );
    const percentage = currentMonthExpense > 0 && budgetValue > 0 
        ? (currentMonthExpense / budgetValue * 100) 
        : 0;

    // Initialize circular progress
    animateCircularProgress(percentage);

    // Show/hide warning alert
    if (currentMonthExpense > budgetValue) {
        showWarningAlert(currentMonthExpense, budgetValue);
    }

    // Animate numbers on page load
    animateCountUp();

    // Update status icon based on budget usage
    updateStatusIcon(percentage);
}

/**
 * Animate circular progress from 0 to final percentage
 */
function animateCircularProgress(finalPercentage) {
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (!progressFill || !progressPercentage) return;

    const circumference = 2 * Math.PI * 70; // radius = 70
    const maxOffset = circumference;
    const strokeDashoffset = maxOffset - (finalPercentage / 100) * maxOffset;

    // Set CSS custom property for SVG animation
    document.documentElement.style.setProperty('--progress-offset', strokeDashoffset);

    // Animate percentage text counter
    animateCounter('progressPercentage', 0, Math.min(finalPercentage, 999), 2500);

    // Update stroke color based on percentage
    updateProgressColor(progressFill, finalPercentage);
}

/**
 * Update progress stroke color based on percentage
 * Green (< 80%), Orange (80-100%), Red (> 100%)
 */
function updateProgressColor(element, percentage) {
    let startColor, endColor;

    if (percentage <= 80) {
        // Safe - Green
        startColor = '#86efac';
        endColor = '#22c55e';
    } else if (percentage <= 100) {
        // Warning - Orange
        startColor = '#fbbf24';
        endColor = '#f59e0b';
    } else {
        // Over budget - Red
        startColor = '#fca5a5';
        endColor = '#ef4444';
    }

    // Update gradient in SVG
    const gradient = document.querySelector('#progressGradient');
    if (gradient) {
        const stops = gradient.querySelectorAll('stop');
        if (stops[0]) stops[0].setAttribute('style', `stop-color:${startColor};stop-opacity:1`);
        if (stops[1]) stops[1].setAttribute('style', `stop-color:${endColor};stop-opacity:1`);
    }

    element.style.stroke = startColor;
}

/**
 * Show warning alert if overspending
 */
function showWarningAlert(spent, budget) {
    const warningAlert = document.getElementById('warningAlert');
    if (!warningAlert) return;

    const overspent = Math.abs(spent - budget);
    const overspendAmount = document.getElementById('overspendAmount');
    
    if (overspendAmount) {
        overspendAmount.textContent = `-₹${Math.round(overspent)} overspent`;
    }

    warningAlert.style.display = 'flex';
    document.querySelector('.warning-alert h4').textContent = '⚠️ You\'re overspending this month';
}

/**
 * Update status icon based on budget percentage
 */
function updateStatusIcon(percentage) {
    const statusIcon = document.getElementById('statusIcon');
    const progressInfo = document.querySelector('.progress-info p');
    
    if (!statusIcon || !progressInfo) return;

    if (percentage <= 75) {
        statusIcon.textContent = '✅';
        progressInfo.textContent = 'Great! You\'re within budget';
    } else if (percentage <= 100) {
        statusIcon.textContent = '⚠️';
        progressInfo.textContent = 'Careful! Approaching budget limit';
    } else {
        statusIcon.textContent = '⛔';
        progressInfo.textContent = 'You\'re overspending this month';
    }
}

/**
 * Animate counter from start to end value
 */
function animateCounter(elementId, startValue, endValue, duration) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const increment = (endValue - startValue) / (duration / 16);
    let currentValue = startValue;
    let lastUpdateTime = Date.now();

    function update() {
        const now = Date.now();
        const elapsed = now - lastUpdateTime;

        // Update based on time elapsed
        currentValue += increment * (elapsed / 16);
        lastUpdateTime = now;

        if (currentValue >= endValue) {
            element.textContent = Math.round(endValue) + '%';
            return;
        }

        element.textContent = Math.round(currentValue) + '%';
        requestAnimationFrame(update);
    }

    update();
}

/**
 * Count up animation for budget information numbers
 */
function animateCountUp() {
    const infoItems = document.querySelectorAll('.info-item');
    
    infoItems.forEach((item, index) => {
        const value = item.querySelector('.info-value');
        if (!value) return;

        const text = value.textContent;
        const number = extractNumberFromText(text);

        if (number !== null) {
            // Start animation after staggered delay
            setTimeout(() => {
                animateNumericValue(value, 0, number, 1500);
            }, 100 + index * 100);
        }
    });
}

/**
 * Animate a numeric value in an element
 */
function animateNumericValue(element, startValue, endValue, duration) {
    const prefix = element.textContent.match(/[₹^-]+/)?.[0] || '₹';
    const suffix = element.textContent.match(/[^₹0-9-]+$/)?.[0] || '';
    
    const increment = (endValue - startValue) / (duration / 16);
    let currentValue = startValue;
    let lastUpdateTime = Date.now();

    function update() {
        const now = Date.now();
        const elapsed = now - lastUpdateTime;

        currentValue += increment * (elapsed / 16);
        lastUpdateTime = now;

        if (currentValue >= endValue) {
            // Format as currency
            const formatted = endValue < 0 
                ? `-${prefix}${Math.abs(Math.round(endValue))}` 
                : `${prefix}${Math.round(endValue)}`;
            element.textContent = formatted + suffix;
            return;
        }

        // Format during animation
        const formatted = currentValue < 0 
            ? `-${prefix}${Math.abs(Math.round(currentValue))}` 
            : `${prefix}${Math.round(currentValue)}`;
        element.textContent = formatted + suffix;
        requestAnimationFrame(update);
    }

    update();
}

/**
 * Extract number from text like "₹5000" or "-₹1,140"
 */
function extractNumberFromText(text) {
    const match = text.match(/-?₹?[\d,]+/);
    if (!match) return null;

    return parseInt(match[0].replace(/[₹,]/g, ''), 10);
}

/**
 * Get number from element by ID
 */
function getNumberFromElement(id) {
    const element = document.getElementById(id);
    if (!element) return null;

    return extractNumberFromText(element.textContent);
}

/**
 * Get number from element text
 */
function getNumberFromText(element) {
    if (!element) return null;

    const text = element.textContent;
    return extractNumberFromText(text);
}

/**
 * Handle theme changes
 */
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            // Reinitialize on theme change
            initializeSettings();
        }
    });
});

observer.observe(document.body, {
    attributes: true
});

/* ========== INTERACTIVE FEATURES ========== */

// Add input validation and real-time feedback
const budgetInput = document.getElementById('budget');
if (budgetInput) {
    budgetInput.addEventListener('focus', function() {
        this.style.animation = 'glow 1s ease-in-out';
    });

    budgetInput.addEventListener('blur', function() {
        this.style.animation = 'none';
    });

    budgetInput.addEventListener('input', function() {
        // Real-time validation feedback
        const value = parseFloat(this.value);
        
        if (value < 0) {
            this.value = 0;
            showNotification('Budget cannot be negative!');
        }
    });
}

/**
 * Show temporary notification
 */
function showNotification(message) {
    const container = document.querySelector('.settings-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = 'error-message';
    notification.innerHTML = `<span>⚠️ ${message}</span>`;
    notification.style.position = 'fixed';
    notification.style.top = '100px';
    notification.style.right = '20px';
    notification.style.zIndex = '1000';
    notification.style.minWidth = '300px';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideInDown 0.4s ease reverse';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}
