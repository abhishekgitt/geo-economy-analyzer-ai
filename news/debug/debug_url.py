import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# We need a token because it's [IsAuthenticated]
# Let's try to login first or just use a dummy one if we can't
# But if we get 401/403 it means the URL is working!
# If we get 404, the URL is NOT working.

url = "http://127.0.0.1:8000/api/general-chat/"
print(f"Testing URL: {url}")

try:
    # Testing OPTIONS
    res_opt = requests.options(url)
    print(f"OPTIONS Status: {res_opt.status_code}")
    print(f"Allow Headers: {res_opt.headers.get('Allow')}")

    # Testing POST
    res_post = requests.post(url, json={"question": "hello"})
    print(f"POST Status: {res_post.status_code}")
    if res_post.status_code == 404:
        print("Response Content (first 100 bytes):")
        print(res_post.text[:500])
except Exception as e:
    print(f"Error: {e}")
