from .utils import word_count
from .config import ECON_KEYWORDS, TOP_N


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
