from qdrant_client import QdrantClient
client = QdrantClient(host="localhost", port=6333)
print("QdrantClient methods:")
for m in dir(client):
    if not m.startswith("_"):
        print(f"- {m}")
