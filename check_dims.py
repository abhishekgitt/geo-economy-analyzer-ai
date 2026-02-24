import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

text = "Debugging vector dimensions for job market news articles."

try:
    result = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text
    )
    vec = result.embeddings[0].values
    print(f"Model: gemini-embedding-001")
    print(f"Vector length: {len(vec)}")
    
    # Try another one
    result4 = client.models.embed_content(
        model="text-embedding-004",
        contents=text
    )
    vec4 = result4.embeddings[0].values
    print(f"Model: text-embedding-004")
    print(f"Vector length: {len(vec4)}")

except Exception as e:
    print(f"Error: {e}")
