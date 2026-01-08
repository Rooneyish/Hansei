import sys
import os
import torch
import numpy as np
from transformers import RobertaTokenizer

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__)) 
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "../../"))

if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)

from src.models.transformer import GoEmotionTransformer

EKMAN_LABELS = ["anger", "disgust", "fear", "joy", "sadness", "surprise"]

def predict_emotion(text, model_path="best_goemotion_model.pt"):
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    MAX_LEN = 64 
    EMBED_DIM = 768
    
    tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
    
    model = GoEmotionTransformer(
    ).to(DEVICE)
    
    # Locate Weights
    if not os.path.isabs(model_path):
        model_path = os.path.join(PROJECT_ROOT, model_path)

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Weight file not found at: {model_path}")

    # Load state dict
    model.load_state_dict(torch.load(model_path, map_location=DEVICE))
    model.eval()
    
    encoding = tokenizer.encode_plus(
        text,
        add_special_tokens=True,
        max_length=MAX_LEN,
        padding='max_length',
        truncation=True,
        return_attention_mask=True,
        return_tensors='pt'
    )
    
    ids = encoding['input_ids'].to(DEVICE)
    mask = encoding['attention_mask'].to(DEVICE)
    
    with torch.no_grad():
        logits = model(ids, attention_mask=mask)
        probs = torch.sigmoid(logits).cpu().numpy()[0]
    
    return probs

if __name__ == "__main__":
    WEIGHTS = "best_goemotion_model.pt"
    
    while True:
        user_input = input("\nEnter text to analyze (or 'q' to quit): ")
        if user_input.lower() == 'q' or not user_input.strip():
            break
            
        try:
            probs = predict_emotion(user_input, model_path=WEIGHTS)
            
            results = sorted(zip(EKMAN_LABELS, probs), key=lambda x: x[1], reverse=True)
            
            print(f"\nAnalysis for: \"{user_input[:50]}...\"")
            print("-" * 40)
            for emo, score in results:
                bar = "█" * int(score * 20) + "░" * (20 - int(score * 20))
                status = "[DETECTED]" if score > 0.45 else ""
                print(f"{emo:10} | {bar} | {score:6.2%} {status}")
                
        except Exception as e:
            print(f"Error during prediction: {e}")
