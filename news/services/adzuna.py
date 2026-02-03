import os
import requests

def search_adzuna_jobs(query, location=None, country='in', page=1):
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id or not app_key:
        # Fallback to empty results if no keys, or we can use mock data for dev
        return {"results": [], "count": 0, "error": "Adzuna API credentials missing"}

    base_url = f"https://api.adzuna.com/v1/api/jobs/{country}/search/{page}"
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": query,
        "category": "it-jobs",
        "content-type": "application/json"
    }
    
    if location:
        params["where"] = location
        
    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching jobs from Adzuna: {e}")
        return {"results": [], "count": 0, "error": str(e)}
