from langchain_community.document_loaders.csv_loader import CSVLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import qdrant_client

def ingest_data():
    csv_path = "/home/rooneyish/Final_Year_Project/Hansei-clone/ai_engine/rag_df.csv"
    vector_db_path = "/home/rooneyish/Final_Year_Project/Hansei-clone/ai_engine/src/rag/qdrant_db"

    loader = CSVLoader(file_path = csv_path, encoding = 'utf-8')
    docs = loader.load()

    embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")

    vectorstore = QdrantVectorStore.from_documents(
            docs,
            embeddings,
            path=vector_db_path,
            collection_name="mental_health_kb",
        )
    
    return vectorstore

if __name__ == "__main__":
    ingest_data()