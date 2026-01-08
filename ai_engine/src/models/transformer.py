import torch
import torch.nn as nn
import math

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=512):
class TransformerBlock(nn.Module):
    def __init__(self, embed_dim, num_heads=12, ff_dim=3072, dropout=0.1):
        super().__init__()
        self.attention = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
        self.norm1 = nn.LayerNorm(embed_dim)
        self.ffn = nn.Sequential(
            nn.Linear(embed_dim, ff_dim),
            nn.GELU(),
            nn.Linear(ff_dim, embed_dim)
        )
        self.norm2 = nn.LayerNorm(embed_dim)
        self.dropout = nn.Dropout(dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe.unsqueeze(0))

    def forward(self, x):
        x = x + self.pe[:x.size(1), :]
    def forward(self, x, padding_mask=None):
        attn_out, _ = self.attention(x, x, x, key_padding_mask=padding_mask)
        x = self.norm1(x + self.dropout(attn_out))
        ffn_out = self.ffn(x)
        x = self.norm2(x + self.dropout(ffn_out))
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
class GoEmotionTransformer(nn.Module):
    def __init__(self, vocab_size=50265, num_labels=7, max_seq_len=512, embed_dim=768):
        super().__init__()
        self.embed_dim = embed_dim
        self.token_embeddings = nn.Embedding(vocab_size, self.embed_dim)
        self.pos_embeddings = nn.Embedding(max_seq_len, self.embed_dim)
        self.norm = nn.LayerNorm(self.embed_dim)

        self.classifier = nn.Linear(d_model, num_classes)
        self.dropout = nn.Dropout(dropout)
        self.layers = nn.ModuleList([
            TransformerBlock(embed_dim=self.embed_dim) for _ in range(12)
        ])

    def forward(self, x, mask=None):
        x = self.embedding(x)*math.sqrt(self.embedding.embedding_dim)
        x = self.pos_encoder(x)
        self.pooler = nn.Linear(self.embed_dim, self.embed_dim)
        self.classifier = nn.Linear(self.embed_dim, num_labels)

    def forward(self, input_ids, padding_mask=None):
        batch_size, seq_len = input_ids.shape
        positions = torch.arange(seq_len, device=input_ids.device).expand(batch_size, seq_len)

        if mask is not None:
            mask = mask.bool()
        x = self.token_embeddings(input_ids) + self.pos_embeddings(positions)
        x = self.norm(x)

        x = self.transformer_encoder(x, src_key_padding_mask=mask)

        x = x.mean(dim=1)  # Global average pooling
        x = self.dropout(x)
        key_padding_mask = None
        if padding_mask is not None:
            key_padding_mask = (padding_mask == 0)

        return self.classifier(x)
        for layer in self.layers:
            x = layer(x, padding_mask=key_padding_mask)
            
        pooled_output = torch.tanh(self.pooler(x[:, 0, :]))
        return self.classifier(pooled_output)