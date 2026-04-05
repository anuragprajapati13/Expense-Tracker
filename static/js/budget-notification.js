/* Budget Warning Notification System */

class BudgetNotification {
    constructor() {
        this.container = null;
        this.notification = null;
        this.autoHideTimer = null;
    }

    /**
     * Show budget exceeded notification
     * @param {number} spent - Amount spent
     * @param {number} budget - Budget limit
     * @param {object} options - Configuration options
     */
    show(spent, budget, options = {}) {
        const {
            message = '⚠️ Budget Exceeded! You are spending too much this month',
            suggestion = 'Try reducing food or shopping expenses',
            autoHide = true,
            autoHideDelay = 8000,
            onReviewClick = null,
            onBudgetClick = null
        } = options;

        // Create container if doesn't exist
        if (!this.container) {
            this.createContainer();
        }

        // Calculate percentage
        const percentUsed = Math.min((spent / budget) * 100, 100);
        const remaining = Math.max(budget - spent, 0);

        // Create notification HTML
        const notificationHTML = `
            <div class="notification-header">
                <div class="notification-icon">🔔</div>
                <h3 class="notification-title">${message.split('!')[0]}!</h3>
                <button class="notification-close" onclick="budgetNotificationManager.close()">×</button>
            </div>

            <p class="notification-message">${message.split('!').slice(1).join('!')}</p>

            <p class="notification-subtext">💡 ${suggestion}</p>

            <div class="progress-section">
                <div class="progress-label">
                    <span>Budget Used</span>
                    <span>${percentUsed.toFixed(1)}% of ₹${budget.toLocaleString()}</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percentUsed}%"></div>
                </div>
                <div style="margin-top: 6px; font-size: 12px; color: #94a3b8;">
                    💸 ₹${spent.toLocaleString()} spent | Remaining: ₹${remaining.toLocaleString()}
                </div>
            </div>

            <div class="notification-actions">
                <button class="btn-notification btn-review" onclick="budgetNotificationManager.triggerReview()">
                    📊 View Expenses
                </button>
                <button class="btn-notification btn-budget" onclick="budgetNotificationManager.triggerBudget()">
                    ⚙️ Set Budget
                </button>
            </div>
        `;

        // Create notification element
        this.notification = document.createElement('div');
        this.notification.className = 'budget-notification';
        this.notification.innerHTML = notificationHTML;

        // Store callbacks
        this.onReviewClick = onReviewClick;
        this.onBudgetClick = onBudgetClick;

        // Add to container
        this.container.innerHTML = '';
        this.container.appendChild(this.notification);

        // Trigger animation
        setTimeout(() => {
            if (this.notification) {
                this.notification.style.animation = 'slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), float 3s ease-in-out infinite 1.5s';
            }
        }, 10);

        // Auto-hide if enabled
        if (autoHide) {
            this.autoHideTimer = setTimeout(() => {
                this.close();
            }, autoHideDelay);
        }
    }

    /**
     * Create notification container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'budget-notification-container';
        document.body.appendChild(this.container);
    }

    /**
     * Close notification with animation
     */
    close() {
        if (!this.notification) return;

        // Clear auto-hide timer
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
        }

        // Add closing animation
        this.notification.classList.add('closing');

        // Remove after animation completes
        setTimeout(() => {
            if (this.notification && this.container) {
                this.container.innerHTML = '';
                this.notification = null;
            }
        }, 400);
    }

    /**
     * Trigger review expenses action
     */
    triggerReview() {
        console.log('Review expenses clicked');
        if (this.onReviewClick) {
            this.onReviewClick();
        } else {
            // Default action: redirect to reports
            window.location.href = '/reports';
        }
        this.close();
    }

    /**
     * Trigger set budget action
     */
    triggerBudget() {
        console.log('Set budget clicked');
        if (this.onBudgetClick) {
            this.onBudgetClick();
        } else {
            // Default action: scroll to budget setting or open modal
            const budgetSection = document.querySelector('[data-budget-modal]');
            if (budgetSection) {
                budgetSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
        this.close();
    }

    /**
     * Check if budget is exceeded and show notification
     * @param {number} spent - Amount spent
     * @param {number} budget - Budget limit
     */
    checkAndShow(spent, budget, options = {}) {
        if (budget > 0 && spent > budget) {
            this.show(spent, budget, options);
            return true;
        }
        return false;
    }
}

// Global instance
let budgetNotificationManager = new BudgetNotification();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Budget notification system initialized');
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BudgetNotification;
}
