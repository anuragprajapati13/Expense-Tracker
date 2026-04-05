# Expense Tracker - Project Structure & Configuration

## Project Structure

```
expense_tracker/
├── app.py                          # Main Flask application
├── wsgi.py                         # WSGI entry point for gunicorn
├── requirements.txt                # Python dependencies
├── runtime.txt                     # Python version for Render
├── Procfile                        # Process file for Render deployment
├── .env                            # Environment variables (DO NOT COMMIT)
├── .env.example                    # Template for environment variables
├── .gitignore                      # Git ignore file
│
├── DEPLOYMENT.md                   # Deployment guide for Render
├── README_CONFIG.md                # This file
│
├── auth_otp/                       # OTP authentication module
│   ├── __init__.py
│   ├── models.py
│   ├── routes.py                   # OTP routes (forgot password)
│   ├── otp_utils.py                # OTP generation & email sending
│   ├── otp_utils_html_email.py     # HTML email templates
│   └── templates/
│       ├── email_otp_template.html
│       ├── forgot_password.html
│       ├── reset_password.html
│       └── verify_otp.html
│
├── models/                         # Database models
│   ├── __init__.py
│   └── db_models.py
│
├── routes/                         # Flask blueprints
│   ├── __init__.py
│   ├── auth_routes.py              # Authentication routes
│   └── expense_routes.py           # Expense management routes
│
├── templates/                      # HTML templates
│   ├── auth/
│   │   ├── login.html
│   │   ├── register.html
│   │   └── forgot_password.html
│   ├── components/
│   │   ├── navbar.html
│   │   ├── navbar-interactive.html
│   │   └── sidebar.html
│   └── dashboard/
│       ├── dashboard.html
│       ├── add_expense.html
│       ├── add_bill.html
│       ├── analytics.html
│       ├── calendar.html
│       ├── reports.html
│       ├── billing.html
│       ├── notifications.html
│       ├── settings.html
│       ├── account-settings.html
│       └── profile.html
│
├── static/                         # Static files
│   ├── assets/
│   │   └── images/
│   ├── css/
│   │   ├── global.css
│   │   ├── auth.css
│   │   ├── dashboard.css
│   │   ├── reports.css
│   │   ├── settings.css
│   │   └── [other CSS files]
│   └── js/
│       ├── auth.js
│       ├── dashboard.js
│       ├── theme.js
│       ├── settings.js
│       ├── reports-live.js
│       └── [other JavaScript files]
│
└── instance/                       # Instance folder (local, not in git)
    └── [MongoDB local data if using local DB]
```

---

## Production Configuration

### Environment Variables

All sensitive configuration is managed through environment variables. Set these in Render dashboard:

#### Required Variables

```env
# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=<secure-random-key>

# MongoDB Atlas
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/expense_tracker?appName=expensetracker
MONGO_DB_NAME=expense_tracker

# SMTP for Email
EXPENSE_TRACKER_EMAIL=your-email@gmail.com
EXPENSE_TRACKER_EMAIL_PASS=your-app-password

# Server
PORT=5000
```

#### Optional Variables

```env
# These can be set for enhanced security in production
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE=Strict
```

### Files Not to Commit

- `.env` - Contains sensitive credentials
- `__pycache__/` - Python cache
- `*.pyc` - Python compiled files
- `venv/` or `env/` - Virtual environment
- `instance/` folder - Local database files
- `.DS_Store` - macOS specific
- `*.log` - Log files

The `.gitignore` file already excludes these.

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Flask | 3.1.3 | Web framework |
| Flask-PyMongo | 2.3.0 | MongoDB integration |
| pymongo | 4.6.1 | MongoDB driver |
| bcrypt | 5.0.0 | Password hashing |
| python-dotenv | 1.0.1 | Environment variables |
| gunicorn | 23.0.0 | Production WSGI server |
| Werkzeug | 3.1.2 | Flask utilities |

---

## Production vs Development Configuration

### Debug Mode

**Development**:
```python
FLASK_ENV=development
FLASK_DEBUG=True
```

**Production** (Render):
```python
FLASK_ENV=production
FLASK_DEBUG=False
```

Debug mode in production is a security risk and is explicitly disabled.

### MongoDB Connection

**Development** (Local SQLite/MongoDB):
```python
MONGO_URI=mongodb://localhost:27017/expense_tracker
```

**Production** (MongoDB Atlas):
```python
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

The app automatically detects invalid URIs and provides helpful error messages.

### Secret Key

**Development**: Falls back to `dev-secret-key-change-in-production`

**Production**: Must be explicitly set via `SECRET_KEY` environment variable
- Generated via: `python -c "import secrets; print(secrets.token_hex(32))"`

### Server Configuration

**Development**:
- Host: `127.0.0.1` (localhost only)
- Port: `5000` (or from `PORT` env var)
- WSGI: Flask development server
- Reloader: Enabled for auto-refresh

**Production** (Render):
- Host: `0.0.0.0` (all interfaces)
- Port: From `$PORT` environment variable
- WSGI: gunicorn with 4 workers
- Reloader: Disabled

---

## Security Considerations

### ✅ Implemented

- [x] Passwords hashed with bcrypt
- [x] Session cookies are httponly
- [x] Secret key stored in environment
- [x] MongoDB credentials in environment
- [x] Debug mode disabled in production
- [x] No hardcoded credentials in code
- [x] HTTPS enforced by Render
- [x] CSRF protection via Flask sessions
- [x] Input validation on all forms

### 🔐 Recommendations

1. **Enable Environmental Variable Encryption** (Render Pro feature)
2. **Use IP Whitelist** for MongoDB Atlas access
3. **Rotate Secrets** regularly (monthly minimum)
4. **Monitor Logs** for suspicious activity
5. **Use HTTPS Only** (force redirect from HTTP)
6. **Enable 2FA** on MongoDB Atlas accounts
7. **Backup Database** regularly (automated in Atlas paid plans)

---

## Database

### MongoDB Structure

**Collections**:
- `users` - User accounts and authentication
- `expenses` - Income and expense transactions
- `payment_reminders` - Bill/reminder tracking
- `notifications` - User notifications
- `sessions` - Flask session data (optional)

### Indexes

Recommended indexes for performance:

```python
# In app initialization or migration script:
mongo.db.expenses.create_index([("user_id", 1), ("date", -1)])
mongo.db.expenses.create_index([("category", 1)])
mongo.db.users.create_index([("email", 1)], unique=True)
mongo.db.payment_reminders.create_index([("user_id", 1)])
```

---

## Deployment Files

### Procfile
```
web: gunicorn -w 4 -b 0.0.0.0:$PORT wsgi:app
```
- Tells Render how to start the application
- Uses 4 gunicorn workers for concurrency
- Binds to all interfaces on the PORT variable

### runtime.txt
```
python-3.11.8
```
- Specifies exact Python version for Render
- Ensures consistency between development and production

### requirements.txt
```
Flask==3.1.3
Flask-PyMongo==2.3.0
...
```
- Lists all Python package dependencies with versions
- Installed during Render build step

### wsgi.py
```python
from app import app
# (gunicorn reads this to get the Flask app)
```
- WSGI entry point for gunicorn
- Production servers use this instead of `app.run()`

---

## Deployment Steps

See [**DEPLOYMENT.md**](DEPLOYMENT.md) for complete step-by-step instructions.

Quick summary:
1. Add environment variables to Render
2. Configure build and start commands
3. Push code to GitHub
4. Render auto-deploys on git push

---

## Local Development

### Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env

# Edit .env for local development
```

### Run

```bash
# Development server with auto-reload
python app.py

# Or with gunicorn (simulates production)
gunicorn -w 4 -b 127.0.0.1:5000 wsgi:app
```

### Testing

```bash
# Test if app imports
python -c "from app import app; print('OK')"

# Test MongoDB connection
python -c "from app import mongo; print(mongo.db.users.find_one())"

# Run specific route
python -c "from app import app; app.test_client().get('/')"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'flask'` | Run `pip install -r requirements.txt` |
| `MONGO_URI` error | Check MongoDB URI format and credentials |
| Email not sending | Verify Gmail App Password, not regular password |
| App won't start | Check `SECRET_KEY` is set in environment variables |
| 502 Bad Gateway | Check Render logs for startup errors |
| Sessions lost after deploy | Expected if `SECRET_KEY` changes |

---

## Additional Resources

- **[Render Documentation](https://render.com/docs)** - Deployment platform
- **[MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)** - Database hosting
- **[Flask Documentation](https://flask.palletsprojects.com/)** - Web framework
- **[Gunicorn Documentation](https://docs.gunicorn.org/)** - Production server
- **[Python Security](https://owasp.org/www-project-web-security-testing-guide/)** - Security best practices

---

## Checklist for Production

- [ ] Keep `.env` file locally, never commit it
- [ ] Add `.env` to `.gitignore`
- [ ] All hardcoded credentials removed
- [ ] Environment variables set up in Render
- [ ] `SECRET_KEY` generated and configured
- [ ] MongoDB Atlas credentials verified
- [ ] Email service configured (if using OTP)
- [ ] `FLASK_DEBUG=False` in production
- [ ] `requirements.txt` updated with dependencies
- [ ] Procfile and runtime.txt correct
- [ ] Tests passed locally
- [ ] IP whitelist configured in MongoDB
- [ ] Regular backups enabled
- [ ] Monitoring set up for errors

---

**For deployment questions, see [DEPLOYMENT.md](DEPLOYMENT.md)**
