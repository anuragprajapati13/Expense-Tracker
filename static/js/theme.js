// ====================================================================
// LEGACY THEME SYSTEM - DISABLED
// All theme functionality moved to navbar-interactive.js
// This file is kept for backward compatibility only
// ====================================================================

// DO NOT USE - Use navbar-interactive.js instead!
// The navbar theme toggle button handles all theme switching
// Storage keys: 'theme' and 'theme-preference' (synchronized)

console.log('%c⚠️ theme.js is DEPRECATED', 'color: orange; font-weight: bold;');
console.log('%c✅ Using navbar-interactive.js for theme management', 'color: #00ff00; font-weight: bold;');

// Keep old functions for backward compatibility, but they do nothing
function initializeTheme() {
    // DEPRECATED - does nothing
    // Theme is now managed by navbar-interactive.js
}

function toggleTheme() {
    // DEPRECATED - does nothing  
    // Click the theme button in navbar instead
}

function updateThemeButton(theme) {
    // DEPRECATED - does nothing
    // Icon updates automatically in navbar
}

// Don't initialize on DOMContentLoaded
// Let navbar-interactive.js handle everything

