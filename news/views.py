from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from news.models import SummaryPage
from news.serializers import SummaryPageSerializer


class SummaryListAPIView(APIView):
    def get(self, request):
        summaries = SummaryPage.objects.select_related("article").all()
        serializer = SummaryPageSerializer(summaries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
