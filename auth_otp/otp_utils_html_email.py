from flask import render_template
import smtplib

# ...existing code...

def send_otp_email(receiver_email, otp, reset_link=None):
    try:
        sender_email = "trackerexpense.auth@gmail.com"
        app_password = "bttmmpkydsvyzqzn"   # ⚠️ Use Gmail App Password

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, app_password)

        # Render the HTML email template
        html_content = render_template(
            "auth_otp/templates/email_otp_template.html",
            otp=otp,
            reset_link=reset_link or "#"
        )

        message = f"""MIME-Version: 1.0\nContent-type: text/html; charset=UTF-8\nSubject: OTP Verification\n\n{html_content}"""

        server.sendmail(sender_email, receiver_email, message)
        server.quit()
        return True
    except Exception as e:
        print("EMAIL ERROR:", e)
        raise e
