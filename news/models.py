from django.db import models

class Article(models.Model):
    source = models.CharField(max_length=200)
    title = models.TextField()
    url = models.URLField(unique=True)
    published_at = models.DateTimeField(null=True, blank=True)
    snippet = models.TextField(blank=True)
    fetched_at = models.DateTimeField(auto_now_add=True)

class SummaryPage(models.Model):
    article = models.OneToOneField(Article, on_delete=models.CASCADE, related_name="summary")
    hero_image = models.URLField(blank=True)
    short_preview = models.TextField(blank=True)    # used on cards
    ai_summary = models.TextField(blank=True)       # detailed AI bullets
    summarized_at = models.DateTimeField(null=True, blank=True)
    model_version = models.CharField(max_length=64, blank=True)
    confidence = models.FloatField(null=True, blank=True)
