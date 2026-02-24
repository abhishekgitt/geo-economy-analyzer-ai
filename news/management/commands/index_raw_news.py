from django.core.management.base import BaseCommand
from news.models import Article
from news.services.qdrant_service import QdrantService
from tqdm import tqdm

class Command(BaseCommand):
    help = "Index all existing articles into Qdrant"

    def handle(self, *args, **options):
        self.stdout.write("Initializing Qdrant service...")
        qdrant = QdrantService()
        qdrant.ensure_collection()

        articles = Article.objects.all()
        total = articles.count()
        self.stdout.write(f"Found {total} articles to index.")

        success_count = 0
        for article in tqdm(articles, desc="Indexing articles"):
            try:
                if qdrant.upsert_article(article):
                    success_count += 1
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed to index article {article.id}: {e}"))

        self.stdout.write(self.style.SUCCESS(f"Successfully indexed {success_count}/{total} articles."))
