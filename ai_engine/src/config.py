import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data", "combined_dataset")
DATA_PATH = os.path.join(DATA_DIR, "goemotions_combined.csv")

TOKENIZER_DIR = os.path.join(BASE_DIR, "processed_data")
TOKENIZER_PATH = os.path.join(TOKENIZER_DIR, "goemotions_tokenizer.json")

MODEL_SAVE_PATH = os.path.join(BASE_DIR, "models", "goemotions_model.pth")