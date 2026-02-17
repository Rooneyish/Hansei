import torch
import numpy as np
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

app = FastAPI(title="Hansei AI Engine: Emotion & Chat")

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Device: {DEVICE}")


emotion_tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
emotion_model = FineTuneRoBERTa(num_labels=len(EMOTIONS))

try:
    emotion_model.load_state_dict(torch.load("fine_tuned_roberta.pt", map_location=DEVICE))
    emotion_model.to(DEVICE)
    emotion_model.eval()
    print("Emotion Detection Model: Loaded")
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
        qwen_id, 
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True
    )

    qwen_pipe = pipeline(
        "text-generation", 
        model=qwen_model, 
        tokenizer=qwen_tokenizer, 
        max_new_tokens=120,      
        temperature=0.75, 
        repetition_penalty=1.2,  
        do_sample=True,
        eos_token_id=qwen_tokenizer.eos_token_id,
        pad_token_id=qwen_tokenizer.pad_token_id,
    )
    llm = HuggingFacePipeline(pipeline=qwen_pipe)
    print('Qwen LLM Ready')
except Exception as e:
    print(f'Error loading Qwen LLM')

try:
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    qdrant_client = QdrantClient(url="http://localhost:6333")
    vectorstore = QdrantVectorStore(
        client=qdrant_client, 
        collection_name="hansei_kb", 
        embedding=embeddings         
    )
    print('Qdrant Connection Successful')
except Exception as e:
    print(f"Error connecting to Qdrant: {e}")

system_template = """
You are 'Hansei', a warm, empathetic, and supportive mental well-being friend.

CORE MISSION:
Your goal is to help the user manage their emotions in the moment using the provided CBT Context. 
DO NOT simply tell them to see a doctor or therapist unless they are in a life-threatening crisis. 
Instead, guide them through a small CBT thought reframe or a comforting activity based on the context.

CONVERSATION STYLE:
1. Validate first: "I hear you, being alone can feel really heavy sometimes."
2. Personalize: Use the context to suggest a small shift in thinking or a gentle activity.
3. Be brief: Keep it under 3-4 sentences.
4. Friend-mode: Talk like a peer, not a clinical manual.

RULES:
1. If the user says a simple greeting (hi, hello, hey), ignore the context and just say hi back warmly.
2. Use the 'Context' to provide supportive CBT-based advice when the user shares a problem.
3. Use a friendly, casual tone. Do not act like a clinical doctor.
4. Keep your response to ONE paragraph (max 4 sentences).
5. Stop writing as soon as you have answered the user.

Always end your response with a gentle, open-ended question to keep the conversation going (e.g., 'What do you think might help you feel a bit more comfortable right now?').

Context: {context}
User: {question}
Hansei:"""

prompt = ChatPromptTemplate.from_template(system_template)

def get_relevant_docs(question):
    greetings = ["hi", "hello", "hey", "howdy", "greetings", "hi there", "whats up", "what's up", "how are you", "how r u"]
    if question.lower().strip() in greetings:
        return "No context needed for a simple greeting."
    
    docs = vectorstore.as_retriever(search_kwargs={"k": 2}).invoke(question)
    return "\n\n".join(doc.page_content for doc in docs)

rag_chain = (
    {"context": RunnableLambda(get_relevant_docs), "question": RunnablePassthrough()}
    | prompt
    | llm
    | StrOutputParser()
)

class JournalRequest(BaseModel):
    text: str

class ChatRequest(BaseModel):
    message: str

@app.post("/analyze")
async def analyze_journal(request: JournalRequest):
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        cleaned = clean_text(request.text)
        inputs = emotion_tokenizer(cleaned, return_tensors="pt", truncation=True, padding='max_length', max_length=128).to(DEVICE)
        
        with torch.no_grad():
            logits = emotion_model(input_ids=inputs['input_ids'], attention_mask=inputs['attention_mask'])
            probs = torch.sigmoid(logits).cpu().numpy()[0]
        
        max_idx = np.argmax(probs)
        predicted_emotion = EMOTIONS[max_idx]
        
        return {
            "emotion": predicted_emotion,
            "emoji": get_mood_details(predicted_emotion),
            "confidence": round(float(probs[max_idx]), 4)
        }
    except Exception as e:
        print("Emotion Detection Error: {e}")
        raise HTTPException(status_code=500, detail="Error during emotion detection.")

@app.post("/chat")
async def chat_with_hansei(request: ChatRequest):
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")

        response_text = rag_chain.invoke(request.message)
        
        if "Hansei:" in response_text:
            response_text = response_text.split("Hansei:")[-1]
            
        response_text = response_text.split("User:")[0].split("Assistant:")[0].strip()
        response_text = response_text.replace("---", "").strip()

        return {"reply": response_text}
    except torch.cuda.OutOfMemoryError:
        print("GPU Out of Memory Error during chat!")
        raise HTTPException(status_code=507, detail="AI is currently overwhelmed. Please try again in a moment.")
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while generating a response.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)