import pandas as pd
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore

df = pd.read_csv("clinical_kb.csv")

docs = []
for _, row in df.iterrows():
    text_content = f"Situation: {row['text']}\nResponse: {row['response']}"
    docs.append(Document(page_content=text_content, metadata={"technique": row['technique']}))

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = QdrantVectorStore.from_documents(
    docs, 
    embeddings, 
    url="http://localhost:6333",
    collection_name="hansei_kb"
)
