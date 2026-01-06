import torch
from torch.utils.data import Dataset
import numpy as np

class GoEmotionsDataset(Dataset):
    def __init__(self, texts, labels_28, tokenizer, max_len=64):
        self.texts = texts.values if hasattr(texts, 'values') else texts
        self.tokenizer = tokenizer
        self.max_len = max_len
        
        self.map_indices = {
            0: [2, 3, 10], 1: [11], 2: [14, 19],
            3: [0, 1, 4, 5, 8, 15, 17, 18, 20, 21, 23], 
            4: [9, 12, 16, 24, 25], 5: [22, 26], 6: [27]
        }
        self.labels = self._map_to_7_classes(labels_28)

    def _map_to_7_classes(self, labels_28):
        N = len(labels_28)
        labels_7 = np.zeros((N, 7))
        for new_idx, old_indices in self.map_indices.items():
            labels_7[:, new_idx] = np.max(labels_28[:, old_indices], axis=1)
        return labels_7

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, item):
        text = str(self.texts[item])
        label = self.labels[item]

        encoding = self.tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(), 
            'labels': torch.tensor(label, dtype=torch.float)
        }