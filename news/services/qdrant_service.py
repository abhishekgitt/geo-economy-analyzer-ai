import os
import time
from qdrant_client import QdrantClient
from qdrant_client.http import models
from google import genai
import numpy as np

class QdrantService:
    def __init__(self):
        self.host = "localhost"
        self.port = 6333
        self.client = QdrantClient(host=self.host, port=self.port)
        self.collection_name = "job_market_news"
        self.vector_size = 3072  # gemini-embedding-001 size
        self.gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    def ensure_collection(self):
        try:
            collection_info = self.client.get_collection(collection_name=self.collection_name)
            current_dim = collection_info.config.params.vectors.size
            if current_dim != self.vector_size:
                print(f"Dimension mismatch (expected {self.vector_size}, got {current_dim}). Recreating collection...")
                self.client.delete_collection(collection_name=self.collection_name)
                raise Exception("Trigger recreation")
        except Exception:
            print(f"Creating collection: {self.collection_name}")
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=self.vector_size,
                    distance=models.Distance.COSINE
                )
            )

    def get_embedding(self, text):
        if not text:
            return None
        
        # Limit text length as embeddings models have limits
        text = text[:8000] 
        
        for attempt in range(3):
            try:
                result = self.gemini_client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=text
                )
                return result.embeddings[0].values
            except Exception as e:
                error_msg = str(e).lower()
                if "quota" in error_msg or "429" in error_msg:
                    print(f"Rate limit hit, waiting... (attempt {attempt+1})")
                    time.sleep(2 * (attempt + 1))
                    continue
                print(f"Error generating embedding: {e}")
                return None
        return None

    def upsert_article(self, article):
        """
        article: Article model instance
        """
        embedding = self.get_embedding(article.snippet)
        if embedding is None:
            return False

        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                models.PointStruct(
                    id=article.id,
                    vector=embedding,
                    payload={
                        "title": article.title,
                        "url": article.url,
                        "source": article.source,
                        "published_at": str(article.published_at) if article.published_at else "",
                        "snippet": article.snippet[:1000] # store preview
                    }
                )
            ]
        )
        return True

    def search_similar(self, query_text, limit=5):
        embedding = self.get_embedding(query_text)
        if embedding is None:
            return []

        results = self.client.query_points(
            collection_name=self.collection_name,
            query=embedding,
            limit=limit
        ).points
        return results
