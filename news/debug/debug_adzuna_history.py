import os
import requests
from dotenv import load_dotenv
import json

load_dotenv()

def test_history():
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id:
        print("No ADZUNA_APP_ID found")
        return

    country = 'in' 
    url = f"https://api.adzuna.com/v1/api/jobs/{country}/history"
    
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "content-type": "application/json",
        "months": 12,
        "what": "Python" 
    }
    
    print(f"Fetching history from {url}")
    try:
        response = requests.get(url, params=params)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            # print first key-value pair to understand structure
            first_key = list(data.keys())[0]
            print(f"Key example: {first_key}")
            print(f"Value example: {data[first_key]}")
            
            print("Top Level Keys:", list(data.keys()))
            if 'month' in data:
                print("Month data found. Sample:", list(data['month'].items())[:3])
            else:
                print("No 'month' key. keys are:", list(data.keys())[:5])
            
        else:
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_history()
