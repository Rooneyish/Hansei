import sys
import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from transformers import RobertaTokenizer
from sklearn.metrics import f1_score
import numpy as np
from tqdm import tqdm

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from models.transformer import GoEmotionTransformer
from process_data.data_utils import get_processed_data
from process_data.dataset import GoEmotionsDataset

def train():
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    MAX_LEN = 64
    BATCH_SIZE = 64
    EPOCHS = 10
    LR = 1e-4
    best_f1 = 0 

    tokenizer = RobertaTokenizer.from_pretrained("roberta-base")

    model = GoEmotionTransformer(
        vocab_size=tokenizer.vocab_size,
        num_labels=7,
        max_seq_len=MAX_LEN,
        embed_dim=768
    ).to(DEVICE)

    train_split, val_split, _ = get_processed_data()
    train_ds = GoEmotionsDataset(train_split[0], train_split[1], tokenizer, max_len=MAX_LEN)
    val_ds = GoEmotionsDataset(val_split[0], val_split[1], tokenizer, max_len=MAX_LEN)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE)

    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR)

    print(f"Starting training on {DEVICE}...")
    for epoch in range(EPOCHS):
        # --- TRAINING PHASE ---
        model.train()
        total_train_loss = 0
        for batch in tqdm(train_loader, desc=f"Epoch {epoch+1} [Train]"):
            ids = batch['input_ids'].to(DEVICE)
            mask = batch['attention_mask'].to(DEVICE)
            train_labels = batch['labels'].to(DEVICE).float()

            optimizer.zero_grad()
            logits = model(ids, padding_mask=mask) 
            loss = criterion(logits, train_labels)
            loss.backward()
            optimizer.step()
            total_train_loss += loss.item()

        model.eval()
        all_preds, all_labels = [], []
        total_val_loss = 0 
        
        with torch.no_grad():
            for batch in tqdm(val_loader, desc=f"Epoch {epoch+1} [Val]"):
                ids = batch['input_ids'].to(DEVICE)
                mask = batch['attention_mask'].to(DEVICE)
                val_labels = batch['labels'].to(DEVICE).float() 
                
                logits = model(ids, padding_mask=mask)
                
                loss = criterion(logits, val_labels) 
                total_val_loss += loss.item()

                preds = (torch.sigmoid(logits) > 0.5).cpu().numpy()
                all_preds.extend(preds)
                all_labels.extend(batch['labels'].numpy())

        # Metrics Calculation
        avg_train_loss = total_train_loss / len(train_loader)
        avg_val_loss = total_val_loss / len(val_loader)
        score = f1_score(all_labels, all_preds, average='micro', zero_division=0)

        print(f"\nEpoch {epoch+1} Summary:")
        print(f"  Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f}")
        print(f"  Val F1: {score:.4f}")

        # Save Best Model
        if score > best_f1:
            best_f1 = score
            torch.save(model.state_dict(), "best_goemotion_model.pt")
            print(f"  >>> Saved new best model (F1: {best_f1:.4f})")
        print("-" * 30)

if __name__ == "__main__":
    train()