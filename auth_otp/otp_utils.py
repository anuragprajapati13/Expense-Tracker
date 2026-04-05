import random
import threading
import logging
from datetime import datetime, timedelta
from flask import session
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

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


# 🔹 Send OTP Email (using SendGrid - more reliable on cloud)
def _send_email_background(receiver_email, otp, sender_email, sendgrid_api_key):
    """Background task to send OTP email using SendGrid."""
    try:
        email_logger.info(f"[BACKGROUND] Starting email send for {receiver_email}")
        print(f"[EMAIL_SEND] Starting OTP email for {receiver_email}")
        
        # Create the email message
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

        # Create SendGrid message
        email_logger.debug(f"Creating SendGrid message for {receiver_email}")
        print(f"[EMAIL_SEND] Creating email message...")
        
        message = Mail(
            from_email=sender_email,
            to_emails=receiver_email,
            subject=subject,
            plain_text_content=text_content,
            html_content=html_content
        )
        
        # Send email via SendGrid
        email_logger.debug(f"Sending via SendGrid API...")
        print(f"[EMAIL_SEND] Sending via SendGrid...")
        
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        
        email_logger.info(f"✅ SUCCESS: OTP email sent to {receiver_email} (Status: {response.status_code})")
        print(f"[EMAIL_SEND] ✅ OTP email sent successfully to {receiver_email} (Status: {response.status_code})")
        
    except Exception as e:
        email_logger.error(f"❌ SENDGRID ERROR: {str(e)}")
        print(f"❌ [EMAIL_ERROR] SendGrid Error: {e}")
        import traceback
        traceback.print_exc()

def send_otp_email(receiver_email, otp):
    import os
    try:
        # Get SendGrid API key from environment
        sendgrid_api_key = os.environ.get("SENDGRID_API_KEY", "").strip()
        sender_email = os.environ.get("EXPENSE_TRACKER_EMAIL", "").strip()

        # Validate that credentials are set
        if not sendgrid_api_key or not sender_email:
            error_msg = "❌ ERROR: SendGrid credentials not configured in Render environment"
            email_logger.error(error_msg)
            print(error_msg)
            print("   Set SENDGRID_API_KEY and EXPENSE_TRACKER_EMAIL in Render dashboard")
            print("   Get your SendGrid API key from: https://app.sendgrid.com/settings/api_keys")
            return False
        
        email_logger.info(f"Starting OTP email send for {receiver_email}")

        # Send email in background thread to avoid request timeout
        email_thread = threading.Thread(
            target=_send_email_background,
            args=(receiver_email, otp, sender_email, sendgrid_api_key),
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