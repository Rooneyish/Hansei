import os
import torch
import numpy as np
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
from contextlib import asynccontextmanager
from transformers import (
    RobertaTokenizer,
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
)
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

from src.model import FineTuneRoBERTa
from src.utils import clean_text, EMOTIONS, get_mood_details
from src.service import (
    get_relevant_docs,
    get_music_recommendation,
    generate_stream,
    get_cbt_lab_analysis,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hansei_engine")

GPU_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
CPU_DEVICE = "cpu"


class HanseiState:
    def __init__(self):
        self.emotion_model = None
        self.emotion_tokenizer = None
        self.qwen_model = None
        self.qwen_tokenizer = None
        self.vectorstore = None
        self.music_vectorstore = None
        self.cbt_lab_vectorstore = None


state = HanseiState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    MODEL_PATH = os.path.join(
        os.path.dirname(__file__), "models", "fine_tuned_roberta.pt"
    )

    try:
        state.emotion_tokenizer = RobertaTokenizer.from_pretrained(
            "FacebookAI/roberta-base"
        )
        state.emotion_model = FineTuneRoBERTa(num_labels=len(EMOTIONS))
        if os.path.exists(MODEL_PATH):
            state.emotion_model.load_state_dict(
                torch.load(MODEL_PATH, map_location=CPU_DEVICE)
            )
            state.emotion_model.to(CPU_DEVICE).eval()
            logger.info("Emotion Model Loaded Successfully")
    except Exception as e:
        logger.error(f"Error Loading RoBERTa: {e}")

    try:
        qwen_id = "Qwen/Qwen2.5-7B-Instruct"
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16
        )
        state.qwen_tokenizer = AutoTokenizer.from_pretrained(qwen_id)
        state.qwen_model = AutoModelForCausalLM.from_pretrained(
            qwen_id, quantization_config=bnb_config, device_map="auto"
        )
        logger.info("Qwen LLM Loaded Successfully")
    except Exception as e:
        logger.error(f"Error Loading Qwen: {e}")

    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="nomic-ai/nomic-embed-text-v1",
            model_kwargs={"trust_remote_code": True, "device": CPU_DEVICE},
        )
        client = QdrantClient(url="http://localhost:6333")
        state.vectorstore = QdrantVectorStore(
            client=client, collection_name="hansei_kb", embedding=embeddings
        )
        state.music_vectorstore = QdrantVectorStore(
            client=client, collection_name="music_library", embedding=embeddings
        )
        state.cbt_lab_vectorstore = QdrantVectorStore(
            client=client, collection_name="cbt_lab_library", embedding=embeddings
        )

        logger.info("Qdrant Collections Connected")
    except Exception as e:
        logger.error(f"Qdrant Connection Error: {e}")
    yield


app = FastAPI(title="Hansei AI Engine", lifespan=lifespan)


class JournalRequest(BaseModel):
    text: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


@app.post("/analyze")
async def analyze_journal(request: JournalRequest):
    if not state.emotion_model:
        raise HTTPException(status_code=503, detail="AI Engine not fully loaded")

    cleaned = clean_text(request.text)
    inputs = state.emotion_tokenizer(
        cleaned, return_tensors="pt", truncation=True, max_length=128
    ).to(CPU_DEVICE)
    with torch.no_grad():
        logits = state.emotion_model(
            input_ids=inputs["input_ids"], attention_mask=inputs["attention_mask"]
        )
        probs = torch.sigmoid(logits).cpu().numpy()[0]

    pred_idx = np.argmax(probs)
    emotion = EMOTIONS[pred_idx]

    music = get_music_recommendation(request.text, emotion, state.music_vectorstore)

    cbt = get_cbt_lab_analysis(
        request.text,
        state.cbt_lab_vectorstore,
        state.qwen_model,
        state.qwen_tokenizer,
        GPU_DEVICE,
    )

    return {
        "emotion": emotion,
        "emoji": get_mood_details(emotion),
        "status_text": f"{emotion.capitalize()} {get_mood_details(emotion)}",
        "music_recommendation": music,
        "cbt_analysis": cbt,
    }


@app.post("/chat")
async def chat_with_hansei(request: ChatRequest):
    context = get_relevant_docs(request.message, state.vectorstore)
    history_str = "".join(
        [f"{m.role.capitalize()}: {m.content}\n" for m in request.history[-4:]]
    )

    return StreamingResponse(
        generate_stream(
            request.message,
            history_str,
            context,
            state.qwen_model,
            state.qwen_tokenizer,
            GPU_DEVICE,
        ),
        media_type="text/plain",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
