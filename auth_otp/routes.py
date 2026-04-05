from flask import Blueprint, render_template, request, redirect, url_for, flash, session
import bcrypt


from .otp_utils import generate_otp, send_otp_email, store_otp, verify_otp, clear_otp

# --- MongoDB injection ---
mongo = None
def set_mongo(mongo_instance):
    global mongo
    mongo = mongo_instance

otp_blueprint = Blueprint('otp', __name__, template_folder='templates')


# 🔹 Forgot Password
@otp_blueprint.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email').lower()

        user = mongo.db.users.find_one({"email": email})

        if not user:
            flash('Email not found.', 'danger')
            return render_template('forgot_password.html')

        otp = generate_otp()
        store_otp(email, otp)

        try:
            send_otp_email(email, otp)
            flash('OTP sent to your email.', 'success')
            return redirect(url_for('otp.verify_otp_route'))

        except Exception:
            flash('Failed to send OTP. Try again later.', 'danger')

    return render_template('forgot_password.html')


# 🔹 Verify OTP
@otp_blueprint.route('/verify-otp', methods=['GET', 'POST'])
def verify_otp_route():
    if 'otp_data' not in session:
        return redirect(url_for('otp.forgot_password'))

    if request.method == 'POST':
        user_otp = request.form.get('otp')

        valid, msg = verify_otp(user_otp)

        if valid:
            flash('OTP verified. Reset your password.', 'success')
            return redirect(url_for('otp.reset_password'))

        else:
            flash(msg, 'danger')

            if "expired" in msg or "Maximum" in msg:
                clear_otp()
                return redirect(url_for('otp.forgot_password'))

    return render_template('verify_otp.html')


# 🔹 Reset Password
@otp_blueprint.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    if 'otp_data' not in session:
        return redirect(url_for('otp.forgot_password'))

    email = session['otp_data']['email']

    if request.method == 'POST':
        password = request.form.get('password')
        confirm = request.form.get('confirm_password')

        if not password or not confirm:
            flash('Please fill all fields.', 'danger')
            return render_template('reset_password.html')

        if password != confirm:
            flash('Passwords do not match.', 'danger')
            return render_template('reset_password.html')


        # Hash password and store as string
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        print(f"[DEBUG] Resetting password for {email}, new hash: {hashed_pw}")
        result = mongo.db.users.update_one(
            {"email": email.lower()},
            {"$set": {"password": hashed_pw}}
        )
        print(f"[DEBUG] MongoDB update result: matched={result.matched_count}, modified={result.modified_count}")

        clear_otp()
        flash('Password reset successful. Please login.', 'success')

        return redirect(url_for('login'))  # make sure this route exists

    return render_template('reset_password.html')