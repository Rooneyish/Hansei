import pandas as pd
import torch 
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

advice_data = pd.read_json("clinical_kb.jsonl", lines=True).to_dict(orient='records')

docs = []
for entry in advice_data:
    indexed_text = f"search_document: {entry['text']}"
    doc = Document(
        page_content=indexed_text,
        metadata=entry['metadata']  
    )
    docs.append(doc)

# for _, row in df.iterrows():
#     text_content = f"Situation: {row['text']}\nResponse: {row['response']}"
#     docs.append(Document(page_content=text_content, metadata={"technique": row['technique']}))


embeddings = HuggingFaceEmbeddings(
    model_name="nomic-ai/nomic-embed-text-v1",
    model_kwargs={'trust_remote_code': True, 'device': 'cuda'},)

qdrant_client = QdrantClient(url="http://localhost:6333")
collection_name = "hansei_kb"

vectorstore = QdrantVectorStore(
    client=qdrant_client,
    collection_name=collection_name,
    embedding=embeddings
)

batch_size = 8

for i in range(0, len(docs), batch_size):
    try:
        batch = docs[i:i +batch_size]

        vectorstore.add_documents(batch)
        torch.cuda.empty_cache()
        if( i//batch_size)%10 ==0:
            print(f"Processed {i}/{len(docs)} documents...")
    except torch.OutOfMemoryError:
        print("clearning cache")
        torch.cuda.empty_cache()
        continue
        
