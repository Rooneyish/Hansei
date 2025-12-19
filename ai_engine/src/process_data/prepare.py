import os
from tokenizers import Tokenizer
from preprocess import extract_data, preprocess_text, train_tokenizer, finalize_tokenizer

def prepare_data():
    TOKENIZER_PATH = '../processed_data/goemotions_tokenizer.json'
    DATA_FILE = '../data/combined_dataset/goemotions_combined.csv'
    train_set, val_set, test_set = extract_data(DATA_FILE)
    
    if train_set is None:
        print("Data extraction failed.")
        return None, None, None, None

    X_train, y_train = train_set
    X_val, y_val = val_set
    X_test, y_test = test_set

    if os.path.exists(TOKENIZER_PATH):
        tokenizer = Tokenizer.from_file(TOKENIZER_PATH)
    else:
        print("Training new tokenizer on training data...")
        X_train_processed = [preprocess_text(t) for t in X_train]
        tokenizer = train_tokenizer(X_train_processed)
        
        if tokenizer is not None:
            tokenizer = finalize_tokenizer(tokenizer)
            os.makedirs('../processed_data/', exist_ok=True)
            tokenizer.save(TOKENIZER_PATH)
        else:
            return None, None, None, None

    return tokenizer, (X_train, y_train), (X_val, y_val), (X_test, y_test)

if __name__ == "__main__":
    tokenizer, train, val, test = prepare_data()
    if tokenizer:
        print(f"Successfully prepared data. Train size: {len(train[0])}")