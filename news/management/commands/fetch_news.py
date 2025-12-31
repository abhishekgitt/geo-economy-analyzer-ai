from django.core.management.base import BaseCommand

from news.news_fetcher.gdelt import fetch_articles
from news.news_fetcher.ranking import rank_articles
from news.news_fetcher.saver import save_articles


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
