import os
from google import genai
from google.genai.errors import ClientError

# Model fallback order (cheap → strong)
MODEL_PRIORITY = [
    "gemini-2.5-flash-lite",
]

def get_client():
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def article_conversation(article_text: str, user_question: str) -> str:
    client = get_client()
    if not os.getenv("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY is not set in environment variables.")

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
            print(f"DEBUG: Trying Gemini model: {model}")
            response = client.models.generate_content(
                model=model,
                contents=prompt
            )
            return response.text

        except Exception as e:
            last_error = e
            error_msg = str(e).lower()
            print(f"DEBUG: Model {model} failed with error: {error_msg}")

            # If it's an API Key error, we should stop immediately and tell the user
            if "api_key_invalid" in error_msg or "invalid api key" in error_msg or "401" in error_msg:
                 raise RuntimeError(f"Invalid Gemini API Key. Please check your .env file. Details: {error_msg}")

            # Quota / To many request / rate   → try next model
            RETRY_ERRORS = ("quota","429","not found", "limit")

            if any(keyword in error_msg for keyword in RETRY_ERRORS):
                print(f"DEBUG: Potentially a quota/limit issue with {model}, trying next...")
                continue

            # Any other error → stop immediately
            raise

    # If all models fail
    raise RuntimeError("All Gemini models exhausted") from last_error

def compare_careers(career1: str, career2: str) -> str:
    client = get_client()
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
            print(f"DEBUG: Trying Gemini model: {model} (comparison)")
            response = client.models.generate_content(
                model=model,
                contents=prompt
            )
            return response.text
        except Exception as e:
            last_error = e
            error_msg = str(e).lower()
            print(f"DEBUG: Model {model} (comparison) failed: {error_msg}")
            
            if any(keyword in error_msg for keyword in ("quota", "429", "not found", "limit")):
                print(f"DEBUG: Potentially a quota/limit issue with {model}, trying next...")
                continue
            raise
    
    raise RuntimeError("All Gemini models exhausted") from last_error

def general_conversation(user_question: str) -> tuple[str, bool]:
    client = get_client()
    if not os.getenv("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY is not set in environment variables.")

    context_text = "No specific news context found."
    used_context = False
    
    try:
        from news.services.qdrant_service import QdrantService
        qdrant = QdrantService()
        results = qdrant.search_similar(user_question, limit=3)
        if results:
            context_text = "\n\n".join([
                f"- {r.payload['title']}: {r.payload['snippet']}..." 
                for r in results
            ])
            used_context = True
    except Exception as e:
        print(f"DEBUG: Qdrant service unavailable or search failed: {e}")
        # used_context remains False, context_text remains default

    prompt = f"""
    You are a professional Job Market & Career Assistant for the "Job Market Trend Hub".
    
    CRITICAL INSTRUCTION:
    - You MUST only provide information related to the Job Market, Careers, Employment, Skills, and Economic trends.
    - If the user asks something unrelated to these topics, politely decline and steer them back to job market topics.
    - Use your training data AND the provided CURRENT CONTEXT to give accurate advice.
    
    Your goal is to:
    - Help users with career advice, interview preparation, and skill development
    - Provide insights into job market trends and salary expectations
    - Explain complex economic concepts in simple terms
    - Maintain a professional, encouraging, and helpful tone
    - Use emojis to keep it engaging
    - Keep responses clear, concise, and easy to read
    
    RETRIEVED CONTEXT (Current Job Market News):
    {context_text}

    User Question: {user_question}

    Provide a helpful and detailed response to guide the user, incorporating the relevant context provided above if applicable.
    """

    last_error = None
    for model in MODEL_PRIORITY:
        try:
            print(f"DEBUG: Trying Gemini model: {model} (general chat)")
            response = client.models.generate_content(
                model=model,
                contents=prompt
            )
            return response.text, used_context
        except Exception as e:
            last_error = e
            error_msg = str(e).lower()
            print(f"DEBUG: Model {model} (general chat) failed: {error_msg}")
            
            if "api_key_invalid" in error_msg or "invalid api key" in error_msg or "401" in error_msg:
                 raise RuntimeError(f"Invalid Gemini API Key. Details: {error_msg}")

            if any(keyword in error_msg for keyword in ("quota", "429", "not found", "limit")):
                continue
            raise
    
    raise RuntimeError("All Gemini models exhausted") from last_error
