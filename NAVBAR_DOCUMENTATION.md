# Interactive Navbar Documentation

## Overview
This is a fully interactive, modern horizontal navbar built with **dark neon glassmorphism** design. It features search functionality, notifications, user dropdown, theme toggle, and smooth animations using CSS keyframes and optional GSAP.

## Features

### 1. **Search Functionality**
- Real-time search input with suggestions
- Keyboard shortcut: `Ctrl+K` to focus search
- Autocomplete suggestions with recent searches
- Smooth blur animations and focus effects

### 2. **Notifications**
- Notification badge with pulse animation
- Dropdown menu with notification list
- Color-coded notification types (warning, success, info)
- Unread notification indicators
- Real-time notification updates

### 3. **User Dropdown**
- User profile with avatar and email
- Quick links to settings, profile, and billing
- Logout option
- Smooth animations on open/close

### 4. **Theme Toggle**
- Dark/Light theme switching
- Smooth Icon rotation animation
- Theme preference saved to localStorage
- Automatic theme restoration on page load

### 5. **Quick Stats Display**
- Real-time balance display
- Daily expense tracking
- Responsive mini stats panel

### 6. **Animations**
- **CSS Keyframes**: Smooth transitions, glows, pulses, and slides
- **GSAP Integration**: Optional advanced animations for enhanced UX
- **Hover Effects**: Scale, glow, and shadow animations
- **Dropdown Animations**: Smooth slide and scale transitions
- **Icon Animations**: Rotation, pulse, and badge animations

### 7. **Responsive Design**
- Fully responsive for desktop, tablet, and mobile
- Mobile hamburger menu with slide transitions
- Touch-friendly button sizes
- Adaptive dropdown positioning

## Installation

### 1. Include CSS
```html
<link rel="stylesheet" href="/static/css/navbar-interactive.css">
```

### 2. Include HTML Component
```html
{% include 'components/navbar-interactive.html' %}
```

### 3. Include JavaScript
```html
<script src="/static/js/navbar-interactive.js"></script>
```

### 4. Optional: Include GSAP for Enhanced Animations
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
```

## Complete Setup Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    
    <!-- Stylesheets -->
    <link rel="stylesheet" href="/static/css/navbar-interactive.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    
    <!-- Scripts -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
</head>
<body>
    <!-- Navbar Component -->
    {% include 'components/navbar-interactive.html' %}
    
    <!-- Your content here -->
    
    <!-- Script -->
    <script src="/static/js/navbar-interactive.js"></script>
    <script src="/static/js/theme.js"></script>
</body>
</html>
```

## Usage & API

### Adding Notifications Dynamically

```javascript
// Add a notification
navbarFunctions.addNotification(
    'Transaction Added',      // title
    '₹2,500 for Groceries',   // message
    'success',                 // type: 'success', 'warning', 'info'
    '5 min ago'               // time (optional)
);

// Example: warning notification
navbarFunctions.addNotification(
    'Budget Alert',
    'Food category at 85% of budget',
    'warning'
);

// Example: info notification
navbarFunctions.addNotification(
    'Weekly Report Ready',
    'View your weekly expense summary',
    'info'
);
```

### Updating Notification Count

```javascript
// Update badge count
navbarFunctions.updateNotificationCount(5);
```

### Toggle Dropdowns Programmatically

```javascript
// Toggle notifications dropdown
navbarFunctions.toggleDropdown('notificationsDropdown');

// Toggle user dropdown
navbarFunctions.toggleDropdown('userDropdown');
```

### Toggle Theme Programmatically

```javascript
// Toggle between dark and light theme
navbarFunctions.toggleTheme();
```

## Keyboard Shortcuts

- **`Ctrl+K` / `Cmd+K`**: Focus search input
- **`Escape`**: Close open dropdowns

## Customization

### Changing Colors

Edit CSS variables in `navbar-interactive.css`:

```css
:root {
    --primary-color: #8b5cf6;           /* Main brand color */
    --primary-light: #a78bfa;
    --primary-dark: #6d28d9;
    --secondary-color: #06b6d4;         /* Accent color */
    --neon-pink: #ec4899;
    --neon-green: #10b981;
    --neon-blue: #3b82f6;
    --glass-bg: rgba(30, 41, 59, 0.7);
    --glass-border: rgba(139, 92, 246, 0.2);
    --text-primary: #e0e7ff;
    --text-secondary: #cbd5e1;
}
```

### Adjusting Animation Speed

Find keyframe definitions in CSS and modify `duration`:

```css
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.navbar-interactive {
    animation: slideInDown 0.6s ease-out;  /* 0.6s = duration */
}
```

### Modifying Glassmorphism Effect

Adjust backdrop blur and transparency:

```css
.navbar-interactive {
    backdrop-filter: blur(20px);  /* Increase for more blur */
    background: rgba(30, 41, 59, 0.7);  /* Adjust opacity (0.7) */
}
```

## Events & Hooks

### Search Input Event
Triggered when user types in search:
```javascript
document.getElementById('searchInput').addEventListener('input', function() {
    console.log('Search query:', this.value);
});
```

### Notification Click
Add click handlers to dynamically added notifications:
```javascript
document.addEventListener('click', function(e) {
    if (e.target.closest('.notification-item')) {
        const notification = e.target.closest('.notification-item');
        console.log('Notification clicked');
    }
});
```

## Animation Details

### Available Keyframes
1. **slideInDown** - Navbar entrance animation
2. **slideInUp** - Dropdown contents animation
3. **fadeIn** - Fade in effect
4. **pulseNeon** - Neon glow pulse on hover
5. **glow** - Text glow effect on logo
6. **shimmer** - Light shimmer effect on buttons
7. **notificationBounce** - Badge bounce animation
8. **searchPulse** - Search focus pulse
9. **slideInRight** - Right slide animation
10. **dropdownSlide** - Dropdown opening animation
11. **iconRotate** - Icon 360° rotation
12. **badgePulse** - Notification badge pulse

### GSAP Animations (if loaded)
- Navbar entrance with ease-out
- Icon button scale on hover
- Badge pulse animation
- User button hover effects
- Search wrapper scale on focus
- Notification slide animations

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Tips

1. **GSAP is optional** - Navbar works perfectly with CSS-only animations
2. **Lazy load notifications** - Only add notifications when needed
3. **Debounce search** - Consider debouncing search input for API calls
4. **Use CSS variables** - Makes theme customization easy and performant

## Troubleshooting

### Dropdowns not opening
- Check if JavaScript file is loaded
- Verify element IDs match HTML template
- Check for JavaScript errors in console

### Animations not smooth
- Enable GSAP for enhanced animations
- Check CSS animation properties
- Reduce motion preferences for accessibility

### Theme toggle not working
- Ensure `theme.js` is loaded before navbar script
- Check `localStorage` availability
- Verify CSS variable support in browser

### Mobile menu issues
- Check viewport meta tag
- Verify touch event handlers
- Test on actual mobile device

## File Structure

```
expense_tracker/
├── templates/
│   └── components/
│       └── navbar-interactive.html   # Navbar HTML template
├── static/
│   ├── css/
│   │   └── navbar-interactive.css    # Navbar styles
│   └── js/
│       └── navbar-interactive.js     # Navbar functionality
└── dashboard/
    ├── dashboard.html
    ├── add_expense.html
    ├── reports.html
    └── settings.html
```

## Integration with Backend

### Flask Integration Example

```python
# In your Flask app
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    # Fetch notifications from database
    notifications = db.query(Notification).filter_by(user_id=current_user.id)
    return jsonify([{
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'time': n.created_at.strftime('%H:%M')
    } for n in notifications])
```

```javascript
// In navbar-interactive.js
function loadNotifications() {
    fetch('/api/notifications')
        .then(r => r.json())
        .then(notifications => {
            notifications.forEach(n => {
                navbarFunctions.addNotification(n.title, n.message, n.type, n.time);
            });
        });
}
```

## License

MIT - Feel free to use and modify for your projects

## Support

For issues or questions:
1. Check the console for error messages
2. Verify all files are properly linked
3. Test in a simple HTML file first
4. Check browser console for JavaScript errors

---

**Version**: 1.0.0  
**Last Updated**: March 2026  
**Author**: Expense Tracker Team
