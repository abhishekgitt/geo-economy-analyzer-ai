import os
from google import genai
from google.genai.errors import ClientError

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Model fallback order (cheap → strong)
MODEL_PRIORITY = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-3-flash",
]

def article_conversation(article_text: str, user_question: str) -> str:

    prompt = f"""
    You are a helpful assistant.

    I will give you a news article written in Markdown.
    Your job is to:

    - Explain the content in simple words
    - Help me understand what happened
    - Answer follow-up questions about the article
    - Keep the tone friendly and conversational
    - Use emojis to make it engaging
    - Keep explanations simple and easy to understand
    - Do NOT rewrite the article
    - Do NOT use heavy Markdown formatting

    Here is the article:
        {article_text}

        This is the User question about the article:
        {user_question}

        Answer in a clear, calm and helpful way.
    """

    last_error = None

    for model in MODEL_PRIORITY:
        
        try:
            print(f"Trying Gemini model: {model}")

            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            # Success 
            return response.text

        except ClientError as e:
            last_error = e
            error_msg = str(e).lower()

            print(f"Model failed: {model}")

            # Quota / To many request / rate   → try next model
            RETRY_ERRORS = ("quota","429","not found")

            if any(keyword in error_msg for keyword in RETRY_ERRORS):
                continue

            # Any other error → stop immediately
            raise

    # If all models fail
    raise RuntimeError("All Gemini models exhausted") from last_error

def compare_careers(career1: str, career2: str) -> str:
    prompt = f"""
    Compare the following two careers: "{career1}" and "{career2}".
    Provide a detailed comparison focusing on:
    - Average Salary
    - Key Skills Required
    - Future Demand
    - Growth Potential
    - Work-Life Balance

    Return the result as a structured JSON object with the following format:
    {{
        "comparison": [
            {{
                "feature": "Average Salary",
                "career1": "value for {career1}",
                "career2": "value for {career2}"
            }},
            ...
        ],
        "summary": "A brief overall summary of which might be better in what scenario."
    }}
    Ensure the output is ONLY the JSON object, NO markdown formatting or extra text.
    """

    last_error = None
    for model in MODEL_PRIORITY:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt
            )
            return response.text
        except ClientError as e:
            last_error = e
            if any(keyword in str(e).lower() for keyword in ("quota", "429", "not found")):
                continue
            raise
    
    raise RuntimeError("All Gemini models exhausted") from last_error
