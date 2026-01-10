import torch.nn as nn
from transformers import RobertaModel

class FineTuneRoBERTa(nn.Module):
    def __init__(self, num_labels):
        super().__init__()
        # Load the base architecture
        self.roberta = RobertaModel.from_pretrained("roberta-base")
        self.dropout = nn.Dropout(0.3)
        self.classifier = nn.Linear(768, num_labels)

    def forward(self, input_ids, attention_mask):
        outputs = self.roberta(input_ids=input_ids, attention_mask=attention_mask)
        # Use [CLS] token representation (index 0) for the classification head
        cls_output = outputs.last_hidden_state[:, 0, :]
        logits = self.classifier(self.dropout(cls_output))
        return logits