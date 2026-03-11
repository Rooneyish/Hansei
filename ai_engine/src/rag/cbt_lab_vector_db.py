import os
import pandas as pd
import torch 
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "knowledge_base", "cbt_lab_kb.jsonl")
print(f"Loading data from: {DATA_PATH}")

cbt_data = pd.read_json(DATA_PATH, lines=True).to_dict(orient='records')

docs = []
for entry in cbt_data:
    doc = Document(
        page_content=entry['text'], 
        metadata=entry['metadata']  
    )
    docs.append(doc)

embeddings = HuggingFaceEmbeddings(
    model_name="nomic-ai/nomic-embed-text-v1",
    model_kwargs={'trust_remote_code': True, 'device': 'cuda' if torch.cuda.is_available() else 'cpu'},
)

qdrant_client = QdrantClient(url="http://localhost:6333")
COLLECTION_NAME = "cbt_lab_library" 

qdrant_client.recreate_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=768, distance=Distance.COSINE),
)

vectorstore = QdrantVectorStore(
    client=qdrant_client,
    collection_name=COLLECTION_NAME,
    embedding=embeddings
)

batch_size = 8
print(f"Indexing {len(docs)} documents into '{COLLECTION_NAME}'...")

for i in range(0, len(docs), batch_size):
    try:
        batch = docs[i : i + batch_size]
        vectorstore.add_documents(batch)
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            
        if (i // batch_size) % 10 == 0:
            print(f"Processed {i}/{len(docs)} documents...")
            
    except Exception as e:
        print(f"Error at index {i}: {e}")
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        continue
