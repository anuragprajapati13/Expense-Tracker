# Expense Tracker - Production Deployment Guide

## Overview

This Flask application is fully configured for production deployment on [Render](https://render.com/). This guide will walk you through the setup process.

---

## Prerequisites

- **Render Account**: Sign up at https://render.com/
- **MongoDB Atlas Account**: Sign up at https://www.mongodb.com/cloud/atlas
- **Git Repository**: Your code should be pushed to GitHub/GitLab/Bitbucket
- **Gmail Account** (optional): For password reset emails via OTP

---

## Step 1: Set Up MongoDB Atlas

### 1.1 Create a MongoDB Cluster
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a new project and cluster
3. Select "M0 Free" tier (or your preferred tier)
4. Wait for cluster creation (5-10 minutes)

### 1.2 Create a Database User
1. In Atlas, go to **Database Access**
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Create username and password (save these securely)
5. Set up connection IP whitelist (~0.0.0.0 for development, specific IPs for production)

### 1.3 Get Connection String
1. In Atlas, go to **Databases** → **Connect**
2. Choose **Connect your application**
3. Select **Python** and version **3.11 or later**
4. Copy the connection string, which looks like:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster-name.mongodb.net/database-name?appName=appname
   ```
5. Replace `USERNAME`, `PASSWORD`, and `database-name` with your actual values

---

## Step 2: Set Up Gmail for Email Notifications (Optional)

### 2.1 Generate Gmail App Password
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already enabled
3. Go back to Security settings
4. Find **App passwords** (scroll down)
5. Select **Mail** and **Windows Computer**
6. Google will generate a 16-character password
7. Copy this password (use as `EXPENSE_TRACKER_EMAIL_PASS`)

---

## Step 3: Deploy to Render

### 3.1 Push Code to GitHub
```bash
git add .
git commit -m "Production-ready Flask app for Render deployment"
git push origin main
```

### 3.2 Create Render Web Service
1. Go to https://render.com/dashboard
2. Click **New** → **Web Service**
3. Choose your GitHub/GitLab repository
4. Configure the service:
   - **Name**: expense-tracker (or your preferred name)
   - **Environment**: Python 3
   - **Build Command**: 
     ```
     pip install --upgrade pip && pip install -r requirements.txt
     ```
   - **Start Command**: 
     ```
     gunicorn -w 4 -b 0.0.0.0:$PORT wsgi:app
     ```
   - **Plan**: Free (or paid if needed)

### 3.3 Add Environment Variables
1. Scroll down to **Environment** section
2. Click **Add Environment Variable** for each:

| Key | Value |
|-----|-------|
| `FLASK_ENV` | `production` |
| `FLASK_DEBUG` | `False` |
| `SECRET_KEY` | *Generate a secure key (see below)* |
| `MONGO_URI` | *Your MongoDB Atlas connection string* |
| `MONGO_DB_NAME` | `expense_tracker` |
| `EXPENSE_TRACKER_EMAIL` | *Your Gmail address* |
| `EXPENSE_TRACKER_EMAIL_PASS` | *Your Gmail App Password* |
| `PORT` | `5000` |

### 3.4 Generate a Secure SECRET_KEY

Run this command locally:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and paste it as your `SECRET_KEY` environment variable.

### 3.5 Deploy
1. Click **Deploy** button
2. Wait for deployment to complete (3-5 minutes)
3. Once deployed, get your app URL from Render dashboard

---

## Step 4: Post-Deployment Verification

### 4.1 Test Your Deployment
1. Visit your app URL: `https://your-app-name.onrender.com`
2. Try to log in (create an account if needed)
3. Test the reports page
4. Test password reset (if email is configured)

### 4.2 Monitor Logs
1. In Render dashboard, select your service
2. Go to **Logs** tab
3. Check for any errors or warnings

### 4.3 Test MongoDB Connection
1. Log in and add an expense
2. Go to Reports page
3. Verify data is saved and displayed correctly

---

## Production Configuration Details

### Environment Variables Explained

- **FLASK_ENV**: Set to `production` to disable debug mode
- **FLASK_DEBUG**: Must be `False` in production
- **SECRET_KEY**: Random secure key for session encryption (changes break active sessions)
- **MONGO_URI**: MongoDB Atlas connection string with credentials
- **MONGO_DB_NAME**: Database name (default: `expense_tracker`)
- **EXPENSE_TRACKER_EMAIL**: Gmail account for sending OTP emails
- **EXPENSE_TRACKER_EMAIL_PASS**: Gmail App Password (not your actual password)
- **PORT**: Server port (Render manages this automatically)

### Files Description

| File | Purpose |
|------|---------|
| `app.py` | Main Flask application with all routes |
| `wsgi.py` | WSGI entry point for gunicorn |
| `Procfile` | Tells Render how to run the app |
| `requirements.txt` | Python dependencies |
| `runtime.txt` | Specifies Python version (3.11.8) |
| `.env.example` | Template for environment variables (safe to commit) |
| `.env` | Actual environment variables (DO NOT COMMIT) |
| `.gitignore` | Prevents sensitive files from being committed |

---

## Troubleshooting

### App Won't Start
**Problem**: `ModuleNotFoundError: No module named 'flask'`
- **Solution**: Ensure `requirements.txt` is up-to-date and Render rebuild command is correct

### MongoDB Connection Error
**Problem**: `pymongo.errors.ConfigurationError: The DNS query name does not exist`
- **Solution**: Update `MONGO_URI` environment variable with valid MongoDB Atlas credentials

### Password Reset Emails Not Sending
**Problem**: OTP emails not received
- **Solution**:
  1. Verify `EXPENSE_TRACKER_EMAIL` is correct Gmail address
  2. Verify `EXPENSE_TRACKER_EMAIL_PASS` is the Gmail App Password (not regular password)
  3. Check Render logs for SMTP errors: `MAIL ERROR:`
  4. Ensure Gmail account has 2-Factor Authentication enabled

### Port Already in Use
**Problem**: `Address already in use` error
- **Solution**: Render automatically manages ports; this shouldn't happen in production

### Secret Key Change Breaks Sessions
**Problem**: All users logged out after SECRET_KEY change
- **Solution**: Expected behavior; users need to log in again after key rotation
- **Prevention**: Never change SECRET_KEY after deployment unless necessary

---

## Security Best Practices

1. ✅ **Environment Variables**: All credentials are in `.env` (not in code)
2. ✅ **Debug Mode**: Disabled in production (`FLASK_DEBUG=False`)
3. ✅ **HTTPS**: Render provides free SSL/TLS certificates
4. ✅ **Secure Cookies**: Session cookies are httponly and secure
5. ✅ **Password Hashing**: Passwords hashed with bcrypt
6. ✅ **No Hardcoded Secrets**: All sensitive data uses environment variables

### Additional Security Recommendations

1. **Change MongoDB Whitelist IP**: Instead of `0.0.0.0`, use Render's IP address
   - Found in Render dashboard → Settings → IP Whitelist

2. **Enable MongoDB IP Access Restriction**: 
   - Go to MongoDB Atlas → Security → Network Access
   - Add only Render's IP address

3. **Rotate Credentials Regularly**:
   - Update `SECRET_KEY` monthly
   - Rotate MongoDB password quarterly

4. **Enable HTTPS Only**: Add to `app.py`:
   ```python
   @app.after_request
   def enforce_https(response):
       response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
       return response
   ```

---

## Scaling & Performance

### For Free Tier
- Works well for up to ~100 concurrent users
- Monitor Render logs for memory usage

### To Scale Up
1. Upgrade Render plan to Starter or Standard
2. Enable auto-scaling if using Professional plan
3. Add database indexes in MongoDB:
   ```python
   mongo.db.expenses.create_index([("user_id", 1), ("date", -1)])
   mongo.db.users.create_index([("email", 1)])
   ```

### Monitor Performance
- Render Dashboard → Metrics tab
- Check CPU, Memory, and Network usage
- MongoDB Atlas → Metrics tab for database performance

---

## Local Development

### Setup Local Environment
```bash
# Clone repository
git clone <your-repo-url>
cd expense_tracker

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate
# Or (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy .env.example to .env
cp .env.example .env

# Edit .env with local values (optional - can use local MongoDB)
# For local MongoDB, set:
# FLASK_ENV=development
# FLASK_DEBUG=True
# MONGO_URI=mongodb://localhost:27017/expense_tracker

# Run locally
python app.py
# Or with gunicorn:
gunicorn -w 4 -b 127.0.0.1:5000 wsgi:app
```

---

## Useful Commands

### View Production Logs
```bash
# Via Render Dashboard or using API
curl https://api.render.com/v1/services/<service-id>/events \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### Rebuild and Deploy
1. Render auto-redeploys on git push
2. To manually redeploy: Render Dashboard → Manual Deploy

### SSH into Running Service
```bash
#Render doesn't provide direct SSH, but you can use their shell
# Instructions at: https://render.com/docs/ssh
```

---

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Flask Docs**: https://flask.palletsprojects.com/
- **PyMongo Docs**: https://pymongo.readthedocs.io/
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/

---

## Deployment Checklist

- [ ] MongoDB Atlas cluster created and running
- [ ] Database user created with password
- [ ] MongoDB connection string obtained
- [ ] Gmail 2FA enabled (if using email)
- [ ] Gmail App Password generated (if using email)
- [ ] Code pushed to GitHub/GitLab
- [ ] Render account created
- [ ] Web Service created with correct build command
- [ ] All environment variables added in Render dashboard
- [ ] `SECRET_KEY` generated and added
- [ ] `.gitignore` updated to exclude `.env`
- [ ] Deployment successful
- [ ] App URL accessible and working
- [ ] Log in and test creating expense
- [ ] Password reset email test (if configured)
- [ ] Reports page displaying data correctly

---

**Happy Deploying! 🚀**
