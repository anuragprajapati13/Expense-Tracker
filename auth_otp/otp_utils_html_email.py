"""
⚠️  DEPRECATED FILE - DO NOT USE
This file is an old implementation using Gmail SMTP.

✅ Use auth_otp/otp_utils.py instead - it uses Mailgun which works reliably on Render.

The current implementation in otp_utils.py:
- Uses Mailgun (works on cloud platforms)
- Background threading to prevent timeouts
- Better error handling and logging
- No hardcoded credentials
"""

from flask import render_template
import os

def send_otp_email(receiver_email, otp, reset_link=None):
    """
    ⚠️  DEPRECATED - Use the implementation in otp_utils.py instead
    
    This uses Mailgun API (current implementation).
    """
    import requests
    import threading
    
    def _send_background():
        try:
            mailgun_domain = os.environ.get("MAILGUN_DOMAIN", "").strip()
            mailgun_api_key = os.environ.get("MAILGUN_API_KEY", "").strip()
            
            if not mailgun_domain or not mailgun_api_key:
                print("❌ ERROR: Mailgun credentials not configured")
                return False
            
            url = f"https://api.mailgun.net/v3/{mailgun_domain}/messages"
            
            # Render HTML template if it exists
            try:
                html_content = render_template(
                    "email_otp_template.html",
                    otp=otp,
                    reset_link=reset_link or "#"
                )
            except:
                # Fallback if template doesn't exist
                html_content = f"""
                <html>
                    <body>
                        <h2>ExpenseTracker - Password Reset</h2>
                        <p>Your OTP: <strong>{otp}</strong></p>
                        <p>Valid for 5 minutes</p>
                    </body>
                </html>
                """
            
            data = {
                "from": f"postmaster@{mailgun_domain}",
                "to": receiver_email,
                "subject": "Your ExpenseTracker OTP",
                "html": html_content
            }
            
            auth = ("api", mailgun_api_key)
            response = requests.post(url, auth=auth, data=data, timeout=10)
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"ERROR sending email: {e}")
            return False
    
    # Send in background thread
    thread = threading.Thread(target=_send_background, daemon=True)
    thread.start()
    return True
