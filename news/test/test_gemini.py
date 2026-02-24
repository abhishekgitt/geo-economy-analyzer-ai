import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("GEMINI_API_KEY")
print(f"API Key found (length {len(key) if key else 0}): {key[:4]}...{key[-4:] if key else ''}")

client = genai.Client(api_key=key)

try:
    print("Listing available models...")
    for m in client.models.list():
        print(f" - {m.name}")

    print("\nTesting gemini-1.5-flash...")
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents="Hello, say 'API works!'"
    )
    print(f"SUCCESS: {response.text}")
except Exception as e:
    print(f"FAILED: {str(e)}")
    print("\nTrying with 'models/' prefix...")
    try:
        response = client.models.generate_content(
            model="models/gemini-1.5-flash",
            contents="Hello, say 'API works!'"
        )
        print(f"SUCCESS (with prefix): {response.text}")
    except Exception as e2:
        print(f"FAILED (with prefix): {str(e2)}")
