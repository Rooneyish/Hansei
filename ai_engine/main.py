import torch
import numpy as np
import os
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import (RobertaTokenizer, AutoModelForCausalLM, AutoTokenizer, pipeline, BitsAndBytesConfig)
from langchain_huggingface import HuggingFacePipeline, HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser
from src.model import FineTuneRoBERTa
from src.utils import clean_text, EMOTIONS, get_mood_details

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Hansei AI Engine")

emotion_model = None
emotion_tokenizer = None
qwen_model = None
qwen_tokenizer = None
vectorstore = None
llm = None
rag_chain = None

GPU_DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
CPU_DEVICE = "cpu"

try:
    emotion_tokenizer = RobertaTokenizer.from_pretrained("FacebookAI/roberta-base")
    emotion_model = FineTuneRoBERTa(num_labels=len(EMOTIONS))
    if os.path.exists("fine_tuned_roberta.pt"):
        emotion_model.load_state_dict(torch.load("fine_tuned_roberta.pt", map_location=CPU_DEVICE))
        emotion_model.to(CPU_DEVICE)
        emotion_model.eval()
        print("Emotion Detection Model: Loaded on CPU")
except Exception as e:
    print(f"Error Loading Emotion Model: {e}")

try:
    qwen_id = "Qwen/Qwen2.5-7B-Instruct"
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16
    )

    qwen_tokenizer = AutoTokenizer.from_pretrained(qwen_id)
    qwen_model = AutoModelForCausalLM.from_pretrained(
        qwen_id, quantization_config=bnb_config, device_map="auto", trust_remote_code=True
    )

    qwen_pipe = pipeline(
        "text-generation", 
        model=qwen_model, 
        tokenizer=qwen_tokenizer, 
        max_new_tokens=150,      
        temperature=0.7, 
        repetition_penalty=1.1,  
        do_sample=True,
        return_full_text=False,
        eos_token_id=qwen_tokenizer.eos_token_id,
        pad_token_id=qwen_tokenizer.pad_token_id,
    )
    llm = HuggingFacePipeline(pipeline=qwen_pipe)
    print('Qwen LLM: Ready on GPU')
except Exception as e:
    print(f'Error loading Qwen LLM: {e}')

try:
    embeddings = HuggingFaceEmbeddings(
        model_name="nomic-ai/nomic-embed-text-v1",
        model_kwargs={'trust_remote_code': True, 'device': CPU_DEVICE}
    )
    qdrant_client = QdrantClient(url="http://localhost:6333")
    vectorstore = QdrantVectorStore(
        client=qdrant_client, collection_name="hansei_kb", embedding=embeddings         
    )
    print('Qdrant Connection: Successful')
except Exception as e:
    print(f"Error connecting to Qdrant: {e}")

system_template = """
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

prompt = ChatPromptTemplate.from_template(system_template)

def get_relevant_docs(question):
    ignore_list = ["hi", "hello", "hey", "howdy", "whats up", "doing great", "doing well", "i am good", "i'm good"]
    clean_q = question.lower().strip()
    
    if any(greet in clean_q for greet in ignore_list):
        return "" 
    
    if vectorstore is not None:
        try:
            results = vectorstore.similarity_search_with_score(f"search_query: {question}", k=2)
            relevant_chunks = [res[0].page_content.replace("search_document: ", "") for res in results if res[1] > 0.65]
            return "\n\n---\n\n".join(relevant_chunks)
        except:
            return ""
    return ""

if llm is not None:
    rag_chain = (
        {
            "context": RunnableLambda(lambda x: get_relevant_docs(x["question"])), 
            "question": lambda x: x["question"],
            "history": lambda x: x["history"]
        }
        | prompt
        | llm
        | StrOutputParser()
    )
class JournalRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str
    history: list = [] 

@app.post("/analyze")
async def analyze_journal(request: JournalRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        cleaned = clean_text(request.text)
        inputs = emotion_tokenizer(cleaned, return_tensors="pt", truncation=True, padding='max_length', max_length=128).to(CPU_DEVICE)
        
        with torch.no_grad():
            logits = emotion_model(input_ids=inputs['input_ids'], attention_mask=inputs['attention_mask'])
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
        print(f"Emotion Detection Error: {e}")
        raise HTTPException(status_code=500, detail="Error during emotion detection.")

@app.post("/chat")
async def chat_with_hansei(request: ChatRequest):
    if rag_chain is None: raise HTTPException(status_code=503)
    try:
        formatted_history = "\n".join([f"{'User' if m['role']=='user' else 'Hansei'}: {m['content']}" for m in request.history[-4:]])
        
        raw_response = rag_chain.invoke({"question": request.message, "history": formatted_history})
        
        response_text = raw_response.split("Hansei:")[-1].strip()
        
        for pattern in ["User:", "Human:", "Assistant:", "Context:", "(Note:", "---", "<|im_end|>", "Note:"]:
            response_text = response_text.split(pattern)[0]
            
        return {"reply": response_text.strip()}
    except torch.cuda.OutOfMemoryError:
        torch.cuda.empty_cache()
        raise HTTPException(status_code=507, detail="AI Overwhelmed")
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        raise HTTPException(status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)