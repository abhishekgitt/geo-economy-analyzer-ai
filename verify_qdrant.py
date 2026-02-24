import os
from news.services.qdrant_service import QdrantService
from news.services.gemini import general_conversation
from dotenv import load_dotenv

load_dotenv()

def verify():
    qdrant = QdrantService()
    try:
        info = qdrant.client.get_collection(qdrant.collection_name)
        print(f"Collection Info: {info.status}")
        print(f"Points count: {info.points_count}")
        
        # Test search
        test_query = "What are the latest job market trends in AI?"
        print(f"\nTesting search for: '{test_query}'")
        results = qdrant.search_similar(test_query, limit=2)
        for r in results:
            print(f"- {r.payload['title']} (Score: {r.score})")
            
        # Test RAG conversation
        print(f"\nTesting RAG AI Response...")
        reply = general_conversation(test_query)
        print(f"AI Reply excerpt: {reply[:300]}...")
        
    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    verify()
