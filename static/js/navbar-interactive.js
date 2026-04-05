// ========================================
// INTERACTIVE NAVBAR FUNCTIONALITY
// ========================================

// ENSURE THIS RUNS FIRST - before any other code
console.log('%c🚀 navbar-interactive.js loaded', 'color: #06b6d4; font-weight: bold;');

// Set up theme toggle IMMEDIATELY
function setupThemeToggleFirst() {
    const btn = document.getElementById('themeToggle');
    if (btn) {
        console.log('%c✅ Found theme toggle button!', 'color: #10b981; font-weight: bold;');
        btn.addEventListener('click', toggleTheme);
        updateThemeIcon();
    } else {
        console.log('%c❌ Theme toggle button NOT found!', 'color: #ef4444; font-weight: bold;');
    }
}

// Run immediately when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('%c📝 DOMContentLoaded fired - initializing navbar', 'color: #8b5cf6;');
    setupThemeToggleFirst();
    initializeNavbar();
});

// Also run immediately if DOM is already ready
if (document.readyState === 'loading') {
    // Still loading
} else {
    // Already loaded
    console.log('%c⚡ DOM already loaded - running immediately', 'color: #f59e0b;'); 
    setupThemeToggleFirst();
}

function initializeNavbar() {
    console.log('%c🎯 Initializing navbar components...', 'color: #8b5cf6;');
    
    // Initialize dropdown toggles
    setupDropdowns();
    
    // Initialize logout confirmation
    setupLogoutConfirmation();
    
    // Initialize notifications modal
    setupNotificationsModal();
    
    // Initialize search functionality
    setupSearch();
    
    // Initialize mobile menu
    setupMobileMenu();
    
    // Setup click outside detection
    setupOutsideClickDetection();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
    
    // Check for GSAP and setup animations if available

    if (typeof gsap !== 'undefined') {
        setupGSAPAnimations();
    }
    
    console.log('%c✅ Navbar initialization complete!', 'color: #10b981; font-weight: bold;');
}

// ========================================
// LOGOUT CONFIRMATION MODAL
// ========================================

function setupLogoutConfirmation() {
    const logoutBtn = document.getElementById('logoutBtn');
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    const modal = document.getElementById('logoutConfirmationModal');
    const confirmBtn = document.getElementById('confirmLogoutBtn');
    const cancelBtn = document.getElementById('cancelLogoutBtn');
    const overlay = document.getElementById('logoutModalOverlay');

    // Handle navbar logout button
    if (logoutBtn && modal) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openLogoutConfirmation(modal);
            console.log('%c🚪 Logout confirmation modal opened (navbar)', 'color: #ef4444;');
        });
    }

    // Handle sidebar logout button
    if (sidebarLogoutBtn && modal) {
        sidebarLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openLogoutConfirmation(modal);
            console.log('%c🚪 Logout confirmation modal opened (sidebar)', 'color: #ef4444;');
        });
    }

    if (!modal) {
        console.log('%c⚠️ Logout confirmation modal not found', 'color: #f59e0b;');
        return;
    }

    // Cancel logout
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            closeLogoutConfirmation(modal);
            console.log('%c🚪 Logout cancelled', 'color: #06b6d4;');
        });
    }

    // Confirm logout
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            window.location.href = '/logout';
            console.log('%c🚪 Logging out...', 'color: #ef4444;');
        });
    }

    // Close modal on overlay click
    if (overlay) {
        overlay.addEventListener('click', function() {
            closeLogoutConfirmation(modal);
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeLogoutConfirmation(modal);
        }
    });
}

function openLogoutConfirmation(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(modal.querySelector('.logout-modal-content'),
            { opacity: 0, scale: 0.9, y: 20 },
            { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out" }
        );
    }
}

function closeLogoutConfirmation(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Close the user dropdown
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        closeDropdown(userDropdown);
    }
}

// ========================================
// NOTIFICATIONS MODAL SETUP
// ========================================

function setupNotificationsModal() {
    const viewAllBtn = document.getElementById('viewAllNotificationsBtn');
    const modal = document.getElementById('notificationsModal');
    const closeBtn = document.getElementById('closeNotificationsModal');
    const overlay = document.getElementById('notificationsOverlay');

    if (!viewAllBtn || !modal) {
        console.log('%c⚠️ Notifications modal elements not found', 'color: #f59e0b;');
        return;
    }

    // Open modal when "View All Notifications" is clicked
    viewAllBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openNotificationsModal(modal);
        console.log('%c🔔 Notifications modal opened', 'color: #06b6d4;');
    });

    // Close modal when close button is clicked
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            closeNotificationsModal(modal);
            console.log('%c🔔 Notifications modal closed', 'color: #06b6d4;');
        });
    }

    // Close modal when overlay is clicked
    if (overlay) {
        overlay.addEventListener('click', function() {
            closeNotificationsModal(modal);
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeNotificationsModal(modal);
        }
    });
}

function openNotificationsModal(modal) {
    modal.classList.add('active');
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    // Add GSAP animation if available
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(modal.querySelector('.notifications-modal-content'),
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out" }
        );
    }
}

function closeNotificationsModal(modal) {
    modal.classList.remove('active');
    
    // Restore body scrolling
    document.body.style.overflow = 'auto';
}

// ========================================
// DROPDOWNS SETUP
// ========================================

function setupDropdowns() {
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    const userBtn = document.getElementById('userBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (notificationsBtn && notificationsDropdown) {
        notificationsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown(notificationsDropdown);
            closeDropdown(userDropdown);
        });
    }

    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleDropdown(userDropdown);
            closeDropdown(notificationsDropdown);
        });
    }

    // Close dropdowns when clicking on items
    if (notificationsDropdown) {
        notificationsDropdown.addEventListener('click', function(e) {
            if (e.target.closest('.notification-item') && !e.target.closest('.close-btn')) {
                setTimeout(() => closeDropdown(notificationsDropdown), 300);
            }
        });
    }

    if (userDropdown) {
        userDropdown.addEventListener('click', function(e) {
            // Don't close dropdown if logout button is clicked - let logout button handler take precedence
            if (e.target.closest('.dropdown-item') && !e.target.closest('#logoutBtn')) {
                setTimeout(() => closeDropdown(userDropdown), 200);
            }
        });
    }
}

function toggleDropdown(dropdown) {
    if (dropdown.classList.contains('active')) {
        closeDropdown(dropdown);
    } else {
        openDropdown(dropdown);
    }
}

function openDropdown(dropdown) {
    dropdown.classList.add('active');
    
    // Add GSAP animation if available
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(dropdown, 
            { opacity: 0, y: -10, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out" }
        );
    }
}

function closeDropdown(dropdown) {
    if (dropdown) {
        dropdown.classList.remove('active');
    }
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) return;

    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('focus', handleSearchFocus);
    searchInput.addEventListener('blur', handleSearchBlur);
}

function handleSearchInput(e) {
    const query = e.target.value.trim();
    const wrapper = e.target.closest('.search-wrapper');
    const suggestions = wrapper.querySelector('.search-suggestions');

    if (query.length > 0) {
        // Show filtered suggestions
        populateSearchSuggestions(query, suggestions);
        suggestions.style.display = 'block';
    } else {
        suggestions.style.display = 'none';
    }
}

function handleSearchFocus(e) {
    const wrapper = e.target.closest('.search-wrapper');
    const suggestions = wrapper.querySelector('.search-suggestions');
    
    // Add pulse animation
    if (typeof gsap !== 'undefined') {
        gsap.to(wrapper, {
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4), inset 0 0 10px rgba(139, 92, 246, 0.1)',
            duration: 0.3
        });
    }
}

function handleSearchBlur(e) {
    setTimeout(() => {
        const wrapper = e.target.closest('.search-wrapper');
        if (wrapper) {
            const suggestions = wrapper.querySelector('.search-suggestions');
            suggestions.style.display = 'none';
        }
    }, 150);
}

function populateSearchSuggestions(query, suggestionsContainer) {
    // Mock search suggestions - replace with actual data fetching
    const mockSuggestions = [
        { icon: 'fa-history', label: 'Recent: ' + query },
        { icon: 'fa-search', label: 'Search: ' + query },
        { icon: 'fa-chart-pie', label: 'Reports containing "' + query + '"' },
    ];

    suggestionsContainer.innerHTML = mockSuggestions.map(item => `
        <div class="suggestion-item">
            <i class="fas ${item.icon}"></i>
            <span>${item.label}</span>
        </div>
    `).join('');

    suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => {
            document.getElementById('searchInput').value = item.textContent.trim();
            performSearch(item.textContent.trim());
        });
    });
}

function performSearch(query) {
    console.log('Searching for:', query);
    // Implement actual search functionality
    // You can make an API call here
}

// ========================================
// MOBILE MENU SETUP
// ========================================

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileMenuBtn.classList.toggle('active');
            mobileMenu.classList.toggle('active');
        });

        // Close menu when clicking on links
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                mobileMenu.classList.remove('active');
            });
        });
    }
}

// ========================================
// ========================================
// THEME TOGGLE - SIMPLIFIED & CLEAR
// ========================================

function toggleTheme() {
    const btn = document.getElementById('themeToggle');
    const icon = btn?.querySelector('i');
    
    console.log('%c🎬 Theme toggle clicked!', 'color: #ec4899; font-weight: bold;');
    
    // Toggle the light-theme class on body
    document.body.classList.toggle('light-theme');
    const isDark = !document.body.classList.contains('light-theme');
    
    console.log('%c📦 Theme state:', 'color: #06b6d4;', isDark ? 'DARK MODE' : 'LIGHT MODE');
    
    // Save to localStorage
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');
    
    // Update the icon
    updateThemeIcon();
    
    // Animate icon if it exists
    if (icon) {
        try {
            icon.style.animation = 'none';
            void icon.offsetWidth; // Reflow
            icon.style.animation = 'iconRotate 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards';
        } catch (e) {
            console.log('Animation error:', e);
        }
    }
}

function updateThemeIcon() {
    const btn = document.getElementById('themeToggle');
    const icon = btn?.querySelector('i');
    
    if (!icon) {
        console.log('%c❌ Icon not found!', 'color: #ef4444;');
        return;
    }
    
    const isDark = !document.body.classList.contains('light-theme');
    
    if (isDark) {
        // Dark mode - show sun icon
        icon.className = 'fas fa-sun';
        icon.style.color = '#FFD700';
        btn.title = 'Click to switch to Light Mode';
        console.log('%c☀️ Icon: SUN (dark mode active)', 'color: #FFD700; font-weight: bold;');
    } else {
        // Light mode - show moon icon
        icon.className = 'fas fa-moon';
        icon.style.color = '#E0AAFF';
        btn.title = 'Click to switch to Dark Mode';
        console.log('%c🌙 Icon: MOON (light mode active)', 'color: #E0AAFF; font-weight: bold;');
    }
}

// ========================================
// CLICK OUTSIDE DETECTION
// ========================================

function setupOutsideClickDetection() {
    document.addEventListener('click', function(event) {
        const notificationsDropdown = document.getElementById('notificationsDropdown');
        const userDropdown = document.getElementById('userDropdown');
        const notificationsWrapper = document.querySelector('.notifications-wrapper');
        const userDropdownWrapper = document.querySelector('.user-dropdown-wrapper');

        // Close notifications dropdown
        if (notificationsDropdown && 
            !notificationsWrapper.contains(event.target)) {
            closeDropdown(notificationsDropdown);
        }

        // Close user dropdown
        if (userDropdown && 
            !userDropdownWrapper.contains(event.target)) {
            closeDropdown(userDropdown);
        }
    });
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + K for search focus
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Escape to close dropdowns
        if (event.key === 'Escape') {
            const notificationsDropdown = document.getElementById('notificationsDropdown');
            const userDropdown = document.getElementById('userDropdown');
            closeDropdown(notificationsDropdown);
            closeDropdown(userDropdown);
        }
    });
}

// ========================================
// NOTIFICATION INTERACTIONS
// ========================================

function markNotificationAsRead(notificationElement) {
    notificationElement.classList.remove('unread');
    
    if (typeof gsap !== 'undefined') {
        gsap.to(notificationElement, {
            opacity: 0.6,
            duration: 0.3
        });
    }
}

// ========================================
// GSAP ANIMATIONS (Optional - if GSAP is loaded)
// ========================================

function setupGSAPAnimations() {
    // Navbar entrance animation
    const navbar = document.querySelector('.navbar-interactive');
    if (navbar) {
        gsap.from(navbar, {
            y: -100,
            opacity: 0,
            duration: 0.6,
            ease: "back.out"
        });
    }

    // Icon button hover animation
    const iconButtons = document.querySelectorAll('.icon-button');
    iconButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            gsap.to(this, {
                scale: 1.1,
                duration: 0.3,
                ease: "back.out"
            });
        });

        button.addEventListener('mouseleave', function() {
            gsap.to(this, {
                scale: 1,
                duration: 0.3,
                ease: "back.out"
            });
        });
    });

    // Notification badge pulse
    const badges = document.querySelectorAll('.notification-badge');
    badges.forEach(badge => {
        gsap.to(badge, {
            boxShadow: '0 0 16px rgba(236, 72, 153, 0.9)',
            repeat: -1,
            yoyo: true,
            duration: 1.5,
            ease: "sine.inOut"
        });
    });

    // User button hover and click animation
    const userButton = document.querySelector('.user-button');
    if (userButton) {
        userButton.addEventListener('mouseenter', function() {
            gsap.to(this, {
                scale: 1.05,
                duration: 0.3,
                ease: "back.out"
            });
        });

        userButton.addEventListener('mouseleave', function() {
            gsap.to(this, {
                scale: 1,
                duration: 0.3,
                ease: "back.out"
            });
        });
    }

    // Search wrapper focus animation
    const searchWrapper = document.querySelector('.search-wrapper');
    if (searchWrapper) {
        const searchInput = searchWrapper.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('focus', function() {
                gsap.to(searchWrapper, {
                    scale: 1.02,
                    duration: 0.3,
                    ease: "back.out"
                });
            });

            searchInput.addEventListener('blur', function() {
                gsap.to(searchWrapper, {
                    scale: 1,
                    duration: 0.3,
                    ease: "back.out"
                });
            });
        }
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Update notification count
function updateNotificationCount(count) {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = count;
        
        if (typeof gsap !== 'undefined') {
            gsap.to(badge, {
                scale: 1.2,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                ease: "back.out"
            });
        }
    }
}

// Add new notification
function addNotification(title, message, type = 'info', time = 'just now') {
    const notificationsList = document.querySelector('.notifications-list');
    
    if (!notificationsList) return;

    const notificationItem = document.createElement('div');
    notificationItem.className = 'notification-item unread';
    
    const iconClass = type === 'warning' ? 'fa-exclamation-circle' : 
                      type === 'success' ? 'fa-check-circle' : 
                      'fa-info-circle';
    
    notificationItem.innerHTML = `
        <div class="notification-icon ${type}">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="notification-content">
            <p class="notification-title">${title}</p>
            <p class="notification-message">${message}</p>
            <span class="notification-time">${time}</span>
        </div>
    `;
    
    notificationsList.insertBefore(notificationItem, notificationsList.firstChild);
    
    // Animate new notification
    if (typeof gsap !== 'undefined') {
        gsap.from(notificationItem, {
            opacity: 0,
            x: 50,
            duration: 0.3,
            ease: "back.out"
        });
    }
    
    // Update badge count
    const badge = document.querySelector('.notification-badge');
    if (badge) {
        const currentCount = parseInt(badge.textContent);
        updateNotificationCount(currentCount + 1);
    }
}

// Export functions for external use
window.navbarFunctions = {
    addNotification,
    updateNotificationCount,
    toggleTheme,
    toggleDropdown: function(id) {
        const dropdown = document.getElementById(id);
        if (dropdown) toggleDropdown(dropdown);
    }
};

console.log('Interactive Navbar initialized successfully!');

// ========================================
// INITIALIZATION - Load theme on page load
// ========================================

function initializeThemeOnLoad() {
    console.log('%c⚙️ Initializing theme system...', 'color: #a78bfa; font-weight: bold;');
    
    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem('theme-preference') || localStorage.getItem('theme') || 'dark';
    console.log('%c💾 Saved theme:', 'color: #06b6d4;', savedTheme);
    
    // Apply theme class
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        console.log('%c💡 Applied: LIGHT THEME', 'color: #FFC107; font-weight: bold;');
    } else {
        document.body.classList.remove('light-theme');
        console.log('%c🌙 Applied: DARK THEME', 'color: #8b5cf6; font-weight: bold;');
    }
    
    // Update icon display
    updateThemeIcon();
}

// Call on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemeOnLoad);
} else {
    initializeThemeOnLoad();
}
