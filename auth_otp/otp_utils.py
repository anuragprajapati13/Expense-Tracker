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
        # Set your new email and app password here, or use environment variables for security
        sender_email = os.environ.get("EXPENSE_TRACKER_EMAIL", "trackerexpense.auth@gmail.com")
        app_password = os.environ.get("EXPENSE_TRACKER_EMAIL_PASS", "bttm mpky dsvy zqzn")

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, app_password)

        message = f"""Subject: Your ExpenseTracker OTP\n\nHello,\n\nYour One-Time Password (OTP) for password reset is:\n\n    {otp}\n\nThis OTP is valid for 5 minutes. If you did not request this, please ignore this email.\n\nRegards,\nExpenseTracker Team"""
        server.sendmail(sender_email, receiver_email, message)
        server.quit()
        return True
    except Exception as e:
        print("EMAIL ERROR:", e)
        return False