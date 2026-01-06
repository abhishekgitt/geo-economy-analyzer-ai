
#Local LLM Prompt
def build_prompt(text: str) -> str:
    """
    Strict structured prompt for geo-economic analysis.
    """
    return f"""
You are a senior economic and geopolitical analyst.

Summarize the news in this order and format.
Plain English only. Include bullet points at last.

Structure:
Explanation of the article in a simple words.
Don't tell how you going to explain it.
If news contains negative or positive effect on the economy explain which are the sectors may have effect.
Tell Estimated percentage impact on stocks and job market\\layoffs impact from this article.
How this news affects the country's economic growth (percentage estimate), Explain why and how country's economy will change.
Estimate Trajectory of layoffs going to happen.
What are the safer stocks to invest in the situation.

Rules:
No greetings
No next question recommendations
Can be longer
Keep simpler Explanation

News article:
{text}
"""