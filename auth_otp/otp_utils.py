import random
import threading
import logging
import requests
from datetime import datetime, timedelta
from flask import session

# Setup logging for email sending
logging.basicConfig(level=logging.DEBUG)
email_logger = logging.getLogger("OTP_EMAIL")

# 🔹 Generate OTP
def generate_otp():
    # Always return a 4-digit OTP as a string, padded if needed
    return f"{random.randint(1000, 9999)}"


# 🔹 Store OTP in session (valid for 5 minutes)
def store_otp(email, otp):
    session['otp_data'] = {
        "email": email,
        "otp": otp,
        "expiry": (datetime.now() + timedelta(minutes=5)).isoformat(),
        "attempts": 0
    }


# 🔹 Verify OTP
def verify_otp(user_otp):
    data = session.get('otp_data')

    if not data:
        return False, "Session expired. Try again."

    if datetime.now() > datetime.fromisoformat(data['expiry']):
        return False, "OTP expired."

    if data['attempts'] >= 3:
        return False, "Maximum attempts reached."

    if user_otp == data['otp']:
        return True, "OTP verified"

    # increase attempts
    data['attempts'] += 1
    session['otp_data'] = data

    return False, "Invalid OTP"


# 🔹 Clear OTP
def clear_otp():
    session.pop('otp_data', None)


# 🔹 Send OTP Email (using Mailgun - fastest setup, works on Render)
def _send_email_background(receiver_email, otp, mailgun_domain, mailgun_api_key):
    """Background task to send OTP email using Mailgun API."""
    try:
        email_logger.info(f"[BACKGROUND] Starting email send for {receiver_email}")
        print(f"[EMAIL_SEND] Starting OTP email for {receiver_email}")
        
        # Mailgun API endpoint
        url = f"https://api.mailgun.net/v3/{mailgun_domain}/messages"
        
        # For Mailgun sandbox, use postmaster@domain as the from address
        from_email = f"postmaster@{mailgun_domain}"
        
        # Email content
        subject = "Your ExpenseTracker OTP"
        html_content = f"""
        <html>
            <body>
                <h2>ExpenseTracker - Password Reset</h2>
                <p>Hello,</p>
                <p>Your One-Time Password (OTP) for password reset is:</p>
                <h1 style="color: #007bff; letter-spacing: 2px;">{otp}</h1>
                <p><strong>This OTP is valid for 5 minutes.</strong></p>
                <p>If you did not request this, please ignore this email.</p>
                <hr>
                <p>Best regards,<br>ExpenseTracker Team</p>
            </body>
        </html>
        """
        
        text_content = f"""Your ExpenseTracker OTP for password reset is:

{otp}

This OTP is valid for 5 minutes. If you did not request this, please ignore this email.

Regards,
ExpenseTracker Team"""

        # Prepare Mailgun request
        email_logger.debug(f"Preparing Mailgun API request to {mailgun_domain}")
        print(f"[EMAIL_SEND] Preparing email via Mailgun...")
        print(f"[EMAIL_SEND] Domain: {mailgun_domain}")
        print(f"[EMAIL_SEND] From: {from_email}")
        print(f"[EMAIL_SEND] To: {receiver_email}")
        
        # Basic auth with Mailgun API key
        auth = ("api", mailgun_api_key)
        data = {
            "from": f"ExpenseTracker <{from_email}>",
            "to": receiver_email,
            "subject": subject,
            "text": text_content,
            "html": html_content
        }
        
        # Send via Mailgun API
        email_logger.debug(f"Sending via Mailgun API...")
        print(f"[EMAIL_SEND] Sending via Mailgun...")
        
        response = requests.post(url, auth=auth, data=data, timeout=10)
        
        if response.status_code == 200:
            email_logger.info(f"✅ SUCCESS: OTP email sent to {receiver_email}")
            print(f"[EMAIL_SEND] ✅ OTP email sent successfully to {receiver_email}")
        else:
            email_logger.error(f"❌ Mailgun API Error: {response.status_code} - {response.text}")
            print(f"❌ [EMAIL_ERROR] Mailgun API returned status {response.status_code}")
            print(f"   Response: {response.text}")
        
    except requests.Timeout:
        email_logger.error(f"❌ TIMEOUT: Mailgun API took too long")
        print(f"❌ [EMAIL_ERROR] Mailgun API Timeout")
    except Exception as e:
        email_logger.error(f"❌ MAILGUN ERROR: {str(e)}")
        print(f"❌ [EMAIL_ERROR] Mailgun Error: {e}")
        import traceback
        traceback.print_exc()

def send_otp_email(receiver_email, otp):
    import os
    try:
        # Get Mailgun credentials from environment
        mailgun_domain = os.environ.get("MAILGUN_DOMAIN", "").strip()
        mailgun_api_key = os.environ.get("MAILGUN_API_KEY", "").strip()

        # Validate that credentials are set
        if not mailgun_domain or not mailgun_api_key:
            error_msg = "❌ ERROR: Mailgun credentials not configured in Render environment"
            email_logger.error(error_msg)
            print(error_msg)
            print("   Set these in Render dashboard:")
            print("   - MAILGUN_DOMAIN (e.g., sandbox8c7469a36bd2461c867074414f815c31.mailgun.org)")
            print("   - MAILGUN_API_KEY (your API key from Mailgun)")
            print("")
            print("   Get Mailgun credentials:")
            print("   1. Go to https://mailgun.com/ and sign up (FREE)")
            print("   2. Verify your email")
            print("   3. In dashboard, copy domain and API key")
            return False
        
        email_logger.info(f"Starting OTP email send for {receiver_email}")
        print(f"[EMAIL_SEND] DEBUG: Domain={mailgun_domain}")
        print(f"[EMAIL_SEND] DEBUG: API Key={mailgun_api_key[:10]}... (showing first 10 chars for security)")

        # Send email in background thread to avoid request timeout
        email_thread = threading.Thread(
            target=_send_email_background,
            args=(receiver_email, otp, mailgun_domain, mailgun_api_key),
            daemon=True
        )
        email_thread.start()
        
        email_logger.info(f"Email thread started for {receiver_email}")
        print(f"[EMAIL_SEND] Background thread started for {receiver_email}")
        return True
        
    except Exception as e:
        email_logger.error(f"Failed to start email thread: {str(e)}")
        print(f"❌ ERROR - Failed to start email thread: {e}")
        import traceback
        traceback.print_exc()
        return False