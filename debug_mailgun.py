#!/usr/bin/env python3
"""
Detailed Mailgun API debugging
"""

import os
import requests
from dotenv import load_dotenv

load_dotenv()

mailgun_domain = os.environ.get("MAILGUN_DOMAIN", "").strip()
mailgun_api_key = os.environ.get("MAILGUN_API_KEY", "").strip()

print("=" * 70)
print("MAILGUN DETAILED DEBUG TEST")
print("=" * 70)
print()
print("CREDENTIALS:")
print(f"  Domain: {mailgun_domain}")
print(f"  API Key: {mailgun_api_key}")
print(f"  API Key starts with: {mailgun_api_key[:10] if mailgun_api_key else 'EMPTY'}")
print(f"  API Key length: {len(mailgun_api_key) if mailgun_api_key else 0}")
print()

if not mailgun_domain:
    print("❌ Domain is empty!")
    exit(1)
if not mailgun_api_key:
    print("❌ API Key is empty!")
    exit(1)

# Try the exact format from Mailgun's example
url = f"https://api.mailgun.net/v3/{mailgun_domain}/messages"

print("REQUEST DETAILS:")
print(f"  URL: {url}")
print(f"  Auth User: api")
print(f"  Auth Password: {mailgun_api_key}")
print()

# Test data
data = {
    "from": f"postmaster@{mailgun_domain}",
    "to": "trackerexpense.auth@gmail.com",
    "subject": "Test Email",
    "text": "Test message"
}

print("PAYLOAD:")
for key, value in data.items():
    print(f"  {key}: {value}")
print()

print("MAKING REQUEST...")
print("-" * 70)

try:
    response = requests.post(url, auth=("api", mailgun_api_key), data=data, timeout=10)
    
    print(f"Status: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"Response Text: {response.text}")
    print()
    
    if response.status_code == 200:
        print("✅ SUCCESS!")
    else:
        print(f"❌ ERROR {response.status_code}")
        
except Exception as e:
    print(f"❌ Connection Error: {e}")
    import traceback
    traceback.print_exc()

print("-" * 70)
