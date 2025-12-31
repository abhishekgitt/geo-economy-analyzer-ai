import time
from django.utils import timezone

from news.models import Article, SummaryPage

from .config import MIN_ARTICLE_LENGTH, ARTICLE_FETCH_PAUSE
from .utils import word_count, parse_published_at
from .extractors import fetch_full_text


def save_articles(articles, stdout):
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

        if word_count(snippet) < MIN_ARTICLE_LENGTH:
            fetched = fetch_full_text(url)
            if word_count(fetched) >= MIN_ARTICLE_LENGTH:
                snippet = fetched
            time.sleep(ARTICLE_FETCH_PAUSE)

        if word_count(snippet) < MIN_ARTICLE_LENGTH:
            stdout.write(
                f" SKIPPED (low quality {word_count(snippet)} words): {title[:80]}"
            )
            continue

        article_obj, created = Article.objects.update_or_create(
            url=url,
            defaults={
                "source": item.get("source") or "gdelt",
                "title": title,
                "snippet": snippet,
                "published_at": published_at,
            }
        )

        SummaryPage.objects.update_or_create(
            article=article_obj,
            defaults={
                "hero_image": "",
                "short_preview": snippet[:200],
                "ai_summary": snippet,
                "summarized_at": None,
                "model_version": "",
                "confidence": None,
            }
        )

        if created:
            saved += 1

    return saved
