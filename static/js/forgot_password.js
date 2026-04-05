// forgot_password.js - Handles resend OTP timer

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.auth-form');
    if (!form) return;

    // Create resend button and timer
    const resendBtn = document.createElement('button');
    resendBtn.type = 'button';
    resendBtn.className = 'submit-btn';
    resendBtn.textContent = 'Resend OTP';
    resendBtn.style.display = 'none';
    resendBtn.style.marginTop = '10px';

    const timerSpan = document.createElement('span');
    timerSpan.style.display = 'block';
    timerSpan.style.margin = '10px 0';
    timerSpan.style.color = '#6c63ff';
    timerSpan.style.fontWeight = 'bold';

    let timer = 30;
    let interval;

    function startTimer() {
        resendBtn.style.display = 'none';
        timerSpan.style.display = 'block';
        timer = 30;
        timerSpan.textContent = `Resend OTP in ${timer} seconds`;
        interval = setInterval(() => {
            timer--;
            timerSpan.textContent = `Resend OTP in ${timer} seconds`;
            if (timer <= 0) {
                clearInterval(interval);
                timerSpan.style.display = 'none';
                resendBtn.style.display = 'block';
            }
        }, 1000);
    }

    // Insert timer and resend button after the form
    form.parentNode.insertBefore(timerSpan, form.nextSibling);
    form.parentNode.insertBefore(resendBtn, timerSpan.nextSibling);

    // Start timer on page load
    startTimer();

    resendBtn.addEventListener('click', function() {
        // Optionally, trigger resend OTP via AJAX or form submit
        // For now, just restart timer
        startTimer();
        // Optionally, you can submit the form or make an AJAX call here
        // Example: form.submit();
    });
});
