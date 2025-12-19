import pandas as pd
import numpy as np
import os
import contractions as ct
from tokenizers import Tokenizer, models, pre_tokenizers, trainers, processors
from sklearn.model_selection import train_test_split

DATA_PATH = '../data/combined_dataset/goemotions_combined.csv'

def extract_data(file_path, train_size = 0.7, test_size=0.15, val_size=0.15, random_state=42):
    try:
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)

            unwanted_cols = ['id', 'author','subreddit', 'link_id','parent_id','created_utc', 'rater_id']
            df = df.drop(columns=unwanted_cols)
            df = df.dropna()
            
            df= df[df['example_very_unclear']==False]
            df = df.drop(columns=['example_very_unclear'])
            
            X = df['text']
            y = df.iloc[:, 1:].values

            X_temp, X_test, y_temp, y_test = train_test_split(
                X, y, test_size=test_size, random_state=random_state
            )

            relative_val_size = val_size / (train_size + val_size)
            X_train, X_val, y_train, y_val = train_test_split(
                X_temp, y_temp, test_size=relative_val_size, random_state=random_state
            )

            return (X_train, y_train), (X_val, y_val), (X_test, y_test)
        else:
            raise FileNotFoundError(f"The file at {DATA_PATH} does not exist.")
    except Exception as e:
        print(f"An error occurred while loading data: {e}")
        return None, None
    
def preprocess_text(text):
    try:
        text = text.lower()
        text = ct.fix(text)
        text = ' '.join(text.split())
        return text
    except Exception as e:
        print(f"An error occurred during text preprocessing: {e}")
        return text

def train_tokenizer(texts, vocab_size=30000):
    try:
        tokenizer = Tokenizer(models.BPE(unk_token="<UNK>"))
        tokenizer.pre_tokenizer = pre_tokenizers.Whitespace()
        trainer = trainers.BpeTrainer(vocab_size=vocab_size, special_tokens=["<PAD>", "<UNK>", "<BOS>", "<EOS>"])
        tokenizer.train_from_iterator(texts, trainer=trainer)
        return tokenizer
    except Exception as e:
        print(f"An error occurred during tokenizer training: {e}")
        return None

def finalize_tokenizer(tokenizer):
    MAX_LENGTH = 512
    try:
        tokenizer.enable_truncation(max_length=MAX_LENGTH)
        tokenizer.enable_padding(length=MAX_LENGTH, pad_id=0, pad_token="<PAD>")

        tokenizer.post_processor = processors.TemplateProcessing(
            single="<BOS> $A <EOS>",
            special_tokens=[
                ("<BOS>", 2),
                ("<EOS>", 3),
            ],
        )
        return tokenizer
    except Exception as e:
        print(f"An error occurred while finalizing the tokenizer: {e}")
        return tokenizer

if __name__ == "__main__":
    train_data, val_data, test_data = extract_data(DATA_PATH)
    
    if train_data is not None:
        X_train, y_train = train_data

        print('Preprocessing training text...')
        X_train_processed = [preprocess_text(t) for t in X_train]
        
        print('Training BPE tokenizer on training data only...')
        tokenizer = train_tokenizer(X_train_processed)
        tokenizer = finalize_tokenizer(tokenizer)
        
        tokenizer.save("goemotions_tokenizer.json")
        print('Tokenizer training complete and saved.')