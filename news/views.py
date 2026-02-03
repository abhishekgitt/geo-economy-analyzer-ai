from django.contrib.auth.models import User

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny

from news.models import (
    SummaryPage,
    Topic,
)
from news.serializers import SummaryPageSerializer
from news.services.gemini import article_conversation, general_conversation, compare_careers
from news.services.adzuna import search_adzuna_jobs



# sign up new user
class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "username and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "username already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        return Response(
            {"message": "User registered successfully"},
            status=status.HTTP_201_CREATED
        )



# Check userpreference (Now Global Feed)
class SummaryListAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Return ALL summaries, latest first
        summaries = SummaryPage.objects.select_related("article").order_by("-article__published_at")
        serializer = SummaryPageSerializer(summaries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# Ask about article
class ArticleChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        article_id = request.data.get("article_id")
        summary_id = request.data.get("summary_id")
        user_question = request.data.get("question")

        if not article_id or not summary_id or not user_question:
            return Response(
                {"error": "article_id, summary_id and question are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            summary = SummaryPage.objects.select_related("article").get(
                id=summary_id
            )
        except SummaryPage.DoesNotExist:
            return Response(
                {"error": "Summary not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Removed Topic Permission Check - Allow any authenticated user to chat about any article

        try:
            article_text = summary.article.snippet or summary.article.title
            reply = article_conversation(
                article_text=article_text,
                user_question=user_question
            )
            return Response({"reply": reply}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"AI service failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Job Search Proxy
class JobSearchAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "")
        location = request.query_params.get("loc", "")
        country = request.query_params.get("country", "in") # Default to India
        page = request.query_params.get("page", 1)

        data = search_adzuna_jobs(query, location, country, page)
        return Response(data, status=status.HTTP_200_OK)


from news.services.adzuna import get_trending_stats

class TrendingJobsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        country = request.query_params.get("country", "in")
        stats = get_trending_stats(country=country)
        return Response(stats, status=status.HTTP_200_OK)

from news.services.gemini import compare_careers
import json

class CareerComparisonAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        career1 = request.data.get("career1")
        career2 = request.data.get("career2")

        if not career1 or not career2:
            return Response(
                {"error": "Both career1 and career2 are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            comparison_text = compare_careers(career1, career2)
            # Remove markdown code blocks if Gemini includes them
            clean_json = comparison_text.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:-3].strip()
            elif clean_json.startswith("```"):
                clean_json = clean_json[3:-3].strip()
            
            data = json.loads(clean_json)
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to generate comparison: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GeneralChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_question = request.data.get("question")

        if not user_question:
            return Response(
                {"error": "Question is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            reply = general_conversation(user_question=user_question)
            return Response({"reply": reply}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"AI service failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
