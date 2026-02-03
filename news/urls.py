from django.urls import path
from news.views import (
    SummaryListAPIView,
    ArticleChatAPIView,
    RegisterAPIView,
    JobSearchAPIView,
    TrendingJobsAPIView,
    CareerComparisonAPIView,
    GeneralChatAPIView,
)

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("api/token/", TokenObtainPairView.as_view(), name="token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/register/", RegisterAPIView.as_view()),

    path("api/summaries/", SummaryListAPIView.as_view(), name="summary-list"),
    path("api/chat/", ArticleChatAPIView.as_view()),
    path("api/jobs/", JobSearchAPIView.as_view()),
    path("api/jobs/trending/", TrendingJobsAPIView.as_view()),
    path("api/compare/", CareerComparisonAPIView.as_view()),
    path("api/general-chat/", GeneralChatAPIView.as_view(), name="general_chat"),
]
