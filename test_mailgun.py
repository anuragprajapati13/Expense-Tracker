#!/usr/bin/env python3
"""
Test script to verify Mailgun API credentials and functionality
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

mailgun_domain = os.environ.get("MAILGUN_DOMAIN", "").strip()
mailgun_api_key = os.environ.get("MAILGUN_API_KEY", "").strip()

print("=" * 60)
print("MAILGUN CREDENTIALS TEST")
print("=" * 60)
print(f"Domain: {mailgun_domain}")
print(f"API Key: {mailgun_api_key[:20]}... (showing first 20 chars)")
print()

if not mailgun_domain or not mailgun_api_key:
    print("❌ ERROR: Mailgun credentials not found in .env")
    exit(1)

# Test the API connection
print("Testing Mailgun API connection...")
print("-" * 60)

url = f"https://api.mailgun.net/v3/{mailgun_domain}/messages"
auth = ("api", mailgun_api_key)
data = {
    "from": f"Test <postmaster@{mailgun_domain}>",
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test email"
}

try:
    response = requests.post(url, auth=auth, data=data, timeout=10)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    print()
    
    if response.status_code == 200:
        print("✅ SUCCESS: Mailgun API is working!")
        print("   Your credentials are valid.")
    elif response.status_code == 401:
        print("❌ ERROR 401: Authentication failed")
        print("   - Check if API key is correct")
        print("   - Check if domain is correct")
        print("   - Make sure they're from the SAME Mailgun account")
    else:
        print(f"❌ ERROR {response.status_code}: {response.text}")
        
except Exception as e:
    print(f"❌ ERROR: {e}")
    print("   Could not connect to Mailgun API")

print("-" * 60)
