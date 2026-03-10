from qdrant_client import QdrantClient
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
import psycopg2
from qdrant_client.models import VectorParams, Distance
from langchain_qdrant import QdrantVectorStore
import torch

conn = psycopg2.connect("dbname=hansei_db user=postgres password=509017 host=127.0.0.1")
cur = conn.cursor()

cur.execute("SELECT id, title, artist, description, mood_tags, category FROM music_tracks")
tracks = cur.fetchall()

docs = []
for track in tracks:
    t_id, title, artist, description, mood_tags, category = track
    indexed_text = f"search_document: Music Title: {title}. Description: {description}"

    doc = Document(
        page_content=indexed_text,
        metadata={
            "database_id": t_id,
            "title": title,
            "artist": artist,
            "mood_tags": mood_tags,
            "category": category,
            "type": "music_recommendation"
        }
    )
    docs.append(doc)

embeddings = HuggingFaceEmbeddings(
    model_name="nomic-ai/nomic-embed-text-v1",
    model_kwargs={'trust_remote_code': True, 'device': 'cuda'},)

qdrant_client = QdrantClient(url="http://localhost:6333")
collection_name = "music_library"

qdrant_client.recreate_collection(
    collection_name=collection_name,
    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
)

vectorstore = QdrantVectorStore(
    client=qdrant_client,
    collection_name=collection_name,
    embedding=embeddings
)

batch_size=8

for i in range(0, len(docs), batch_size):
    try:
        batch = docs[i:i + batch_size]
        vectorstore.add_documents(batch)
        torch.cuda.empty_cache()
        
        if (i // batch_size) % 1 == 0:
            print(f"Processed {i + len(batch)}/{len(docs)} tracks...")
            
    except torch.OutOfMemoryError:
        print("CUDA Out of Memory: clearing cache and retrying...")
        torch.cuda.empty_cache()
        continue

print("Music library indexing complete.")

cur.close()
conn.close()

