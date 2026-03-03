import torch
import numpy as np
import os
import logging
import threading
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from transformers import (
    RobertaTokenizer, 
    AutoModelForCausalLM, 
    AutoTokenizer, 
    BitsAndBytesConfig, 
    TextIteratorStreamer
)
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient

from src.model import FineTuneRoBERTa
from src.utils import clean_text, EMOTIONS, get_mood_details

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

state = HanseiState()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        state.emotion_tokenizer = RobertaTokenizer.from_pretrained("FacebookAI/roberta-base")
        state.emotion_model = FineTuneRoBERTa(num_labels=len(EMOTIONS))
        if os.path.exists("fine_tuned_roberta.pt"):
            state.emotion_model.load_state_dict(torch.load("fine_tuned_roberta.pt", map_location=CPU_DEVICE))
            state.emotion_model.to(CPU_DEVICE).eval()
            logger.info("✅ Emotion Detection Model loaded on CPU")
    except Exception as e:
        logger.error(f"❌ Error Loading Emotion Model: {e}")

    try:
        qwen_id = "Qwen/Qwen2.5-7B-Instruct"
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16
        )
        state.qwen_tokenizer = AutoTokenizer.from_pretrained(qwen_id)
        state.qwen_model = AutoModelForCausalLM.from_pretrained(
            qwen_id, 
            quantization_config=bnb_config, 
            device_map="auto", 
            trust_remote_code=True
        )
        logger.info("✅ Qwen LLM loaded on GPU")
    except Exception as e:
        logger.error(f"❌ Error loading Qwen LLM: {e}")

    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="nomic-ai/nomic-embed-text-v1",
            model_kwargs={'trust_remote_code': True, 'device': CPU_DEVICE}
        )
        client = QdrantClient(url="http://localhost:6333")
        state.vectorstore = QdrantVectorStore(
            client=client, 
            collection_name="hansei_kb", 
            embedding=embeddings         
        )
        logger.info("✅ Qdrant Connection: Successful")
    except Exception as e:
        logger.error(f"❌ Qdrant Error: {e}")

    yield
    logger.info("Shutting down Hansei Engine...")

app = FastAPI(title="Hansei AI Engine", lifespan=lifespan)

SYSTEM_TEMPLATE = """
<|im_start|>system
You are 'Hansei', a supportive friend inspired by the Japanese philosophy of self-reflection.
Your goal is to help the user manage their emotions in the moment using the provided 'CBT Context'.

IMPORTANT RULES:
1. GREETINGS: If the user says 'Hi', 'Hello', or 'Hey', ONLY say hello back warmly. Do NOT give CBT advice or use the context.
2. IDENTITY & CONTEXT: The provided 'CBT Context' is a REFERENCE LIBRARY of examples, not the user's life.
    - NEVER assume the user has a husband, boyfriend, or specific job unless they mention it first.
    - Use the 'CBT Context' only for the TYPE of advice or the exercise it suggests.
    - If the context mentions "your husband" but the user is talking about "work," ignore the "husband" part and only use the "work" logic.
    - If the user just stated a belief or a feeling, do NOT ask "does that resonate?" or "how does that feel?" They just told you! Instead, acknowledge it as a fact (e.g., "That perfectionism is a heavy burden to carry").
    - If the user says they are "going to" do something, wish them luck and tell them you're here when they get back. Do NOT ask them how it felt yet, as they haven't done it!
3. ROLE-PLAY: Speak ONLY as Hansei. Never continue the conversation as 'Assistant', 'Human', or 'User'.
4. NO DOCTOR TALK: Avoid clinical jargon. Instead of "Catastrophizing," say "expecting the worst." Avoid "I recommend."
5. BREVITY: Keep your response to ONE paragraph and under 4 sentences.

HOW TO USE THE CONTEXT:
- If the Context is empty or irrelevant, just have a normal friendly chat focusing on the user's words.
- SUPPORT ADVICE: Translate professional tips into warm, friendly suggestions.
- CBT EXERCISE PLAN: Pick ONE small step to try together.
- CORE BELIEFS: Gently ask if a specific belief (like 'feeling unlovable') resonates with them.

ENDING THE CHAT:
- Normally, end with a gentle question (e.g., "How does that sound to you?").
- If the user says "Bye", "Thanks", or "I'm done", just wish them well without a question.<|im_end|>

<|im_start|>user
Context: {context}
History: {history}
Message: {question}<|im_end|>
<|im_start|>assistant
Hansei:"""

def get_relevant_docs(question: str):
    ignore_list = ["hi", "hello", "hey", "howdy", "whats up", "i am good", "i'm good"]
    if any(greet in question.lower().strip() for greet in ignore_list):
        return "None (Casual Greeting)"
    
    if state.vectorstore:
        try:
            results = state.vectorstore.similarity_search_with_score(f"search_query: {question}", k=2)
            relevant_chunks = [res[0].page_content.replace("search_document: ", "") for res in results if res[1] > 0.65]
            return "\n\n".join(relevant_chunks) if relevant_chunks else "No specific context found."
        except Exception as e:
            logger.error(f"Retriever error: {e}")
    return "Not available."

async def generate_stream(message: str, history_str: str, context: str):
    full_prompt = SYSTEM_TEMPLATE.format(
        context=context,
        history=history_str,
        question=message
    )
    
    inputs = state.qwen_tokenizer([full_prompt], return_tensors="pt").to(GPU_DEVICE)
    streamer = TextIteratorStreamer(state.qwen_tokenizer, skip_prompt=True, skip_special_tokens=True)
    
    generation_kwargs = dict(
        **inputs,
        streamer=streamer,
        max_new_tokens=200,
        temperature=0.7,
        do_sample=True,
        repetition_penalty=1.1,
        eos_token_id=state.qwen_tokenizer.eos_token_id,
        pad_token_id=state.qwen_tokenizer.pad_token_id,
    )

    thread = threading.Thread(target=state.qwen_model.generate, kwargs=generation_kwargs)
    thread.start()

    stop_tokens = ["User:", "Human:", "Context:", "<|im_end|>", "Hansei:"]
    
    for new_text in streamer:
        yield new_text
        await asyncio.sleep(0.01)

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
        raise HTTPException(status_code=503, detail="Emotion model not loaded")
        
    try:
        cleaned = clean_text(request.text)
        inputs = state.emotion_tokenizer(
            cleaned, 
            return_tensors="pt", 
            truncation=True, 
            padding='max_length', 
            max_length=128
        ).to(CPU_DEVICE)
        
        with torch.no_grad():
            logits = state.emotion_model(input_ids=inputs['input_ids'], attention_mask=inputs['attention_mask'])
            probs = torch.sigmoid(logits).cpu().numpy()[0]
        
        max_idx = np.argmax(probs)
        predicted_emotion = EMOTIONS[max_idx]
        confidence = float(probs[max_idx])
        emoji = get_mood_details(predicted_emotion)
        
        return {
            "emotion": predicted_emotion,
            "emoji": emoji,
            "confidence": round(confidence, 4),
            "status_text": f"{predicted_emotion.capitalize()} {emoji}"
        }
    except Exception as e:
        logger.error(f"Emotion Detection Error: {e}")
        raise HTTPException(status_code=500, detail="Error during emotion detection.")

@app.post("/chat")
async def chat_with_hansei(request: ChatRequest):
    if not state.qwen_model:
        raise HTTPException(status_code=503, detail="Hansei is still waking up.")

    try:
        context = get_relevant_docs(request.message)

        formatted_history = ""
        for m in request.history[-4:]: 
            role = "User" if m.role == 'user' else "Hansei"
            formatted_history += f"{role}: {m.content}\n"

        return StreamingResponse(
            generate_stream(request.message, formatted_history, context),
            media_type="text/plain"
        )

    except torch.cuda.OutOfMemoryError:
        torch.cuda.empty_cache()
        logger.error("CUDA Out of Memory")
        raise HTTPException(status_code=507, detail="AI Overwhelmed. Please try a shorter message.")
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)