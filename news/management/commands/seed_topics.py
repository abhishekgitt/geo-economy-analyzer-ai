from django.core.management.base import BaseCommand
from django.utils.text import slugify
from news.models import Topic
from news.news_fetcher.config import ECON_KEYWORDS

class Command(BaseCommand):
    help = "Seed the Topic table with ECON_KEYWORDS from config"

    def handle(self, *args, **options):
        self.stdout.write("Seeding topics...")
        
        count = 0
        for name in ECON_KEYWORDS:
            topic, created = Topic.objects.get_or_create(
                name=name,
                defaults={'slug': slugify(name)}
            )
            if created:
                count += 1
                self.stdout.write(self.style.SUCCESS(f"Created topic: {name}"))
            else:
                self.stdout.write(f"Topic already exists: {name}")

        self.stdout.write(self.style.SUCCESS(f"Seeding complete. Added {count} new topics."))
