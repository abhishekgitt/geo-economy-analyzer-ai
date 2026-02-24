import os
import sys
from unittest.mock import patch, MagicMock

# Ensure we can import from the project root
sys.path.append(os.getcwd())

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from news.services.gemini import general_conversation

def test_resiliency():
    print("--- Testing Resiliency (Simulating Qdrant Connection Failure) ---")
    
    # Mock QdrantService to raise an exception upon instantiation
    with patch('news.services.qdrant_service.QdrantService') as mock_qdrant:
        mock_qdrant.side_effect = Exception("Connection Refused (Simulated)")
        
        try:
            reply, used_context = general_conversation("What is a resume?")
            print(f"Used Context Flag: {used_context}")
            print(f"Reply Excerpt: {reply[:100]}...")
            
            if not used_context:
                print("\nSUCCESS: AI fell back gracefully and used_context is False.")
            else:
                print("\nFAILURE: used_context is True despite error.")
                
        except Exception as e:
            print(f"\nFAILURE: AI crashed despite error handling: {e}")

if __name__ == "__main__":
    test_resiliency()
