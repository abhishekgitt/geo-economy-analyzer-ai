from django.urls import path
from news.views import SummaryListAPIView, ArticleChatAPIView

urlpatterns = [
    path("api/summaries/", SummaryListAPIView.as_view(), name="summary-list"),
    path("api/chat/", ArticleChatAPIView.as_view()),
]
