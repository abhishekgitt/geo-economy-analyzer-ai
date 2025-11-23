from django.shortcuts import render
from rest_framework import generics
from .models import Article 
from .serializers import ArticleSerializer 

class ArticleList(generics.ListAPIView):
    queryset = Article.objects.order_by()
    serializer_class = ArticleSerializer
