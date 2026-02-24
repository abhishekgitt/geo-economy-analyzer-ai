import time
from django.utils import timezone

from news.models import Article, SummaryPage, Topic
from news.news_fetcher.config import (
    MIN_ARTICLE_LENGTH,
    ARTICLE_FETCH_PAUSE,
    ECON_KEYWORDS,
)
from .utils import word_count, parse_published_at
from .extractors import fetch_full_text
from news.services.qdrant_service import QdrantService


def assign_topics(article, text):
    """
    Attach Topic objects to an article based on keyword matching.
    """
    text = text.lower()
    assigned = []

    for keyword in ECON_KEYWORDS:
        if keyword.lower() in text:
            topic = Topic.objects.filter(name__iexact=keyword).first()
            if topic:
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
