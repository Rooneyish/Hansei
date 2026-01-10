# main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import numpy as np
from transformers import RobertaTokenizer
from src.model import FineTuneRoBERTa
from src.utils import clean_text, EMOTIONS, get_mood_details

app = FastAPI(title="Hansei AI Emotion Engine")

# 1. Setup Device (CPU is usually fine for inference)
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# 2. Load Model & Tokenizer
tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
model = FineTuneRoBERTa(num_labels=len(EMOTIONS))

# 3. Load the saved weights (fine_tuned_roberta.pt)
try:
    model.load_state_dict(torch.load("fine_tuned_roberta.pt", map_location=DEVICE))
    model.to(DEVICE)
    model.eval()
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")

class JournalRequest(BaseModel):
    text: str

@app.post("/analyze")
async def analyze_journal(request: JournalRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # A. Preprocessing
    cleaned = clean_text(request.text)
    inputs = tokenizer(
        cleaned, 
        return_tensors="pt", 
        truncation=True, 
        padding='max_length', 
        max_length=128
    ).to(DEVICE)

    # B. Inference
    with torch.no_grad():
        logits = model(input_ids=inputs['input_ids'], attention_mask=inputs['attention_mask'])
        # Use Sigmoid because GoEmotions is a multi-label dataset
        probs = torch.sigmoid(logits).cpu().numpy()[0]

    # C. Get the strongest emotion
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)