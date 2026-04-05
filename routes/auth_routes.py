from flask import Blueprint, render_template, request, redirect, url_for, session

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

from flask import flash
import bcrypt
from app import mongo

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email').lower()
        password = request.form.get('password')
        user = mongo.db.users.find_one({'email': email})
        print(f"[DEBUG] Login attempt for email: {email}")
        if user:
            stored_pw = user['password']
            print(f"[DEBUG] Stored password (from DB): {stored_pw}")
            print(f"[DEBUG] Entered password: {password}")
            # Convert stored password string to bytes for bcrypt
            if isinstance(stored_pw, str):
                stored_pw_bytes = stored_pw.encode('utf-8')
            else:
                stored_pw_bytes = bytes(stored_pw)
            if bcrypt.checkpw(password.encode('utf-8'), stored_pw_bytes):
                session['user_id'] = str(user['_id'])
                print("[DEBUG] Login successful!")
                return redirect('/dashboard')
            else:
                print("[DEBUG] Password check failed.")
        else:
            print("[DEBUG] User not found.")
        flash('Invalid email or password. Please try again or register.', 'danger')
    return render_template('auth/login.html')

from datetime import datetime

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email').lower()
        password = request.form.get('password')
        # Hash the password with bcrypt and store as string
        hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_doc = {
            "name": name,
            "email": email,
            "password": hashed_pw,
            "budget": 0,
            "created_at": datetime.now()
        }
        mongo.db.users.insert_one(user_doc)
        print(f"[DEBUG] Registered user {email} with hash: {hashed_pw}")
        return redirect(url_for('auth.login'))
    return render_template('auth/register.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('auth.login'))
