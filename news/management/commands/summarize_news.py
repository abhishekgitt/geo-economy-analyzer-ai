import os
import requests
from django.core.management.base import BaseCommand
from django.utils import timezone

from news.models import SummaryPage



# Number of database rows loaded into memory at a time
CHUNK_SIZE = int(os.getenv("AI_SUMMARY_DB_CHUNK_SIZE", 3))




def word_count(text: str) -> int:
    """Return number of words in text"""
    # split() - split words in a list : and return the count 
    return len(text.split()) if text else 0




# Ollama config
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "llama3.1:8b"

# Wait maximum 5 minutes for response generation for saving to db
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT","600"))

def generate_summary(text: str) -> str:
    payload = {
        "model": MODEL_NAME,
        "prompt": build_prompt(text),
        "stream": False,
        "options": {
            "temperature": 0.3,
            "top_p": 0.9
        }
    }

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=REQUEST_TIMEOUT
    )

    response.raise_for_status()
    return (response.json().get("response") or "").strip()


#Local LLM Prompt
def build_prompt(text: str) -> str:
    """
    Strict structured prompt for Job Market Trend analysis.
    """
    return f"""
You are a Senior Job Market Analyst.

TASK:
Convert the given news information into a well-structured MARKDOWN article focusing on employment trends, skills, and workforce dynamics.

STEP 1 – CLASSIFICATION:
First, identify the news category from this list:
- Remote Work
- Layoffs & Hiring
- Emerging Skills
- Wage & Policy
- Future of Work
- Education & Training
- General Market

STEP 2 – FORMAT:
Based on the category, choose the correct MARKDOWN TEMPLATE below
and generate the article.

STRICT RULES:
- Output ONLY Markdown
- Do NOT explain your steps
- Do NOT mention the category explicitly
- **Start with a single BOLDED sentence: "**Bottom Line:** <essence of the news>"**
- Use emojis where appropriate
- Use clear headings, bold text, bullet points, and blockquotes
- Keep tone professional and neutral
- Keep the response language english

--------------------------------------------------

### TEMPLATE: REMOTE WORK

# 🏠 <Headline>

**📍 Region/Focus:** <region/sector>
**📅 Date:** <date>

**Bottom Line:** <one sentence summary>

---

## 💻 Work Mode Shifts
<details on hybrid/remote/RTO attributes>

---

## 📊 Adoption Stats
- <stat>
- <stat>

---

## 🧠 Impact on Talent
<analysis of how this affects workers>

---

## 🔮 Future Outlook
<trend prediction>

--------------------------------------------------

### TEMPLATE: LAYOFFS & HIRING

# 📉 <Headline>

**🏢 Company/Sector:** <name>
**📅 Date:** <date>

**Bottom Line:** <one sentence summary>

---

## 🚨 The Situation
<details on the event>

---

## 📉 Impact & Numbers
- <number affected>
- <departments involved>

---

## 🔍 Context & Reasons
<why is this happening>

---

## ⏭️ Market Implication
<what this means for job seekers>

--------------------------------------------------

### TEMPLATE: EMERGING SKILLS

# 🚀 <Headline>

**🛠️ Skill/Tech:** <name>
**📅 Date:** <date>

**Bottom Line:** <one sentence summary>

---

## 🌟 Why It's Hot
<explanation>

---

## 📈 Demand Growth
- <stat> or <job counting data>

---

## 🎓 Learning Path
<how to acquire this skill>

---

## 💼 Who is Hiring?
<industries or role types>

--------------------------------------------------

### TEMPLATE: WAGE & POLICY

# 💰 <Headline>

**🏛️ Jurisdiction/Sector:** <name>
**📅 Date:** <date>

**Bottom Line:** <one sentence summary>

---

## 📜 The Change
<rule or trend details>

---

## 💵 Financial Impact
<salary details>

---

## 👥 Who Benefits?
<analysis>

--------------------------------------------------

### TEMPLATE: FUTURE OF WORK

# 🤖 <Headline>

**🔬 Trend:** <trend name>
**📅 Date:** <date>

**Bottom Line:** <one sentence summary>

---

## 🌐 The Big Shift
<concept explanation>

---

## ⚙️ Automation & AI
<role of tech>

---

## 🔮 2026 & Beyond
<long term prediction>

--------------------------------------------------

### TEMPLATE: GENERAL MARKET

# 📊 <Headline>

**📍 Focus:** <topic>
**📅 Date:** <date>

**Bottom Line:** <one sentence summary>

---

## 📝 Key Takeaways
- <point>
- <point>

---

## 🧠 Analyst Insight
<professional opinion>

--------------------------------------------------

INPUT NEWS:
<PASTE RAW NEWS HERE>

NOW GENERATE THE MARKDOWN ARTICLE.


{text}
"""



class Command(BaseCommand):
    help = "Generate AI summaries using local LLM"

    def handle(self, *args, **options):
        self.stdout.write(" ---> Starting AI summarization...")

        # Select those summarized_at column where __isnull, and select related article.
        pending_qs = SummaryPage.objects.filter(
            summarized_at__isnull=True
        ).select_related("article")

        # Check at least one article without ai summary exists, if not return
        if not pending_qs.exists():
            self.stdout.write(self.style.SUCCESS(" No pending articles."))
            return

        for summary_page in pending_qs.iterator(CHUNK_SIZE):
            article = summary_page.article
            text = (article.snippet or "").strip()

            # -----> Skip articles with less than 300 WORDS 
            if word_count(text) < 300:
                self.stdout.write(
                    self.style.WARNING(
                        f" SKIPPED (short article, {word_count(text)} words): "
                        f"{article.title[:80]}"
                    )
                )
                continue



            try:
                self.stdout.write(f"{MODEL_NAME} --- Processing: {article.title[:80]}")

                ai_summary = generate_summary(text)

                if not ai_summary:
                    raise ValueError("Empty AI response")
                #loopvar.field
                summary_page.ai_summary = ai_summary
                summary_page.summarized_at = timezone.now()
                summary_page.model_version = MODEL_NAME
                summary_page.confidence = 0.85
                summary_page.save()

                self.stdout.write(self.style.SUCCESS("✔ Summary saved"))

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f" AI failed, skipping article: {str(e)}")
                )
                continue

        self.stdout.write(self.style.SUCCESS("AI summarization completed."))
