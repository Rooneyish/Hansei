import torch
import torch.nn as nn
import math

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=512):
        super().__init__()

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x):
        x = x + self.pe[:x.size(1), :]
        return x
    
class EmotionTransformer(nn.Module):
    def __init__(self, vocab_size, num_classes, d_model=256, nhead=8, num_layers=4, dropout=0.1):
        super(EmotionTransformer, self).__init__()

        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_encoder = PositionalEncoding(d_model)
        
        encoder_layers = nn.TransformerEncoderLayer(
            d_model=d_model, 
            nhead=nhead,
            dim_feedforward=d_model*4, 
            dropout=dropout,
            batch_first=True
        )

        self.transformer_encoder = nn.TransformerEncoder(encoder_layers, num_layers=num_layers)
        
        self.classifier = nn.Linear(d_model, num_classes)
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x, mask=None):
        x = self.embedding(x)*math.sqrt(self.embedding.embedding_dim)
        x = self.pos_encoder(x)
        
        if mask is not None:
            mask = mask.bool()
        
        x = self.transformer_encoder(x, src_key_padding_mask=mask)

        x = x.mean(dim=1)  # Global average pooling
        x = self.dropout(x)

        return self.classifier(x)