import os

import requests
from bs4 import BeautifulSoup

import time
from django.utils import timezone
from dateutil import parser


from django.utils.text import slugify
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from news.models import Article, SummaryPage, Topic

from django.core.management.base import BaseCommand

from news.services.qdrant_service import QdrantService




GDELT_BASE = os.getenv("GDELT_BASE", "https://api.gdeltproject.org/api/v2/doc/doc")
GDELT_MAX = int(os.getenv("GDELT_MAX_RECORDS", "50"))
TOP_N = int(os.getenv("TOP_N", "20"))
FETCH_INTERVAL = int(os.getenv("FETCH_MIN_INTERVAL_SECONDS", "3"))
ARTICLE_FETCH_TIMEOUT = int(os.getenv("ARTICLE_FETCH_TIMEOUT", "200"))
ARTICLE_FETCH_PAUSE = float(os.getenv("ARTICLE_FETCH_PAUSE_SECONDS", "0.6"))
MIN_ARTICLE_LENGTH = int(os.getenv("MIN_ARTICLE_LENGTH", 300))

# language control
FETCH_LANGUAGE = os.getenv("FETCH_LANGUAGE", "en")  # "en" or "all"

# Keywords (Job Market Focus)
ECON_KEYWORDS = os.getenv(
    "ECON_KEYWORDS",
    "mass layoffs, layoffs, job cuts, workforce reduction, staff reduction, downsizing, restructuring, employee termination, hiring surge, mass hiring, recruitment drive, job openings, hiring freeze, talent acquisition, expanding workforce, unemployment, rising unemployment, labor shortage, talent shortage, job market slowdown, tech layoffs, manufacturing layoffs, corporate layoffs, hiring boom"
)
ECON_KEYWORDS = [k.strip() for k in ECON_KEYWORDS.split(",") if k.strip()]

USER_AGENT = os.getenv(
    "FETCH_USER_AGENT",
    "geo-econ-fetcher/1.0 (+https://example.com)"
)




try:
    from newspaper import Article as NewspaperArticle
    HAVE_NEWSPAPER = True
except Exception:
    HAVE_NEWSPAPER = False

try:
    import trafilatura
    HAVE_TRAFILATURA = True
except Exception:
    HAVE_TRAFILATURA = False


def fetch_full_text(url, timeout=ARTICLE_FETCH_TIMEOUT):
    """
    Try several extractors to get full article text.
    """
    if not url or not url.startswith("http"):
        return ""

    headers = {"User-Agent": USER_AGENT}

    # 1) newspaper3k
    if HAVE_NEWSPAPER:
        try:
            art = NewspaperArticle(url, language="en")
            art.download()
            art.parse()
            text = (art.text or "").strip()
            if word_count(text) >= 100:
                return text
        except Exception:
            pass

    # 2) trafilatura
    if HAVE_TRAFILATURA:
        try:
            downloaded = trafilatura.fetch_url(url, timeout=timeout)
            if downloaded:
                text = trafilatura.extract(downloaded)
                if word_count(text) >= 100:
                    return text.strip()
        except Exception:
            pass

    # 3) BeautifulSoup fallback
    try:
        resp = requests.get(url, timeout=timeout, headers=headers)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        article_tag = soup.find("article")
        if article_tag:
            txt = "\n\n".join(
                p.get_text(" ", strip=True)
                for p in article_tag.find_all("p")
            )
            if word_count(txt) >= 100:
                return txt.strip()
    except Exception:
        pass

    return ""


def chunk_list(lst, n):
    """Yield successive n-sized chunks from lst."""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

def fetch_articles():
    """Fetch raw articles from GDELT, handling query length limits by chunking"""
    all_articles = []
    seen_urls = set()
    
    # Split keywords into chunks of 5 to avoid timeouts or query limits
    keyword_chunks = list(chunk_list(ECON_KEYWORDS, 5))
    
    # Divide max records by number of chunks to keep total roughly same (or just fetch max per chunk?)
    # Let's fetch a portion per chunk to avoid fetching too many duplicates, 
    # but GDELT sorts by relevance/date so we want top from each topic group.
    # We'll fetch GDELT_MAX for each chunk and then deduplicate/rank later.
    
    for chunk in keyword_chunks:
        if not chunk: 
            continue
            
        @retry(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=1, min=4, max=10),
            retry=retry_if_exception_type(requests.exceptions.RequestException)
        )
        def _fetch_chunk(chunk):
            params = {
                "query": build_gdelt_query(chunk),
                "mode": "artlist",
                "format": "json",
                "maxrecords": str(GDELT_MAX),
            }

            if FETCH_LANGUAGE != "all":
                params["sourcelang"] = FETCH_LANGUAGE

            resp = requests.get(
                GDELT_BASE,
                params=params,
                timeout=30,
                headers={"User-Agent": USER_AGENT},
            )
            resp.raise_for_status()
            return resp.json()

        try:
            data = _fetch_chunk(chunk)
            raw_list = data.get("articles") or data.get("artlist") or []
            
            for a in raw_list:
                norm = normalize_article(a)
                if norm['url'] not in seen_urls:
                    all_articles.append(norm)
                    seen_urls.add(norm['url'])
            
            # Add delay between chunks to respect rate limits
            if len(keyword_chunks) > 1:
                time.sleep(FETCH_INTERVAL)
                    
        except Exception as e:
            print(f"Error fetching chunk {chunk} after retries: {e}")
            continue

    return all_articles





def rank_articles(articles):
    """
    Rank articles by snippet quality
    """
    ranked = []

    for a in articles:
        combined = (a["title"] + " " + a["snippet"]).lower()
        if not any(k in combined for k in ECON_KEYWORDS):
            continue

        ranked.append({
            "data": a,
            "score": word_count(a.get("snippet", ""))
        })

    if not ranked:
        ranked = [
            {"data": a, "score": word_count(a.get("snippet", ""))}
            for a in articles
        ]

    ranked.sort(key=lambda x: x["score"], reverse=True)

    return [r["data"] for r in ranked[:TOP_N]]




def word_count(text: str) -> int:
    """Returns number of words in text"""
    return len(text.split()) if text else 0






def build_gdelt_query(keywords):
    """
    Converts them into a GDELT-style search query
    eg: ("inflation" OR "oil prices" OR "trade war")
    """
    # Wrap each keyword in quotes to handle multi-word phrases correctly
    q = " OR ".join(f'"{k}"' for k in keywords)
    return f"({q})"


def normalize_article(a: dict):
    """
    Normalize raw article from GDELT
    """
    return {
        "title": a.get("title") or a.get("titleplain") or "",
        "url": a.get("url") or a.get("urlapi") or "",
        "snippet": a.get("snippet") or a.get("description") or "",
        "published_at_raw": a.get("seendate") or a.get("publishdate") or a.get("pubDate"),
        "source": a.get("domain") or a.get("source") or "gdelt",
    }


def parse_published_at(raw):
    """Parse date safely"""
    if not raw:
        return None
    try:
        dt = parser.parse(raw)
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone.utc)
        return dt
    except Exception:
        return None




def assign_topics(article, text):
    """
    Attach Topic objects to an article based on keyword matching.
    """
    text = text.lower()
    assigned = []

    for keyword in ECON_KEYWORDS:
        if keyword.lower() in text:
            topic, created = Topic.objects.get_or_create(
                name=keyword,
                defaults={'slug': slugify(keyword)}
            )
            article.topics.add(topic)
            assigned.append(topic.name)
    
    return assigned






def save_articles(articles, stdout):
    qdrant = QdrantService()
    try:
        qdrant.ensure_collection()
    except Exception as e:
        stdout.write(f"Warning: Could not connect to Qdrant: {e}")
        # We continue even if Qdrant fails, so we don't block DB saving
        qdrant = None

    saved = 0
    seen = set()

    for item in articles:
        url = item.get("url")
        if not url or url in seen:
            continue
        seen.add(url)

        title = (item.get("title") or "")[:300]
        snippet = (item.get("snippet") or "").strip()
        published_at = parse_published_at(item.get("published_at_raw"))

        # Try fetching full content if snippet is too short
        if word_count(snippet) < MIN_ARTICLE_LENGTH:
            fetched = fetch_full_text(url)
            if word_count(fetched) >= MIN_ARTICLE_LENGTH:
                snippet = fetched
            time.sleep(ARTICLE_FETCH_PAUSE)

        # Skip low-quality articles
        if word_count(snippet) < MIN_ARTICLE_LENGTH:
            stdout.write(
                f" SKIPPED (low quality {word_count(snippet)} words): {title[:80]}"
            )
            continue

        # Save / update Article
        article_obj, created = Article.objects.update_or_create(
            url=url,
            defaults={
                "source": item.get("source") or "gdelt",
                "title": title,
                "snippet": snippet,
                "published_at": published_at,
            }
        )

        # ASSIGN TOPICS HERE (CRITICAL FIX)
        combined_text = f"{article_obj.title} {article_obj.snippet}"
        assign_topics(article_obj, combined_text)

        # Create / update SummaryPage
        SummaryPage.objects.update_or_create(
            article=article_obj,
            defaults={
                "hero_image": "http://127.0.0.1:8000/static/news/llama-logo.png",
                "short_preview": snippet[:200],
                "ai_summary": snippet,
                "summarized_at": None,
                "model_version": "",
                "confidence": None,
            }
        )

        if created:
            saved += 1
            if qdrant:
                try:
                    qdrant.upsert_article(article_obj)
                except Exception as e:
                    stdout.write(f"Failed to index article {article_obj.id}: {e}")

    return saved





class Command(BaseCommand):
    help = "Fetch top economic news and save to DB"

    def handle(self, *args, **options):
        self.stdout.write("Fetching articles from GDELT...")

        articles = fetch_articles()
        ranked = rank_articles(articles)
        saved = save_articles(ranked, self.stdout)

        self.stdout.write(
            self.style.SUCCESS(f"Fetch complete — saved {saved} articles.")
        )
