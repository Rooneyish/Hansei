import torch
from torch.utils.data import Dataset

class GoEmotionsDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, item):
        text = str(self.texts[item])
        encoding = self.tokenizer.encode(text)
        
        return {
            'input_ids': torch.tensor(encoding.ids, dtype=torch.long),
            'attention_mask': torch.tensor(encoding.attention_mask, dtype=torch.long),
            'labels': torch.tensor(self.labels[item], dtype=torch.float) 
        }