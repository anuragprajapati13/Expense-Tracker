import smtplib
import random
from datetime import datetime, timedelta
from flask import session

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


# 🔹 Send OTP Email

def send_otp_email(receiver_email, otp):
    import os
    try:
        # Get email credentials from environment variables (REQUIRED)
        sender_email = os.environ.get("EXPENSE_TRACKER_EMAIL", "").strip()
        app_password = os.environ.get("EXPENSE_TRACKER_EMAIL_PASS", "").strip()

        # Validate that both credentials are set
        if not sender_email or not app_password:
            error_msg = "ERROR: Email credentials not configured. Set EXPENSE_TRACKER_EMAIL and EXPENSE_TRACKER_EMAIL_PASS in .env"
            print(error_msg)
            return False

        # Remove spaces from app password (in case they were accidentally added)
        app_password = app_password.replace(" ", "")

        print(f"[DEBUG] Sending OTP to {receiver_email} from {sender_email}")
        
        # Connect to Gmail SMTP server
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        
        # Login with sender email and app password
        print(f"[DEBUG] Logging in to Gmail...")
        server.login(sender_email, app_password)

        # Construct the email message
        message = f"""Subject: Your ExpenseTracker OTP\n\nHello,\n\nYour One-Time Password (OTP) for password reset is:\n\n    {otp}\n\nThis OTP is valid for 5 minutes. If you did not request this, please ignore this email.\n\nRegards,\nExpenseTracker Team"""
        
        # Send the email
        print(f"[DEBUG] Sending email...")
        server.sendmail(sender_email, receiver_email, message)
        server.quit()
        
        print(f"[DEBUG] OTP email sent successfully to {receiver_email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"EMAIL ERROR - Authentication Failed: Check your email/password. Error: {e}")
        return False
    except smtplib.SMTPException as e:
        print(f"EMAIL ERROR - SMTP Error: {e}")
        return False
    except Exception as e:
        print(f"EMAIL ERROR - Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return False