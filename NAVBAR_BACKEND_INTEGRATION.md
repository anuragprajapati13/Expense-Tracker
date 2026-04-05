# Backend Integration Guide for Interactive Navbar

## Overview
This guide shows how to integrate the interactive navbar with your Flask/Python backend to display real data.

## 1. Flask Backend Setup

### Create a notifications route

```python
# app.py or routes/notifications_routes.py

from flask import jsonify, session
from datetime import datetime, timedelta
from models.db_models import Notification, User

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Fetch user notifications"""
    user_id = session.get('user_id')
    
    # Get unread notifications
    notifications = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).order_by(Notification.created_at.desc()).limit(10).all()
    
    result = []
    for notification in notifications:
        result.append({
            'id': notification.id,
            'title': notification.title,
            'message': notification.message,
            'type': notification.type,  # 'success', 'warning', 'info'
            'time': notification.created_at.strftime('%H:%M'),
            'created_at': notification.created_at.isoformat()
        })
    
    return jsonify(result)

@app.route('/api/notifications/count', methods=['GET'])
def get_notification_count():
    """Get unread notification count"""
    user_id = session.get('user_id')
    count = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()
    
    return jsonify({'count': count})

@app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read(notification_id):
    """Mark notification as read"""
    user_id = session.get('user_id')
    notification = Notification.query.get(notification_id)
    
    if notification and notification.user_id == user_id:
        notification.is_read = True
        db.session.commit()
        return jsonify({'status': 'success'})
    
    return jsonify({'status': 'error'}), 404

@app.route('/api/notifications/add', methods=['POST'])
def add_notification():
    """Add a new notification (for testing/internal use)"""
    data = request.get_json()
    user_id = session.get('user_id')
    
    notification = Notification(
        user_id=user_id,
        title=data.get('title'),
        message=data.get('message'),
        type=data.get('type', 'info'),
        is_read=False,
        created_at=datetime.now()
    )
    
    db.session.add(notification)
    db.session.commit()
    
    return jsonify({'status': 'success'})
```

### Database Model

```python
# models/db_models.py

from datetime import datetime

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='info')  # success, warning, info
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    user = db.relationship('User', backref='notifications')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'time': self.created_at.strftime('%H:%M'),
            'is_read': self.is_read
        }
```

## 2. Frontend Integration

### Load notifications on page load

```javascript
// Add this to navbar-interactive.js or in a separate initialization script

// Load notifications when navbar is initialized
function loadNotificationsFromServer() {
    fetch('/api/notifications')
        .then(response => response.json())
        .then(notifications => {
            const notificationsContainer = document.querySelector('.notifications-list');
            if (!notificationsContainer) return;
            
            notificationsContainer.innerHTML = '';
            
            notifications.forEach(notif => {
                navbarFunctions.addNotification(
                    notif.title,
                    notif.message,
                    notif.type,
                    notif.time
                );
            });
            
            // Update badge count
            navbarFunctions.updateNotificationCount(notifications.length);
        })
        .catch(error => console.error('Error loading notifications:', error));
}

// Load notifications on page load
document.addEventListener('DOMContentLoaded', function() {
    loadNotificationsFromServer();
});
```

### Poll for new notifications

```javascript
// Add to navbar-interactive.js

// Poll for new notifications every 30 seconds
setInterval(function() {
    fetch('/api/notifications')
        .then(response => response.json())
        .then(notifications => {
            const badge = document.querySelector('.notification-badge');
            const currentCount = parseInt(badge.textContent);
            
            if (notifications.length > currentCount) {
                navbarFunctions.updateNotificationCount(notifications.length);
            }
        })
        .catch(error => console.error('Polling error:', error));
}, 30000); // 30 seconds
```

### Mark notification as read

```javascript
// Add click handler to notifications
document.addEventListener('click', function(e) {
    const notificationItem = e.target.closest('.notification-item');
    if (notificationItem) {
        const notificationId = notificationItem.dataset.id;
        
        // Mark as read on server
        fetch(`/api/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                notificationItem.classList.remove('unread');
            }
        });
    }
});
```

## 3. Real-time Notifications (WebSocket)

For real-time notifications, use WebSocket:

### Flask-SocketIO Setup

```python
# app.py

from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import session

socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    user_id = session.get('user_id')
    join_room(f'user_{user_id}')
    print(f'User {user_id} connected')

@socketio.on('disconnect')
def handle_disconnect():
    user_id = session.get('user_id')
    print(f'User {user_id} disconnected')
```

### Send notification to user

```python
from flask_socketio import emit

def send_notification_to_user(user_id, title, message, notification_type='info'):
    """Send real-time notification to user"""
    socketio.emit('new_notification', {
        'title': title,
        'message': message,
        'type': notification_type,
        'time': datetime.now().strftime('%H:%M')
    }, room=f'user_{user_id}')
```

### Frontend WebSocket handling

```javascript
// Add this to navbar-interactive.js

// Connect to WebSocket
const socket = io();

// Listen for new notifications
socket.on('new_notification', function(data) {
    navbarFunctions.addNotification(
        data.title,
        data.message,
        data.type,
        data.time
    );
});

// Update notification count when new notification arrives
socket.on('new_notification', function(data) {
    const badge = document.querySelector('.notification-badge');
    const currentCount = parseInt(badge.textContent);
    navbarFunctions.updateNotificationCount(currentCount + 1);
});
```

## 4. Transaction Notifications

Automatically add notifications when transactions are created:

```python
# routes/expense_routes.py

from flask_socketio import socketio
from models.db_models import Expense, Notification

@app.route('/add', methods=['POST'])
def add_expense():
    # ... existing code ...
    
    expense = Expense(
        user_id=user_id,
        category=category,
        amount=amount,
        description=description,
        date=date,
        type=expense_type
    )
    
    db.session.add(expense)
    db.session.commit()
    
    # Create notification
    if expense_type == 'Expense':
        title = f'Transaction Added'
        message = f'₹{amount} for {category}'
        notif_type = 'success'
    else:
        title = f'Income Added'
        message = f'₹{amount} received'
        notif_type = 'success'
    
    # Save to database
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type
    )
    db.session.add(notification)
    db.session.commit()
    
    # Send real-time notification
    socketio.emit('new_notification', {
        'title': title,
        'message': message,
        'type': notif_type,
        'time': 'just now'
    }, room=f'user_{user_id}')
    
    return jsonify({'status': 'success'})
```

## 5. Budget Alert Notifications

Create notifications when budget thresholds are exceeded:

```python
# routes/budget_routes.py

from models.db_models import Budget, Expense
from datetime import datetime, timedelta

def check_budget_alerts(user_id):
    """Check and create budget alert notifications"""
    user = User.query.get(user_id)
    budgets = Budget.query.filter_by(user_id=user_id).all()
    
    for budget in budgets:
        # Calculate current month spending
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        spending = db.session.query(func.sum(Expense.amount)).filter(
            Expense.user_id == user_id,
            Expense.category == budget.category,
            extract('month', Expense.date) == current_month,
            extract('year', Expense.date) == current_year,
            Expense.type == 'Expense'
        ).scalar() or 0
        
        percentage = (spending / budget.limit) * 100
        
        # Alert at 75% and 100%
        if percentage >= 100:
            notify_user(
                user_id,
                f'⚠ Budget Exceeded',
                f'{budget.category} budget exceeded! ₹{spending}/₹{budget.limit}',
                'warning'
            )
        elif percentage >= 75 and not budget.warning_sent:
            notify_user(
                user_id,
                f'⚠ Budget Alert',
                f'{budget.category} at {int(percentage)}% of budget',
                'warning'
            )
            budget.warning_sent = True
            db.session.commit()

def notify_user(user_id, title, message, notif_type):
    """Helper function to create and send notification"""
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type
    )
    db.session.add(notification)
    db.session.commit()
    
    # Send real-time notification if WebSocket is enabled
    socketio.emit('new_notification', {
        'title': title,
        'message': message,
        'type': notif_type,
        'time': 'just now'
    }, room=f'user_{user_id}')
```

## 6. Daily Spending in Quick Stats

Update the quick stats with real-time data:

```python
# routes/dashboard_routes.py

from datetime import date
from models.db_models import Expense

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics for navbar"""
    user_id = session.get('user_id')
    
    # Total balance
    expenses = Expense.query.filter_by(user_id=user_id).all()
    balance = sum(e.amount for e in expenses if e.type == 'Income') - \
              sum(e.amount for e in expenses if e.type == 'Expense')
    
    # Today's spending
    today = date.today()
    today_spending = sum(
        e.amount for e in expenses 
        if e.type == 'Expense' and e.date == today
    )
    
    return jsonify({
        'balance': balance,
        'today_spending': today_spending
    })
```

Update HTML to use actual data:

```html
<!-- In navbar-interactive.html -->
<div class="quick-stats">
    <div class="stat-item">
        <span class="stat-label">Balance</span>
        <span class="stat-value" id="navbarBalance">₹0</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
        <span class="stat-label">Spent Today</span>
        <span class="stat-value today" id="navbarTodaySpent">₹0</span>
    </div>
</div>

<script>
    // Load stats on page load
    fetch('/api/dashboard/stats')
        .then(r => r.json())
        .then(data => {
            document.getElementById('navbarBalance').textContent = '₹' + data.balance.toLocaleString();
            document.getElementById('navbarTodaySpent').textContent = '₹' + data.today_spending.toLocaleString();
        });
</script>
```

## Best Practices

1. **Debounce notifications**: Don't send too many notifications at once
2. **Cache notifications**: Store locally to reduce server requests
3. **Use WebSocket**: For real-time updates instead of polling
4. **Error handling**: Always handle fetch errors gracefully
5. **Rate limiting**: Limit notification frequency per user
6. **Cleanup**: Remove old notifications after a certain period

---

**Last Updated**: March 2026
