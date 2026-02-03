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

def get_adzuna_history(query, country='in', months=12):
    app_id = os.getenv("ADZUNA_APP_ID")
    app_key = os.getenv("ADZUNA_APP_KEY")
    
    if not app_id or not app_key:
        return {}

    url = f"https://api.adzuna.com/v1/api/jobs/{country}/history"
    params = {
        "app_id": app_id,
        "app_key": app_key,
        "what": query,
        "months": months,
        "content-type": "application/json"
    }
    
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json().get("month", {})
        return {}
    except:
        return {}

def calculate_growth(history_data):
    if not history_data:
        return "0%"
        
    # Sort dates
    sorted_dates = sorted(history_data.keys())
    if len(sorted_dates) < 2:
        return "0%"
        
    oldest_val = history_data[sorted_dates[0]]
    latest_val = history_data[sorted_dates[-1]]
    
    if oldest_val == 0:
        return "0%"
        
    growth = ((latest_val - oldest_val) / oldest_val) * 100
    sign = "+" if growth >= 0 else ""
    return f"{sign}{int(growth)}%"

def get_trending_stats(country='in'):
    # List of trending/popular job categories to track
    categories = [
        "Python Developer",
        "Data Scientist", 
        "React Developer",
        "Project Manager",
        "Cyber Security",
        "DevOps Engineer",
        "AI Engineer",
        "Marketing Manager"
    ]
    
    stats = []
    
    for cat in categories:
        # Fetch current count
        count = 0
        try:
            data = search_adzuna_jobs(query=cat, country=country, page=1)
            count = data.get("count", 0)
        except:
            count = 0
            
        # Fetch history for growth (Salary Growth as proxy for Demand Trend)
        history = get_adzuna_history(cat, country=country)
        growth = calculate_growth(history)
            
        stats.append({
            "title": cat,
            "count": count,
            "growth": growth
        })
            
    # Sort by count descending
    stats.sort(key=lambda x: x['count'], reverse=True)
    
    return stats
