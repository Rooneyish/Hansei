from transformers import RobertaModel
import torch.nn as nn

class GoEmotionTransformer(nn.Module):
    def __init__(self, num_labels=6):
        super().__init__()
        self.encoder = RobertaModel.from_pretrained("roberta-base")
        self.classifier = nn.Linear(self.encoder.config.hidden_size, num_labels)

    def forward(self, input_ids, attention_mask):
        outputs = self.encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        pooled = outputs.last_hidden_state[:, 0, :]
        return self.classifier(pooled)
