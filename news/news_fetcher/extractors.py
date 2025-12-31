import requests
from bs4 import BeautifulSoup

from .config import USER_AGENT, ARTICLE_FETCH_TIMEOUT
from .utils import word_count

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
