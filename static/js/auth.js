// Authentication related JavaScript

// Password visibility toggle function
function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    const toggleButton = event.target.closest('.password-toggle');
    const icon = toggleButton.querySelector('i');

    if (!passwordInput) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        toggleButton.style.color = '#a78bfa';
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        toggleButton.style.color = 'rgba(255, 255, 255, 0.5)';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Reset password visibility on page load
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        const toggleButton = input.closest('.password-input-group')?.querySelector('.password-toggle');
        if (toggleButton) {
            const icon = toggleButton.querySelector('i');
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            toggleButton.style.color = 'rgba(255, 255, 255, 0.5)';
        }
    });

    // Password requirements real-time validation
    const pwInput = document.getElementById('password');
    const reqLength = document.getElementById('pw-length');
    const reqLower = document.getElementById('pw-lower');
    const reqUpper = document.getElementById('pw-upper');
    const reqNum = document.getElementById('pw-num');
    if (pwInput && reqLength && reqLower && reqUpper && reqNum) {
        pwInput.addEventListener('input', function() {
            const val = pwInput.value;
            // Length
            if (val.length >= 6) {
                reqLength.classList.add('valid');
                reqLength.querySelector('i').classList.remove('fa-times');
                reqLength.querySelector('i').classList.add('fa-check');
            } else {
                reqLength.classList.remove('valid');
                reqLength.querySelector('i').classList.remove('fa-check');
                reqLength.querySelector('i').classList.add('fa-times');
            }
            // Lowercase
            if (/[a-z]/.test(val)) {
                reqLower.classList.add('valid');
                reqLower.querySelector('i').classList.remove('fa-times');
                reqLower.querySelector('i').classList.add('fa-check');
            } else {
                reqLower.classList.remove('valid');
                reqLower.querySelector('i').classList.remove('fa-check');
                reqLower.querySelector('i').classList.add('fa-times');
            }
            // Uppercase
            if (/[A-Z]/.test(val)) {
                reqUpper.classList.add('valid');
                reqUpper.querySelector('i').classList.remove('fa-times');
                reqUpper.querySelector('i').classList.add('fa-check');
            } else {
                reqUpper.classList.remove('valid');
                reqUpper.querySelector('i').classList.remove('fa-check');
                reqUpper.querySelector('i').classList.add('fa-times');
            }
            // Number
            if (/[0-9]/.test(val)) {
                reqNum.classList.add('valid');
                reqNum.querySelector('i').classList.remove('fa-times');
                reqNum.querySelector('i').classList.add('fa-check');
            } else {
                reqNum.classList.remove('valid');
                reqNum.querySelector('i').classList.remove('fa-check');
                reqNum.querySelector('i').classList.add('fa-times');
            }
        });
    }

    // Add focus animations to form groups
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        const input = group.querySelector('input');
        if (input) {
            input.addEventListener('focus', function() {
                group.classList.add('focused');
            });

            input.addEventListener('blur', function() {
                group.classList.remove('focused');
            });
        }
    });

    // Prevent form submission on Enter for password toggle
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // Form validation
    const loginForm = document.querySelector('.auth-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                e.preventDefault();
                console.log('Please fill all fields');
            }
        });
    }
});

// Add CSS class animation
const style = document.createElement('style');
style.textContent = `
    .form-group.focused label {
        color: #a78bfa;
    }
`;
document.head.appendChild(style);
