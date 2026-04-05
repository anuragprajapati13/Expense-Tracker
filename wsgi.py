"""
Production WSGI entry point for gunicorn.
This file is used when deploying to Render or other production servers.

Usage: gunicorn -w 4 -b 0.0.0.0:$PORT wsgi:app
"""

from app import app

if __name__ == "__main__":
    # This is for reference only. Use gunicorn in production.
    app.run()

