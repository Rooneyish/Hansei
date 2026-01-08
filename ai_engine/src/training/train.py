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

# Mapping 27 emotions → 7 classes
MAP_INDICES = {
    0: [2, 3, 10], 1: [11], 2: [14, 19],
    3: [0, 1, 4, 5, 8, 15, 17, 18, 20, 21, 23], 
    4: [9, 12, 16, 24, 25], 5: [22, 26]
}

def map_labels_27_to_6(labels_27):
    """
    Convert multi-hot 27-label array to 7-class array using max pooling
    """
    N = labels_27.shape[0]
    labels_6 = np.zeros((N, 6))
    for new_idx, old_indices in MAP_INDICES.items():
        labels_6[:, new_idx] = np.max(labels_27[:, old_indices], axis=1)
    return labels_6

def train():
    DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    MAX_LEN = 64
    BATCH_SIZE = 64
    EPOCHS = 10
    LR = 2e-5
    best_f1 = 0 

    tokenizer = RobertaTokenizer.from_pretrained("roberta-base")

    # Load model
    model = GoEmotionTransformer().to(DEVICE)

    # Load data
    train_split, val_split, _ = get_processed_data()

    # Map 28-labels → 7-labels
    y_train_6 = map_labels_27_to_6(train_split[1])
    y_val_6 = map_labels_27_to_6(val_split[1])

    # Create datasets
    train_ds = GoEmotionsDataset(train_split[0], y_train_6, tokenizer, max_len=MAX_LEN)
    val_ds = GoEmotionsDataset(val_split[0], y_val_6, tokenizer, max_len=MAX_LEN)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE)

    # Compute pos_weight for BCEWithLogitsLoss
    labels_tensor = torch.tensor(y_train_6, dtype=torch.float)
    label_counts = labels_tensor.sum(dim=0)
    total = labels_tensor.shape[0]
    pos_weight = (total - label_counts) / (label_counts + 1e-5)
    pos_weight = pos_weight.to(DEVICE)

    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
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
            logits = model(ids, attention_mask=mask)
            loss = criterion(logits, train_labels)
            loss.backward()
            optimizer.step()

            total_train_loss += loss.item()

        # --- VALIDATION PHASE ---
        model.eval()
        all_preds, all_labels = [], []
        total_val_loss = 0
        with torch.no_grad():
            for batch in tqdm(val_loader, desc=f"Epoch {epoch+1} [Val]"):
                ids = batch['input_ids'].to(DEVICE)
                mask = batch['attention_mask'].to(DEVICE)
                val_labels = batch['labels'].to(DEVICE).float()

                logits = model(ids, attention_mask=mask)
                loss = criterion(logits, val_labels)
                total_val_loss += loss.item()

                preds = (torch.sigmoid(logits) > 0.5).cpu().numpy()
                all_preds.extend(preds)
                all_labels.extend(val_labels.cpu().numpy())

        # Metrics
        avg_train_loss = total_train_loss / len(train_loader)
        avg_val_loss = total_val_loss / len(val_loader)
        f1 = f1_score(all_labels, all_preds, average='macro', zero_division=0)

        print(f"\nEpoch {epoch+1} Summary:")
        print(f"  Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f}")
        print(f"  Val F1: {f1:.4f}")

        # Save best model
        if f1 > best_f1:
            best_f1 = f1
            torch.save(model.state_dict(), "best_goemotion_model.pt")
            print(f"  >>> Saved new best model (F1: {best_f1:.4f})")
        print("-" * 30)

if __name__ == "__main__":
    train()
