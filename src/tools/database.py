import os
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_huggingface import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()

# Initialize Pinecone
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index_name = os.getenv("PINECONE_INDEX_NAME")

# Use HuggingFace Embeddings (lightweight, free, runs locally)
# all-MiniLM-L6-v2: 384 dimensions, fast and efficient
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'},
    encode_kwargs={'normalize_embeddings': True}
)

def init_pinecone_index():
    """Creates the index if it doesn't exist."""
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=384, # Dimension for all-MiniLM-L6-v2
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
    return pc.Index(index_name)

def get_vectorstore():
    """Returns the LangChain wrapper for Pinecone."""
    return PineconeVectorStore(index_name=index_name, embedding=embeddings)