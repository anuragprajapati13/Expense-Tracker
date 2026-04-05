import smtplib
import random
import socket
import threading
import logging
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


# 🔹 Send OTP Email (in background thread to avoid timeout)
def _send_email_background(receiver_email, otp, sender_email, app_password):
    """Background task to send OTP email without blocking request."""
    try:
        email_logger.info(f"[BACKGROUND] Starting email send for {receiver_email}")
        print(f"[EMAIL_SEND] Starting OTP email for {receiver_email}")
        
        # Create socket with 10-second timeout
        socket_timeout = 10
        
        # Connect to Gmail SMTP server with timeout
        email_logger.debug(f"Connecting to Gmail SMTP server...")
        print(f"[EMAIL_SEND] Connecting to Gmail SMTP...")
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=socket_timeout)
        server.starttls()
        
        # Login with sender email and app password
        email_logger.debug(f"Logging in with {sender_email}")
        print(f"[EMAIL_SEND] Logging in to Gmail...")
        server.login(sender_email, app_password)

        # Construct the email message
        message = f"""Subject: Your ExpenseTracker OTP\n\nHello,\n\nYour One-Time Password (OTP) for password reset is:\n\n    {otp}\n\nThis OTP is valid for 5 minutes. If you did not request this, please ignore this email.\n\nRegards,\nExpenseTracker Team"""
        
        # Send the email
        email_logger.debug(f"Sending email message...")
        print(f"[EMAIL_SEND] Sending email...")
        server.sendmail(sender_email, receiver_email, message)
        server.quit()
        
        email_logger.info(f"✅ SUCCESS: OTP email sent to {receiver_email}")
        print(f"[EMAIL_SEND] ✅ OTP email sent successfully to {receiver_email}")
        
    except smtplib.SMTPAuthenticationError as e:
        email_logger.error(f"❌ AUTHENTICATION FAILED: {str(e)}")
        print(f"❌ [EMAIL_ERROR] AUTHENTICATION FAILED - Email: {sender_email}")
        print(f"   Make sure EXPENSE_TRACKER_EMAIL_PASS is a Gmail App Password (not your regular password)")
        print(f"   Error: {e}")
    except socket.timeout:
        email_logger.error(f"❌ SOCKET TIMEOUT: Gmail server took too long")
        print(f"❌ [EMAIL_ERROR] SOCKET TIMEOUT - Gmail server not responding")
    except smtplib.SMTPException as e:
        email_logger.error(f"❌ SMTP ERROR: {str(e)}")
        print(f"❌ [EMAIL_ERROR] SMTP Error: {e}")
    except Exception as e:
        email_logger.error(f"❌ UNEXPECTED ERROR: {str(e)}")
        print(f"❌ [EMAIL_ERROR] Unexpected Error: {e}")
        import traceback
        traceback.print_exc()

def send_otp_email(receiver_email, otp):
    import os
    try:
        # Get email credentials from environment variables (REQUIRED)
        sender_email = os.environ.get("EXPENSE_TRACKER_EMAIL", "").strip()
        app_password = os.environ.get("EXPENSE_TRACKER_EMAIL_PASS", "").strip()

        # Validate that both credentials are set
        if not sender_email or not app_password:
            error_msg = "❌ ERROR: Email credentials not configured in Render environment"
            email_logger.error(error_msg)
            print(error_msg)
            print("   Set EXPENSE_TRACKER_EMAIL and EXPENSE_TRACKER_EMAIL_PASS in Render dashboard")
            return False

        # Remove spaces from app password (in case they were accidentally added)
        app_password = app_password.replace(" ", "")
        
        email_logger.info(f"Starting OTP email send for {receiver_email}")

        # Send email in background thread to avoid request timeout
        # This returns immediately to the user, then sends email asynchronously
        email_thread = threading.Thread(
            target=_send_email_background,
            args=(receiver_email, otp, sender_email, app_password),
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