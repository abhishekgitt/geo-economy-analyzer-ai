from django.urls import path
from news.views import SummaryListAPIView

urlpatterns = [
    path("api/summaries/", SummaryListAPIView.as_view(), name="summary-list"),
]
