import requests

from .config import (
    GDELT_BASE, GDELT_MAX, FETCH_LANGUAGE, USER_AGENT, ECON_KEYWORDS
)
from .utils import build_gdelt_query, normalize_article


def fetch_articles():
    """Fetch raw articles from GDELT"""
    params = {
        "query": build_gdelt_query(ECON_KEYWORDS),
        "mode": "artlist",
        "format": "json",
        "maxrecords": str(GDELT_MAX),
    }

    if FETCH_LANGUAGE != "all":
        params["sourcelang"] = FETCH_LANGUAGE

    resp = requests.get(
        GDELT_BASE,
        params=params,
        timeout=20,
        headers={"User-Agent": USER_AGENT},
    )
    resp.raise_for_status()

    data = resp.json()
    raw_list = data.get("articles") or data.get("artlist") or []

    return [normalize_article(a) for a in raw_list]
